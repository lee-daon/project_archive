# Image Translate Pipeline
## 개요

이 프로젝트는 이미지 번역 파이프라인을 구현하며, 여러 단계의 이미지 처리 작업을 효율적으로 처리하기 위해 Redis 큐와 워커 패턴을 활용합니다. 초기에는 각 기능을 세분화된 워커로 나누어 구상했으나, 현재는 **OCR 워커**, **Operate 워커**, **Result 워커** 3개의 핵심 워커로 통합하여 아키텍처를 단순화하고 워커 간 통신 오버헤드를 줄였습니다.

## 현재 아키텍처: 큐-워커 패턴

시스템은 독립적인 3개의 워커와 이들 사이의 작업을 조율하는 Redis 큐로 구성됩니다.

1.  **OCR 워커 (`ocr_worker`):**
    *   **역할:** API 서버로부터 `ocr_tasks` 큐를 통해 이미지 처리 요청을 받습니다. PaddleOCR을 사용해 이미지에서 텍스트를 추출(OCR)합니다.
    *   **출력:** 추출된 텍스트 정보(`ocr_result`)를 `processor_tasks` 큐에 넣어 Operate 워커에게 전달합니다.

2.  **Operate 워커 (`operate_worker`):**
    *   **역할:** 파이프라인의 핵심으로, OCR 결과를 받아 **번역, 인페인팅, 렌더링**을 모두 처리하는 통합 워커입니다. 내부에 정교한 비동기 파이프라인을 갖추고 있습니다.
    *   상세한 동작 원리는 아래 **"Operate 워커 상세 동작 원리"** 섹션에서 설명합니다.

3.  **Result 워커 (`result`):**
    *   **역할:** `hosting_tasks` 큐를 통해 최종 결과 이미지 URL을 수신합니다.
    *   **출력:** 수신한 정보를 바탕으로 메인 서버에 작업 완료를 알리는 등 후속 처리를 담당합니다.

## Operate 워커 상세 동작 원리

`operate_worker`는 단일 워커지만, 내부는 여러 컴포넌트와 단계로 구성된 복잡한 비동기 파이프라인입니다.

### 1. 초기화 및 시작 (`main` -> `run_worker`)

1.  **이벤트 루프 및 신호 처리:** `main()` 함수에서 `asyncio` 이벤트 루프를 시작하고, `SIGINT`, `SIGTERM`과 같은 종료 신호를 처리하여 우아한 종료(graceful shutdown)가 가능하도록 설정합니다.
2.  **Redis 클라이언트 초기화:** `initialize_redis()`를 호출하여 Redis 연결 풀을 생성합니다.
3.  **LaMa 모델 로드:** `load_model()` 함수가 `lama_gpu.py`의 `load_lama_gpu_model`을 호출하여 LaMa 인페인팅 모델(`*.pt` 파일)을 GPU 메모리에 로드합니다. 이 작업은 워커 시작 시 한 번만 수행됩니다.
4.  **AsyncInpaintingWorker 인스턴스 생성:**
    *   `AsyncInpaintingWorker` 클래스의 인스턴스를 생성합니다.
    *   이때 **CPU 집약적 작업을 위한 스레드 풀**(`ThreadPoolExecutor`)이 생성됩니다. 이 스레드 풀은 이후 마스크 생성, 이미지 전/후처리, 렌더링 등 GIL(Global Interpreter Lock)의 제약을 받는 순수 Python 코드를 병렬로 처리하는 데 사용됩니다.
5.  **내부 워커 및 컴포넌트 시작:** `async_worker.start_workers()` 메소드가 호출되면서 다음과 같은 핵심 컴포넌트들이 초기화되고 내부 태스크들이 시작됩니다.
    *   **HTTP 클라이언트 세션 (`aiohttp.ClientSession`):** 이미지 다운로드 및 번역 API 호출에 사용될 비동기 HTTP 클라이언트 세션을 생성합니다.
    *   **GPU 접근 제어 (`asyncio.Semaphore(1)`):** 여러 비동기 태스크가 동시에 GPU에 접근하는 것을 막기 위해 세마포어를 생성합니다. 한 번에 하나의 작업(배치)만 GPU를 사용하도록 보장합니다.
    *   **내부 메모리 큐 (`asyncio.Queue`):** 인페인팅 파이프라인의 각 단계를 연결하는 3개의 메모리 큐(`preprocessing_queue`, `inference_queue_short/long`, `postprocessing_queue`)를 생성합니다. 이 큐들은 SHM 정보와 같은 작은 데이터만 주고받아 매우 빠릅니다.
    *   **렌더링 및 결과 확인 모듈:** `RenderingProcessor`와 `ResultChecker` 인스턴스를 생성합니다. 이들은 각각 최종 이미지 렌더링과, 번역/인페인팅 결과의 동기화를 담당합니다.
    *   **내부 워커 태스크 시작:** 여러 종류의 워커들이 `asyncio.create_task`를 통해 동시에 실행됩니다.
        *   **매니저 워커:** `_concurrent_worker` 함수를 사용하여 '전처리 매니저'와 '후처리 매니저'가 생성됩니다. 이들은 각자 담당 큐를 감시하며, 작업이 들어오면 병렬로 처리할 '핸들러' 태스크를 생성하는 역할을 합니다.
        *   **GPU 추론 워커:** `_gpu_inference_worker`는 배치 처리를 위해 단일 루프로 동작합니다.
        *   **Redis 리스너 워커:** `_redis_listener_worker`는 외부 Redis 큐로부터 최초의 작업을 받아오는 역할을 합니다.

### 2. 단일 작업 처리 흐름

초기화가 완료되면, `_redis_listener_worker`가 `processor_tasks` Redis 큐를 리스닝하며 실제 작업을 처리하기 시작합니다.

1.  **작업 수신:** `_redis_listener_worker`가 `redis.blpop`을 통해 `processor_tasks` 큐에서 OCR 결과가 포함된 작업을 가져옵니다.
2.  **작업 생성 제어:** 메인 세마포어(`concurrent_task_semaphore`)를 통해 동시 처리 중인 작업의 총량이 한도를 넘지 않도록 제어합니다.
3.  **작업 분기:** `async_worker.process_ocr_task` 메소드를 `create_task`로 호출하여 비동기적으로 처리합니다. 이 메소드 안에서 **번역 경로**와 **인페인팅 경로**로 나뉘어 병렬로 진행됩니다.

#### 2-1. 번역 경로 (비동기 I/O 위주)

*   `logic.text_translate.process_and_save_translation` 함수가 호출됩니다.
*   **번역 API 호출:** `ocr_result`의 텍스트들을 모아 `aiohttp`를 통해 외부 번역 API (Gemini)를 비동기적으로 호출합니다. API 응답을 기다리는 동안 이벤트 루프는 다른 작업을 처리할 수 있습니다.
*   **결과 저장:** 번역이 완료되면, `save_result_to_hash` 함수가 번역 결과(`translate_result`)와 원본 이미지 URL을 `translate_text_result:{request_id}` 라는 이름의 Redis 해시(Hash)에 저장합니다.
*   **렌더링 시도:** `result_checker.check_and_trigger_rendering_after_translate`를 호출하여, 혹시 인페인팅이 먼저 끝나 있는지 확인하고, 그렇다면 즉시 렌더링을 시작합니다.

#### 2-2. 인페인팅 경로 (CPU 스레드 풀 + GPU 파이프라인)

*   **마스크 생성:** `generate_mask_pure_sync` 함수가 **CPU 스레드 풀**에서 실행됩니다. OCR 좌표를 기반으로 마스크 이미지를 생성하고, 원본 이미지와 마스크를 공유 메모리(SHM)에 저장합니다. 그 후 SHM 정보가 포함된 `preprocessing_task` 객체를 만들어 반환합니다.
*   **전처리 큐에 추가:** 생성된 `preprocessing_task`가 `preprocessing_queue` (메모리 큐)에 추가됩니다.
*   **전처리 매니저 및 핸들러 (`preprocess-manager`):**
    *   **매니저 워커**(`_concurrent_worker`)가 `preprocessing_queue`에서 작업을 꺼내 **핸들러 태스크**(`_handle_preprocessing_task`)를 생성합니다.
    *   매니저는 세마포어로 동시 실행 수를 제어하며, 실제 처리를 담당할 **핸들러 태스크**를 `create_task`로 생성하고 즉시 다음 작업을 받으러 갑니다.
    *   여러 개의 핸들러 태스크들은 **CPU 스레드 풀**을 통해 `process_single_task_pure_sync` 함수를 **병렬로 실행**하여, 디노이징, 리사이징 등의 작업을 동시에 처리합니다.
*   **GPU 추론 워커 (`_gpu_inference_worker`):**
    *   `inference_queue`에서 작업들을 가져와 배치(batch)로 묶습니다.
    *   `gpu_semaphore`를 획득하여 GPU 접근을 동기화한 후, `run_batch_inference` 함수를 호출하여 LaMa 모델로 인페인팅을 **GPU에서** 실행합니다.
    *   추론 결과(NumPy 배열)를 `postprocessing_queue`에 넣습니다.
*   **후처리 매니저 및 핸들러 (`postprocess-manager`):**
    *   전처리 단계와 동일한 패턴으로, **매니저 워커**가 큐에서 작업을 꺼내 **핸들러 태스크**(`_handle_postprocessing_task`)를 생성합니다.
    *   여러 개의 핸들러 태스크들은 **CPU 스레드 풀**을 통해 추론 결과를 원본 이미지 크기로 **병렬로 복원**합니다.
*   **결과 저장 및 렌더링 시도:** 복원된 인페인팅 이미지는 서버의 임시 파일(`*.png`)로 저장됩니다. 이 파일 경로가 `inpainting_result:{request_id}` Redis 해시에 저장되고, `result_checker.check_and_trigger_rendering`가 호출되어 번역 결과가 준비되었는지 확인 후 렌더링을 시작합니다.

### 3. 동기화 및 최종 렌더링

*   `ResultChecker`는 두 경로의 결과가 모두 각각의 Redis 해시에 저장되는 시점을 감지합니다.
*   어느 한쪽이 완료되었을 때 다른 쪽의 결과가 이미 있다면, `_trigger_rendering_task`를 호출하여 최종 렌더링 단계를 시작합니다.
*   `process_rendering_sync` 함수가 **CPU 스레드 풀**에서 실행되어 인페인팅된 이미지에 텍스트를 그리는 렌더링 작업을 수행합니다.
*   최종 결과 이미지는 R2 스토리지에 업로드되고, 이 이미지의 URL이 `hosting_tasks` Redis 큐에 추가되어 **Result 워커**에게 전달됩니다.

## Redis 큐 및 데이터 스키마

각 워커는 Redis 큐를 통해 작업을 전달받습니다. 자세한 데이터 스키마는 `workers/operate_worker/redis_queue_schema.js` 파일을 참조하십시오.

1.  **`ocr_tasks` (List):**
    *   **흐름:** API 서버 → OCR 워커
    *   **역할:** 이미지 OCR 작업을 요청합니다.

2.  **`processor_tasks` (List):**
    *   **흐름:** OCR 워커 → Operate 워커
    *   **역할:** OCR 결과(텍스트 좌표, 내용)를 전달하여 번역 및 인페인팅, 렌더링을 포함한 후속 작업을 요청합니다.
    *   **주요 데이터:** `request_id`, `image_url`, `ocr_result`.

3.  **`translate_text_result:{request_id}` (Hash):**
    *   **역할:** Operate 워커가 번역 결과를 저장하는 중간 저장소입니다.
    *   **주요 데이터:** `translate_result` (번역 결과 JSON), `original_image_url`.

4.  **`inpainting_result:{request_id}` (Hash):**
    *   **역할:** Operate 워커가 인페인팅 결과를 저장하는 중간 저장소입니다.
    *   **주요 데이터:** `image_id`, `is_long`, `temp_path` (임시 저장된 인페인팅 이미지 파일 경로).

5.  **`hosting_tasks` (List):**
    *   **흐름:** Operate 워커 → Result 워커
    *   **역할:** 최종 렌더링된 이미지의 URL을 전달하여 작업 완료를 알립니다.

*성능과 최적화 효과는 환경과 데이터에 따라 다를 수 있으며, 지속적인 개선이 필요합니다.

