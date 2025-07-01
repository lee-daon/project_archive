import os
import sys
import logging
import re

import numpy as np
import cv2

# 프로젝트 루트 설정
WORKER_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROOT_DIR = os.path.dirname(os.path.dirname(WORKER_DIR))
sys.path.insert(0, ROOT_DIR)

from core.config import MASK_PADDING_PIXELS
from core.shm_manager import create_shm_from_array

logger = logging.getLogger(__name__)

# 중국어 판별 정규식 (Unicode 범위)
CHINESE_REGEX = re.compile(r'[\u4e00-\u9fff]')
ONLY_CHINESE_FILTER = True



def filter_chinese_ocr_result(ocr_result: list, request_id: str) -> list:
    """OCR 결과에서 중국어 텍스트만 필터링합니다."""
    if not ONLY_CHINESE_FILTER:
        logger.debug(f"[{request_id}] Skipping Chinese text filter (ONLY_CHINESE_FILTER is False).")
        return ocr_result

    logger.debug(f"[{request_id}] Applying Chinese text filter.")
    filtered_ocr_result = []
    
    for item in ocr_result:
        try:
            # [[box], [text, score]] 형식으로 가정하고 텍스트 추출
            if isinstance(item, list) and len(item) == 2 and \
               isinstance(item[1], list) and len(item[1]) >= 1:
                text = item[1][0]  # item[1]은 [text, score] -> text는 item[1][0]
                if isinstance(text, str) and CHINESE_REGEX.search(text):
                    filtered_ocr_result.append(item)
                elif isinstance(text, str):  # 중국어가 아닌 경우 디버그 로그
                    logger.debug(f"[{request_id}] Filtering out non-Chinese text: '{text}'")
            else:
                logger.warning(f"[{request_id}] Skipping item with unexpected format during filtering: {item}")
        except Exception as e:
            logger.warning(f"[{request_id}] Error during filtering item {item}: {e}", exc_info=False)

    logger.debug(f"[{request_id}] Filtering complete. {len(filtered_ocr_result)} items remain.")
    return filtered_ocr_result



def generate_mask_pure_sync(image_bytes: bytes, ocr_result: list, request_id: str, image_id: str, is_long: bool = False):
    """마스크 생성 순수 동기 함수 (100% CPU 작업만)"""
    try:
        logger.debug(f"[{request_id}] Pure CPU mask generation in thread")
        
        # 1. 이미지 디코딩 (CPU 작업)
        img_array = np.frombuffer(image_bytes, dtype=np.uint8)
        img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
        
        if img is None:
            logger.error(f"[{request_id}] Failed to decode image")
            return None
        
        # 2. 중국어 필터링 (CPU 작업)
        filtered_ocr_result = filter_chinese_ocr_result(ocr_result or [], request_id)
        
        # 3. 마스크 생성 (CPU 집약적)
        h, w = img.shape[:2]
        mask = np.zeros((h, w), dtype=np.uint8)
        
        if filtered_ocr_result:
            processed_boxes = 0
            for item in filtered_ocr_result:
                try:
                    if isinstance(item, list) and len(item) >= 1 and isinstance(item[0], list):
                        box_points = np.array(item[0], dtype=np.int32)
                        
                        # 패딩 추가 (CPU 작업)
                        padding = MASK_PADDING_PIXELS
                        if len(box_points) == 4:
                            # 바운딩 박스 확장
                            box_points[0][0] = max(0, box_points[0][0] - padding)
                            box_points[0][1] = max(0, box_points[0][1] - padding)
                            box_points[1][0] = min(w - 1, box_points[1][0] + padding)
                            box_points[1][1] = max(0, box_points[1][1] - padding)
                            box_points[2][0] = min(w - 1, box_points[2][0] + padding)
                            box_points[2][1] = min(h - 1, box_points[2][1] + padding)
                            box_points[3][0] = max(0, box_points[3][0] - padding)
                            box_points[3][1] = min(h - 1, box_points[3][1] + padding)
                        
                        # 마스크 채우기 (CPU 작업)
                        cv2.fillPoly(mask, [box_points], 255)
                        processed_boxes += 1
                        
                except Exception as e:
                    logger.warning(f"[{request_id}] Error processing box: {e}")
                    
            logger.debug(f"[{request_id}] Generated mask from {processed_boxes} boxes")
        
        # 4. 전처리 작업 정보 생성 (SHM 정보 포함)
        preprocessing_task = {
            "request_id": request_id,
            "image_id": image_id,  # 실제 image_id 사용
            "is_long": is_long  # 외부에서 전달받은 is_long 값 사용
        }
        
        # 🔧 이미지와 마스크를 공유 메모리에 저장
        img_shm_info = create_shm_from_array(img)
        mask_shm_info = create_shm_from_array(mask)
        
        if img_shm_info and mask_shm_info:
            preprocessing_task["shm_info"] = img_shm_info
            preprocessing_task["mask_shm_info"] = mask_shm_info
        else:
            logger.error(f"[{request_id}] Failed to create shared memory")
            return None
        
        return img, mask, preprocessing_task
        
    except Exception as e:
        logger.error(f"[{request_id}] Pure sync mask generation error: {e}", exc_info=True)
        return None 