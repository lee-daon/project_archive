# Result Checker

## 역할

`ResultChecker`는 이미지 번역 파이프라인에서 중간 결과들을 감시하고, 다음 단계인 렌더링 작업의 시작 조건을 충족했는지 확인하는 역할을 담당합니다. 번역 결과와 인페인팅(텍스트 제거) 결과가 모두 준비되면, 렌더링 워커가 처리할 수 있도록 관련 정보를 조합하여 `rendering_tasks` 큐에 작업을 추가합니다.

## 주요 기능

*   **결과 감시:** Redis 키스페이스 이벤트(`__keyevent@*__:hset`)를 구독하여 `translate_text_result:*` 또는 `inpainting_result:*` 해시 키에 변경이 발생했는지 실시간으로 감지합니다.
*   **주기적 검사:** 일정 간격(기본 5초)으로 Redis에 존재하는 모든 `translate_text_result:*` 및 `inpainting_result:*` 키를 스캔하여, 이벤트 기반 감시에서 놓쳤거나 이전에 조건 미충족으로 처리되지 않은 요청들을 확인합니다.
*   **조건 확인:** 특정 요청 ID(`request_id`)에 대해 번역 결과 해시와 인페인팅 결과 해시가 모두 존재하는지, 그리고 각 해시 내부에 필요한 필드(`data`, `original_shm_info`, `image_id`, `inpaint_shm_info`)가 모두 존재하는지 확인합니다.
*   **렌더링 작업 큐잉:** 모든 조건이 충족되면, 번역 데이터, 인페인팅된 이미지 SHM 정보, 원본 이미지 SHM 정보 등을 포함하는 렌더링 작업 데이터를 JSON 형식으로 만들어 `rendering_tasks` Redis 리스트에 추가합니다 (`lpush`).
*   **중복 방지:** 한 번 렌더링 큐에 추가된 요청은 `rendering_queued:{request_id}` 마커 키를 생성하여 중복으로 큐에 추가되는 것을 방지합니다.
*   **리소스 정리:** 렌더링 작업이 성공적으로 큐에 추가되면, 사용된 원본 결과 해시(`translate_text_result:*`, `inpainting_result:*`)를 Redis에서 삭제하여 불필요한 데이터 누적을 방지합니다.

## 작동 구조 (비동기 방식)

`ResultChecker`는 `asyncio`를 기반으로 비동기적으로 작동하여 Redis I/O 작업을 효율적으로 처리합니다.

1.  **초기화:**
    *   시작 시 비동기 Redis 클라이언트(`core/redis_client`)에 연결합니다.
    *   Redis 키스페이스 이벤트 알림 설정을 시도하고(`CONFIG SET notify-keyspace-events KEA`), 이벤트 구독을 설정합니다 (`psubscribe __keyevent@*__:hset`).

2.  **모니터링 시작 (`start_monitoring`):**
    *   **초기 검사:** 시작 시 한 번 `process_pending_requests`를 호출하여 Redis에 남아있는 처리되지 않은 모든 요청을 확인하고 렌더링 큐에 추가합니다.
    *   **메시지 리스너 (`message_listener`):** 별도의 비동기 태스크로 실행되며, `pubsub.listen()`을 통해 Redis 키스페이스 이벤트를 지속적으로 대기합니다. 관련 키(`translate_text_result:*`, `inpainting_result:*`)에 `hset` 이벤트가 발생하면, 해당 `request_id`에 대해 `check_and_queue_rendering`을 비동기 태스크로 실행합니다.
    *   **주기적 검사기 (`periodic_checker`):** 별도의 비동기 태스크로 실행되며, 설정된 간격(`check_interval`)마다 `process_pending_requests`를 호출하여 모든 관련 키를 다시 스캔하고 렌더링 큐에 작업을 추가합니다.
    *   `asyncio.gather`를 사용하여 메시지 리스너와 주기적 검사기 태스크를 동시에 실행하고 관리합니다.

## 실행 환경

*   Python 3.9 이상 (asyncio 활용)
*   필요 라이브러리: `requirements.txt` 참조 (redis)
*   Redis 서버 필요 (Keyspace 이벤트 알림 기능 활성화 권장)
*   `Dockerfile`을 통해 Docker 컨테이너 환경에서 독립적으로 실행 가능 (`docker-compose.yml` 참조)
