import redis.asyncio as redis
import json
import logging
from typing import Dict, Any

# core 모듈에서 필요한 설정값과 클라이언트 함수 임포트
from core.config import OCR_TASK_QUEUE
from core.redis_client import get_redis_client

logger = logging.getLogger(__name__)

async def enqueue_ocr_task(task_data: Dict[str, Any]):
    """OCR 작업 데이터를 JSON으로 직렬화하여 Redis 큐 오른쪽에 추가합니다 (FIFO)."""
    client = get_redis_client()
    try:
        # NumPy 배열의 shape 튜플을 리스트로 변환 (JSON 직렬화 가능하도록)
        if 'shm_info' in task_data and 'shape' in task_data['shm_info'] and isinstance(task_data['shm_info']['shape'], tuple):
             task_data['shm_info']['shape'] = list(task_data['shm_info']['shape'])

        task_json = json.dumps(task_data).encode('utf-8')
        # LPUSH를 RPUSH로 변경하여 FIFO 구현
        await client.rpush(OCR_TASK_QUEUE, task_json)
        logger.info(f"Task {task_data.get('request_id')} enqueued to {OCR_TASK_QUEUE} (RPUSH)")
    except Exception as e:
        logger.error(f"Failed to enqueue task {task_data.get('request_id')}: {e}", exc_info=True)
        # 에러를 다시 발생시켜 호출 측에서 처리하도록 함
        raise
