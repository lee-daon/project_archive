import os
import sys
import json
import logging
import signal
import time
import asyncio
from typing import List, Dict, Tuple, Any

import numpy as np
import cv2
import redis

# 프로젝트 루트 설정
WORKER_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(os.path.dirname(WORKER_DIR))
CORE_DIR = os.path.join(ROOT_DIR, 'core')
sys.path.insert(0, ROOT_DIR)

from core.config import (
    LOG_LEVEL,
    INPAINTING_LONG_TASKS_QUEUE,
    INPAINTING_SHORT_TASKS_QUEUE,
    INPAINTING_LONG_SIZE,
    INPAINTING_SHORT_SIZE,
    INPAINTING_BATCH_SIZE_LONG,
    INPAINTING_BATCH_SIZE_SHORT,
    LAMA_INFERENCE_LONG_TASKS_QUEUE,
    LAMA_INFERENCE_SHORT_TASKS_QUEUE
)
from core.shm_manager import get_array_from_shm, create_shm_from_array, cleanup_shm
from core.redis_client import initialize_redis, close_redis, get_redis_client

# 로깅 설정
logging.basicConfig(level=LOG_LEVEL)
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

async def process_batch(batch_tasks: List[Dict[str, Any]], is_long: bool) -> bool:
    """배치 전처리 작업을 처리합니다"""
    if not batch_tasks:
        return True

    batch_start_time = time.time()
    batch_size = len(batch_tasks)
    task_type = 'long' if is_long else 'short'
    logger.info(f"전처리 배치 시작: {batch_size}개의 {task_type} 작업")
    
    # 타겟 크기 결정
    target_size = INPAINTING_LONG_SIZE if is_long else INPAINTING_SHORT_SIZE
    target_h, target_w = target_size
    
    # 배치 처리 결과 저장을 위한 리스트
    processed_tasks = []
    shm_handles = []  # SHM 핸들 추적

    # 데이터 전처리
    for task in batch_tasks:
        try:
            request_id = task.get("request_id")
            image_id = task.get("image_id")
            mask_shm_info = task.get("mask_shm_info")
            original_shm_info = task.get("shm_info")

            # 필수 정보가 있는지 확인
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
                 continue
            
            # 원본 이미지 로드
            img_array, img_shm = get_array_from_shm(original_shm_info)
            shm_handles.append(img_shm)
            
            # 마스크 이미지 로드
            mask_array, mask_shm = get_array_from_shm(mask_shm_info)
            shm_handles.append(mask_shm)
            
            if img_array is None or mask_array is None:
                logger.error(f"[{request_id}] 공유 메모리에서 이미지 또는 마스크 로드 실패")
                continue
                
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
                logger.info(f"[{request_id}] CPU Bilateral Filter 적용 완료: {denoise_duration:.4f}초")
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
            
            # 추론 작업 정보 생성
            inference_task = {
                "request_id": request_id,
                "image_id": image_id,
                "original_size": original_size,
                "padding_info": padding_info,
                "preprocessed_img_shm_info": preprocessed_img_shm_info,
                "preprocessed_mask_shm_info": preprocessed_mask_shm_info,
                "is_long": is_long
            }
            processed_tasks.append(inference_task)
            
        except Exception as e:
            logger.error(f"작업 전처리 중 오류 발생: {e}", exc_info=True)
            continue
    
    if not processed_tasks:
        logger.warning("배치에 유효한 이미지가 없습니다")
        return False
    
    try:
        # 전처리된 작업들을 LaMa 추론 큐에 추가
        redis_client = get_redis_client()
        target_queue = LAMA_INFERENCE_LONG_TASKS_QUEUE if is_long else LAMA_INFERENCE_SHORT_TASKS_QUEUE
        
        for task in processed_tasks:
            await redis_client.rpush(
                target_queue, 
                json.dumps(task)
            )
        
        batch_end_time = time.time()
        total_duration = batch_end_time - batch_start_time
        logger.info(f"{len(processed_tasks)}개의 {task_type} 작업 전처리 완료. 총 소요 시간: {total_duration:.2f}초")
        
        # 마스크 공유 메모리 정리 (원본 이미지는 유지)
        for task in batch_tasks:
            mask_shm_info = task.get("mask_shm_info")
            if mask_shm_info and isinstance(mask_shm_info, dict) and 'shm_name' in mask_shm_info:
                mask_shm_name = mask_shm_info['shm_name']
                try:
                    cleanup_shm(mask_shm_name)
                    logger.debug(f"[{task.get('request_id')}] 마스크 공유 메모리 정리: {mask_shm_name}")
                except Exception as e:
                    logger.error(f"[{task.get('request_id')}] 마스크 공유 메모리 정리 실패 {mask_shm_name}: {e}", exc_info=True)
        
        return True
        
    except Exception as e:
        logger.error(f"배치 처리 중 오류 발생: {e}", exc_info=True)
        return False
    finally:
        # SHM 핸들 닫기
        for shm in shm_handles:
            try:
                if shm:
                    shm.close()
            except Exception as e:
                logger.error(f"SHM 핸들 닫기 오류: {e}")

async def run_worker(stop_event: asyncio.Event):
    """메인 워커 루프"""
    redis_initialized = False
    
    try:
        # Redis 초기화
        await initialize_redis()
        redis_initialized = True
        
        logger.info(f"전처리 워커 시작. 리스닝 큐: {INPAINTING_LONG_TASKS_QUEUE}, {INPAINTING_SHORT_TASKS_QUEUE}")
        
        # 큐 교차 처리를 위한 플래그
        is_long_turn = True
        
        while not stop_event.is_set():
            current_queue = INPAINTING_LONG_TASKS_QUEUE if is_long_turn else INPAINTING_SHORT_TASKS_QUEUE
            batch_tasks = []
            
            try:
                redis_client = get_redis_client()
                
                # 배치 크기 결정 (long: 2, short: 4)
                max_batch_size = INPAINTING_BATCH_SIZE_LONG if is_long_turn else INPAINTING_BATCH_SIZE_SHORT
                
                # 배치 데이터 수집
                for _ in range(max_batch_size):
                    if stop_event.is_set():
                        break
                        
                    # non-blocking 모드로 큐에서 작업 가져오기 (timeout=1)
                    task_tuple = await redis_client.blpop([current_queue], timeout=1)
                    
                    if not task_tuple:
                        # 타임아웃 - 큐가 비어있으므로 현재 배치 처리 또는 다른 큐로 전환
                        break
                        
                    task_bytes = task_tuple[1]
                    try:
                        task_data = json.loads(task_bytes.decode('utf-8'))
                        batch_tasks.append(task_data)
                    except json.JSONDecodeError as e:
                        logger.error(f"작업 JSON 디코딩 실패: {e}. 원본 데이터: {task_bytes}")
                
                # 배치 처리
                if batch_tasks:
                    await process_batch(batch_tasks, is_long_turn)
                else:
                    # 배치가 비어있으면 큐 전환
                    is_long_turn = not is_long_turn
                    logger.debug(f"큐 전환: {'long' if is_long_turn else 'short'} 큐로 전환")
                    # 잠시 대기하여 CPU 사용량 감소
                    await asyncio.sleep(0.1)
            
            except asyncio.CancelledError:
                logger.info("메인 루프 취소됨")
                break
            except (redis.exceptions.ConnectionError, redis.exceptions.TimeoutError) as e:
                logger.error(f"Redis 연결 오류: {e}. 재연결 시도 예정.")
                await asyncio.sleep(5)
            except Exception as e:
                logger.error(f"메인 루프 예상치 못한 오류: {e}", exc_info=True)
                await asyncio.sleep(1)
    
    except Exception as e:
        logger.critical(f"워커 심각한 오류: {e}", exc_info=True)
    finally:
        logger.info("워커 루프 종료 중...")
        if redis_initialized:
            await close_redis()

def main():
    """동기 실행 진입점 및 신호 처리 설정"""
    stop_event = asyncio.Event()
    
    def shutdown_handler(sig, frame):
        logger.info(f"신호 {sig} 수신. 정상 종료 시작...")
        loop = asyncio.get_event_loop()
        if loop.is_running():
            loop.call_soon_threadsafe(stop_event.set)
    
    # 신호 핸들러 등록
    signal.signal(signal.SIGINT, shutdown_handler)
    signal.signal(signal.SIGTERM, shutdown_handler)
    
    try:
        asyncio.run(run_worker(stop_event))
    except KeyboardInterrupt:
        logger.info("메인에서 KeyboardInterrupt 감지. 종료 중.")
        if not stop_event.is_set():
            stop_event.set()
    
    logger.info("전처리 워커 종료.")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        logger.critical(f"워커 실행 중 심각한 오류: {e}", exc_info=True)
        exit(1)
