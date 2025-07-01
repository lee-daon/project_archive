import os
import sys
import logging
import time
from typing import List, Dict, Tuple, Any

import numpy as np
import cv2

# 프로젝트 루트 설정
WORKER_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROOT_DIR = os.path.dirname(os.path.dirname(WORKER_DIR))
CORE_DIR = os.path.join(ROOT_DIR, 'core')
sys.path.insert(0, ROOT_DIR)

from core.config import (
    INPAINTING_LONG_SIZE,
    INPAINTING_SHORT_SIZE
)
from core.shm_manager import get_array_from_shm, create_shm_from_array, cleanup_shm

logger = logging.getLogger(__name__)

def resize_with_padding(img: np.ndarray, target_size: Tuple[int, int]) -> Tuple[np.ndarray, Tuple[int, int, int, int]]:
    """
    이미지 비율을 유지하면서 지정된 크기로 조절하고 패딩을 추가합니다.
    
    Args:
        img: 원본 이미지 (HWC format, BGR/RGB)
        target_size: 목표 크기 (height, width)
        
    Returns:
        조절된 이미지와 패딩 정보 (top, right, bottom, left)
    """
    target_h, target_w = target_size
    h, w = img.shape[:2]
    
    # 이미지가 이미 목표 크기보다 작으면 패딩만 추가
    if h <= target_h and w <= target_w:
        pad_top = (target_h - h) // 2
        pad_bottom = target_h - h - pad_top
        pad_left = (target_w - w) // 2
        pad_right = target_w - w - pad_left
        
        padded_img = cv2.copyMakeBorder(
            img, pad_top, pad_bottom, pad_left, pad_right,
            cv2.BORDER_REFLECT_101
        )
        return padded_img, (pad_top, pad_right, pad_bottom, pad_left)
    
    # 비율 유지하면서 리사이징
    scale_h = target_h / h
    scale_w = target_w / w
    scale = min(scale_h, scale_w)  # 작은 스케일 선택 (letterbox 스타일)
    
    new_h = int(h * scale)
    new_w = int(w * scale)
    
    resized_img = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)
    
    # 패딩 추가
    pad_top = (target_h - new_h) // 2
    pad_bottom = target_h - new_h - pad_top
    pad_left = (target_w - new_w) // 2
    pad_right = target_w - new_w - pad_left
    
    padded_img = cv2.copyMakeBorder(
        resized_img, pad_top, pad_bottom, pad_left, pad_right,
        cv2.BORDER_REFLECT_101
    )
    
    return padded_img, (pad_top, pad_right, pad_bottom, pad_left)

def process_single_task_pure_sync(task: Dict[str, Any], is_long: bool) -> Dict[str, Any]:
    """
    단일 전처리 작업을 순수 동기로 처리합니다 (스레드 풀용 - 100% CPU 작업만)
    
    Args:
        task: 전처리할 작업 데이터
        is_long: 긴 작업인지 여부
        
    Returns:
        전처리된 작업 데이터 또는 None (실패 시)
    """
    request_id = task.get("request_id")
    image_id = task.get("image_id")
    mask_shm_info = task.get("mask_shm_info")
    original_shm_info = task.get("shm_info")

    # 필수 정보 확인
    valid_request_id = bool(request_id)
    valid_mask_info = bool(mask_shm_info and isinstance(mask_shm_info, dict) and mask_shm_info.get('shm_name'))
    valid_original_info = bool(original_shm_info and isinstance(original_shm_info, dict) and original_shm_info.get('shm_name'))

    if not (valid_request_id and valid_mask_info and valid_original_info):
        logger.error(
            f"유효하지 않은 작업 데이터. "
            f"검사 결과: req_id={valid_request_id}, "
            f"mask_info={valid_mask_info}, "
            f"orig_info={valid_original_info}. 작업 데이터: {task}"
        )
        return None

    shm_handles = []  # SHM 핸들 추적
    
    try:
        # 원본 이미지 로드
        img_array, img_shm = get_array_from_shm(original_shm_info)
        if img_shm:
            shm_handles.append(img_shm)
        
        # 마스크 이미지 로드
        mask_array, mask_shm = get_array_from_shm(mask_shm_info)
        if mask_shm:
            shm_handles.append(mask_shm)
        
        if img_array is None or mask_array is None:
            logger.error(f"[{request_id}] 공유 메모리에서 이미지 또는 마스크 로드 실패")
            return None
            
        # 타겟 크기 결정
        target_size = INPAINTING_LONG_SIZE if is_long else INPAINTING_SHORT_SIZE
        
        # CPU 디노이징 적용 (Bilateral Filter)
        denoise_start_time = time.time()
        try:
            # BGR uint8 이미지에 적용
            denoised_img_array = cv2.bilateralFilter(
                src=img_array, 
                d=9,             # Pixel neighborhood diameter
                sigmaColor=75,   # Filter sigma in the color space
                sigmaSpace=75    # Filter sigma in the coordinate space
            )
            denoise_duration = time.time() - denoise_start_time
            logger.debug(f"[{request_id}] CPU Bilateral Filter 적용 완료: {denoise_duration:.4f}초")
            # 이후 처리를 위해 디노이징된 이미지 사용
            img_array = denoised_img_array

        except Exception as e:
            logger.error(f"[{request_id}] Bilateral Filtering 중 오류 발생: {e}", exc_info=True)
            # 오류 발생 시 원본 이미지 계속 사용
        
        # 원본 크기 저장
        original_size = img_array.shape[:2]
        
        # BGR -> RGB 변환 (LaMa 모델 입력 형식)
        img_rgb = cv2.cvtColor(img_array, cv2.COLOR_BGR2RGB)
        
        # 이미지와 마스크 크기 조절
        resized_img, padding_info = resize_with_padding(img_rgb, target_size)
        
        # 마스크를 그레이스케일(단일 채널)로 변환
        if mask_array.ndim == 3 and mask_array.shape[2] > 1:
            mask_gray = cv2.cvtColor(mask_array, cv2.COLOR_BGR2GRAY)
        else:
            mask_gray = mask_array.squeeze() if mask_array.ndim == 3 else mask_array
            
        resized_mask, _ = resize_with_padding(mask_gray, target_size)
        
        # 전처리된 이미지와 마스크를 새로운 공유 메모리에 저장
        preprocessed_img_shm_info = create_shm_from_array(resized_img)
        preprocessed_mask_shm_info = create_shm_from_array(resized_mask)
        
        if not preprocessed_img_shm_info or not preprocessed_mask_shm_info:
            logger.error(f"[{request_id}] 전처리된 데이터 공유 메모리 생성 실패")
            return None
        
        # 전처리된 작업 정보 생성
        processed_task = {
            "request_id": request_id,
            "image_id": image_id,
            "original_size": original_size,
            "padding_info": padding_info,
            "preprocessed_img_shm_info": preprocessed_img_shm_info,
            "preprocessed_mask_shm_info": preprocessed_mask_shm_info,
            "is_long": is_long
        }
        
        logger.debug(f"[{request_id}] 전처리 완료. 타겟 크기: {target_size}")
        return processed_task
        
    except Exception as e:
        logger.error(f"[{request_id}] 전처리 중 오류 발생: {e}", exc_info=True)
        return None
    finally:
        # SHM 핸들 닫기 (안전하게)
        for shm in shm_handles:
            try:
                if shm:
                    shm.close()
            except Exception as e:
                logger.warning(f"SHM 핸들 닫기 중 오류: {e}")
        
        # 마스크 공유 메모리 정리 (원본 이미지는 유지)
        if mask_shm_info and isinstance(mask_shm_info, dict) and 'shm_name' in mask_shm_info:
            mask_shm_name = mask_shm_info['shm_name']
            try:
                cleanup_shm(mask_shm_name)
                logger.debug(f"[{request_id}] 마스크 공유 메모리 정리: {mask_shm_name}")
            except Exception as e:
                logger.warning(f"[{request_id}] 마스크 공유 메모리 정리 실패 {mask_shm_name}: {e}") 