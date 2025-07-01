# OCR Worker

이 문서는 이미지 번역 파이프라인의 `OCR Worker`에 대한 기술적인 내용을 다룹니다. OCR Worker는 이미지 URL을 받아 텍스트를 인식하고, 그 결과를 다음 단계로 전달하는 역할을 수행합니다.

## 주요 기능

-   **비동기 이미지 다운로드**: `aiohttp`를 사용하여 여러 이미지를 동시에 비동기적으로 다운로드하여 I/O 병목 현상을 최소화합니다.
-   **안정적인 백프레셔(Backpressure)**: 시스템의 부하를 실시간으로 모니터링하여, 처리 용량을 초과하는 작업 요청이 들어올 경우 작업 수신을 스스로 조절합니다. 이를 통해 작업 유실 없이 안정적인 운영이 가능합니다.
-   **GPU 기반 OCR 처리**: `PaddleOCR` 모델을 GPU 메모리에 상주시켜 빠르고 효율적인 텍스트 인식을 수행합니다.
-   **설정 유연성**: 환경 변수를 통해 동시 다운로드 수, 작업 대기열 크기 등 주요 파라미터를 유연하게 설정할 수 있습니다.

---

## 파일 구조 및 설명

-   `worker.py`: 워커의 메인 로직 및 비동기 파이프라인을 구현한 파일.
-   `Dockerfile`: OCR Worker 실행을 위한 Docker 환경을 정의한 파일.
-   `core/config.py`: 워커의 동작을 제어하는 설정 변수를 관리하는 파일.
-   `core/redis_client.py`: Redis 연결을 관리하는 유틸리티 모듈.
-   `requirements.txt`: Python 의존성 패키지 목록.

---

### `worker.py`

워커의 핵심 로직입니다. Redis 큐에서 작업을 가져와 이미지 다운로드, OCR 처리, 결과 전송까지의 전체 파이프라인을 관장합니다.

#### 주요 클래스 및 함수

-   **`ImageDownloadManager`**:
    -   이미지 다운로드 파이프라인을 관리하는 핵심 클래스입니다.
    -   `download_semaphore`: `asyncio.Semaphore`를 사용하여 동시 다운로드 수를 `MAX_CONCURRENT_DOWNLOADS`로 제한합니다.
    -   `pending_images`: 다운로드가 완료되어 OCR 처리를 기다리는 이미지(NumPy 배열)를 저장하는 `deque` 큐입니다.
    -   `get_total_load()`: 현재 다운로드 중인 작업 수와 OCR 대기 중인 이미지 수를 합산하여 **전체 시스템 부하**를 계산합니다. 이 값이 백프레셔의 기준이 됩니다.

-   **`download_and_prepare_image()`**:
    -   주어진 URL에서 이미지를 다운로드하고 전처리합니다.
    -   HTTP 420 (Rate Limit) 에러 발생 시 재시도 로직이 포함되어 있습니다.
    -   `.png`, `.jpg` 외 다른 형식의 이미지를 호환 가능한 `JPEG`로 변환합니다.

-   **`process_ocr_task()`**:
    -   다운로드된 이미지(NumPy 배열)를 받아 `PaddleOCR` 모델로 텍스트를 추출합니다.
    -   GPU 리소스를 효율적으로 사용하기 위해 한 번에 하나의 이미지만 순차적으로 처리합니다.
    -   추론 결과는 다음 파이프라인을 위해 Redis 결과 큐(`OCR_RESULT_QUEUE`)에 저장됩니다.

-   **`main()`**:
    -   워커의 메인 이벤트 루프입니다.
    -   **백프레셔 로직**: 루프마다 `download_manager.get_total_load()`로 부하를 먼저 확인합니다. 부하가 `MAX_PENDING_IMAGES` 임계치를 넘으면 `DOWNLOAD_COOLDOWN` 시간만큼 휴식하며, 여유가 있을 때만 Redis에서 새로운 작업을 가져옵니다.
    -   **비동기 실행**: Redis에서 가져온 작업은 "Fire-and-Forget" 방식으로 즉시 비동기 다운로드를 시작시키고, 메인 루프는 OCR 처리 등 다른 작업을 계속 수행합니다.

### `Dockerfile`

OCR Worker를 실행하기 위한 Docker 이미지를 빌드합니다.

-   **Base Image**: `paddlepaddle/paddle:3.0.0-gpu-cuda11.8-cudnn8.9-trt8.6`를 사용하여 GPU 및 CUDA 환경을 사전 구성합니다.
-   **의존성 설치**: `apt-get`으로 시스템 라이브러리를 설치하고, `requirements.txt`를 통해 Python 패키지를 설치합니다.
-   **모델 복사**: 로컬에 저장된 `PaddleOCR` 모델 파일들을 이미지 빌드 시점에 컨테이너 내부(`/root/.paddleocr/whl/`)로 복사합니다. 이를 통해 컨테이너 실행 시 모델을 다시 다운로드할 필요가 없어 시작 시간이 단축됩니다.
-   **실행**: `CMD ["python", "worker.py"]` 명령어로 워커를 실행합니다.

### `core/config.py`

환경 변수를 통해 워커의 주요 동작을 설정합니다.

-   `REDIS_URL`: 연결할 Redis 서버 주소.
-   `OCR_TASK_QUEUE`, `OCR_RESULT_QUEUE`: 작업을 가져오고 결과를 저장할 Redis 큐 이름.
-   `LOG_LEVEL`: 로그 출력 레벨 (기본값: `INFO`).
-   `JPEG_QUALITY`: 이미지 형식 변환 시 사용할 JPEG 압축 품질.
-   **백프레셔 제어 변수**:
    -   `MAX_CONCURRENT_DOWNLOADS`: 동시에 처리할 수 있는 최대 다운로드 수. (기본값: `3`)
    -   `MAX_PENDING_IMAGES`: 시스템이 수용할 수 있는 최대 작업 부하(다운로드 중 + OCR 대기). 이 값을 초과하면 신규 작업 수신을 중단합니다. (기본값: `1`)
    -   `DOWNLOAD_COOLDOWN`: 과부하 시 신규 작업 수신을 중단하고 휴식할 시간(초). (기본값: `3`)

### `core/redis_client.py`

워커 전체에서 사용될 Redis 클라이언트 연결을 관리합니다.

-   `initialize_redis()`: 워커 시작 시 호출되어 Redis 연결 풀을 생성합니다.
-   `get_redis_client()`: 초기화된 Redis 클라이언트 객체를 반환합니다.
-   `close_redis()`: 워커 종료 시 호출되어 Redis 연결을 정상적으로 닫습니다.
-   모듈 스코프에서 단일 클라이언트(`_redis_client`)를 유지하여 애플리케이션 전체에서 동일한 연결 풀을 공유합니다.
