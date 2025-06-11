# Rendering Worker

## 역할

`RenderingWorker`는 이미지 번역 파이프라인의 최종 단계 중 하나로, 번역된 텍스트와 인페인팅(원본 텍스트 제거)된 이미지를 입력받아, 번역된 텍스트를 이미지 위에 자연스럽게 렌더링하여 최종 결과 이미지를 생성하는 역할을 담당합니다.

## 주요 기능

*   **텍스트 크기 계산:** 주어진 텍스트 박스 크기에 맞춰 적절한 폰트 크기를 계산합니다. (`modules/textsize.py`)
*   **텍스트 색상 선택:** 인페인팅된 배경과 원본 이미지의 색상 정보를 분석하여, 배경과 충분한 대비를 가지면서도 원본과 유사한 최적의 텍스트 색상을 선택합니다. (`modules/selectTextColor.py`)
*   **텍스트 렌더링:** 계산된 폰트 크기와 선택된 색상을 사용하여 Pillow 라이브러리를 통해 번역된 텍스트를 이미지에 렌더링합니다.
*   **결과 저장 및 상태 업데이트:** 최종 렌더링된 이미지를 지정된 경로에 저장하고, Redis에 작업 완료 상태와 결과 이미지 경로를 업데이트합니다.

## 작동 구조 (비동기 방식)

`RenderingWorker`는 `asyncio`를 기반으로 비동기적으로 작동하여 효율적인 자원 활용과 높은 처리량을 목표로 합니다.

1.  **초기화:**
    *   워커 시작 시 비동기 Redis 클라이언트(`core/redis_client`)에 연결합니다.
    *   `TextSizeCalculator`, `TextColorSelector` 모듈을 초기화합니다. 폰트 객체는 요청 시 로드되어 캐싱됩니다.
    *   `RenderingWorker 초기화 완료` 로그를 출력합니다.

2.  **작업 대기 및 수신:**
    *   `start_worker` 함수 내에서 무한 루프를 돌며 `rendering_tasks` Redis 리스트에 작업이 들어오기를 비동기적으로 대기합니다 (`blpop`).
    *   `렌더링 워커 시작 ... Async Mode` 로그를 출력합니다.

3.  **작업 처리 (`process_rendering_task` 비동기 태스크):**
    *   `blpop`으로 작업을 받으면, 해당 작업을 처리하기 위한 별도의 비동기 태스크(`asyncio.create_task`)를 생성합니다. 이를 통해 워커는 다음 작업을 기다리는 동시에 현재 작업을 처리할 수 있습니다.
    *   `Processing rendering task started.` 로그를 출력합니다.
    *   **데이터 파싱:** 작업 데이터(JSON 문자열)를 파싱합니다.
    *   **이미지 로드:** 작업 데이터 내 SHM(공유 메모리) 정보를 사용하여 원본 이미지와 인페인팅된 이미지를 비동기적으로 로드합니다 (`_load_image_from_shm_async`). (실제 SHM 접근은 블로킹 가능성이 있어 `run_in_executor` 사용)
    *   **폰트 크기 계산:** `TextSizeCalculator`를 사용하여 각 텍스트 항목에 대한 폰트 크기를 계산합니다 (`calculate_font_sizes`). (CPU 집약적일 수 있어 `run_in_executor` 사용)
    *   **텍스트 색상 선택:** `TextColorSelector`를 사용하여 각 텍스트 항목에 대한 색상을 선택합니다 (`select_text_color`). (KMeans 계산은 CPU 집약적이므로 `run_in_executor` 사용, 픽셀 샘플링 적용)
    *   **텍스트 렌더링:** 계산된 크기와 색상으로 각 텍스트를 인페인팅된 이미지 위에 순차적으로 렌더링합니다 (`_draw_text_on_image_async` -> `_draw_text_on_image_sync`). (Pillow 렌더링은 CPU 집약적이므로 `run_in_executor` 사용)
    *   **이미지 저장:** 최종 렌더링된 이미지를 파일로 저장합니다 (`_save_image_async`). (파일 I/O는 블로킹 가능성이 있어 `run_in_executor` 사용)
    *   **상태 업데이트:** Redis에 최종 작업 상태(`completed` 또는 `failed`)와 이미지 경로를 업데이트합니다 (`_update_task_status_async`). Redis Pub/Sub 및 SSE용 리스트에도 결과를 발행/추가합니다.
    *   **리소스 정리:** 사용한 공유 메모리 객체를 닫고(`_cleanup_shm_resources_async`), 공유 메모리 세그먼트를 시스템에서 해제(unlink)합니다 (`_cleanup_shm_unlink_async`). (블로킹 가능성이 있어 `run_in_executor` 사용)

4.  **(선택적) ResultChecker 와의 연동:**
    *   `RenderingWorker`는 `rendering_tasks` 큐만 바라봅니다. 이 큐에 작업을 넣는 것은 `ResultChecker` (또는 유사한 역할의 컴포넌트)의 책임입니다.
    *   `ResultChecker`는 Redis 키(`translate_text_result:*`, `inpainting_result:*`)를 감시하고, 번역 및 인페인팅 결과가 모두 준비되면 `rendering_tasks` 큐에 작업을 생성하여 넣습니다.
    *   (현재는 테스트를 위해 `worker.py` 내에서 `ResultChecker`가 함께 실행되도록 설정되어 있습니다. 운영 환경에서는 별도 프로세스/컨테이너로 분리하는 것을 권장합니다.)

## 실행 환경

*   Python 3.9 이상 (asyncio 활용)
*   필요 라이브러리: `requirements.txt` 참조 (numpy, opencv-python, Pillow, redis, scikit-learn)
*   Redis 서버 필요
*   공유 메모리 사용 (IPC 통신)
*   `Dockerfile`을 통해 Docker 컨테이너 환경에서 실행 가능 (`docker-compose.yml` 참조)
