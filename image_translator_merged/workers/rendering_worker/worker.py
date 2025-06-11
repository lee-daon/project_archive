import os
import json
import time
import logging
import numpy as np
import cv2
import traceback
import asyncio
from typing import Dict, Any, Tuple, List, Optional
from pathlib import Path
import functools # functools 임포트
import redis

# 코어 모듈 가져오기
from core.config import REDIS_URL, RENDERING_TASKS_QUEUE, RENDERING_RESULT_HASH_PREFIX, RENDERING_OUTPUT_DIR, HOSTING_TASKS_QUEUE, RESIZE_TARGET_SIZE
from core.redis_client import get_redis_client, initialize_redis, close_redis
from core.shm_manager import get_array_from_shm, cleanup_shm, create_shm_from_array

# 렌더링 관련 모듈 가져오기
from modules.selectTextColor import TextColorSelector
from modules.textsize import TextSizeCalculator

# PIL 관련 모듈 임포트
from PIL import Image, ImageDraw, ImageFont


# 로깅 설정
logging.basicConfig(level=logging.DEBUG, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logging.getLogger().setLevel(logging.INFO)
logger = logging.getLogger(__name__)

class RenderingWorker:
    """
    번역된 텍스트를 인페인팅된 이미지에 렌더링하는 워커 (비동기 버전)
    """
    
    def __init__(self, 
                 rendering_queue_name: str = RENDERING_TASKS_QUEUE, 
                 output_dir: str = RENDERING_OUTPUT_DIR,
                 font_path: str = "modules/fonts/NanumGothic.ttf"):
        """
        RenderingWorker 초기화
        
        Args:
            rendering_queue_name: 렌더링 작업 큐 이름
            output_dir: 결과 이미지를 저장할 디렉토리
            font_path: 사용할 폰트 파일 경로
        """
        self.redis = get_redis_client() # 초기화된 비동기 클라이언트 가져오기
        self.rendering_queue_name = rendering_queue_name
        
        # 결과 이미지 저장 디렉토리 생성
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)
        
        # 폰트 파일 경로 저장
        self.font_path = font_path
        if not os.path.exists(self.font_path):
            logger.warning(f"폰트 파일을 찾을 수 없습니다: {self.font_path}")
        
        # 렌더링 워커용 폰트 캐시
        self.font_cache: Dict[int, ImageFont.FreeTypeFont] = {}
        
        # 필요한 모듈 인스턴스 생성
        self.text_color_selector = TextColorSelector()
        try:
            self.text_size_calculator = TextSizeCalculator(font_path=self.font_path)
        except Exception as e:
            logger.error(f"Failed to initialize TextSizeCalculator: {e}", exc_info=True)
            # TextSizeCalculator 초기화 실패 시 워커 실행 중단 또는 대체 로직 필요
            # 여기서는 None으로 설정하고 이후 작업에서 확인하여 처리
            self.text_size_calculator = None 
        
        # 공유 메모리 관리를 위한 목록
        self.active_shm_objects = []
        
        logger.info("RenderingWorker 초기화 완료")
    
    # 렌더링 워커용 폰트 로드 및 캐싱 함수
    def _get_font(self, size: int) -> Optional[ImageFont.FreeTypeFont]:
        """
        지정된 크기의 폰트 객체를 캐시에서 가져오거나 로드하여 캐시에 저장합니다.
        렌더링 실패 시 None을 반환할 수 있습니다.

        Args:
            size: 폰트 크기 (픽셀)

        Returns:
            Optional[ImageFont.FreeTypeFont]: 로드된 폰트 객체 또는 실패 시 None
        """
        if size <= 0:
             logger.warning(f"Requested font size {size} is invalid. Returning None.")
             return None

        if size not in self.font_cache:
            try:
                self.font_cache[size] = ImageFont.truetype(self.font_path, size)
            except IOError as e:
                logger.error(f"Worker failed to load font '{self.font_path}' at size {size}: {e}")
                return None # 렌더링 실패를 유도하기 위해 None 반환
            except Exception as e:
                logger.error(f"Worker encountered unexpected error loading font at size {size}: {e}", exc_info=True)
                return None
        return self.font_cache[size]
    
    # 비동기 I/O 처리를 위해 to_thread 사용 고려
    # CPU 바운드 또는 블로킹 I/O를 이벤트 루프에서 분리
    async def _load_image_from_shm_async(self, shm_info: Dict[str, Any]) -> np.ndarray:
        """
        공유 메모리에서 이미지 로드 (비동기 래퍼)

        Args:
            shm_info: 공유 메모리 정보 딕셔너리

        Returns:
            np.ndarray: 로드된 이미지
        """
        loop = asyncio.get_running_loop()
        try:
            # shm_info가 문자열이면 JSON으로 파싱 (동기 작업)
            if isinstance(shm_info, str):
                try:
                    shm_info = json.loads(shm_info)
                except json.JSONDecodeError as e:
                     logger.error(f"Failed to parse SHM info string: {shm_info}. Error: {e}")
                     raise ValueError("Invalid SHM info JSON string") from e

            # get_array_from_shm은 내부적으로 multiprocessing.shared_memory 사용
            # 이는 블로킹 I/O 또는 CPU 자원을 사용할 수 있으므로 스레드에서 실행
            img_array, existing_shm = await loop.run_in_executor(
                None, # 기본 스레드 풀 사용
                functools.partial(get_array_from_shm, shm_info) # 부분 적용으로 인자 전달
            )

            # 사용 후 닫기 위해 목록에 추가 (동기 작업)
            self.active_shm_objects.append(existing_shm)

            # 배열 복사본 반환 (동기 작업)
            return img_array.copy()

        except Exception as e:
            logger.error(f"공유 메모리에서 이미지 로드 중 오류 (async wrapper): {str(e)}", exc_info=True)
            # traceback.print_exc() # exc_info=True로 대체
            raise

    # 비동기 + CPU 집약적 작업 분리
    async def _draw_text_on_image_async(self, 
                           image: np.ndarray, 
                           text: str, 
                           box: List[List[float]], 
                           text_color: Dict[str, int], 
                           bg_color: Dict[str, int],
                           font_size: float) -> Optional[np.ndarray]:
        """
        이미지에 텍스트 렌더링 (비동기 래퍼, Pillow/OpenCV는 CPU 집약적)

        Args:
            image: 텍스트를 그릴 이미지
            text: 그릴 텍스트
            box: 텍스트 박스 좌표
            text_color: 텍스트 색상 (RGB)
            bg_color: 배경 색상 (RGB)
            font_size: 폰트 크기 (픽셀 단위, Pillow용)

        Returns:
            Optional[np.ndarray]: 텍스트가 그려진 이미지 또는 실패 시 None
        """
        loop = asyncio.get_running_loop()
        try:
            # Pillow/OpenCV 텍스트 렌더링은 CPU 집약적이므로 스레드에서 실행
            rendered_image = await loop.run_in_executor(
                None,
                functools.partial(self._draw_text_on_image_sync, # 동기 함수 호출
                                  image=image, text=text, box=box,
                                  text_color=text_color, bg_color=bg_color,
                                  font_size=font_size)
            )
            return rendered_image
        except Exception as e:
            logger.error(f"텍스트 렌더링 중 오류 발생 (async wrapper): {str(e)}", exc_info=True)
            return None # 실패 시 None 반환 일관성 유지

    # 기존 _draw_text_on_image 로직을 동기 함수로 분리
    def _draw_text_on_image_sync(self, image: np.ndarray, text: str, box: List[List[float]],
                                text_color: Dict[str, int], bg_color: Dict[str, int],
                                font_size: float) -> Optional[np.ndarray]:
        """
        이미지에 텍스트 렌더링 (동기 버전 - run_in_executor로 호출됨)
        (기존 _draw_text_on_image 함수의 내용을 여기로 이동)
        """
        try:
            # 결과 이미지 복사 (원본 변경 방지)
            result_image = image.copy()

            # 폰트 로드 (OpenCV에서 한글 지원을 위해 PIL 사용)
            try:
                # 박스 좌표를 정수로 변환
                box = np.array(box, dtype=np.int32)

                # 박스의 경계 구하기
                x_min, y_min = box.min(axis=0)
                x_max, y_max = box.max(axis=0)
                width = x_max - x_min
                height = y_max - y_min

                # PIL Image로 변환하여 영역 추출
                pil_image = Image.fromarray(cv2.cvtColor(result_image, cv2.COLOR_BGR2RGB))
                draw = ImageDraw.Draw(pil_image)

                # 폰트 크기 계산
                font_size_px = int(font_size) # 정수형으로 변환
                if font_size_px <= 0:
                    logger.warning(f"Received font size is {font_size_px}, setting to minimum 1.")
                    font_size_px = 1
                # 캐시된 폰트 사용 (여기서는 직접 호출)
                font = self._get_font(font_size_px) # 동기 함수 내에서는 await 없음
                if font is None:
                    # 폰트 로드 실패 시, 여기서 렌더링 중단
                    logger.error(f"Could not get font for size {font_size_px}. Aborting text drawing.")
                    return None # 실패 의미로 None 반환

                # RGB 색상으로 변환
                rgb_text_color = (text_color.get("r", 0), text_color.get("g", 0), text_color.get("b", 0))

                # 텍스트 줄 분리
                lines = text.split('\n')

                # 전체 텍스트 크기 계산 (여러 줄 고려)
                total_text_width = 0
                total_text_height = 0
                line_heights = []

                for line in lines:
                    text_bbox = draw.textbbox((0, 0), line, font=font)
                    line_width = text_bbox[2] - text_bbox[0]
                    line_height = text_bbox[3] - text_bbox[1]
                    total_text_width = max(total_text_width, line_width)
                    line_heights.append(line_height)
                    total_text_height += line_height

                # 텍스트 그리기 위치 계산 (박스 중앙 정렬)
                text_x = x_min + (width - total_text_width) // 2
                text_y = y_min + (height - total_text_height) // 2

                # 각 줄에 대해 텍스트 그리기
                current_y = text_y
                for i, line in enumerate(lines):
                    try:
                        draw.text((text_x, current_y), line, fill=rgb_text_color, font=font)
                    except Exception as draw_err:
                        logger.error(f"Failed to draw text line: '{line}'. Error: {draw_err}", exc_info=True)
                        pass # 또는 continue
                    current_y += line_heights[i]

                # PIL 이미지를 OpenCV 이미지로 변환
                result_image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)

            except ImportError:
                logger.warning("PIL을 불러올 수 없어 OpenCV로 대체합니다. 한글이 제대로 표시되지 않을 수 있습니다.")
                # ... (OpenCV 대체 로직 - 필요시 이 부분도 동기적으로 처리)
                font_face = cv2.FONT_HERSHEY_SIMPLEX
                box_points = np.array(box, dtype=np.int32)
                center_x, center_y = np.mean(box_points, axis=0).astype(int)
                bgr_text_color = (text_color.get("b", 0), text_color.get("g", 0), text_color.get("r", 0))
                (text_width, text_height), _ = cv2.getTextSize(text, font_face, font_size, thickness=2)
                text_x = center_x - text_width // 2
                text_y = center_y + text_height // 2
                cv2.putText(result_image, text, (text_x, text_y), font_face, font_size, bgr_text_color, thickness=2)

            return result_image

        except Exception as e:
            logger.error(f"텍스트 렌더링 중 오류 발생 (sync): {str(e)}", exc_info=True)
            # traceback.print_exc() # exc_info=True 사용
            return None # 실패 시 None 반환

    # 비동기 파일 I/O
    async def _save_image_async(self, image: np.ndarray, request_id: str, image_id: str) -> Dict[str, Any]:
        """
        이미지를 공유 메모리에 저장 (비동기)

        Args:
            image: 저장할 이미지
            request_id: 요청 ID
            image_id: 이미지 ID

        Returns:
            Dict[str, Any]: 저장된 공유 메모리 정보
        """
        loop = asyncio.get_running_loop()
        try:
            # 이미지를 공유 메모리에 저장 (CPU 집약적 작업이므로 스레드에서 실행)
            shm_info = await loop.run_in_executor(
                None,
                functools.partial(create_shm_from_array, image)
            )
            
            logger.info(f"[{request_id}] 렌더링된 이미지를 공유 메모리에 저장: {shm_info['shm_name']}")
            return shm_info

        except Exception as e:
            logger.error(f"이미지 공유 메모리 저장 중 오류 발생 (async): {str(e)}", exc_info=True)
            raise

    # 비동기 Redis 작업
    async def _update_task_status_async(self, request_id: str, shm_info: Dict[str, Any], image_id: str, status: str = "completed"):
        """
        작업 상태 업데이트 및 hosting 큐에 결과 전달 (비동기)

        Args:
            request_id: 요청 ID
            shm_info: 공유 메모리 정보
            image_id: 이미지 ID
            status: 작업 상태 (completed, failed 등)
        """
        try:
            # Redis에 결과 저장 (비동기 hset)
            result_key = f"{RENDERING_RESULT_HASH_PREFIX}{request_id}"
            # 상태 및 타임스탬프 정보 저장
            mapping_bytes = {
                b"status": status.encode('utf-8'),
                b"timestamp": str(time.time()).encode('utf-8')
            }
            # 공유 메모리 정보를 JSON 문자열로 저장
            if shm_info:
                mapping_bytes[b"shm_info"] = json.dumps(shm_info).encode('utf-8')
            
            hset_result = await self.redis.hset(result_key, mapping=mapping_bytes)

            # 결과 알림을 위한 스트리밍 채널에 결과 발행 (비동기 publish)
            event_data = json.dumps({
                "request_id": request_id,
                "event": "rendering_completed",
                "data": {
                    "status": status,
                    "shm_name": shm_info['shm_name'] if shm_info else None
                }
            }).encode('utf-8')
            publish_result = await self.redis.publish(f"events:{request_id}", event_data)

            # SSE를 통한 알림을 위해 결과 추가 (비동기 lpush)
            lpush_result = await self.redis.lpush(f"sse:results:{request_id}", event_data)
            
            # hosting:tasks 큐에 결과 추가 (비동기 rpush)
            if status == "completed" and shm_info:
                hosting_task = {
                    "request_id": request_id,
                    "image_id": image_id,
                    "shm_info": shm_info  # 전체 shm_info 객체 전달
                }
                await self.redis.rpush(HOSTING_TASKS_QUEUE, json.dumps(hosting_task).encode('utf-8'))
                logger.info(f"Request {request_id}: 렌더링 작업 완료, hosting 큐에 결과 전달됨 (shm: {shm_info['shm_name']})")
            else:
                logger.warning(f"Request {request_id}: 렌더링 작업 {status}, 하지만 hosting 큐에 결과 전달 안됨")

        except Exception as e:
            logger.error(f"작업 상태 업데이트 중 오류 발생 (async): {str(e)}", exc_info=True)

    # 비동기 SHM 정리
    async def _cleanup_shm_resources_async(self):
        """공유 메모리 자원 정리 (비동기, shm.close()는 블로킹 가능성)"""
        loop = asyncio.get_running_loop()
        cleanup_tasks = []
        # active_shm_objects 복사 후 반복 (목록 변경 방지)
        shm_list = list(self.active_shm_objects)
        self.active_shm_objects.clear() # 목록 즉시 비우기

        for shm in shm_list:
            async def close_shm(shm_obj):
                try:
                    await loop.run_in_executor(None, shm_obj.close)
                except Exception as e:
                    # 이미 닫혔거나 존재하지 않는 경우 오류 발생 가능, 로깅만 수행
                    logger.warning(f"공유 메모리 객체 닫기 중 오류 (무시 가능): {shm_obj.name}, Error: {str(e)}")
            cleanup_tasks.append(close_shm(shm))

        if cleanup_tasks:
             await asyncio.gather(*cleanup_tasks)
        logger.debug("SHM resources closed.")

    async def _cleanup_shm_unlink_async(self, shm_name: Optional[str]):
         """주어진 이름의 SHM unlink (비동기)"""
         if not shm_name:
             return
         loop = asyncio.get_running_loop()
         try:
             logger.debug(f"Cleaning up SHM (unlink): {shm_name}")
             await loop.run_in_executor(None, cleanup_shm, shm_name)
         except Exception as unlink_e:
              logger.error(f"Error unlinking SHM {shm_name}: {unlink_e}", exc_info=True)

    # 비동기 이미지 리사이즈
    async def _resize_image_async(self, image: np.ndarray, target_size: Tuple[int, int], request_id: str) -> np.ndarray:
        """
        이미지를 목표 크기로 강제 리사이즈 (비동기)
        
        Args:
            image: 리사이즈할 이미지
            target_size: 목표 크기 (height, width)
            request_id: 요청 ID (로깅용)
            
        Returns:
            np.ndarray: 리사이즈된 이미지
        """
        target_height, target_width = target_size
        current_height, current_width = image.shape[:2]
        
        if current_height == target_height and current_width == target_width:
            return image  # 이미 목표 크기면 그대로 반환
            
        logger.info(f"[{request_id}] 이미지 리사이즈: {current_width}x{current_height} -> {target_width}x{target_height}")
        
        # 더 적절한 보간법 선택
        scale_factor = min(target_width / current_width, target_height / current_height)
        if scale_factor < 1.0:  # 다운샘플링
            interpolation = cv2.INTER_AREA
        else:  # 업샘플링
            interpolation = cv2.INTER_LINEAR
        
        loop = asyncio.get_running_loop()
        # fit: 'fill' 방식으로 강제 리사이즈 (aspect ratio 무시)
        resized_image = await loop.run_in_executor(
            None,
            functools.partial(cv2.resize, image, (target_width, target_height), interpolation=interpolation)
        )
        
        logger.debug(f"[{request_id}] 이미지 리사이즈 완료 (보간법: {interpolation})")
        return resized_image

    # async def 및 내부 호출 비동기화
    async def process_rendering_task(self, task_data: Dict[str, Any]): # 반환값 제거 (오류는 예외로 처리)
        """
        렌더링 작업 처리 (비동기)

        Args:
            task_data: 렌더링 작업 데이터
        """
        request_id = task_data.get("request_id", "unknown_request") # 기본값 설정
        logger.debug(f"[{request_id}] Processing rendering task started.")
        
        # SHM 이름 저장용 변수 (finally에서 사용)
        inpaint_shm_name: Optional[str] = None
        original_shm_name: Optional[str] = None
        inpainted_image: Optional[np.ndarray] = None
        original_image: Optional[np.ndarray] = None
        shm_info: Dict[str, Any] = {}
        image_id_str: str = ""
        status: str = "processing" # 초기 상태

        try:
            # 필요한 데이터 추출 (문자열)
            image_id_str = task_data.get("image_id")
            translate_data_str = task_data.get("translate_data")
            inpaint_shm_info_str = task_data.get("inpaint_shm_info")
            original_shm_info_str = task_data.get("original_shm_info")
            is_long = task_data.get("is_long", False)  # is_long 정보 추출

            # 필수 데이터 확인
            if not all([request_id != "unknown_request", image_id_str, translate_data_str, inpaint_shm_info_str, original_shm_info_str]):
                logger.error(f"[{request_id}] Missing required task data (pre-parse): {task_data}")
                raise ValueError("Missing required task data")

            # 데이터 파싱 (동기 작업)
            try:
                translate_data = json.loads(translate_data_str)
                inpaint_shm_info = json.loads(inpaint_shm_info_str)
                original_shm_info = json.loads(original_shm_info_str)
                # finally 절 위한 이름 저장
                inpaint_shm_name = inpaint_shm_info.get('shm_name')
                original_shm_name = original_shm_info.get('shm_name')
            except json.JSONDecodeError as e:
                 logger.error(f"[{request_id}] Failed to parse JSON data: {e}")
                 raise ValueError("Invalid JSON data in task") from e

            # 이미지 로드 (비동기)
            # gather 사용
            load_tasks = [
                self._load_image_from_shm_async(inpaint_shm_info),
                self._load_image_from_shm_async(original_shm_info)
            ]
            inpainted_image, original_image = await asyncio.gather(*load_tasks)
            if inpainted_image is None or original_image is None:
                raise ValueError("Failed to load one or both images from SHM")

            loop = asyncio.get_running_loop()

            # 스케일링 팩터 초기화
            height_scale = 1.0
            width_scale = 1.0
            # 색상 선택에 사용할 이미지 (is_long 값에 따라 리사이즈되거나 원본이 할당됨)
            image_for_text_color_selection = original_image # 원본 이미지를 기본값으로 할당
            # inpainted_image는 루프 내에서 직접 수정됨 (리사이즈된 이미지로 교체될 수 있음)

            # is_long == false일 때 이미지 리사이즈 및 스케일링 팩터 계산
            if not is_long:
                original_h_i, original_w_i = inpainted_image.shape[:2]
                target_h, target_w = RESIZE_TARGET_SIZE

                # 리사이즈 수행
                # 원본 original_image는 TextColorSelector에 원본을 전달할 가능성을 위해 .copy() 사용
                resized_original_img_for_color_task = self._resize_image_async(original_image.copy(), RESIZE_TARGET_SIZE, f"{request_id}_orig_for_color")
                inpainted_image_resized_task = self._resize_image_async(inpainted_image, RESIZE_TARGET_SIZE, f"{request_id}_inpaint")
                
                image_for_text_color_selection, inpainted_image = await asyncio.gather(
                    resized_original_img_for_color_task,
                    inpainted_image_resized_task
                )
                
                if original_h_i > 0 and original_w_i > 0: # 0으로 나누는 것 방지
                    height_scale = target_h / original_h_i
                    width_scale = target_w / original_w_i
                logger.info(f"[{request_id}] Images resized. Scale factors: H={height_scale:.2f}, W={width_scale:.2f}")

                # translate_data의 box 좌표 스케일링 (font_size_px 스케일링은 여기서 제거)
                if "translate_result" in translate_data:
                    for item in translate_data["translate_result"]:
                        if "box" in item and item["box"]:
                            original_box_coords = np.array(item["box"])
                            scaled_box_coords = original_box_coords.astype(np.float32)
                            scaled_box_coords[:, 0] *= width_scale
                            scaled_box_coords[:, 1] *= height_scale
                            item["box"] = scaled_box_coords.tolist()
                        # font_size_px를 여기서 스케일링하는 로직은 제거됨.
                        # TextSizeCalculator가 스케일된 box 기준으로 계산할 것이기 때문.
            # else: # is_long == True (리사이즈 안 함)
                # image_for_text_color_selection는 이미 original_image로 초기화되어 있음
                # inpainted_image도 원본 그대로 사용됨

            # 이제 translate_data의 box는 (필요시) 스케일링된 상태.
            # 폰트 크기 계산 (TextSizeCalculator는 스케일링된 box 정보를 사용)
            if self.text_size_calculator:
                try:
                    # functools.partial을 사용하여 인스턴스 메서드와 인자 전달
                    # TextSizeCalculator에 전달되는 translate_data의 box는 이미 (필요시) 스케일링 되었음.
                    translate_data = await loop.run_in_executor(
                        None,
                        functools.partial(self.text_size_calculator.calculate_font_sizes, translate_data)
                    )
                    logger.debug(f"[{request_id}] Font sizes calculated (based on potentially scaled boxes).")
                except Exception as size_calc_err:
                    logger.error(f"[{request_id}] Failed to calculate font sizes: {size_calc_err}", exc_info=True)
                    # 실패 시에도 계속 진행 (draw 함수에서 기본값 사용)
                    pass
            else:
                logger.warning(f"[{request_id}] TextSizeCalculator not available. Skipping font size calculation.")

            # 텍스트 색상 선택 (KMeans는 CPU 집약적 -> 스레드)
            # image_for_text_color_selection 과 inpainted_image 는 (is_long 값에 따라) 리사이즈되었거나 원본 상태임.
            # TextColorSelector에 전달되는 translate_data의 box도 이미 (필요시) 스케일링 되었음.
            try:
                # functools.partial 사용
                translate_data = await loop.run_in_executor(
                    None,
                    functools.partial(self.text_color_selector.select_text_color,
                                      request_id=request_id,
                                      translate_data=translate_data,
                                      original_image=image_for_text_color_selection,
                                      inpainted_image=inpainted_image)
                )
            except Exception as color_e:
                logger.error(f"[{request_id}] 텍스트 색상 선택 중 오류 발생: {color_e}", exc_info=True)
                pass # 오류 발생해도 일단 계속 진행

            # 텍스트 렌더링 (CPU 집약적 -> 스레드, 각 아이템별로)
            rendered_image = inpainted_image # 초기 이미지는 (리사이즈되었을 수 있는) inpainted_image
            if translate_data and "translate_result" in translate_data:
                render_tasks = []
                current_rendered_image = rendered_image.copy() # 각 단계별 결과를 저장할 변수

                for item_index, item in enumerate(translate_data["translate_result"]):
                    text = item.get("translated_text")
                    box = item.get("box") # 이미 스케일링된 box (if not is_long)
                    text_color = item.get("text_color") # RGB dict
                    bg_color = item.get("bg_color") # RGB dict
                    calculated_font_size = item.get("font_size_px") # 이미 스케일링된 font_size (if not is_long and TextSizeCalc ran)

                    if calculated_font_size is None:
                        logger.warning(f"[{request_id}] font_size_px not found for item {item_index}. Using default ratio (0.8) or min value from (scaled) box.")
                        if box and len(box) == 4: # box는 이미 스케일링된 좌표 (if not is_long)
                            try:
                                box_points = np.array(box, dtype=np.float32)
                                # minAreaRect는 CPU 연산이므로 스레드에서 실행
                                _, (_, box_height) = await loop.run_in_executor(None, cv2.minAreaRect, box_points)
                                calculated_font_size = max(1, int(box_height * 0.8)) # 스케일된 box 높이 기준
                            except Exception as rect_err:
                                logger.warning(f"[{request_id}] Error getting (scaled) box height for default font size: {rect_err}. Using 1.")
                                calculated_font_size = 1
                        else:
                            calculated_font_size = 1
                    
                    # calculated_font_size가 0 이하일 경우 처리 보강
                    if not isinstance(calculated_font_size, (int, float)) or calculated_font_size <= 0:
                        logger.warning(f"[{request_id}] Invalid calculated_font_size ({calculated_font_size}) for item {item_index}. Setting to 1.")
                        calculated_font_size = 1


                    if text and box and text_color:
                         # 렌더링 함수 호출 (비동기)
                         # 주의: 각 렌더링은 이전 결과에 누적되어야 함.
                         #      순차적 실행이 필요하므로 gather 사용 부적합.
                         temp_image = await self._draw_text_on_image_async(
                             image=current_rendered_image, # 이전 결과 이미지 전달
                             text=text,
                             box=box,
                             text_color=text_color,
                             bg_color=bg_color,
                             font_size=calculated_font_size
                         )
                         if temp_image is not None:
                             current_rendered_image = temp_image # 결과 업데이트
                             logger.debug(f"[{request_id}] Successfully rendered text for item {item_index}")
                         else:
                             logger.warning(f"[{request_id}] _draw_text_on_image returned None for item {item_index}. Skipping update.")
                    else:
                        logger.warning(f"[{request_id}] Skipping drawing for item {item_index} due to missing data: text={bool(text)}, box={bool(box)}, text_color={bool(text_color)}")
                
                rendered_image = current_rendered_image # 최종 결과 할당

            else:
                logger.warning(f"[{request_id}] No translate_result found in task_data to render.")

            # 결과 이미지를 공유 메모리에 저장 (비동기)
            shm_info = await self._save_image_async(rendered_image, request_id, image_id_str)
            status = "completed"

        except Exception as e:
            logger.error(f"[{request_id}] 렌더링 작업 처리 중 오류 발생: {str(e)}", exc_info=True)
            # traceback.print_exc() # exc_info=True 사용
            status = "failed"
            # 오류 발생 시에도 상태 업데이트를 위해 shm_info는 빈 딕셔너리 유지

        finally:
            # 작업 상태 업데이트 및 hosting 큐에 결과 전달 (비동기)
            try:
                 await self._update_task_status_async(request_id, shm_info, image_id_str, status)
            except Exception as update_e:
                 logger.error(f"[{request_id}] 최종 작업 상태 업데이트 실패: {update_e}", exc_info=True)
                 # 업데이트 실패는 심각한 문제일 수 있음

            # SHM 리소스 정리 (비동기)
            logger.debug(f"[{request_id}] Entering finally block for SHM cleanup.")
            # 1. RenderingWorker가 직접 로드한 SHM 객체 close
            await self._cleanup_shm_resources_async()
            # 2. 사용했던 SHM 이름으로 unlink 호출
            unlink_tasks = [
                 self._cleanup_shm_unlink_async(inpaint_shm_name),
                 self._cleanup_shm_unlink_async(original_shm_name)
            ]
            await asyncio.gather(*unlink_tasks)
            logger.debug(f"[{request_id}] Exiting finally block.")

    # async def 및 비동기 Redis 호출
    async def start_worker(self, poll_interval: float = 1.0):
        """
        렌더링 워커 시작 (비동기)

        Args:
            poll_interval: Redis 큐 폴링 간격 (초) - blpop 타임아웃으로 사용
        """
        logger.info(f"렌더링 워커 시작 (큐: {self.rendering_queue_name}, 출력 디렉토리: {self.output_dir}) - Async Mode")

        while True:
            try:
                # 큐에서 작업 가져오기 (비동기 blpop)
                # blpop은 (queue_name_bytes, task_data_bytes) 튜플 또는 None 반환
                task = await self.redis.blpop(self.rendering_queue_name, timeout=int(poll_interval))

                if task:
                    queue_name_bytes, task_data_bytes = task
                    try:
                         task_data = json.loads(task_data_bytes.decode('utf-8'))
                         # 작업 처리 (비동기 함수 호출)
                         # 결과를 기다리지 않고 다음 작업 가져오기 (동시 처리)
                         asyncio.create_task(self.process_rendering_task(task_data))
                         # await self.process_rendering_task(task_data) # 순차 처리 시
                    except json.JSONDecodeError as e:
                         logger.error(f"Failed to decode task data from Redis: {task_data_bytes}. Error: {e}")
                    except Exception as proc_e:
                         # process_rendering_task 내부에서 예외 처리가 되지만
                         # task 생성 자체의 오류나 예상 못한 오류 로깅
                         logger.error(f"Error creating/starting task processing: {proc_e}", exc_info=True)

            except asyncio.CancelledError:
                 logger.info("Worker task cancelled.")
                 break
            except redis.exceptions.ConnectionError as e:
                 logger.error(f"Redis connection error in worker loop: {e}")
                 await asyncio.sleep(5) # 연결 오류 시 잠시 대기 후 재시도
            except Exception as e:
                # KeyboardInterrupt는 여기서 처리되지 않음 (main에서 처리)
                logger.error(f"작업 처리 루프 중 오류 발생: {str(e)}", exc_info=True)
                await asyncio.sleep(poll_interval)  # 오류 발생 시 잠시 대기

        logger.info("렌더링 워커 루프 종료")

# 비동기 실행을 위한 main 함수
async def main():
    """
    메인 비동기 함수: 워커 및 체커 시작
    """
    # Redis 초기화
    await initialize_redis()


    worker_task = None  # finally에서 사용하기 위해 초기화

    try:

        # --- RenderingWorker 비동기 실행 --- #
        worker = RenderingWorker()
        worker_task = asyncio.create_task(worker.start_worker())

        # gather를 사용하여 두 태스크 동시 실행 및 대기
        # worker_task만 대기하도록 변경
        # 워커 태스크가 완료될 때까지 대기 (KeyboardInterrupt 등으로 종료될 때까지)
        # await asyncio.gather(worker_task, checker_task) # 두 태스크가 모두 완료될 때까지 대기
        await asyncio.gather(worker_task) # 워커 태스크만 대기

    except asyncio.CancelledError:
        logger.info("Main task cancelled.")
    except KeyboardInterrupt: # KeyboardInterrupt 처리
         logger.info("KeyboardInterrupt received, stopping worker...")
    except Exception as e:
        logger.error(f"프로그램 실행 중 오류 발생: {str(e)}", exc_info=True)
        # traceback.print_exc() # exc_info=True 사용
    finally:
        if worker_task and not worker_task.done():
             logger.info("Cancelling worker task...") # 로그 추가
             worker_task.cancel()

        tasks_to_wait = []
        if worker_task: tasks_to_wait.append(worker_task)

        if tasks_to_wait:
             logger.info(f"Waiting for tasks to finish cleanup: {tasks_to_wait}")
             # gather에 return_exceptions=True를 주어 개별 태스크 오류가 전체를 중단시키지 않도록 함
             results = await asyncio.gather(*tasks_to_wait, return_exceptions=True)
             logger.info(f"Cleanup task results: {results}")

        # --- Redis 연결 종료 --- #
        await close_redis()
        logger.info("Redis connection closed. Exiting.")

if __name__ == "__main__":
    asyncio.run(main())

