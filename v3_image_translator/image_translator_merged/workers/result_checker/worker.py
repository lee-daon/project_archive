import json
import time
import logging
from typing import Dict, Any, Optional
import asyncio # asyncio 임포트

from core.redis_client import get_redis_client, initialize_redis, close_redis

# 코어 모듈 임포트 수정
from core.config import REDIS_URL # REDIS_URL 직접 사용

# 로깅 설정
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

logging.getLogger('asyncio').setLevel(logging.WARNING) # asyncio 자체 로그는 줄이기
logger = logging.getLogger(__name__)

class ResultChecker:
    def __init__(self, rendering_queue_name: str = "rendering_tasks"):
        """
        번역 결과와 인페인팅 결과를 확인하고 렌더링 작업을 큐에 추가하는 클래스
        
        Args:
            rendering_queue_name: 렌더링 작업 큐 이름
        """
        self.redis = get_redis_client() # 초기화된 비동기 클라이언트 가져오기

        self.rendering_queue_name = rendering_queue_name

    async def check_and_queue_rendering(self, request_id: str) -> bool:
        """
        주어진 request_id에 대해 번역 결과와 인페인팅 결과가 모두 있는지 확인하고
        모두 있으면 렌더링 작업을 큐에 추가 (비동기 버전)
        
        Args:
            request_id: 확인할 요청 ID
            
        Returns:
            bool: 렌더링 작업이 큐에 추가되었으면 True, 아니면 False
        """
        translate_key = f"translate_text_result:{request_id}"
        inpaint_key = f"inpainting_result:{request_id}"
        queued_marker_key = f"rendering_queued:{request_id}"
        
        try:
            # 0. 이미 큐에 추가되었는지 확인 (비동기)
            if await self.redis.exists(queued_marker_key):
                logger.debug(f"[{request_id}] Already marked as queued. Skipping.")
                return False
                
            # 1. 두 결과 해시가 모두 존재하는지 확인 (비동기)
            # exists 호출을 한 번으로 줄이기 (선택적 최적화)
            exists_results = await asyncio.gather(
                self.redis.exists(translate_key),
                self.redis.exists(inpaint_key)
            )
            if not all(exists_results):
                return False
            
            # 2. 각 해시에서 필요한 필드 가져오기 (비동기)
            translate_info, inpaint_info = await asyncio.gather(
                self.redis.hgetall(translate_key),
                self.redis.hgetall(inpaint_key)
            ) 
            # 3. 필드 존재 여부 확인 및 로깅 (바이트를 문자열로 디코딩 필요)
            translate_data = translate_info.get(b"data", b"").decode('utf-8')
            original_shm_info_json = translate_info.get(b"original_shm_info", b"").decode('utf-8')
            image_id = inpaint_info.get(b"image_id", b"").decode('utf-8')
            inpaint_shm_info = inpaint_info.get(b"inpaint_shm_info", b"").decode('utf-8')
            is_long = inpaint_info.get(b"is_long", b"false").decode('utf-8')  # is_long 정보 추출
            
            all_data_present = True
            missing_fields = []
            if not translate_data:
                missing_fields.append("translate_data")
                all_data_present = False
            if not original_shm_info_json:
                missing_fields.append("original_shm_info")
                all_data_present = False
            if not image_id:
                missing_fields.append("image_id")
                all_data_present = False
            if not inpaint_shm_info:
                missing_fields.append("inpaint_shm_info")
                all_data_present = False
                
            if not all_data_present:
                return False
                
            # 4. 렌더링 작업 데이터 생성 (Python 딕셔너리)
            task_data = {
                "request_id": request_id,
                "image_id": image_id,
                "translate_data": translate_data, # 이미 문자열
                "inpaint_shm_info": inpaint_shm_info, # 이미 문자열
                "original_shm_info": original_shm_info_json,
                "is_long": is_long.lower() == "true"  # "true" 문자열을 boolean으로 안전하게 변환
            }
            
            # 5. 렌더링 큐에 작업 추가 (JSON으로 직렬화) (비동기)
            task_json = json.dumps(task_data).encode('utf-8') # 바이트로 인코딩
            lpush_result = await self.redis.lpush(self.rendering_queue_name, task_json) # DEBUG 로그 위해 결과 저장
            
            # 6. 처리 완료 표시 (선택적) (비동기)
            setex_result = await self.redis.setex(queued_marker_key, 86400, 1) # 1일 TTL # DEBUG 로그 위해 결과 저장

            
            try:
                delete_count = await self.redis.delete(translate_key, inpaint_key)
                logger.debug(f"Request {request_id}: Deleted source Redis hashes ({translate_key}, {inpaint_key}). Count: {delete_count}.")
            except Exception as del_e:
                logger.error(f"Request {request_id}: Failed to delete source Redis hashes. Error: {del_e}", exc_info=True)

            logger.debug(f"Request {request_id}: 렌더링 작업 큐에 추가됨 (Python Logic, Async)")
            return True
            
        except Exception as e:
            logger.error(f"Request {request_id} 확인 중 오류 발생 (Python Logic, Async): {e}", exc_info=True)
            return False
    async def process_pending_requests(self) -> int:
        """
        처리되지 않은 모든 요청을 확인하고 렌더링 작업을 큐에 추가 (비동기)
        
        Returns:
            int: 큐에 추가된 작업 수
        """
        queued_count = 0
        
        try:
            translate_keys = [key async for key in self.redis.scan_iter("translate_text_result:*")]
            inpaint_keys = [key async for key in self.redis.scan_iter("inpainting_result:*")]

            # 모든 고유 request_id 추출 (바이트 디코딩 필요)
            request_ids = set()
            for key_bytes in translate_keys:
                try: # 키 형식 오류 방지
                    request_ids.add(key_bytes.decode('utf-8').split(":")[1])
                except IndexError:
                    logger.warning(f"Invalid translate key format found: {key_bytes}")
            for key_bytes in inpaint_keys:
                 try: # 키 형식 오류 방지
                    request_ids.add(key_bytes.decode('utf-8').split(":")[1])
                 except IndexError:
                     logger.warning(f"Invalid inpaint key format found: {key_bytes}")

            # 각 request_id에 대해 확인 (동시 실행 고려 가능)
            tasks = []
            for request_id in request_ids:
                # 이미 렌더링 큐에 추가된 작업은 건너뛰기 (비동기)
                queued_marker_key = f"rendering_queued:{request_id}"

                tasks.append(self.check_if_queued_and_process(request_id, queued_marker_key))

            if tasks: # 태스크가 있을 때만 gather 호출
                results = await asyncio.gather(*tasks)
                queued_count = sum(results)

            return queued_count
            
        except Exception as e:
            logger.error(f"처리되지 않은 요청 확인 중 오류 발생 (Async): {str(e)}", exc_info=True)
            return queued_count

    # process_pending_requests에서 동시 처리를 위한 헬퍼 함수
    async def check_if_queued_and_process(self, request_id: str, queued_marker_key: str) -> int:
        if await self.redis.exists(queued_marker_key):
            return 0
        if await self.check_and_queue_rendering(request_id):
             return 1
        return 0

    async def start_monitoring(self, check_interval: int = 5):
        """
        Redis 키 이벤트 모니터링 시작 및 주기적 처리 (비동기)
        
        Args:
            check_interval: 주기적 확인 간격(초)
        """
        logger.info("Attempting to start Redis monitoring...")
        # Redis keyspace 이벤트 알림 설정 (비동기)
        # 설정은 시작 시 한 번만 하면 되므로, 별도 스크립트나 초기화 시점에 수행하는 것이 더 적합할 수 있음
        try:
            await self.redis.config_set("notify-keyspace-events", "KEA")
            logger.info("Successfully set notify-keyspace-events=KEA")
        except Exception as config_e:
            logger.warning(f"Failed to set Redis keyspace events notification: {config_e}. Make sure Redis config allows it.")

        # 구독 클라이언트 설정 (비동기)
        pubsub = self.redis.pubsub()

        # 해시 작업 이벤트 구독 (비동기)
        try:
            await pubsub.psubscribe("__keyevent@*__:hset")
            logger.info("Successfully psubscribed to __keyevent@*__:hset")
        except Exception as sub_e:
            logger.error(f"Failed to psubscribe to keyspace events: {sub_e}", exc_info=True)
            return # 구독 실패 시 모니터링 시작 불가

        logger.info("Redis 키 이벤트 모니터링 시작 (비동기 pubsub.listen)")

        # 시작 시 한 번 처리되지 않은 요청 확인 (비동기)
        try:
            initial_count = await self.process_pending_requests()
            logger.info(f"초기 검사: {initial_count}개 작업 큐에 추가됨")
        except Exception as initial_check_e:
            logger.error(f"Error during initial pending request check: {initial_check_e}", exc_info=True)


        async def periodic_checker():
            # nonlocal last_check_time # 제거
            logger.info("Periodic checker task started.")
            while True:
                await asyncio.sleep(check_interval)
                try:
                    count = await self.process_pending_requests()
                    if count > 0:
                        logger.info(f"Periodic check queued {count} tasks.")
                except Exception as periodic_e:
                     logger.error(f"Error during periodic check: {periodic_e}", exc_info=True)
                     # 주기적 검사 실패 시에도 계속 시도

        async def message_listener():
            logger.info("Message listener task started.")
            while True:
                try:
                    async for message in pubsub.listen(): # listen 제너레이터 사용
                        if message and message["type"] == "pmessage":
                            channel_pattern = message.get("pattern")
                            channel = message.get("channel")
                            key_bytes = message.get("data") # 이벤트 발생 키
                            
                            # 키 이름 디코딩
                            if isinstance(key_bytes, bytes):
                                try:
                                    key = key_bytes.decode('utf-8')
                                except UnicodeDecodeError:
                                     logger.warning(f"Could not decode key bytes: {key_bytes}")
                                     continue
                            else:
                                logger.warning(f"Received unexpected data type for keyevent key: {type(key_bytes)}")
                                continue
                            
                            # logger.debug(f"Keyspace event: pattern={channel_pattern}, channel={channel}, key={key}") # 키 이벤트 로그 주석 처리

                            # '__keyevent@*__:hset' 이벤트에서 key는 hset이 발생한 키 이름
                            if key.startswith("translate_text_result:") or key.startswith("inpainting_result:"):
                                try:
                                    request_id = key.split(":")[1]
                                    logger.debug(f"Relevant key event detected for request_id: {request_id}")
                                    # check_and_queue_rendering을 직접 호출하지 않고 태스크 생성 고려 (선택적)
                                    asyncio.create_task(self.check_and_queue_rendering(request_id))
                                except IndexError:
                                     logger.warning(f"Could not extract request_id from key: {key}")
                                except Exception as task_e:
                                     logger.error(f"Error creating task for keyspace event key {key}: {task_e}", exc_info=True)

                except asyncio.CancelledError:
                    logger.info("Message listener task cancelled.")
                    break # 루프 종료
                except redis.exceptions.ConnectionError as e:
                    logger.error(f"Redis connection error during pubsub listen: {e}")
                    await asyncio.sleep(5) # 연결 오류 시 잠시 대기 후 재시도
                except Exception as e:
                    logger.error(f"Error processing pubsub message: {e}", exc_info=True)
                    await asyncio.sleep(1) # 기타 오류 시 잠시 대기

        # 주기적 검사기와 메시지 리스너를 동시에 실행
        listener_task = asyncio.create_task(message_listener())
        checker_task = asyncio.create_task(periodic_checker())

        results = await asyncio.gather(listener_task, checker_task, return_exceptions=True)
        logger.info(f"Monitoring tasks finished. Results: {results}") # 종료 시 결과 로깅

async def main():
    logger.info("Initializing Redis...")
    await initialize_redis() # Redis 초기화
    logger.info("Redis initialized.")
    checker = ResultChecker()
    try:
        logger.info("Starting monitoring...")
        await checker.start_monitoring()
    except asyncio.CancelledError:
         logger.info("Main monitoring task cancelled.")
    finally:
        logger.info("Closing Redis connection...")
        await close_redis() # Redis 종료
        logger.info("Redis connection closed.")

# 직접 실행할 경우 사용할 코드
if __name__ == "__main__":
    try:
        logger.info("Starting ResultChecker main...")
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("ResultChecker stopped by user.")

