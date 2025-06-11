import logging
from typing import Optional

from .image_processor import bytes_to_numpy_bgr
from core.shm_manager import create_shm_from_array, cleanup_shm
from .redis import enqueue_ocr_task # 새 경로에서 import

logger = logging.getLogger(__name__)

async def process_translate_request(
    request_id: str,
    image_bytes: bytes,
    image_id: str,
    is_long: bool,
    original_filename: Optional[str] = None
):
    """요청받은 이미지를 처리하고 OCR 작업을 큐에 넣습니다."""
    shm_info = None
    try:
        # 1. 이미지 바이트 -> NumPy 배열 변환
        logger.info(f"[{request_id}] Processing image: {image_id} (filename: {original_filename})")
        img_array = bytes_to_numpy_bgr(image_bytes)

        # 2. NumPy 배열 -> 공유 메모리 저장
        logger.info(f"[{request_id}] Writing image array to shared memory...")
        shm_info = create_shm_from_array(img_array)
        logger.info(f"[{request_id}] Image array written to SHM: {shm_info['shm_name']}")

        # 3. OCR 작업 데이터 준비
        task_data = {
            "request_id": request_id,
            "image_id": image_id,
            "is_long": is_long,
            "shm_info": shm_info,
            "original_filename": original_filename # 추적/디버깅 용도
        }

        # 4. Redis 큐에 작업 추가
        logger.info(f"[{request_id}] Enqueuing OCR task...")
        await enqueue_ocr_task(task_data)
        logger.info(f"[{request_id}] OCR task enqueued successfully.")

        # 성공적으로 큐에 넣었으므로, API 서버는 공유 메모리를 직접 정리할 필요 없음
        # 워커가 처리를 완료하고 결과를 저장한 후, 별도의 메커니즘(또는 타임아웃)으로 정리해야 함
        # 여기서는 간단하게 API 서버가 생성 후 바로 정리하지 않음.

    except Exception as e:
        logger.error(f"[{request_id}] Failed to process request: {e}", exc_info=True)
        # 오류 발생 시 생성된 공유 메모리 정리 시도
        if shm_info and shm_info.get('shm_name'):
            logger.warning(f"[{request_id}] Attempting to cleanup SHM {shm_info['shm_name']} due to error.")
            cleanup_shm(shm_info['shm_name'])
        # 에러를 다시 발생시켜 main.py의 핸들러가 처리하도록 함
        raise 