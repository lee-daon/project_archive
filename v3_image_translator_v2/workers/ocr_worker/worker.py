import asyncio
import json
import logging
import signal
import time
import numpy as np
from paddleocr import PaddleOCR
import os
import aiohttp
import cv2
from PIL import Image
import io
import tempfile
import shutil
from collections import deque
from typing import Dict, List, Optional

from core.redis_client import initialize_redis, close_redis, get_redis_client
from core.config import (
    OCR_TASK_QUEUE, LOG_LEVEL, OCR_RESULT_QUEUE, JPEG_QUALITY,
    MAX_CONCURRENT_DOWNLOADS, MAX_PENDING_IMAGES, DOWNLOAD_COOLDOWN,
    ERROR_QUEUE
)

# 로깅 설정
logging.basicConfig(level=LOG_LEVEL)
logger = logging.getLogger(__name__)

# 임시 디렉토리 생성
TEMP_DIR = tempfile.mkdtemp()
logger.info(f"임시 디렉토리 생성: {TEMP_DIR}")

# PaddleOCR 모델 로드 (GPU 사용)
try:
    logger.info("Loading PaddleOCR model with GPU...")
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

class ImageDownloadManager:
    def __init__(self):
        self.pending_images: deque = deque()  # OCR 처리를 대기 중인 이미지 큐
        self.download_semaphore = asyncio.Semaphore(MAX_CONCURRENT_DOWNLOADS)  # 동시 다운로드 제어
        self.download_tasks: Dict[str, asyncio.Task] = {}  # 진행 중인 다운로드 작업 추적

    async def add_download_task(self, session: aiohttp.ClientSession, image_url: str, image_id: str, task_data: dict):
        """새로운 이미지 다운로드 작업을 추가합니다. 부하 확인은 외부에서 수행됩니다."""
        task = asyncio.create_task(
            self._download_with_semaphore(session, image_url, image_id, task_data)
        )
        self.download_tasks[image_id] = task

    async def _download_with_semaphore(self, session: aiohttp.ClientSession, image_url: str, image_id: str, task_data: dict):
        """세마포어를 사용하여 이미지를 다운로드하고 결과를 대기열에 추가합니다."""
        request_id = task_data.get("request_id", "N/A")
        try:
            async with self.download_semaphore:
                logger.info(f"[{request_id}] Starting image download: {image_id}")
                img_array = await download_and_prepare_image(session, image_url, image_id)
                if img_array is not None:
                    self.pending_images.append((img_array, task_data))
                    logger.info(f"[{request_id}] Image download complete, added to OCR queue: {image_id}")
                else:
                    # 이미지 다운로드 실패 시 에러 큐로 전송
                    redis_client = get_redis_client()
                    await enqueue_error_result(redis_client, request_id, image_id, "Image download failed")
        except Exception as e:
            logger.error(f"[{request_id}] Image download failed for {image_id}: {e}", exc_info=True)
            # 다운로드 예외 발생 시 에러 큐로 전송
            try:
                redis_client = get_redis_client()
                await enqueue_error_result(redis_client, request_id, image_id, f"Image download error: {str(e)}")
            except Exception as eq_error:
                logger.error(f"[{request_id}] Failed to send download error to queue: {eq_error}")
        finally:
            # 작업이 완료되었으므로 추적에서 제거
            self.download_tasks.pop(image_id, None)

    def get_pending_image(self) -> Optional[tuple]:
        """대기 중인 이미지를 가져옵니다."""
        return self.pending_images.popleft() if self.pending_images else None

    def has_pending_images(self) -> bool:
        """대기 중인 이미지가 있는지 확인합니다."""
        return len(self.pending_images) > 0

    def get_pending_count(self) -> int:
        """OCR 대기열에 있는 이미지 개수를 반환합니다."""
        return len(self.pending_images)

    def get_downloading_count(self) -> int:
        """현재 다운로드 중인 작업 개수를 반환합니다."""
        return len(self.download_tasks)

    def get_total_load(self) -> int:
        """총 부하 (OCR 대기 중 + 다운로드 중)를 반환합니다."""
        return self.get_pending_count() + self.get_downloading_count()

def ensure_compatible_format(file_path: str) -> str:
    """이미지 형식을 확인하고 필요시 JPG로 변환하는 함수"""
    try:
        # 파일 확장자 확인
        _, ext = os.path.splitext(file_path)
        ext = ext.lower()
        compatible_exts = ['.jpg', '.jpeg', '.png']
        
        # 호환되는 형식이면 원본 경로 반환
        if ext in compatible_exts:
            return file_path
        
        # 호환되지 않는 형식이면 JPG로 변환
        logger.debug(f"호환되지 않는 이미지 형식({ext}) 감지, JPG로 변환 중: {file_path}")
        converted_path = file_path + '.converted.jpg'
        
        # PIL로 이미지 열고 JPG로 저장
        with Image.open(file_path) as img:
            # RGBA인 경우 RGB로 변환
            if img.mode in ('RGBA', 'LA', 'P'):
                img = img.convert('RGB')
            img.save(converted_path, 'JPEG', quality=JPEG_QUALITY)
        
        return converted_path
        
    except Exception as e:
        logger.error(f"이미지 형식 변환 중 오류 ({file_path}): {e}")
        raise Exception(f"이미지 형식 변환 실패: {e}")

async def download_and_prepare_image(session: aiohttp.ClientSession, image_url: str, image_id: str) -> np.ndarray:
    """이미지 URL에서 이미지를 다운로드하고 전처리한 후 NumPy 배열로 변환합니다."""
    temp_files = []  # 정리할 임시 파일들
    max_retries = 3
    retry_delay = 2  # 초
    
    try:
        # URL이 //로 시작하는 경우 https: 추가
        if image_url.startswith('//'):
            image_url = 'https:' + image_url
        
        logger.info(f"Downloading image from: {image_url}")
        
        # 재시도 로직
        for attempt in range(max_retries):
            try:
                async with session.get(image_url) as response:
                    if response.status == 420:
                        if attempt < max_retries - 1:
                            wait_time = retry_delay * (attempt + 1)
                            logger.warning(f"Rate limit hit (420), waiting {wait_time} seconds before retry...")
                            await asyncio.sleep(wait_time)
                            continue
                    response.raise_for_status()
                    image_bytes = await response.read()
                    break
            except aiohttp.ClientResponseError as e:
                if e.status == 420 and attempt < max_retries - 1:
                    wait_time = retry_delay * (attempt + 1)
                    logger.warning(f"Rate limit hit (420), waiting {wait_time} seconds before retry...")
                    await asyncio.sleep(wait_time)
                    continue
                raise
        
        # 2. 임시 파일로 저장
        original_path = os.path.join(TEMP_DIR, f"{image_id}")
        with open(original_path, 'wb') as f:
            f.write(image_bytes)
        temp_files.append(original_path)
        
        # 3. 호환 가능한 형식으로 변환 (필요한 경우)
        compatible_path = ensure_compatible_format(original_path)
        if compatible_path != original_path:
            temp_files.append(compatible_path)
        
        # 4. 최종 이미지를 NumPy 배열로 변환
        with Image.open(compatible_path) as image:
            # RGB로 변환 (RGBA인 경우 등)
            if image.mode != 'RGB':
                image = image.convert('RGB')
                
            # NumPy 배열로 변환 (OpenCV 형식: BGR)
            img_array = np.array(image)
            # RGB -> BGR 변환 (PaddleOCR이 BGR을 예상하는 경우)
            img_array = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
        
        logger.info(f"Image processed successfully. Final shape: {img_array.shape}")
        return img_array
        
    except Exception as e:
        logger.error(f"Failed to download and prepare image from {image_url}: {e}", exc_info=True)
        raise
    finally:
        # 임시 파일들 정리
        for temp_file in temp_files:
            try:
                if os.path.exists(temp_file):
                    os.remove(temp_file)
            except Exception as e:
                logger.warning(f"임시 파일 삭제 실패 ({temp_file}): {e}")

async def enqueue_ocr_result(redis_client, result_data: dict):
    """OCR 처리 결과를 JSON으로 직렬화하여 Redis 큐에 추가합니다."""
    try:
        result_json = json.dumps(result_data).encode('utf-8')
        await redis_client.rpush(OCR_RESULT_QUEUE, result_json)
        logger.info(f"[{result_data.get('request_id')}] OCR result enqueued to {OCR_RESULT_QUEUE} (RPUSH)")
    except Exception as e:
        logger.error(f"[{result_data.get('request_id')}] Failed to enqueue OCR result: {e}", exc_info=True)

async def enqueue_error_result(redis_client, request_id: str, image_id: str, error_message: str):
    """에러 결과를 에러 큐에 추가합니다."""
    try:
        error_data = {
            "request_id": request_id,
            "image_id": image_id,
            "error_message": error_message,
            "timestamp": time.time()
        }
        error_json = json.dumps(error_data).encode('utf-8')
        await redis_client.rpush(ERROR_QUEUE, error_json)
        logger.info(f"[{request_id}] Error result enqueued to {ERROR_QUEUE}: {error_message}")
    except Exception as e:
        logger.error(f"[{request_id}] Failed to enqueue error result: {e}", exc_info=True)

async def process_ocr_task(img_array: np.ndarray, task_data: dict):
    """단일 OCR 작업을 처리합니다."""
    request_id = task_data.get("request_id")
    image_id = task_data.get("image_id")
    image_url = task_data.get("image_url")
    is_long = task_data.get("is_long")

    logger.info(f"[{request_id}] Processing OCR for image: {image_id}")

    try:
        # PaddleOCR 실행
        loop = asyncio.get_running_loop()
        raw_result = await loop.run_in_executor(None, ocr_model.ocr, img_array, True)

        # 결과 형식 처리
        if raw_result is None or not raw_result or raw_result[0] is None:
            logger.warning(f"[{request_id}] No OCR results found for image {image_id}.")
            ocr_result = []
        elif isinstance(raw_result[0], list) and isinstance(raw_result[0][0], list) and isinstance(raw_result[0][0][0], list):
            ocr_result = raw_result[0]
        else:
            ocr_result = raw_result

        # 결과 데이터 생성
        result_data = {
            "request_id": request_id,
            "image_id": image_id,
            "image_url": image_url,
            "is_long": is_long,
            "ocr_result": ocr_result
        }

        # 결과 큐에 저장
        redis_client = get_redis_client()
        await enqueue_ocr_result(redis_client, result_data)

    except Exception as e:
        logger.error(f"[{request_id}] Error processing OCR task: {e}", exc_info=True)
        # OCR 처리 실패 시 에러 큐로 전송
        try:
            redis_client = get_redis_client()
            await enqueue_error_result(redis_client, request_id, image_id, f"OCR processing error: {str(e)}")
        except Exception as eq_error:
            logger.error(f"[{request_id}] Failed to send OCR error to queue: {eq_error}")

async def main():
    """메인 워커 루프"""
    await initialize_redis()
    redis_client = get_redis_client()
    logger.info(f"OCR Worker started. Listening to queue: {OCR_TASK_QUEUE}")

    stop_event = asyncio.Event()
    download_manager = ImageDownloadManager()

    def signal_handler():
        logger.info("Stop signal received. Shutting down gracefully...")
        stop_event.set()

    loop = asyncio.get_running_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, signal_handler)

    async with aiohttp.ClientSession() as session:
        while not stop_event.is_set():
            try:
                # 1. 부하 확인 (선 상태 확인)
                current_load = download_manager.get_total_load()
                task_tuple = None

                # 2. 부하에 따라 작업 가져오기 또는 휴식 결정
                if current_load >= MAX_PENDING_IMAGES:
                    # 부하가 임계치 이상이면 휴식
                    logger.warning(
                        f"Backpressure: System load ({current_load}) is high. "
                        f"Pausing task fetching for {DOWNLOAD_COOLDOWN}s."
                    )
                    await asyncio.sleep(DOWNLOAD_COOLDOWN)
                else:
                    # 부하가 낮으면 Redis에서 새로운 작업을 가져옴
                    task_tuple = await redis_client.blpop([OCR_TASK_QUEUE], timeout=1)

                if task_tuple:
                    # 3. 가져온 작업을 download_manager에 추가
                    list_key, task_bytes = task_tuple
                    try:
                        task_data = json.loads(task_bytes.decode('utf-8'))
                        image_url = task_data.get("image_url")
                        image_id = task_data.get("image_id", image_url.split('/')[-1])
                        
                        await download_manager.add_download_task(session, image_url, image_id, task_data)
                        
                    except json.JSONDecodeError as e:
                        logger.error(f"Failed to decode task JSON: {e}. Raw data: {task_bytes}")
                        # JSON 파싱 실패 시 에러 큐로 전송 (request_id를 알 수 없으므로 N/A로 처리)
                        try:
                            await enqueue_error_result(redis_client, "N/A", "N/A", f"JSON decode error: {str(e)}")
                        except Exception as eq_error:
                            logger.error(f"Failed to send JSON decode error to queue: {eq_error}")
                    except Exception as e:
                        logger.error(f"Error adding download task: {e}", exc_info=True)
                        # 기타 에러 시 에러 큐로 전송
                        try:
                            task_data = json.loads(task_bytes.decode('utf-8')) if 'task_bytes' in locals() else {}
                            request_id = task_data.get("request_id", "N/A")
                            image_id = task_data.get("image_id", "N/A")
                            await enqueue_error_result(redis_client, request_id, image_id, f"Task processing error: {str(e)}")
                        except Exception as eq_error:
                            logger.error(f"Failed to send task error to queue: {eq_error}")

                # 4. 대기 중인 이미지 OCR 처리 (항상 시도)
                if download_manager.has_pending_images():
                    img_array, task_data = download_manager.get_pending_image()
                    if img_array is not None:
                        await process_ocr_task(img_array, task_data)
                
                # 할 일이 없었던 경우 (Redis 큐 비어있고, 처리할 이미지도 없음) CPU 과사용 방지
                if not task_tuple and not download_manager.has_pending_images():
                    await asyncio.sleep(0.1)

            except asyncio.CancelledError:
                logger.info("Main loop cancelled.")
                break
            except Exception as e:
                logger.error(f"An error occurred in the main loop: {e}", exc_info=True)
                await asyncio.sleep(5)

    logger.info("Closing Redis connection...")
    await close_redis()
    
    # 임시 디렉토리 정리
    try:
        shutil.rmtree(TEMP_DIR)
        logger.info(f"임시 디렉토리 정리 완료: {TEMP_DIR}")
    except Exception as e:
        logger.warning(f"임시 디렉토리 정리 실패: {e}")
    
    logger.info("OCR Worker stopped.")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("KeyboardInterrupt received. Exiting.")
    except Exception as e:
        logger.critical(f"Critical error in worker startup/runtime: {e}", exc_info=True)
        exit(1)
