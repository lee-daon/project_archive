import os
import sys
import json
import logging
import signal
import time
import asyncio
import concurrent.futures
from typing import List, Dict, Tuple, Any, Optional, Callable, Coroutine
from functools import partial

import numpy as np
import cv2
import torch
import redis
import aiohttp
from PIL import Image, ImageDraw, ImageFont

# 프로젝트 루트 설정
WORKER_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(WORKER_DIR) # 'logic' 등 로컬 모듈 임포트를 위해 경로 추가
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
    PROCESSOR_TASK_QUEUE,
    MASK_PADDING_PIXELS,
    HOSTING_TASKS_QUEUE,
    SUCCESS_QUEUE,
    ERROR_QUEUE,
    CPU_WORKER_COUNT,
    TRANSLATE_TEXT_RESULT_HASH_PREFIX,
    RESIZE_TARGET_SIZE,
    FONT_PATH,
    MAX_CONCURRENT_TASKS,
    MAX_POSTPROCESS_TASKS,
    INFERENCE_QUEUE_SIZE_SHORT,
    INFERENCE_QUEUE_SIZE_LONG,
    POSTPROCESSING_QUEUE_SIZE,
    POSTPROCESS_QUEUE_TIMEOUT,
    IMAGE_DOWNLOAD_MAX_RETRIES,
    IMAGE_DOWNLOAD_RETRY_DELAY
)
from core.shm_manager import get_array_from_shm, create_shm_from_array, cleanup_shm
from core.redis_client import initialize_redis, close_redis, get_redis_client

# 통합된 로직 모듈들 임포트
from logic.post_processing import restore_from_padding
from logic.lama_gpu import load_model as load_lama_gpu_model, run_batch_inference
from logic.mask import filter_chinese_ocr_result, generate_mask_pure_sync
from logic.text_translate import process_and_save_translation
from logic.preprocessing import process_single_task_pure_sync
from hosting.r2hosting import R2ImageHosting

# 분리된 렌더링 관련 모듈 임포트
from rendering_worker.result_check import ResultChecker
from rendering_worker.rendering import RenderingProcessor

# 로깅 설정
logging.basicConfig(level=LOG_LEVEL)
logging.getLogger('asyncio').setLevel(logging.WARNING) # asyncio 자체 로그는 줄이기
logger = logging.getLogger(__name__)

async def enqueue_error_result(request_id: str, image_id: str, error_message: str):
    """에러 결과를 에러 큐에 추가합니다."""
    try:
        redis_client = get_redis_client()
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

class AsyncInpaintingWorker:
    """통합된 비동기 인페인팅 + 렌더링 워커 (ThreadPool 렌더링 적용)"""
    
    def __init__(self):
        # CPU 집약적 작업용 ThreadPoolExecutor (렌더링 포함)
        self.cpu_executor = concurrent.futures.ThreadPoolExecutor(
            max_workers=CPU_WORKER_COUNT, 
            thread_name_prefix="cpu-worker"
        )
        
        # GPU 작업 동시성 제어
        self.gpu_semaphore = asyncio.Semaphore(1)
        
        # ✨ 신규: 동시 작업 수 제한으로 메모리 과부하 방지
        self.concurrent_task_semaphore = asyncio.Semaphore(MAX_CONCURRENT_TASKS) # 동시에 처리할 수 있는 최대 작업 수

        # ✨ 신규: 후처리 동시성 제어용 세마포어
        self.postprocess_semaphore = asyncio.Semaphore(MAX_POSTPROCESS_TASKS) # 동시에 처리할 최대 후처리 작업 수

        # 내부 큐들 (전처리 큐 제거)
        self.inference_queue_short = asyncio.Queue(maxsize=INFERENCE_QUEUE_SIZE_SHORT)
        self.inference_queue_long = asyncio.Queue(maxsize=INFERENCE_QUEUE_SIZE_LONG)
        self.postprocessing_queue = asyncio.Queue(maxsize=POSTPROCESSING_QUEUE_SIZE)
        
        # R2 호스팅 인스턴스 (최종 결과 호스팅용만)
        self.r2_hosting = R2ImageHosting()
        
        # HTTP 클라이언트 세션
        self.http_session: Optional[aiohttp.ClientSession] = None
        
        # 워커 상태
        self._running = False
        self._workers = []
        
        # 렌더링 관련 인스턴스들 (나중에 초기화)
        self.rendering_processor = None
        self.result_checker = None
        self.main_loop = None

    async def start_workers(self):
        """워커 태스크들 시작 (올바른 이벤트 루프에서 큐 생성)"""
        self._running = True
        
        # HTTP 클라이언트 세션 생성
        self.http_session = aiohttp.ClientSession()

        # 메인 이벤트 루프에서 큐들과 세마포어 생성
        self.main_loop = asyncio.get_running_loop()
        self.gpu_semaphore = asyncio.Semaphore(1)
        self.inference_queue_short = asyncio.Queue(maxsize=INFERENCE_QUEUE_SIZE_SHORT)
        self.inference_queue_long = asyncio.Queue(maxsize=INFERENCE_QUEUE_SIZE_LONG)
        self.postprocessing_queue = asyncio.Queue(maxsize=POSTPROCESSING_QUEUE_SIZE)
        
        # 렌더링 관련 인스턴스 초기화
        self.rendering_processor = RenderingProcessor(loop=self.main_loop)
        self.result_checker = ResultChecker(
            cpu_executor=self.cpu_executor,
            rendering_processor=self.rendering_processor,
            http_session=self.http_session
        )
        
        logger.info("✅ Queues and rendering modules created in correct event loop")
        
        # ✨ 변경: 범용 워커를 사용하여 매니저 태스크들을 생성
        postprocess_manager_task = asyncio.create_task(
            self._concurrent_worker(
                "postprocess-manager",
                self.postprocessing_queue,
                self._handle_postprocessing_task,
                self.postprocess_semaphore,
                get_timeout=POSTPROCESS_QUEUE_TIMEOUT
            )
        )
        
        short_task = asyncio.create_task(self._gpu_inference_worker("gpu-short", is_long=False))
        long_task = asyncio.create_task(self._gpu_inference_worker("gpu-long", is_long=True))
        
        # 외부 요청을 받는 Redis 리스너 워커 추가
        redis_listener_task = asyncio.create_task(self._redis_listener_worker("redis-listener"))

        self._workers = [
            postprocess_manager_task, 
            short_task, 
            long_task, 
            redis_listener_task
        ]
        logger.info(f"🚀 Started {len(self._workers)} batch processing workers, including Redis listener")

    async def stop_workers(self):
        """모든 워커 정지"""
        self._running = False
        
        # 모든 워커 태스크 취소
        for worker in self._workers:
            worker.cancel()
        
        await asyncio.gather(*self._workers, return_exceptions=True)
        self._workers.clear()
        
        # HTTP 세션 종료
        if self.http_session:
            await self.http_session.close()
            
        # 스레드풀 종료
        self.cpu_executor.shutdown(wait=True)
        logger.info("Stopped all workers and thread pool")

    async def run_cpu_task(self, func, *args, **kwargs):
        """CPU 집약적 작업을 별도 스레드에서 실행 (GIL 우회)"""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            self.cpu_executor, 
            partial(func, *args, **kwargs)
        )

    async def process_ocr_task(self, task_data: dict):
        """OCR 작업 처리 - 진정한 I/O/CPU 분리. 작업 완료 시 반드시 세마포어를 해제합니다."""
        request_id = task_data.get("request_id")
        
        try:
            image_url = task_data.get("image_url")
            image_id = task_data.get("image_id")
            ocr_result = task_data.get("ocr_result")
            
            logger.info(f"[{request_id}] Starting OCR task processing")
            
            try:
                # 1. 먼저 중국어 텍스트가 있는지 확인 (가벼운 작업)
                from logic.mask import filter_chinese_ocr_result
                filtered_ocr_result = filter_chinese_ocr_result(ocr_result or [], request_id)
                
                if not filtered_ocr_result:
                    # Case 2/3: 중국어 텍스트가 없으면 이미지 크기 정리 (Long/Short 모두 처리)
                    is_long = task_data.get("is_long")
                    logger.info(f"[{request_id}] No Chinese text found, processing image resize (is_long={is_long})")
                    
                    # 이미지 다운로드
                    image_bytes = await self._download_image_async(image_url, request_id)
                    if image_bytes is None:
                        logger.error(f"[{request_id}] Image download failed")
                        await enqueue_error_result(request_id, image_id, "Image download failed")
                        return
                    
                    # Long/Short 모두 이미지 크기 정리 처리
                    final_image_url = await self.run_cpu_task(
                        self._handle_no_chinese_text_sync, 
                        image_bytes, 
                        image_url,
                        request_id, 
                        image_id,
                        is_long
                    )
                    
                    if final_image_url:
                        # 최종 URL을 호스팅 큐로 전송
                        from core.redis_client import get_redis_client
                        redis_client = get_redis_client()
                        hosting_task = {
                            "request_id": request_id,
                            "image_id": image_id,
                            "image_url": final_image_url
                        }
                        await redis_client.rpush(HOSTING_TASKS_QUEUE, json.dumps(hosting_task).encode('utf-8'))
                        logger.info(f"[{request_id}] Forwarded to hosting queue (no Chinese text, final URL: {final_image_url})")
                    else:
                        await enqueue_error_result(request_id, image_id, "Failed to process no-Chinese-text image")
                    return
                
                # 2. 중국어가 있을 때만 이미지 다운로드 (I/O 작업)
                logger.debug(f"[{request_id}] Chinese text found, starting inpainting pipeline")
                logger.debug(f"[{request_id}] Downloading image (async I/O)")
                image_bytes = await self._download_image_async(image_url, request_id)
                
                if image_bytes is None:
                    logger.error(f"[{request_id}] Image download failed")
                    await enqueue_error_result(request_id, image_id, "Image download failed")
                    return
                
                # 3. 마스크 생성 + 전처리 (CPU 집약적 - 스레드풀에서 한번에 처리)
                logger.debug(f"[{request_id}] Generating mask and preprocessing (pure CPU in thread)")
                is_long = task_data.get("is_long", False)
                processed_result = await self.run_cpu_task(
                    self._generate_mask_and_preprocess_sync, 
                    image_bytes, 
                    ocr_result, 
                    request_id,
                    image_id,
                    is_long
                )
                
                if not processed_result:
                    logger.error(f"[{request_id}] Mask generation and preprocessing failed")
                    await enqueue_error_result(request_id, image_id, "Mask generation and preprocessing failed")
                    return
                
                # 4. 번역 작업 (I/O 집약적 - 순수 async, 외부 모듈 호출)
                logger.debug(f"[{request_id}] Running translation (async I/O)")
                # 이미 중국어 필터링이 완료되었으므로 filtered_ocr_result 전달
                task_data_with_filtered = task_data.copy()
                task_data_with_filtered["filtered_ocr_result"] = filtered_ocr_result
                await process_and_save_translation(task_data_with_filtered, image_url, self.result_checker)
                
                # 5. 바로 추론 큐에 추가 (배치 처리)
                is_long = processed_result.get("is_long", False)
                target_queue = self.inference_queue_long if is_long else self.inference_queue_short
                await target_queue.put(processed_result)
                logger.debug(f"[{request_id}] ✅ Added to {'long' if is_long else 'short'} inference queue")
                
            except Exception as e:
                logger.error(f"[{request_id}] Error in OCR task: {e}", exc_info=True)
                await enqueue_error_result(request_id, image_id, f"OCR task processing error: {str(e)}")
        finally:
            # ✨ 신규: 작업이 성공하든 실패하든, 반드시 세마포어를 해제하여 다른 작업이 시작될 수 있도록 함
            self.concurrent_task_semaphore.release()
            logger.debug(f"[{request_id}] Task finished, semaphore released.")

    async def _download_image_async(self, image_url: str, request_id: str) -> Optional[bytes]:
        """이미지 다운로드 (순수 async I/O - 메인 루프에서)"""
        if not self.http_session:
            logger.error(f"[{request_id}] HTTP Session is not initialized.")
            return None

        try:
            # URL이 //로 시작하는 경우 https: 추가
            if image_url.startswith('//'):
                image_url = 'https:' + image_url

            logger.debug(f"[{request_id}] Downloading from: {image_url}")
            
            # 재시도 로직
            max_retries = IMAGE_DOWNLOAD_MAX_RETRIES
            retry_delay = IMAGE_DOWNLOAD_RETRY_DELAY
            
            for attempt in range(max_retries):
                try:
                    async with self.http_session.get(image_url) as response:
                        if response.status == 420:
                            if attempt < max_retries - 1:
                                wait_time = retry_delay * (attempt + 1)
                                logger.warning(f"[{request_id}] Rate limit, waiting {wait_time}s")
                                await asyncio.sleep(wait_time)
                                continue
                        response.raise_for_status()
                        image_bytes = await response.read()
                        logger.debug(f"[{request_id}] Downloaded {len(image_bytes)} bytes")
                        return image_bytes
                            
                except aiohttp.ClientResponseError as e:
                    if e.status == 420 and attempt < max_retries - 1:
                        wait_time = retry_delay * (attempt + 1)
                        logger.warning(f"[{request_id}] Rate limit, waiting {wait_time}s")
                        await asyncio.sleep(wait_time)
                        continue
                    raise
                    
        except Exception as e:
            logger.error(f"[{request_id}] Download failed: {e}", exc_info=True)
            return None

    async def _handle_postprocessing_task(self, postprocess_task: dict):
        """단일 후처리 작업을 비동기적으로 처리하고, 완료 시 세마포어를 해제하는 '실무' 핸들러"""
        try:
            # CPU 집약적 작업을 스레드 풀에서 실행 (순수 동기)
            restored_bgr_array = await self.run_cpu_task(self._postprocess_pure_sync, postprocess_task)
            
            # CPU 작업이 성공적으로 완료되었을 때만 결과 저장
            if restored_bgr_array is not None:
                task_data = postprocess_task["task"]
                request_id = task_data.get("request_id")
                image_id = task_data.get("image_id")
                is_long = postprocess_task["is_long"]

                logger.info(f"[{request_id}] Inpainting completed, saving to ResultChecker")
                
                # 임시 파일로 저장
                temp_dir = "/app/output/temp_inpainted"
                os.makedirs(temp_dir, exist_ok=True)
                temp_filename = f"{request_id}.png"
                temp_path = os.path.join(temp_dir, temp_filename)
                
                success = cv2.imwrite(temp_path, restored_bgr_array)
                if success:
                    # ResultChecker의 내부 저장소에 인페인팅 결과 저장
                    inpainting_data = {
                        "image_id": image_id,
                        "is_long": is_long,
                        "temp_path": temp_path
                    }
                    await self.result_checker.save_inpainting_result(request_id, inpainting_data)
                else:
                    logger.error(f"[{request_id}] Failed to save inpainted image to: {temp_path}")
                    # 이미지 저장 실패 시 에러 큐로 전송
                    await enqueue_error_result(request_id, task_data.get("image_id", "N/A"), "Failed to save inpainted image")
        except Exception as e:
            request_id = postprocess_task.get("task", {}).get("request_id", "N/A")
            image_id = postprocess_task.get("task", {}).get("image_id", "N/A")
            logger.error(f"[{request_id}] Error in postprocessing handler: {e}", exc_info=True)
            await enqueue_error_result(request_id, image_id, f"Postprocessing error: {str(e)}")
        finally:
            # ✨ 신규: 작업 성공/실패 여부와 관계없이 반드시 세마포어 해제
            self.postprocess_semaphore.release()

    def _postprocess_pure_sync(self, postprocess_task: dict) -> np.ndarray:
        """후처리 순수 동기 함수 (100% CPU 작업만)"""
        try:
            task_data = postprocess_task["task"]
            result = postprocess_task["result"]
            
            padding_info = task_data.get("padding_info")
            original_size = task_data.get("original_size")
            
            # 결과를 원본 크기로 복원 (CPU 집약적)
            restored_result = restore_from_padding(result, padding_info, original_size)
            
            # RGB -> BGR 변환 (CPU 집약적)
            restored_result_bgr = cv2.cvtColor(restored_result, cv2.COLOR_RGB2BGR)
            
            return restored_result_bgr
            
        except Exception as e:
            request_id = postprocess_task.get("task", {}).get("request_id", "N/A")
            logger.error(f"[{request_id}] Postprocessing error in thread: {e}", exc_info=True)
            raise

    # ✨ 신규: 범용 동시성 워커
    async def _concurrent_worker(
        self, 
        worker_name: str, 
        queue: asyncio.Queue, 
        handler: Callable[[Dict], Coroutine], 
        semaphore: asyncio.Semaphore,
        get_timeout: Optional[float] = None
    ):
        """
        큐에서 작업을 가져와, 세마포어로 동시성을 제어하며, 지정된 핸들러로 작업을 처리하는
        범용 워커입니다.
        """
        logger.info(f"Concurrent worker '{worker_name}' started for queue '{queue}'")
        while self._running:
            try:
                if get_timeout:
                    task_data = await asyncio.wait_for(queue.get(), timeout=get_timeout)
                else:
                    task_data = await queue.get()

                await semaphore.acquire()
                asyncio.create_task(handler(task_data))
                queue.task_done()

            except asyncio.TimeoutError:
                continue
            except asyncio.CancelledError:
                logger.info(f"Worker '{worker_name}' cancelled.")
                break
            except Exception as e:
                logger.error(f"Unexpected error in worker '{worker_name}': {e}", exc_info=True)
                await asyncio.sleep(1)

    # ✨ 신규: 메인 루프에서 분리된 Redis 리스너 워커
    async def _redis_listener_worker(self, worker_name: str):
        """Redis 큐에서 작업을 지속적으로 가져와 처리 태스크를 생성하는 워커"""
        logger.info(f"Worker {worker_name} started. Listening on: {PROCESSOR_TASK_QUEUE}")
        
        while self._running:
            try:
                redis_client = get_redis_client()
                
                # Redis에서 OCR 작업 받기
                ocr_task_tuple = await redis_client.blpop([PROCESSOR_TASK_QUEUE], timeout=1)
                
                if ocr_task_tuple:
                    # ✨ 신규: 새로운 작업을 시작하기 전에 세마포어를 획득 (획득할 수 있을 때까지 대기)
                    # 이를 통해 동시에 실행되는 작업의 수를 제한합니다.
                    await self.concurrent_task_semaphore.acquire()
                    
                    task_bytes = ocr_task_tuple[1]
                    try:
                        task_data = json.loads(task_bytes.decode('utf-8'))
                        request_id = task_data.get('request_id', 'N/A')
                        logger.debug(f"[{request_id}] Acquired semaphore, creating task.")
                        
                        # OCR 작업을 비동기로 처리 (fire-and-forget)
                        asyncio.create_task(self.process_ocr_task(task_data))
                        
                    except json.JSONDecodeError as e:
                        logger.error(f"Failed to decode OCR task JSON: {e}")
                        self.concurrent_task_semaphore.release()
                    except Exception as e:
                        req_id = task_data.get('request_id', 'N/A') if 'task_data' in locals() else 'N/A'
                        logger.error(f"[{req_id}] Error creating OCR task: {e}", exc_info=True)
                        self.concurrent_task_semaphore.release()
                else:
                    await asyncio.sleep(0.1)

            except asyncio.CancelledError:
                logger.info(f"Worker {worker_name} cancelled")
                break
            except (redis.exceptions.ConnectionError, redis.exceptions.TimeoutError) as e:
                logger.error(f"Redis connection error in {worker_name}: {e}")
                await asyncio.sleep(5)
            except Exception as e:
                logger.error(f"Unexpected error in {worker_name}: {e}", exc_info=True)
                await asyncio.sleep(1)

    def _handle_no_chinese_text_sync(self, image_bytes: bytes, original_url: str, request_id: str, image_id: str, is_long: bool) -> str:
        """중국어 텍스트가 없을 때 Long/Short 모두 이미지 크기 정리 처리 (순수 동기 함수)"""
        try:
            # 1. 이미지 디코딩
            img_array = np.frombuffer(image_bytes, dtype=np.uint8)
            img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
            
            if img is None:
                logger.error(f"[{request_id}] Failed to decode image")
                return original_url
            
            # 2. rendering.py와 동일한 이미지 크기 정리 로직
            original_h, original_w = img.shape[:2]
            
            if not is_long:
                # Short: 1024x1024 고정
                target_h, target_w = RESIZE_TARGET_SIZE
                logger.info(f"[{request_id}] Short image: {original_w}x{original_h} → {target_w}x{target_h}")
            else:
                # Long: 가로 864px 고정, 세로 비율 유지
                target_w = 864
                scale = target_w / original_w
                target_h = int(original_h * scale)
                logger.info(f"[{request_id}] Long image: {original_w}x{original_h} → {target_w}x{target_h}")
            
            # 3. 이미지 리사이즈
            resized_img = cv2.resize(img, (target_w, target_h))
            
            # 4. R2에 업로드
            from datetime import datetime
            current_date = datetime.now().strftime('%Y-%m-%d')
            
            # image_id에서 productId 추출 (첫 번째 '-'로 분리)
            if '-' in image_id:
                product_id = image_id.split('-', 1)[0]
                remaining_part = image_id.split('-', 1)[1]
            else:
                product_id = image_id
                remaining_part = ""
            
            # 파일명 구성: remaining_part + '-' + request_id의 첫 5글자
            final_image_id = f"{remaining_part}-{request_id[:5]}" if remaining_part else f"{image_id}-{request_id[:5]}"
            
            upload_result = self.r2_hosting.upload_image_from_array(
                image_array=resized_img,
                image_id=final_image_id,
                sub_path=f'translated_image/{current_date}/{product_id}',
                file_ext='.jpg',
                quality=90,
                metadata={
                    "request_id": request_id,
                    "image_id": image_id,
                    "type": f"no_chinese_text_{'long' if is_long else 'short'}_resize"
                }
            )
            
            if upload_result["success"]:
                final_image_url = upload_result["url"]
                logger.info(f"[{request_id}] Image resized and uploaded: {final_image_url}")
                return final_image_url
            else:
                logger.error(f"[{request_id}] Failed to upload resized image: {upload_result.get('error')}")
                return original_url  # 업로드 실패 시 원본 URL 반환
                
        except Exception as e:
            logger.error(f"[{request_id}] Error in no-Chinese-text handler: {e}", exc_info=True)
            return original_url  # 에러 시 원본 URL 반환

    def _generate_mask_and_preprocess_sync(self, image_bytes: bytes, ocr_result: list, request_id: str, image_id: str, is_long: bool):
        """마스크 생성 + 전처리를 한번에 처리하는 순수 동기 함수 (CPU 스레드풀에서 실행)"""
        try:
            from logic.mask import generate_mask_pure_sync
            from logic.preprocessing import process_single_task_pure_sync
            
            # 1. 마스크 생성
            logger.debug(f"[{request_id}] Generating mask (pure CPU)")
            mask_result = generate_mask_pure_sync(image_bytes, ocr_result, request_id, image_id, is_long)
            
            if not mask_result:
                logger.error(f"[{request_id}] Mask generation failed")
                return None
            
            img_array, mask_array, preprocessing_task = mask_result
            
            # 2. 바로 전처리 실행
            logger.debug(f"[{request_id}] Running preprocessing (pure CPU)")
            processed_task = process_single_task_pure_sync(preprocessing_task, is_long)
            
            if not processed_task:
                logger.error(f"[{request_id}] Preprocessing failed")
                return None
                
            logger.debug(f"[{request_id}] Mask generation and preprocessing completed")
            return processed_task
            
        except Exception as e:
            logger.error(f"[{request_id}] Error in mask generation and preprocessing: {e}", exc_info=True)
            return None

    async def _gpu_inference_worker(self, worker_name: str, is_long: bool):
        """GPU 인퍼런스 워커 (배치 처리) - 전처리된 데이터를 받아서 GPU 추론 실행"""
        logger.info(f"GPU inference worker {worker_name} started")
        
        queue = self.inference_queue_long if is_long else self.inference_queue_short
        batch_size = INPAINTING_BATCH_SIZE_LONG if is_long else INPAINTING_BATCH_SIZE_SHORT
        
        while self._running:
            try:
                # 배치 수집
                batch_tasks = []
                try:
                    # 첫 번째 작업 대기
                    task = await asyncio.wait_for(queue.get(), timeout=2.0)
                    batch_tasks.append(task)
                    
                    # 나머지 배치 수집
                    for _ in range(batch_size - 1):
                        try:
                            task = await asyncio.wait_for(queue.get(), timeout=0.1)
                            batch_tasks.append(task)
                        except asyncio.TimeoutError:
                            break
                            
                except asyncio.TimeoutError:
                    continue
                
                if batch_tasks:
                    logger.info(f"[{worker_name}] Processing batch of {len(batch_tasks)} tasks")
                    await self._process_gpu_batch(batch_tasks, is_long, worker_name)
                    
            except asyncio.CancelledError:
                logger.info(f"GPU worker {worker_name} cancelled")
                break
            except Exception as e:
                logger.error(f"Error in GPU worker {worker_name}: {e}", exc_info=True)
                await asyncio.sleep(1)

    async def _process_gpu_batch(self, batch_tasks: List[Dict[str, Any]], is_long: bool, worker_name: str):
        """GPU 배치 처리"""
        async with self.gpu_semaphore:  # GPU 동시성 제어
            try:
                batch_start_time = time.time()
                
                # 전처리된 데이터 로드
                images_np = []
                masks_np = []
                shm_handles = []
                
                for task in batch_tasks:
                    try:
                        request_id = task.get("request_id")
                        preprocessed_img_shm_info = task.get("preprocessed_img_shm_info")
                        preprocessed_mask_shm_info = task.get("preprocessed_mask_shm_info")

                        if not all([preprocessed_img_shm_info, preprocessed_mask_shm_info]):
                            logger.error(f"[{request_id}] Missing preprocessed data")
                            continue
                        
                        # 전처리된 이미지 로드
                        img_array, img_shm = get_array_from_shm(preprocessed_img_shm_info)
                        shm_handles.append(img_shm)
                        
                        # 전처리된 마스크 로드
                        mask_array, mask_shm = get_array_from_shm(preprocessed_mask_shm_info)
                        shm_handles.append(mask_shm)
                        
                        if img_array is None or mask_array is None:
                            logger.error(f"[{request_id}] Failed to load from SHM")
                            continue
                        
                        images_np.append(img_array)
                        masks_np.append(mask_array)
                        
                    except Exception as e:
                        logger.error(f"Error loading batch data: {e}", exc_info=True)
                        continue
                
                if not images_np:
                    logger.warning(f"[{worker_name}] No valid images in batch")
                    return
                
                # GPU 추론 실행
                logger.info(f"[{worker_name}] Running LaMa inference on {len(images_np)} images")
                results_np = run_batch_inference(
                    images_np=images_np,
                    masks_np=masks_np,
                    use_fp16=USE_FP16
                )
                
                # 후처리를 위한 작업들을 큐에 추가
                for i, result in enumerate(results_np):
                    if i < len(batch_tasks):
                        postprocess_task = {
                            "task": batch_tasks[i],
                            "result": result,
                            "is_long": is_long
                        }
                        
                        # 후처리 큐에 추가
                        await self.postprocessing_queue.put(postprocess_task)

                # 전처리된 공유 메모리 정리
                for task in batch_tasks:
                    self._cleanup_preprocessed_shm(task)

                batch_time = time.time() - batch_start_time
                logger.info(f"[{worker_name}] Batch completed in {batch_time:.2f}s")
                    
            except Exception as e:
                logger.error(f"[{worker_name}] GPU batch error: {e}", exc_info=True)
                # GPU 배치 처리 실패 시 각 작업에 대해 에러 큐로 전송
                for task in batch_tasks:
                    try:
                        request_id = task.get("request_id", "N/A")
                        image_id = task.get("image_id", "N/A")
                        await enqueue_error_result(request_id, image_id, f"GPU processing error: {str(e)}")
                    except Exception as eq_error:
                        logger.error(f"Failed to send GPU error to queue: {eq_error}")
            finally:
                # SHM 핸들 닫기
                for shm in shm_handles:
                    try:
                        if shm:
                            shm.close()
                    except Exception:
                        pass

    def _cleanup_preprocessed_shm(self, task: dict):
        """전처리된 공유 메모리 정리"""
        try:
            for shm_key in ["preprocessed_img_shm_info", "preprocessed_mask_shm_info"]:
                shm_info = task.get(shm_key)
                if shm_info and 'shm_name' in shm_info:
                    cleanup_shm(shm_info['shm_name'])
        except Exception as e:
            logger.error(f"Error cleaning up SHM: {e}")

# 전역 워커 인스턴스
async_worker = AsyncInpaintingWorker()

async def load_model():
    """LaMa 모델 로드"""
    try:
        logger.info("Loading LaMa GPU model...")
        await load_lama_gpu_model(LAMA_CONFIG_PATH, LAMA_CHECKPOINT_PATH, USE_CUDA)
    except Exception as e:
        logger.error(f"Failed to load LaMa model: {e}", exc_info=True)
        raise

async def run_worker(stop_event: asyncio.Event):
    """메인 워커 루프 (통합 파이프라인: OCR 후처리 + 인페인팅 + ThreadPool 렌더링)"""
    redis_initialized = False
    
    try:
        # Redis 초기화
        await initialize_redis()
        redis_initialized = True
        
        # LaMa 모델 로드
        await load_model()
        
        # 비동기 워커들 시작
        await async_worker.start_workers()
        
        logger.info(f"Complete pipeline worker started. Listening: {PROCESSOR_TASK_QUEUE}")
        logger.info("Pipeline: OCR → Translation → Inpainting → ThreadPool Rendering → Hosting")
        
        while not stop_event.is_set():
            try:
                redis_client = get_redis_client()
                
                # Redis에서 OCR 작업 받기
                ocr_task_tuple = await redis_client.blpop([PROCESSOR_TASK_QUEUE], timeout=1)
                
                if ocr_task_tuple:
                    # ✨ 신규: 새로운 작업을 시작하기 전에 세마포어를 획득 (획득할 수 있을 때까지 대기)
                    # 이를 통해 동시에 실행되는 작업의 수를 제한합니다.
                    await async_worker.concurrent_task_semaphore.acquire()
                    
                    task_bytes = ocr_task_tuple[1]
                    try:
                        task_data = json.loads(task_bytes.decode('utf-8'))
                        request_id = task_data.get('request_id', 'N/A')
                        logger.debug(f"[{request_id}] Acquired semaphore, creating task.")
                        
                        # OCR 작업을 비동기로 처리 (fire-and-forget)
                        # 이 태스크는 완료 시 반드시 세마포어를 해제해야 합니다.
                        asyncio.create_task(async_worker.process_ocr_task(task_data))
                        
                    except json.JSONDecodeError as e:
                        logger.error(f"Failed to decode OCR task JSON: {e}")
                        # JSON 파싱 실패 시 에러 큐로 전송
                        await enqueue_error_result("N/A", "N/A", f"JSON decode error: {str(e)}")
                        async_worker.concurrent_task_semaphore.release() # ✨ 신규: JSON 파싱 실패 시에도 세마포어 해제
                    except Exception as e:
                        req_id = task_data.get('request_id', 'N/A') if 'task_data' in locals() else 'N/A'
                        img_id = task_data.get('image_id', 'N/A') if 'task_data' in locals() else 'N/A'
                        logger.error(f"[{req_id}] Error processing OCR task: {e}", exc_info=True)
                        await enqueue_error_result(req_id, img_id, f"Task processing error: {str(e)}")
                        async_worker.concurrent_task_semaphore.release() # ✨ 신규: 알 수 없는 오류 발생 시에도 세마포어 해제
                else:
                    # 잠시 대기
                    await asyncio.sleep(0.1)
                    
            except asyncio.CancelledError:
                logger.info("Main loop cancelled")
                break
            except (redis.exceptions.ConnectionError, redis.exceptions.TimeoutError) as e:
                logger.error(f"Redis connection error: {e}")
                await asyncio.sleep(5)
            except Exception as e:
                logger.error(f"Unexpected error in main loop: {e}", exc_info=True)
                await asyncio.sleep(1)
    
    except Exception as e:
        logger.critical(f"Critical worker error: {e}", exc_info=True)
    finally:
        logger.info("Shutting down complete pipeline worker...")
        
        await async_worker.stop_workers()
        if redis_initialized:
            await close_redis()

def main():
    """메인 진입점"""
    stop_event = asyncio.Event()
    
    def shutdown_handler(sig, frame):
        logger.info(f"Signal {sig} received. Starting graceful shutdown...")
        loop = asyncio.get_event_loop()
        if loop.is_running():
            loop.call_soon_threadsafe(stop_event.set)
    
    # 신호 핸들러 등록
    signal.signal(signal.SIGINT, shutdown_handler)
    signal.signal(signal.SIGTERM, shutdown_handler)
    
    try:
        asyncio.run(run_worker(stop_event))
    except KeyboardInterrupt:
        logger.info("KeyboardInterrupt detected. Shutting down.")
        if not stop_event.is_set():
            stop_event.set()
    
    logger.info("Complete pipeline worker shutdown complete.")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        logger.critical(f"Critical error during worker execution: {e}", exc_info=True)
        exit(1)
