import asyncio
import json
import logging
import signal
import time
import numpy as np
from paddleocr import PaddleOCR
import os

from core.redis_client import initialize_redis, close_redis, get_redis_client
from core.shm_manager import get_array_from_shm
from core.config import OCR_TASK_QUEUE, LOG_LEVEL ,OCR_RESULT_QUEUE

# 로깅 설정
logging.basicConfig(level=LOG_LEVEL)
logger = logging.getLogger(__name__)

# PaddleOCR 모델 로드 (GPU 사용)
try:
    logger.info("Loading PaddleOCR model with GPU...")
    # ocr_model = PaddleOCR(use_angle_cls=False, lang="ch", use_gpu=True, use_fp16=True, show_log=True) # 이전 코드 주석 처리 또는 삭제
    ocr_model = PaddleOCR(

        #감지 관련
            det_algorithm="DB", # DB고정임
            det_model_dir="/root/.paddleocr/whl/det/ch/ch_PP-OCRv4_det_infer", # PP-OCRv4 detection 모델 경로
            det_max_side_len=1504, #  이미지의 긴 변 최대 크기,이 값 이상인 이미지는 비율에 맞춰 축소
            det_db_thresh=0.3, # DB 바이너리 맵 임계값. 낮게 설정하면(예: 0.2) 더 많은 영역을 검출(기본 0.3)
            det_db_box_thresh=0.5, # DB 박스 임계값. 낮게 설정하면(예: 0.2) 더 많은 영역을 검출(기본 0.5)
            det_db_unclip_ratio=2.0,  # DB 박스 확장 비율.더 큰 박스-하나의 박스에 더 많은 문자 포함(기본 2.0)
            use_dilation=False, # DB 알고리즘에서 Dilation 사용 여부, OCR에서는 끊어진 텍스트 영역을 연결하거나 강화하는 데 사용

        #인식 관련
            rec_algorithm="SVTR_LCNet", # 인식 알고리즘
            rec_model_dir="/root/.paddleocr/whl/rec/ch/ch_PP-OCRv3_rec_infer", # PP-OCRv3 recognition 모델 경로
            #기본 CRNN, 정확도가 중요하면 SVTR_LCNet
            rec_image_shape='3, 64, 480', # 인식 이미지 크기, 긴 문장이면 길이 추가(기본 3,32,320)
            rec_char_type='ch', # 인식 문자 유형, ch사용시 영어+중국어 인식(기본 'ch')
            max_text_length=25, # 인식 가능한 최대 문자 길이(기본 25)
            use_space_char=True, # 공백 인식 여부(True/False)
            drop_score=0.5, # 인식 결과 필터링 임계값(기본 0.5). 이 값보다 낮은 인식 신뢰도는 무시합니다.
            #번역 품질을 위해 낮은 신뢰 문자는 제거하는 것이 좋으므로, 상황에 따라 0.6~0.7 정도로 올려 사용할 수 있습니다.

        #시스템 관련
            lang="ch", # 인식 언어(기본 'ch')
            use_gpu=True, # GPU 사용 여부(True/False)
            use_fp16=True, # 16비트 연산 사용 여부(True/False)
            show_log=True, # 로그 출력 여부 (기본값: True)
            gpu_mem=500, # GPU 메모리 제한 (MB).
            precision='fp32', # 추론 정밀도 (FP32 -> FP16 변경).
            max_batch_size=10 # 최대 배치 크기
        )
    logger.info("PaddleOCR model loaded successfully.")
except Exception as e:
    logger.error(f"Failed to load PaddleOCR model: {e}", exc_info=True)
    # 모델 로드 실패 시 워커를 시작할 수 없음
    exit(1)

async def enqueue_ocr_result(redis_client, result_data: dict):
    """OCR 처리 결과를 JSON으로 직렬화하여 Redis 큐에 추가합니다."""
    try:
        result_json = json.dumps(result_data).encode('utf-8')
        await redis_client.rpush(OCR_RESULT_QUEUE, result_json)
        logger.info(f"[{result_data.get('request_id')}] OCR result enqueued to {OCR_RESULT_QUEUE} (RPUSH)")
    except Exception as e:
        logger.error(f"[{result_data.get('request_id')}] Failed to enqueue OCR result: {e}", exc_info=True)
        # 여기서 에러 발생 시 재시도 로직 등을 고려할 수 있음

async def process_ocr_task(task_data: dict):
    """단일 OCR 작업을 처리합니다."""
    request_id = task_data.get("request_id")
    image_id = task_data.get("image_id")
    is_long = task_data.get("is_long")
    shm_info = task_data.get("shm_info")
    shm_name = shm_info.get('shm_name') if shm_info else None

    if not all([request_id, image_id, shm_info, shm_name]):
        logger.error(f"Invalid task data received: {task_data}")
        return

    logger.info(f"[{request_id}] Processing task for image: {image_id}")

    img_array = None
    existing_shm = None
    ocr_result = None
    start_time = time.time()

    try:
        # 1. 공유 메모리에서 이미지 배열 가져오기
        logger.debug(f"[{request_id}] Accessing shared memory: {shm_name}")
        img_array, existing_shm = get_array_from_shm(shm_info)
        logger.info(f"[{request_id}] Image array retrieved from SHM. Shape: {img_array.shape}, Dtype: {img_array.dtype}")

        # 2. PaddleOCR 실행 (NumPy 배열 직접 사용)
        # PaddleOCR의 ocr 메소드는 동기적으로 작동하므로, 비동기 루프 차단을 피하기 위해 run_in_executor 사용
        loop = asyncio.get_running_loop()
        logger.info(f"[{request_id}] Starting OCR inference...")
        # OCR 결과는 [[box, (text, score)], ...] 형식을 가정
        # PaddleOCR 2.6+ 는 [[ [box], (text, score) ], ...] 형식일 수 있음
        raw_result = await loop.run_in_executor(None, ocr_model.ocr, img_array, True)
        logger.info(f"[{request_id}] OCR inference completed in {time.time() - start_time:.2f} seconds.")

        # 결과 형식 처리 (사용자 제공 예시와 유사하게 덜 엄격하게 처리)
        if raw_result is None or not raw_result or raw_result[0] is None: # raw_result가 비었거나 첫 요소가 None인지 확인
            logger.warning(f"[{request_id}] No OCR results found for image {image_id}.")
            ocr_result = [] # 빈 리스트로 설정
        # PaddleOCR >= 2.6 버전 형식 ([ [ [box], (text, score) ], ... ]) 확인
        elif isinstance(raw_result[0], list) and isinstance(raw_result[0][0], list) and isinstance(raw_result[0][0][0], list):
            # 가장 바깥 리스트 제거
            ocr_result = raw_result[0]
            logger.debug(f"[{request_id}] Adjusted result format for PaddleOCR >= 2.6.")
        else:
            # 이전 버전 형식이거나 다른 형식일 경우 그대로 사용
            ocr_result = raw_result
            logger.debug(f"[{request_id}] Using raw result format.")

        # 3. 결과 데이터 생성 (처리된 ocr_result 직접 사용)
        result_data = {
            "request_id": request_id,
            "image_id": image_id,
            "is_long": is_long,
            "shm_info": shm_info, # 다음 워커가 SHM에 접근해야 할 경우 전달
            "ocr_result": ocr_result # 상세 검증 없이 ocr_result 사용
        }

        # 4. 결과 큐에 저장
        redis_client = get_redis_client()
        await enqueue_ocr_result(redis_client, result_data)

    except FileNotFoundError:
        logger.error(f"[{request_id}] Shared memory {shm_name} not found. It might have been cleaned up already.")
    except Exception as e:
        logger.error(f"[{request_id}] Error processing task: {e}", exc_info=True)
        # 실패 시에도 SHM 정리는 시도 (-> close만 시도하도록 변경)
    finally:
        # 5. 공유 메모리 리소스 정리 (close 호출) - 현재 프로세스가 핸들만 닫음
        if existing_shm:
            try:
                existing_shm.close()
                logger.debug(f"[{request_id}] Closed shared memory handle: {shm_name}")
            except Exception as e:
                 logger.error(f"[{request_id}] Error closing shared memory handle {shm_name}: {e}", exc_info=True)

        # 중요: 공유 메모리 unlink는 생성한 프로세스(API 서버) 또는 별도 관리자가 처리하는 것이 일반적
        # 다음 단계 워커가 사용해야 하므로 여기서는 unlink 하지 않음.
async def main():
    """메인 워커 루프"""
    await initialize_redis()
    redis_client = get_redis_client()
    logger.info(f"OCR Worker started. Listening to queue: {OCR_TASK_QUEUE}")

    stop_event = asyncio.Event()

    def signal_handler():
        logger.info("Stop signal received. Shutting down gracefully...")
        stop_event.set()

    loop = asyncio.get_running_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, signal_handler)

    while not stop_event.is_set():
        try:
            # Redis 큐에서 작업 가져오기 (BLPOP, 타임아웃 2초)
            # 타임아웃을 짧게 하여 종료 시그널을 더 빨리 감지
            task_tuple = await redis_client.blpop([OCR_TASK_QUEUE], timeout=2)
            if task_tuple:
                list_key, task_bytes = task_tuple
                try:
                    task_data = json.loads(task_bytes.decode('utf-8'))
                    # 작업 처리 함수 비동기 실행 (await하지 않아 여러 작업 동시 처리 가능, 단 리소스 제한 필요)
                    # 여기서는 간단하게 await으로 순차 처리
                    await process_ocr_task(task_data)
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to decode task JSON: {e}. Raw data: {task_bytes}")
                except Exception as e:
                    logger.error(f"Error processing task: {e}", exc_info=True)
            # 타임아웃 시에는 루프 계속 진행 (stop_event 체크)

        except asyncio.CancelledError:
            logger.info("Main loop cancelled.")
            break
        except Exception as e:
            logger.error(f"An error occurred in the main loop: {e}", exc_info=True)
            # 잠시 대기 후 재시도 (Redis 연결 문제 등)
            await asyncio.sleep(5)

    logger.info("Closing Redis connection...")
    await close_redis()
    logger.info("OCR Worker stopped.")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("KeyboardInterrupt received. Exiting.")
    except Exception as e:
        logger.critical(f"Critical error in worker startup/runtime: {e}", exc_info=True)
        exit(1)
