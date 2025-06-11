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

# 프로젝트 루트 설정 - Docker 환경에서는 PYTHONPATH 의존성으로 변경
# WORKER_DIR = os.path.dirname(os.path.abspath(__file__))
# ROOT_DIR = os.path.dirname(os.path.dirname(WORKER_DIR))
# CORE_DIR = os.path.join(ROOT_DIR, 'core') # 더 이상 필요하지 않음
# SRC_DIR = os.path.join(ROOT_DIR, 'src') # 더 이상 필요하지 않음
# sys.path.insert(0, ROOT_DIR) # PYTHONPATH로 대체

from core.config import (
    LOG_LEVEL,
    USE_CUDA,
    # USE_FP16, # MI-GAN은 파이프라인 초기화 시 내부적으로 처리하거나 자동 감지 가정
    INPAINTING_BATCH_SIZE_SHORT,
    INPAINTING_BATCH_SIZE_LONG,
    # 큐 이름은 일단 LaMa와 동일하게 사용, 필요시 변경
    LAMA_INFERENCE_LONG_TASKS_QUEUE as MI_GAN_INFERENCE_LONG_TASKS_QUEUE,
    LAMA_INFERENCE_SHORT_TASKS_QUEUE as MI_GAN_INFERENCE_SHORT_TASKS_QUEUE
)
from core.shm_manager import get_array_from_shm, create_shm_from_array, cleanup_shm
from core.redis_client import initialize_redis, close_redis, get_redis_client

# MI-GAN 추론 모듈 사용 (README.md 참고)
# src.core에서 직접 기본 경로와 해상도를 가져옴
try:
    from src.core import initialize_pipeline, inpaint_batch_images, PYTORCH_MODEL_PATH_DEFAULT, MODEL_RESOLUTION_DEFAULT
except ImportError as e:
    logging.error(f"src.core 모듈 임포트 실패. ROOT_DIR/src/core.py 경로를 확인하세요: {e}")
    # 이 경우 워커가 정상 작동하지 않으므로, 에러를 발생시켜 빠르게 인지하도록 함
    raise ImportError(f"MI-GAN core 모듈(src.core) 로드에 실패했습니다. PYTHONPATH 및 파일 구조를 확인해주세요. 에러: {e}") from e


# 로깅 설정
logging.basicConfig(level=LOG_LEVEL)
logger = logging.getLogger(__name__)

# MI-GAN 모델 관련 전역 변수
pipeline = None # MI-GAN 파이프라인 인스턴스
device = "cuda" if USE_CUDA and torch.cuda.is_available() else "cpu"
# MI-GAN 모델 경로 및 해상도는 src.core의 기본값을 사용
MI_GAN_MODEL_PATH = PYTORCH_MODEL_PATH_DEFAULT
MI_GAN_RESOLUTION = MODEL_RESOLUTION_DEFAULT


def restore_from_padding(img: np.ndarray, padding_info: Tuple[int, int, int, int], original_size: Tuple[int, int]) -> np.ndarray:
    """
    패딩 정보를 사용하여 이미지를 원본 크기로 복원합니다.
    (기존 inpainting_worker와 동일한 함수)
    """
    pad_top, pad_right, pad_bottom, pad_left = padding_info
    h, w = original_size
    
    unpadded = img[pad_top:img.shape[0]-pad_bottom, pad_left:img.shape[1]-pad_right]
    
    if unpadded.shape[:2] != (h, w):
        restored = cv2.resize(unpadded, (w, h), interpolation=cv2.INTER_LINEAR)
        return restored
    
    return unpadded

async def load_model():
    """MI-GAN 모델을 로드합니다"""
    global pipeline
    try:
        logger.info(f"MI-GAN 모델 로드 중: {MI_GAN_MODEL_PATH}, 해상도: {MI_GAN_RESOLUTION}, 장치: {device}...")
        # README.md에 따르면 initialize_pipeline은 (pipeline_instance, device_object)를 반환
        # device_object는 이미 전역 device 변수에 할당되어 있으므로, pipeline_instance만 사용
        pipeline_instance, _ = initialize_pipeline(
            model_path=MI_GAN_MODEL_PATH,
            resolution=MI_GAN_RESOLUTION,
            device_str=device
        )
        if pipeline_instance is None:
            raise RuntimeError("MI-GAN 파이프라인 초기화 실패 (None 반환)")
        pipeline = pipeline_instance
        logger.info("MI-GAN 모델 로드 완료")
    except Exception as e:
        logger.error(f"MI-GAN 모델 로드 실패: {e}", exc_info=True)
        raise

async def process_batch(batch_tasks: List[Dict[str, Any]]) -> bool:
    """배치 작업을 처리합니다"""
    if not batch_tasks:
        return True

    batch_start_time = time.time()
    batch_size = len(batch_tasks)
    is_long = batch_tasks[0].get("is_long", False) # 첫 번째 작업 기준으로 long/short 판단
    task_type = 'long' if is_long else 'short'
    logger.info(f"MI-GAN 추론 배치 시작: {batch_size}개의 {task_type} 작업")
    
    images_np_rgb_list = [] # MI-GAN은 RGB 입력을 기대 (H, W, 3)
    masks_np_list = []      # MI-GAN은 (H, W, 1) Grayscale 마스크 기대, 0=인페인트, 255=보존
    padding_infos = []
    original_sizes = []
    request_ids = []
    image_ids = []
    preprocessed_img_shm_infos = []
    preprocessed_mask_shm_infos = []
    shm_handles = []
    
    for task in batch_tasks:
        try:
            request_id = task.get("request_id")
            image_id = task.get("image_id")
            original_size = task.get("original_size") # (H, W)
            padding_info = task.get("padding_info")   # (top, right, bottom, left)
            preprocessed_img_shm_info = task.get("preprocessed_img_shm_info")
            preprocessed_mask_shm_info = task.get("preprocessed_mask_shm_info")

            if not all([request_id, image_id, original_size, padding_info, preprocessed_img_shm_info, preprocessed_mask_shm_info]):
                logger.error(f"[{request_id}] 필수 정보 누락: {task}")
                continue
            
            img_array_bgr, img_shm = get_array_from_shm(preprocessed_img_shm_info)
            shm_handles.append(img_shm)
            
            mask_array, mask_shm = get_array_from_shm(preprocessed_mask_shm_info)
            shm_handles.append(mask_shm)
            
            if img_array_bgr is None or mask_array is None:
                logger.error(f"[{request_id}] 공유 메모리에서 전처리된 이미지 또는 마스크 로드 실패")
                continue

            # MI-GAN 입력 형식에 맞게 변환
            # 이미지: BGR (공유메모리) -> RGB (MI-GAN 입력)
            img_array_rgb = cv2.cvtColor(img_array_bgr, cv2.COLOR_BGR2RGB)

            # 마스크: README.md에 따르면 (H,W,1) uint8, 0=인페인트, 255=보존.
            # 기존 전처리에서 이 형식을 맞춘다고 가정. 추가 확인 필요 시 로직 추가.
            # 예: if mask_array.ndim == 2: mask_array = mask_array[..., np.newaxis]
            if mask_array.ndim == 2: # (H,W) -> (H,W,1)
                 mask_array = np.expand_dims(mask_array, axis=-1)

            # 모든 이미지/마스크는 동일한 H, W를 가져야 함 (MI-GAN 배치 처리 요구사항)
            # 전처리 단계에서 MODEL_RESOLUTION에 맞게 리사이징 되었다고 가정
            # 만약 여기서 리사이징이 필요하다면 추가 로직:
            # target_h, target_w = MI_GAN_RESOLUTION, MI_GAN_RESOLUTION
            # if img_array_rgb.shape[0] != target_h or img_array_rgb.shape[1] != target_w:
            #    img_array_rgb = cv2.resize(img_array_rgb, (target_w, target_h), interpolation=cv2.INTER_AREA)
            #    mask_array = cv2.resize(mask_array, (target_w, target_h), interpolation=cv2.INTER_NEAREST)
            #    if mask_array.ndim == 2: mask_array = np.expand_dims(mask_array, axis=-1)

            images_np_rgb_list.append(img_array_rgb)
            masks_np_list.append(mask_array)
            padding_infos.append(padding_info)
            original_sizes.append(original_size)
            request_ids.append(request_id)
            image_ids.append(image_id)
            preprocessed_img_shm_infos.append(preprocessed_img_shm_info)
            preprocessed_mask_shm_infos.append(preprocessed_mask_shm_info)
            
        except Exception as e:
            logger.error(f"전처리된 데이터 로드 중 오류 (request_id: {task.get('request_id', 'N/A')}): {e}", exc_info=True)
            continue
    
    if not images_np_rgb_list:
        logger.warning("배치에 유효한 이미지가 없습니다")
        # 공유 메모리 핸들 정리 (오류 발생 전 로드된 것들)
        for shm in shm_handles:
            try:
                if shm: shm.close()
            except Exception as e:
                logger.error(f"SHM 핸들 닫기 오류 (데이터 로드 실패 시): {e}")
        return False # process_batch 실패로 간주
    
    try:
        inference_start_time = time.time()
        logger.info(f"MI-GAN 추론 실행: {len(images_np_rgb_list)}개 이미지")
        
        # `pipeline`은 전역 변수 `pipeline` 사용
        # `inpaint_batch_images`는 List[np.ndarray] (RGB 이미지), List[np.ndarray] (마스크)를 입력으로 받음
        results_rgb_np_list = inpaint_batch_images(
            image_np_list=images_np_rgb_list,
            mask_np_list=masks_np_list
            # pipeline 인스턴스는 함수 내부에서 관리되거나, 전역 pipeline을 사용하도록 구현되어 있어야 함.
            # README.md의 함수 시그니처에는 pipeline 객체가 명시적으로 전달되지 않음.
            # src.core.inpaint_batch_images 가 내부적으로 로드된 pipeline을 사용한다고 가정.
            # 만약 pipeline을 인자로 받아야 한다면, `pipeline=pipeline` 추가.
        )
        inference_end_time = time.time()
        inference_duration = inference_end_time - inference_start_time

        logger.info(f"MI-GAN 추론 완료: {len(results_rgb_np_list)}개 결과, 소요 시간: {inference_duration:.2f}초")
        
        postprocess_start_time = time.time()
        redis_client = get_redis_client()
        
        for i, result_rgb_np in enumerate(results_rgb_np_list):
            try:
                request_id = request_ids[i]
                image_id = image_ids[i]
                padding_info = padding_infos[i]
                original_size = original_sizes[i] # (H, W)
                
                # 결과를 원본 크기로 복원 (RGB 상태에서)
                restored_result_rgb = restore_from_padding(result_rgb_np, padding_info, original_size)
                
                # RGB -> BGR (OpenCV 및 공유 메모리 저장 형식)
                restored_result_bgr = cv2.cvtColor(restored_result_rgb, cv2.COLOR_RGB2BGR)
                
                inpaint_shm_info = create_shm_from_array(restored_result_bgr)
                
                result_hash_key = f"inpainting_result:{request_id}"
                result_data = {
                    "image_id": image_id,
                    "inpaint_shm_info": json.dumps(inpaint_shm_info),
                    "is_long": str(is_long).lower()
                }
                
                await redis_client.hset(result_hash_key, mapping=result_data)
                logger.info(f"[{request_id}] MI-GAN 인페인팅 결과 저장 완료: {result_hash_key}")
                
            except Exception as e:
                logger.error(f"작업 {i} (request_id: {request_ids[i] if i < len(request_ids) else 'N/A'}) 결과 후처리 중 오류: {e}", exc_info=True)
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
            f"{len(results_rgb_np_list)}개의 {task_type} 작업 처리 완료 (요청: {batch_size}개). "
            f"총 소요 시간: {total_batch_duration:.2f}초 "
            f"(추론: {inference_duration:.2f}초, 후처리: {postprocess_duration:.2f}초)"
        )
                
        return True
        
    except Exception as e:
        logger.error(f"배치 추론 중 오류: {e}", exc_info=True)
        return False
    finally:
        for shm in shm_handles:
            try:
                if shm:
                    shm.close()
            except Exception as e:
                logger.error(f"SHM 핸들 닫기 오류: {e}")

async def run_worker(stop_event: asyncio.Event):
    """메인 워커 루프"""
    redis_initialized = False
    model_loaded = False
    
    try:
        await initialize_redis()
        redis_initialized = True
        
        await load_model() # MI-GAN 모델 로드
        model_loaded = True
        
        logger.info(f"MI-GAN 인페인팅 워커 시작. 리스닝 큐: {MI_GAN_INFERENCE_LONG_TASKS_QUEUE}, {MI_GAN_INFERENCE_SHORT_TASKS_QUEUE}")
        
        is_long_turn = True
        
        while not stop_event.is_set():
            if not model_loaded: # 모델 로드 실패 시 루프 중단 또는 재시도 로직 필요
                logger.error("모델이 로드되지 않아 워커를 중단합니다.")
                break

            current_queue = MI_GAN_INFERENCE_LONG_TASKS_QUEUE if is_long_turn else MI_GAN_INFERENCE_SHORT_TASKS_QUEUE
            batch_tasks = []
            
            try:
                redis_client = get_redis_client()
                max_batch_size = INPAINTING_BATCH_SIZE_LONG if is_long_turn else INPAINTING_BATCH_SIZE_SHORT
                
                for _ in range(max_batch_size):
                    if stop_event.is_set():
                        break
                    task_tuple = await redis_client.blpop([current_queue], timeout=1)
                    
                    if not task_tuple:
                        break
                        
                    task_bytes = task_tuple[1]
                    try:
                        task_data = json.loads(task_bytes.decode('utf-8'))
                        task_data["is_long"] = is_long_turn # 배치 전체에 대한 is_long 정보 추가
                        batch_tasks.append(task_data)
                    except json.JSONDecodeError as e:
                        logger.error(f"작업 JSON 디코딩 실패: {e}. 원본 데이터: {task_bytes}")
                
                if batch_tasks:
                    await process_batch(batch_tasks)
                else:
                    is_long_turn = not is_long_turn
                    # logger.debug(f"큐 전환: {'long' if is_long_turn else 'short'} 큐로 전환") # 너무 빈번한 로그일 수 있음
                    await asyncio.sleep(0.1) # CPU 사용량 감소
            
            except asyncio.CancelledError:
                logger.info("메인 루프 취소됨")
                break
            except (redis.exceptions.ConnectionError, redis.exceptions.TimeoutError) as e:
                logger.error(f"Redis 연결 오류: {e}. 재연결 시도 예정.")
                await asyncio.sleep(5) # 재연결 대기
            except Exception as e:
                logger.error(f"메인 루프 예상치 못한 오류: {e}", exc_info=True)
                await asyncio.sleep(1)
    
    except Exception as e:
        logger.critical(f"워커 심각한 오류 (초기화 또는 모델 로드 중): {e}", exc_info=True)
    finally:
        logger.info("워커 루프 종료 중...")
        if redis_initialized:
            await close_redis()
        # pipeline 객체에 별도 정리 함수가 있다면 호출 (예: pipeline.cleanup())
        # 현재 README에는 명시 없음

def main():
    stop_event = asyncio.Event()
    
    def shutdown_handler(sig, frame):
        logger.info(f"신호 {sig} 수신. 정상 종료 시작...")
        # stop_event를 설정하기 전에 현재 실행 중인 루프를 가져옵니다.
        try:
            loop = asyncio.get_running_loop()
            loop.call_soon_threadsafe(stop_event.set)
        except RuntimeError: # 루프가 실행 중이 아닐 때
             logger.info("이벤트 루프가 실행 중이 아니므로 직접 stop_event를 설정합니다.")
             stop_event.set()


    signal.signal(signal.SIGINT, shutdown_handler)
    signal.signal(signal.SIGTERM, shutdown_handler)
    
    try:
        asyncio.run(run_worker(stop_event))
    except KeyboardInterrupt: # asyncio.run() 외부에서 발생 시
        logger.info("메인에서 KeyboardInterrupt 감지. 종료 중.")
        if not stop_event.is_set():
            stop_event.set() # 이벤트 설정 보장
    except Exception as e: # asyncio.run() 자체에서 다른 예외 발생 시
        logger.critical(f"asyncio.run 실행 중 예기치 않은 오류: {e}", exc_info=True)
        if not stop_event.is_set():
            stop_event.set() # 종료 시도
    
    logger.info("MI-GAN 인페인팅 워커 종료.")

if __name__ == "__main__":
    # 전역 로거 설정은 이미 상단에 있음
    try:
        main()
    except ImportError as e: # src.core 임포트 실패 시 main() 진입 전에 발생 가능
        logger.critical(f"필수 모듈 임포트 실패로 워커 실행 불가: {e}", exc_info=True)
        exit(1)
    except Exception as e:
        logger.critical(f"워커 실행 중 최상위 레벨에서 심각한 오류: {e}", exc_info=True)
        exit(1)

