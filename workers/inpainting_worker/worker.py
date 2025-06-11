import os
import sys
import json
import logging
import signal
import time
import asyncio
from typing import List, Dict, Tuple, Any, Optional

import numpy as np
import cv2
import torch
import redis

# 프로젝트 루트 설정
WORKER_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(os.path.dirname(WORKER_DIR))
CORE_DIR = os.path.join(ROOT_DIR, 'core')
# 베이스 이미지의 LaMa 모듈 사용 (PYTHONPATH=/app에 이미 포함됨)
sys.path.insert(0, ROOT_DIR)

from core.config import (
    LOG_LEVEL,
    LAMA_CONFIG_PATH,
    LAMA_CHECKPOINT_PATH,
    USE_CUDA,
    USE_FP16,
    INPAINTING_BATCH_SIZE_SHORT,
    INPAINTING_BATCH_SIZE_LONG,
    LAMA_INFERENCE_LONG_TASKS_QUEUE,
    LAMA_INFERENCE_SHORT_TASKS_QUEUE
)
from core.shm_manager import get_array_from_shm, create_shm_from_array, cleanup_shm
from core.redis_client import initialize_redis, close_redis, get_redis_client
# 통합된 LaMa 추론 모듈 사용
from lama.bin.inference import load_lama_model, batch_inference

# 로깅 설정
logging.basicConfig(level=LOG_LEVEL)
logger = logging.getLogger(__name__)

# LaMa 모델 관련 전역 변수
model = None
train_config = None
device = "cuda" if USE_CUDA and torch.cuda.is_available() else "cpu"

def restore_from_padding(img: np.ndarray, padding_info: Tuple[int, int, int, int], original_size: Tuple[int, int]) -> np.ndarray:
    """
    패딩 정보를 사용하여 이미지를 원본 크기로 복원합니다.
    
    Args:
        img: 패딩된 이미지
        padding_info: 패딩 정보 (top, right, bottom, left)
        original_size: 원본 크기 (height, width)
        
    Returns:
        원본 크기로 복원된 이미지
    """
    pad_top, pad_right, pad_bottom, pad_left = padding_info
    h, w = original_size
    
    # 패딩 제거
    unpadded = img[pad_top:img.shape[0]-pad_bottom, pad_left:img.shape[1]-pad_right]
    
    # 원본 크기로 복원 (필요한 경우)
    if unpadded.shape[:2] != (h, w):
        restored = cv2.resize(unpadded, (w, h), interpolation=cv2.INTER_LINEAR)#복원을 해야 한다는 건 이미지를 축소해서 처리했기 때문에 원본 크기로 복원해야 한다는 것
        return restored# 참고로 단순히 패딩만 있었다면 복원의 필요성이 없음
    
    return unpadded

async def load_model():
    """LaMa 모델을 로드합니다"""
    global model, train_config
    try:
        logger.info(f"LaMa 모델 로드 중: {LAMA_CHECKPOINT_PATH}, 장치: {device}...")
        model, train_config = load_lama_model(LAMA_CONFIG_PATH, LAMA_CHECKPOINT_PATH, device)
        logger.info("LaMa 모델 로드 완료")
    except Exception as e:
        logger.error(f"LaMa 모델 로드 실패: {e}", exc_info=True)
        raise

async def process_batch(batch_tasks: List[Dict[str, Any]]) -> bool:
    """배치 작업을 처리합니다"""
    if not batch_tasks:
        return True

    batch_start_time = time.time()
    batch_size = len(batch_tasks)
    is_long = batch_tasks[0].get("is_long", False)
    task_type = 'long' if is_long else 'short'
    logger.info(f"LaMa 추론 배치 시작: {batch_size}개의 {task_type} 작업")
    
    # 배치 처리를 위한 리스트 준비
    images_np = []
    masks_np = []
    padding_infos = []
    original_sizes = []
    request_ids = []
    image_ids = []
    # 공유 메모리 관리를 위한 정보
    preprocessed_img_shm_infos = []
    preprocessed_mask_shm_infos = []
    shm_handles = []  # SHM 핸들 추적
    
    # 전처리된 데이터 로드
    for task in batch_tasks:
        try:
            request_id = task.get("request_id")
            image_id = task.get("image_id")
            original_size = task.get("original_size")
            padding_info = task.get("padding_info")
            preprocessed_img_shm_info = task.get("preprocessed_img_shm_info")
            preprocessed_mask_shm_info = task.get("preprocessed_mask_shm_info")

            # 필수 정보가 있는지 확인
            if not all([
                request_id, 
                image_id, 
                original_size, 
                padding_info, 
                preprocessed_img_shm_info, 
                preprocessed_mask_shm_info
            ]):
                logger.error(f"[{request_id}] 필수 정보 누락: {task}")
                continue
            
            # 전처리된 이미지 로드
            img_array, img_shm = get_array_from_shm(preprocessed_img_shm_info)
            shm_handles.append(img_shm)
            
            # 전처리된 마스크 로드
            mask_array, mask_shm = get_array_from_shm(preprocessed_mask_shm_info)
            shm_handles.append(mask_shm)
            
            if img_array is None or mask_array is None:
                logger.error(f"[{request_id}] 공유 메모리에서 전처리된 이미지 또는 마스크 로드 실패")
                continue
            
            # 배치 처리를 위한 데이터 추가
            images_np.append(img_array)  # 이미 전처리된 RGB 이미지
            masks_np.append(mask_array)  # 이미 전처리된 그레이스케일 마스크
            padding_infos.append(padding_info)
            original_sizes.append(original_size)
            request_ids.append(request_id)
            image_ids.append(image_id)
            # 나중에 정리하기 위해 저장
            preprocessed_img_shm_infos.append(preprocessed_img_shm_info)
            preprocessed_mask_shm_infos.append(preprocessed_mask_shm_info)
            
        except Exception as e:
            logger.error(f"전처리된 데이터 로드 중 오류: {e}", exc_info=True)
            continue
    
    if not images_np:
        logger.warning("배치에 유효한 이미지가 없습니다")
        return False
    
    try:
        # LaMa 배치 추론 실행
        inference_start_time = time.time()
        logger.info(f"LaMa 추론 실행: {len(images_np)}개 이미지")
        results_np = batch_inference(
            images_np=images_np,
            masks_np=masks_np,
            model=model,
            train_config=train_config,
            device=device,
            use_fp16=USE_FP16
        )
        inference_end_time = time.time()
        inference_duration = inference_end_time - inference_start_time

        logger.info(f"LaMa 추론 완료: {len(results_np)}개 결과, 소요 시간: {inference_duration:.2f}초")
        
        # 결과 후처리 및 큐 전송
        postprocess_start_time = time.time()
        redis_client = get_redis_client()
        
        for i, result in enumerate(results_np):
            try:
                request_id = request_ids[i]
                image_id = image_ids[i]
                padding_info = padding_infos[i]
                original_size = original_sizes[i]
                
                # 결과를 원본 크기로 복원
                restored_result = restore_from_padding(result, padding_info, original_size)
                
                # RGB -> BGR (OpenCV 형식)
                restored_result_bgr = cv2.cvtColor(restored_result, cv2.COLOR_RGB2BGR)
                
                # 결과를 공유 메모리에 저장
                inpaint_shm_info = create_shm_from_array(restored_result_bgr)
                
                # 결과를 Redis Hash에 저장
                result_hash_key = f"inpainting_result:{request_id}"
                result_data = {
                    "image_id": image_id,
                    "inpaint_shm_info": json.dumps(inpaint_shm_info),
                    "is_long": str(is_long).lower()  # 명시적으로 "true" 또는 "false" 문자열로 저장
                }
                
                await redis_client.hset(result_hash_key, mapping=result_data)
                logger.info(f"[{request_id}] 인페인팅 결과 저장 완료: {result_hash_key}")
                
            except Exception as e:
                logger.error(f"작업 {i} 결과 후처리 중 오류: {e}", exc_info=True)
                continue

        # 전처리된 이미지 및 마스크 공유 메모리 정리
        for img_shm_info in preprocessed_img_shm_infos:
            if img_shm_info and 'shm_name' in img_shm_info:
                try:
                    cleanup_shm(img_shm_info['shm_name'])
                    logger.debug(f"전처리된 이미지 공유 메모리 정리: {img_shm_info['shm_name']}")
                except Exception as e:
                    logger.error(f"전처리된 이미지 공유 메모리 정리 실패: {e}", exc_info=True)

        for mask_shm_info in preprocessed_mask_shm_infos:
            if mask_shm_info and 'shm_name' in mask_shm_info:
                try:
                    cleanup_shm(mask_shm_info['shm_name'])
                    logger.debug(f"전처리된 마스크 공유 메모리 정리: {mask_shm_info['shm_name']}")
                except Exception as e:
                    logger.error(f"전처리된 마스크 공유 메모리 정리 실패: {e}", exc_info=True)

        postprocess_end_time = time.time()
        postprocess_duration = postprocess_end_time - postprocess_start_time

        batch_end_time = time.time()
        total_batch_duration = batch_end_time - batch_start_time

        logger.info(
            f"{batch_size}개의 {task_type} 작업 처리 완료. "
            f"총 소요 시간: {total_batch_duration:.2f}초 "
            f"(추론: {inference_duration:.2f}초, 후처리: {postprocess_duration:.2f}초)"
        )
                
        return True
        
    except Exception as e:
        logger.error(f"배치 추론 중 오류: {e}", exc_info=True)
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
        
        # LaMa 모델 로드
        await load_model()
        
        logger.info(f"인페인팅 워커 시작. 리스닝 큐: {LAMA_INFERENCE_LONG_TASKS_QUEUE}, {LAMA_INFERENCE_SHORT_TASKS_QUEUE}")
        
        # 큐 교차 처리를 위한 플래그
        is_long_turn = True
        
        while not stop_event.is_set():
            current_queue = LAMA_INFERENCE_LONG_TASKS_QUEUE if is_long_turn else LAMA_INFERENCE_SHORT_TASKS_QUEUE
            batch_tasks = []
            
            try:
                redis_client = get_redis_client()
                
                # 배치 크기 결정
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
                    await process_batch(batch_tasks)
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
    
    logger.info("인페인팅 워커 종료.")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        logger.critical(f"워커 실행 중 심각한 오류: {e}", exc_info=True)
        exit(1)
