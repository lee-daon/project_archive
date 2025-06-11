import sys
import redis 

# ---> asyncio 직접 임포트 시도 코드 제거 <---

import asyncio # 나머지 import는 아래로
import json
import logging
import signal
import time
import re
import os

import numpy as np
import cv2 # OpenCV 임포트

# 로컬 모듈 임포트 (경로 수정)
from geminiapi import call_gemini_translate_list

ONLY_CHINESE_FILTER = True

# 프로젝트 루트 설정 등은 유지
WORKER_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(os.path.dirname(WORKER_DIR))
CORE_DIR = os.path.join(ROOT_DIR, 'core')
sys.path.insert(0, ROOT_DIR)

from core.config import (
    REDIS_URL,# @deprecated: redis_client로 대체
    PROCESSOR_TASK_QUEUE, 
    HOSTING_TASKS_QUEUE,
    INPAINTING_LONG_TASKS_QUEUE, 
    INPAINTING_SHORT_TASKS_QUEUE,
    TRANSLATE_TEXT_RESULT_HASH_PREFIX,
    MOCK_TRANSLATION_DELAY, # 번역 API 호출을 대신 가정한 지연시간
    LOG_LEVEL, 
    SHM_NAME_PREFIX, # @deprecated: create_shm_from_array 함수로 대체
    MASK_PADDING_PIXELS # 마스크 패딩 픽셀 설정 추가
)
from core.shm_manager import get_array_from_shm, create_shm_from_array, cleanup_shm
# ---> core.redis_client 임포트 추가 < ---
from core.redis_client import initialize_redis, close_redis, get_redis_client

# 로깅 설정
logging.basicConfig(level=LOG_LEVEL)
logger = logging.getLogger(__name__)

# ---> 로컬 redis_client 변수 제거 < ---
# redis_client = None

# 중국어 판별 정규식 (Unicode 범위)
CHINESE_REGEX = re.compile(r'[\u4e00-\u9fff]')

# ---> 로컬 initialize_dependencies 함수 제거 < ---
# async def initialize_dependencies(): ...

# ---> 로컬 close_dependencies 함수 제거 < ---
# async def close_dependencies(): ...

async def enqueue_task_to_queue(queue_name: str, task_data: dict, request_id: str):
    """(큐 전용) 지정된 큐에 작업을 JSON으로 직렬화하여 RPUSH합니다 (FIFO)."""
    try:
        redis_client = get_redis_client() # get_redis_client 사용
        task_json = json.dumps(task_data).encode('utf-8')
        await redis_client.rpush(queue_name, task_json)
        logger.info(f"[{request_id}] Task enqueued to queue {queue_name} (RPUSH)")
        return True
    except ConnectionError as ce:
        logger.error(f"[{request_id}] Redis client not initialized? {ce}")
        return False
    except Exception as e:
        logger.error(f"[{request_id}] Failed to enqueue task to queue {queue_name}: {e}", exc_info=True)
        return False

async def save_result_to_hash(request_id: str, result_data: dict):
    """(결과 저장용) 번역 결과 및 렌더링 데이터를 Request ID 기준 Redis Hash에 저장합니다."""
    try:
        redis_client = get_redis_client()
        
        # original_shm_info 추출 (result_data에 있다고 가정)
        original_shm_info = result_data.get("original_shm_info") # 키 이름 변경
        if not original_shm_info:
             logger.warning(f"[{request_id}] original_shm_info not found in result_data for saving to hash.")

        # 데이터 부분 추출 (image_id, translate_result)
        data_to_save = {
            "image_id": result_data.get("image_id"),
            "translate_result": result_data.get("translate_result")
        }
        result_json = json.dumps(data_to_save).encode('utf-8')
        
        hash_key = f"{TRANSLATE_TEXT_RESULT_HASH_PREFIX}{request_id}"
        
        # hset 명령어 수정: data와 original_shm_info(JSON)를 별도 필드로 저장
        mapping_to_save = {"data": result_json}
        if original_shm_info: # original_shm_info가 존재할 경우 JSON 문자열로 변환하여 추가
            mapping_to_save["original_shm_info"] = json.dumps(original_shm_info)
            
        await redis_client.hset(hash_key, mapping=mapping_to_save)
        
        logger.debug(f"[{request_id}] Result saved to Redis Hash with key {hash_key} (original_shm_info included: {bool(original_shm_info)})")
        return True
    except ConnectionError as ce:
        logger.error(f"[{request_id}] Redis client not initialized? {ce}")
        return False
    except Exception as e:
        logger.error(f"[{request_id}] Failed to save result to Redis Hash {hash_key}: {e}", exc_info=True)
        return False

async def call_translation_api(texts: list[str], request_id: str) -> list[str]:
    """
    Gemini API (JSON 모드)를 호출하여 텍스트 리스트 전체를 한 번에 번역합니다.
    API 호출 실패 시 한 번 재시도하며, 최종 실패 시 빈 리스트를 반환합니다.

    Args:
        texts: 번역할 텍스트 문자열 리스트.
        request_id: 로깅을 위한 요청 ID.

    Returns:
        번역된 텍스트 문자열 리스트. 최종 실패 시 빈 리스트 `[]` 반환.
    """
    if not texts: # 입력 리스트가 비어있으면 바로 반환
        logger.info(f"[{request_id}] No texts provided for translation.")
        return []

    logger.info(f"[{request_id}] Calling Gemini translation API (JSON List) for {len(texts)} texts...")

    max_retries = 1 # 최대 재시도 횟수 (총 2번 시도)
    for attempt in range(max_retries + 1):
        try:
            # Gemini API (JSON List 모드) 호출
            translated_texts = await call_gemini_translate_list(
                texts_to_translate=texts,
                request_id=request_id
            )
            logger.info(f"[{request_id}] Gemini translation (JSON List) finished on attempt {attempt + 1}. Processed {len(texts)} texts, received {len(translated_texts)} translations.")
            # 성공 시 번역 결과 반환
            return translated_texts

        except Exception as e:
            logger.error(f"[{request_id}] Attempt {attempt + 1} failed to translate text list using Gemini API (JSON List): {e}", exc_info=False)
            if attempt < max_retries:
                logger.info(f"[{request_id}] Retrying translation...")
                await asyncio.sleep(1) # 재시도 전 잠시 대기 (선택 사항)
            else:
                logger.error(f"[{request_id}] All translation attempts failed.")
                # 모든 재시도 실패 시 빈 리스트 반환
                return []

    # 이론상 이 라인에 도달해서는 안되지만, 안전을 위해 빈 리스트 반환
    return []

async def process_ocr_result_task(task_data: dict):
    """단일 OCR 결과 작업을 처리합니다."""
    request_id = task_data.get("request_id")
    image_id = task_data.get("image_id")
    is_long = task_data.get("is_long", False) # 기본값 False
    shm_info = task_data.get("shm_info")
    ocr_result = task_data.get("ocr_result")
    shm_name = shm_info.get('shm_name') if shm_info else None

    if not all([request_id, image_id, shm_info, shm_name]):
        logger.error(f"Invalid task data received (missing fields): {task_data}")
        return

    logger.info(f"[{request_id}] Processing task for image: {image_id}")

    # 1. OCR 결과가 비어있는 경우 처리
    if not ocr_result: # None 또는 빈 리스트 [] 체크
        logger.warning(f"[{request_id}] OCR result is empty. Forwarding to hosting queue.")
        hosting_task = {
            "request_id": request_id,
            "image_id": image_id,
            "shm_info": shm_info # shm_name 대신 전체 shm_info 객체 전달
        }
        await enqueue_task_to_queue(HOSTING_TASKS_QUEUE, hosting_task, request_id)
        # OCR 결과가 없으면 여기서 처리 종료
        # 주의: 원본 이미지 SHM은 API 서버나 관리 프로세스가 정리해야 함
        return

    # 2. 중국어 필터링 작업
    original_ocr_result = ocr_result # 원본 저장
    filtered_ocr_result = []
    if ONLY_CHINESE_FILTER:
        logger.debug(f"[{request_id}] Applying Chinese text filter.")
        for item in ocr_result:
            try:
                # [[box], [text, score]] 형식으로 가정하고 텍스트 추출
                if isinstance(item, list) and len(item) == 2 and \
                   isinstance(item[1], list) and len(item[1]) >= 1:
                    text = item[1][0] # item[1]은 [text, score] -> text는 item[1][0]
                    if isinstance(text, str) and CHINESE_REGEX.search(text):
                        filtered_ocr_result.append(item)
                    elif isinstance(text, str): # 중국어가 아닌 경우 디버그 로그
                         logger.debug(f"[{request_id}] Filtering out non-Chinese text: '{text}'")
                    # else: text가 문자열이 아니거나 None인 경우는 무시
                else:
                    logger.warning(f"[{request_id}] Skipping item with unexpected format during filtering: {item}")
            except Exception as e:
                 # 예외 발생 시 로그만 남기고 계속 진행
                 logger.warning(f"[{request_id}] Error during filtering item {item}: {e}", exc_info=False)

        logger.debug(f"[{request_id}] Filtering complete. {len(filtered_ocr_result)} items remain.")
        if not filtered_ocr_result:
             logger.warning(f"[{request_id}] No results left after Chinese filtering.")
             # 빈 마스크 생성으로 진행됨 (pass 삭제 불필요)
    else:
        logger.debug(f"[{request_id}] Skipping Chinese text filter (ONLY_CHINESE_FILTER is False).")
        filtered_ocr_result = ocr_result # 필터링 안하면 원본 사용

    img_array = None
    existing_shm = None
    mask_shm_info = None
    mask_shm_name = None # 마스크 SHM 이름 추적용

    try:
        # 3. 마스크 생성 준비: 원본 이미지 로드
        logger.debug(f"[{request_id}] Accessing original image shared memory: {shm_name}")
        img_array, existing_shm = get_array_from_shm(shm_info)
        if img_array is None:
            logger.error(f"[{request_id}] Failed to get image array from SHM {shm_name}. Cannot proceed.")
            return # 이미지 없으면 처리 불가

        logger.debug(f"[{request_id}] Original image array retrieved. Shape: {img_array.shape}")
        h, w = img_array.shape[:2]

        # 3. 마스크 생성
        mask = np.zeros((h, w), dtype=np.uint8) # 검은색 배경의 빈 마스크
        if filtered_ocr_result: # 필터링된 결과가 있을 때만 마스크 생성
            logger.debug(f"[{request_id}] Generating mask from {len(filtered_ocr_result)} bounding boxes.")
            processed_boxes = 0
            for item in filtered_ocr_result:
                try:
                    # item 구조가 다양할 수 있으므로 box 데이터 추출 시에도 방어적 접근
                    if isinstance(item, list) and len(item) >= 1 and isinstance(item[0], list):
                        box_points = np.array(item[0], dtype=np.int32) # 좌표를 정수형 NumPy 배열로
                        
                        # 패딩 추가: 바운딩 박스를 모든 방향으로 MASK_PADDING_PIXELS 픽셀씩 확장
                        padding = MASK_PADDING_PIXELS
                        
                        # 방법 1: 직접 좌표 수정
                        # 바운딩 박스 형태에 따라 처리 (일반적인 사각형 또는 다각형)
                        if len(box_points) == 4:  # 일반적인 사각형
                            # 왼쪽 위 좌표 (x,y) 감소
                            box_points[0][0] = max(0, box_points[0][0] - padding)
                            box_points[0][1] = max(0, box_points[0][1] - padding)
                            # 오른쪽 위 좌표 (x 증가, y 감소)
                            box_points[1][0] = min(w - 1, box_points[1][0] + padding)
                            box_points[1][1] = max(0, box_points[1][1] - padding)
                            # 오른쪽 아래 좌표 (x,y) 값 증가
                            box_points[2][0] = min(w - 1, box_points[2][0] + padding)
                            box_points[2][1] = min(h - 1, box_points[2][1] + padding)
                            # 왼쪽 아래 좌표 (x 감소, y 증가)
                            box_points[3][0] = max(0, box_points[3][0] - padding)
                            box_points[3][1] = min(h - 1, box_points[3][1] + padding)
                        else:
                            # 다각형의 경우, 각 점마다 외부로 이동 (복잡한 계산 필요)
                            # 여기서는 간단하게 다각형은 그대로 유지
                            logger.debug(f"[{request_id}] Non-rectangular polygon detected ({len(box_points)} points). Using without padding.")
                        
                        # 마스크 채우기
                        cv2.fillPoly(mask, [box_points], 255) # 흰색으로 채우기
                        processed_boxes += 1
                    else:
                        logger.warning(f"[{request_id}] Skipping item with unexpected box format during mask generation: {item}")
                except Exception as e:
                    logger.warning(f"[{request_id}] Error processing bounding box for mask {item[0] if isinstance(item, list) and len(item)>0 else 'N/A'}: {e}", exc_info=False)
            
            # 패딩을 위한 추가 방법: 전체 마스크에 팽창 연산 적용 (위 패딩과 함께 사용시 추가 효과)
            # kernel = np.ones((MASK_PADDING_PIXELS*2+1, MASK_PADDING_PIXELS*2+1), np.uint8)
            # mask = cv2.dilate(mask, kernel, iterations=1)
            
            logger.debug(f"[{request_id}] Mask generated from {processed_boxes} valid boxes with {MASK_PADDING_PIXELS}px padding.")
        else:
            logger.debug(f"[{request_id}] No OCR results to generate mask from (possibly after filtering). Creating empty mask.")


        # 3-5. 마스크를 공유 메모리에 저장 (shm_manager에 함수가 있다고 가정)
        logger.debug(f"[{request_id}] Attempting to create shared memory for mask...")
        mask_shm_info = create_shm_from_array(mask) # 마스크용 SHM 생성, prefix 인자 제거
        if not mask_shm_info:
            logger.error(f"[{request_id}] Failed to create shared memory for the mask. Proceeding without mask SHM info.")
            # 마스크 SHM 정보 없이 다음 단계 진행
        else:
            mask_shm_name = mask_shm_info.get('shm_name')
            logger.debug(f"[{request_id}] Mask saved to shared memory: {mask_shm_name}")


        # 5. Inpainting 작업 큐잉
        inpainting_queue = INPAINTING_LONG_TASKS_QUEUE if is_long else INPAINTING_SHORT_TASKS_QUEUE
        inpainting_task = {
            "request_id": request_id,
            "image_id": image_id,
            # "shm_name": shm_name, # 제거: shm_info 안에 포함되어 중복됨
            "mask_shm_info": mask_shm_info, # 마스크 이미지 SHM 정보
            "shm_info": shm_info # 원본 이미지의 shm_info 전체 (name, shape, dtype, size 포함)
        }
        await enqueue_task_to_queue(inpainting_queue, inpainting_task, request_id)

        # 6. 번역 준비 및 처리
        if filtered_ocr_result: # 필터링된 OCR 결과가 있을 때만 번역 시도
            texts_to_translate = []
            original_items_for_rendering = [] # 렌더링 큐에 넣을 원본 정보 저장

            for item in filtered_ocr_result: # <--- original_ocr_result 대신 filtered_ocr_result 사용
                try:
                    # [[box], [text, score]] 형식으로 가정하고 box와 text 추출
                    if isinstance(item, list) and len(item) == 2 and \
                       isinstance(item[0], list) and isinstance(item[1], list) and len(item[1]) >= 1:
                        box_info = item[0]
                        text_score_pair = item[1]
                        text = text_score_pair[0]

                        # box 정보와 text가 모두 유효한 경우에만 추가
                        if isinstance(text, str) and text.strip(): # 공백만 있는 텍스트 제외
                            texts_to_translate.append(text)
                            original_items_for_rendering.append({
                                "box": box_info,         # box 좌표
                                "original_text": text    # 원본 텍스트 (필터링된)
                            })
                        # else: text가 유효하지 않으면 로깅 불필요
                    else:
                        logger.warning(f"[{request_id}] Skipping item with unexpected format for translation (using filtered data): {item}")
                except Exception as e:
                     logger.warning(f"[{request_id}] Error extracting data for translation from filtered item {item}: {e}", exc_info=False)

            if texts_to_translate:
                # 4. 번역 API 호출 (비동기) - texts_to_translate는 문자열 리스트임
                logger.info(f"[{request_id}] Calling translation API for {len(texts_to_translate)} filtered texts.") # 로그 추가
                translated_texts = await call_translation_api(texts_to_translate, request_id)

                # 번역 결과와 원본 정보를 조합하여 rendering task 데이터 생성
                translate_result_for_rendering = [] # 기본값 빈 리스트 설정

                # 1. 번역 실패 확인 (입력은 있었으나 결과가 빈 리스트인 경우)
                if not translated_texts and texts_to_translate:
                    logger.warning(f"[{request_id}] Translation API failed after retries. Saving empty result to proceed.")
                    # translate_result_for_rendering은 이미 [] 이므로 추가 작업 불필요

                # 2. 길이 불일치 확인 (이론상 발생하기 어려움)
                elif len(translated_texts) != len(original_items_for_rendering):
                    logger.error(f"[{request_id}] Mismatch between original items ({len(original_items_for_rendering)}) and translated texts ({len(translated_texts)}). Skipping rendering result saving.")
                    # **** 길이 불일치 시에는 저장하지 않도록 None 설정 ****
                    translate_result_for_rendering = None # 저장하지 않음을 명시

                # 3. 성공 케이스 (번역 결과가 있고 길이가 일치)
                else:
                    logger.debug(f"[{request_id}] Translation successful. Preparing rendering data.")
                    for original_info, translated_text in zip(original_items_for_rendering, translated_texts):
                        translate_result_for_rendering.append({
                            "box": original_info["box"],
                            "translated_text": translated_text,
                            "original_char_count": len(original_info["original_text"]) # 문자 수는 필터링된 텍스트 기준
                        })

                # **** 저장 로직: 길이 불일치(None)가 아닌 경우에만 저장 ****
                if translate_result_for_rendering is not None:
                    # 6. 번역 결과 및 렌더링 데이터 저장 (Hash)
                    rendering_data = {
                        "image_id": image_id,
                        "original_shm_info": shm_info, # 원본 이미지 shm 정보 전달
                        "translate_result": translate_result_for_rendering # 성공 시 데이터, 실패/빈 경우 []
                    }
                    await save_result_to_hash(request_id, rendering_data)
                    logger.debug(f"[{request_id}] Translation/Rendering data saved to hash (result count: {len(translate_result_for_rendering)}).")

            else: # texts_to_translate가 처음부터 빈 경우
                 logger.debug(f"[{request_id}] No valid text found in filtered OCR results to translate. Saving empty result.")
                 # **** 빈 결과 저장 ****
                 rendering_data = {
                     "image_id": image_id,
                     "original_shm_info": shm_info,
                     "translate_result": [] # 빈 리스트 저장
                 }
                 await save_result_to_hash(request_id, rendering_data)
                 logger.debug(f"[{request_id}] Empty translation/rendering data saved to hash.")
        else: # filtered_ocr_result 자체가 빈 경우
             logger.debug(f"[{request_id}] Filtered OCR result was empty, skipping translation. Saving empty result.")
             # **** 빈 결과 저장 ****
             rendering_data = {
                 "image_id": image_id,
                 "original_shm_info": shm_info,
                 "translate_result": [] # 빈 리스트 저장
             }
             await save_result_to_hash(request_id, rendering_data)
             logger.debug(f"[{request_id}] Empty translation/rendering data saved to hash due to empty filtered OCR.")


    except FileNotFoundError:
        logger.error(f"[{request_id}] Original image shared memory {shm_name} not found. It might have been cleaned up already.")
    except ImportError as e:
         logger.critical(f"Missing dependency: {e}. Please install required libraries (e.g., opencv-python, numpy, redis>=4.2.0).")
         # TODO: Consider a mechanism to stop the worker gracefully or notify admin
    except Exception as e:
        logger.error(f"[{request_id}] Error processing processor task for image {image_id}: {e}", exc_info=True)
        # 실패 시 처리 로직 (예: 실패 큐, 재시도 등) 고려 가능
    finally:
        # 원본 이미지 SHM 핸들 닫기
        if existing_shm:
            try:
                existing_shm.close()
                logger.debug(f"[{request_id}] Closed original image shared memory handle: {shm_name}")
            except Exception as e:
                 logger.error(f"[{request_id}] Error closing original image shared memory handle {shm_name}: {e}", exc_info=True)

        pass # 마스크 SHM 정리는 여기서 하지 않음

async def run_worker(stop_event: asyncio.Event):
    """메인 워커 루프 (비동기 실행) - core.redis_client 사용"""
    redis_initialized = False
    try:
        await initialize_redis() # core.redis_client의 초기화 함수 사용
        redis_initialized = True
    except ConnectionError:
        logger.critical("Failed to initialize dependencies (Redis). Worker exiting.")
        return # 초기화 실패 시 종료
    except Exception as e: # 예상치 못한 초기화 에러
        logger.critical(f"Unexpected error during Redis initialization: {e}", exc_info=True)
        return

    logger.info(f"Processor Worker started. Listening to queue: {PROCESSOR_TASK_QUEUE}")

    while not stop_event.is_set():
        task_data = None
        try:
            # Redis 클라이언트 가져오기 (이미 초기화되었으므로 에러는 발생하지 않을 것으로 기대)
            redis_client = get_redis_client()

            task_tuple = await redis_client.blpop([PROCESSOR_TASK_QUEUE], timeout=1)

            if task_tuple:
                # task_tuple[0]은 큐 이름(바이트), task_tuple[1]은 데이터(바이트)
                task_bytes = task_tuple[1]
                try:
                    task_data = json.loads(task_bytes.decode('utf-8'))
                    await process_ocr_result_task(task_data)
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to decode task JSON: {e}. Raw data: {task_bytes}")
                except Exception as e:
                    req_id = task_data.get('request_id', 'N/A') if task_data else 'N/A'
                    logger.error(f"[{req_id}] Error processing task in main loop: {e}", exc_info=True)

        except asyncio.CancelledError:
            logger.info("Main loop cancelled.")
            break
        except (redis.exceptions.ConnectionError, redis.exceptions.TimeoutError) as e:
             logger.error(f"Redis connection error in main loop: {e}. Worker will attempt to reconnect on the next cycle or exit if initialization fails.")
             await asyncio.sleep(5)
        except Exception as e:
            # 예상치 못한 다른 오류 처리
            req_id_for_log = 'N/A'
            if task_data and isinstance(task_data, dict):
                req_id_for_log = task_data.get('request_id', 'N/A')
            logger.error(f"[{req_id_for_log}] An unexpected error occurred in the main loop: {e}", exc_info=True)
            await asyncio.sleep(1)

    logger.info("Worker loop is stopping...")
    if redis_initialized:
        await close_redis()

def main():
    """동기 실행 진입점 및 신호 처리 설정"""
    stop_event = asyncio.Event()

    def shutdown_handler(sig, frame):
        logger.info(f"Received signal {sig}. Initiating graceful shutdown...")
        loop = asyncio.get_event_loop()
        if loop.is_running():
             loop.call_soon_threadsafe(stop_event.set)
        else:
             pass

    # 표준 signal 핸들러 등록
    signal.signal(signal.SIGINT, shutdown_handler)
    signal.signal(signal.SIGTERM, shutdown_handler)

    try:
        asyncio.run(run_worker(stop_event))
    except KeyboardInterrupt:
        logger.info("KeyboardInterrupt caught in main. Shutting down.")
        if not stop_event.is_set():
            stop_event.set()

    logger.info("Processor Worker finished.")


if __name__ == "__main__":
    # shm_manager에 필요한 함수가 있는지 확인 (간단 체크)
    try:
        from core.shm_manager import get_array_from_shm, create_shm_from_array
    except ImportError:
        logger.critical("Could not import required functions (get_array_from_shm, create_shm_from_array) from core.shm_manager.")
        exit(1)

    try:
        main() # 동기 main 함수 호출
    except Exception as e:
        logger.critical(f"Critical error during worker execution: {e}", exc_info=True)
        exit(1)
