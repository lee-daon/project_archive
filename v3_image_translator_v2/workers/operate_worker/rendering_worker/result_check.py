import json
import logging
import asyncio
from typing import Dict, Any
import concurrent.futures
import os
import cv2
import numpy as np

from core.config import HOSTING_TASKS_QUEUE

# 로깅 설정
logger = logging.getLogger(__name__)

# 임시 파일 저장 경로
TEMP_OUTPUT_DIR = "/app/output/temp_inpainted"
os.makedirs(TEMP_OUTPUT_DIR, exist_ok=True)

class ResultChecker:
    def __init__(self, cpu_executor: concurrent.futures.ThreadPoolExecutor,
                 rendering_processor, http_session):
        """
        번역 결과와 인페인팅 결과를 내부 메모리에서 확인하고 렌더링 작업을 ThreadPool에 제출하는 클래스
        """
        self.cpu_executor = cpu_executor
        self.rendering_processor = rendering_processor
        self.http_session = http_session
        
        # ✨ 내부 메모리 저장소 (Redis 대신 사용)
        self.translation_results = {}  # {request_id: translation_data}
        self.inpainting_results = {}   # {request_id: inpainting_data}  
        self.result_lock = asyncio.Lock()  # 동시성 제어

    async def save_translation_result(self, request_id: str, data: dict):
        """번역 결과를 내부 메모리에 저장하고 렌더링 가능성 확인"""
        async with self.result_lock:
            self.translation_results[request_id] = data
            logger.debug(f"[{request_id}] Translation result saved to memory")
            await self._check_and_trigger_rendering(request_id)

    async def save_inpainting_result(self, request_id: str, data: dict):
        """인페인팅 결과를 내부 메모리에 저장하고 렌더링 가능성 확인"""
        async with self.result_lock:
            self.inpainting_results[request_id] = data
            logger.debug(f"[{request_id}] Inpainting result saved to memory")
            await self._check_and_trigger_rendering(request_id)

    async def _check_and_trigger_rendering(self, request_id: str):
        """두 결과가 모두 준비되면 렌더링 트리거 (내부 메모리 기반)"""
        translation_data = self.translation_results.get(request_id)
        inpainting_data = self.inpainting_results.get(request_id)
        
        if translation_data and inpainting_data:
            logger.info(f"[{request_id}] Both results ready, triggering rendering")
            
            try:
                # 렌더링 실행
                await self._trigger_rendering_internal(request_id, translation_data, inpainting_data)
                
            except Exception as e:
                logger.error(f"[{request_id}] Error in rendering: {e}", exc_info=True)
            finally:
                # 메모리 정리
                self.translation_results.pop(request_id, None)
                self.inpainting_results.pop(request_id, None)
                logger.debug(f"[{request_id}] Results cleaned from memory")

    async def _trigger_rendering_internal(self, request_id: str, translation_data: dict, inpainting_data: dict):
        """내부 메모리 데이터를 사용하여 렌더링 실행"""
        try:
            # 인페인팅 이미지 로드
            temp_path = inpainting_data.get("temp_path")
            if not temp_path or not os.path.exists(temp_path):
                logger.error(f"[{request_id}] Inpainted image file not found: {temp_path}")
                return
                
            inpainted_image = cv2.imread(temp_path)
            if inpainted_image is None:
                logger.error(f"[{request_id}] Failed to load inpainted image from: {temp_path}")
                return

            # 원본 이미지 다운로드 (번역 데이터에서 URL 가져오기)
            original_image_url = translation_data.get("image_url")
            if not original_image_url:
                logger.error(f"[{request_id}] Original image URL not found in translation data")
                return
                
            original_image_bytes = await self._download_image_async(original_image_url, request_id)
            if not original_image_bytes:
                logger.error(f"[{request_id}] Failed to download original image")
                return

            # 렌더링 태스크 데이터 구성
            rendering_task_data = {
                "request_id": request_id,
                "image_id": translation_data.get("image_id"),
                "translate_data": translation_data,
                "inpainted_image": inpainted_image,
                "original_image_bytes": original_image_bytes,
                "is_long": inpainting_data.get("is_long", False)
            }

            # CPU 스레드풀에서 렌더링 실행 (fire-and-forget)
            logger.info(f"[{request_id}] Submitting rendering task to ThreadPool")
            self.cpu_executor.submit(self.rendering_processor.process_rendering_sync, rendering_task_data)
            
            # 임시 파일 정리
            try:
                if temp_path and os.path.exists(temp_path):
                    os.remove(temp_path)
                    logger.debug(f"[{request_id}] Temporary inpainted file removed: {temp_path}")
            except Exception as e:
                logger.warning(f"[{request_id}] Failed to remove temp file {temp_path}: {e}")
                
        except Exception as e:
            logger.error(f"[{request_id}] Error in internal rendering trigger: {e}", exc_info=True)

    # 기존 메서드들은 호환성을 위해 유지하되 내부 저장소로 리다이렉트
    async def check_and_trigger_rendering(self, request_id: str, inpainted_image: np.ndarray,
                                         image_id: str, is_long: bool):
        """
        인페인팅 완료 후 호출됨 (호환성 유지)
        """
        logger.info(f"[{request_id}] Inpainting completed, saving to internal storage")
        
        # 임시 파일로 저장
        temp_filename = f"{request_id}.png"
        temp_path = os.path.join(TEMP_OUTPUT_DIR, temp_filename)
        
        # 비동기로 파일 저장
        loop = asyncio.get_running_loop()
        success = await loop.run_in_executor(
            self.cpu_executor, 
            cv2.imwrite, temp_path, inpainted_image
        )
        
        if success:
            # 내부 저장소에 인페인팅 결과 저장
            inpainting_data = {
                "image_id": image_id,
                "is_long": is_long,
                "temp_path": temp_path
            }
            await self.save_inpainting_result(request_id, inpainting_data)
        else:
            logger.error(f"[{request_id}] Failed to save inpainted image to: {temp_path}")

    async def check_and_trigger_rendering_after_translate(self, request_id: str):
        """
        번역 완료 후 호출됨 (호환성 유지)
        이미 save_translation_result에서 자동으로 확인하므로 아무것도 하지 않음
        """
        logger.debug(f"[{request_id}] Translation completed, automatic check already performed")
        pass

    async def _download_image_async(self, image_url: str, request_id: str):
        """이미지 다운로드 (순수 async I/O)"""
        if not self.http_session:
            logger.error(f"[{request_id}] HTTP Session is not initialized.")
            return None

        try:
            if image_url.startswith('//'):
                image_url = 'https:' + image_url

            logger.debug(f"[{request_id}] Downloading from: {image_url}")
            
            max_retries = 3
            retry_delay = 2
            
            for attempt in range(max_retries):
                try:
                    async with self.http_session.get(image_url) as response:
                        response.raise_for_status()
                        return await response.read()
                except Exception as e:
                    if attempt < max_retries - 1:
                        wait_time = retry_delay * (attempt + 1)
                        logger.warning(f"[{request_id}] Download error ({e}), retrying in {wait_time}s")
                        await asyncio.sleep(wait_time)
                    else:
                        raise
                    
        except Exception as e:
            logger.error(f"[{request_id}] Download failed after retries: {e}", exc_info=True)
            return None
