# Inpainting Worker (통합 버전)

이 워커는 이미지 번역 파이프라인의 인페인팅 단계를 담당하는 **완전 통합된 버전**입니다. LaMa 베이스 이미지 설정이 없어도 독립적으로 작동할 수 있도록 모든 필요한 구성 요소가 포함되어 있습니다.

## 통합된 구성 요소

- **LaMa 모델 및 가중치**: `lama-fourier/` 디렉토리에 포함
- **LaMa 추론 코드**: `lama/` 디렉토리에 포함  
- **모든 Python 의존성**: `base_requirements.txt`에 정의
- **Docker 환경**: PyTorch 1.8.0 + CUDA 11.1 베이스 이미지 사용

## 주요 기능

1.  **입력 수신 (Receive Input):** 두 개의 Redis 큐, `lama_inference:longtasks` (`LAMA_INFERENCE_LONG_TASKS_QUEUE` 설정값)와 `lama_inference:shorttasks` (`LAMA_INFERENCE_SHORT_TASKS_QUEUE` 설정값)에서 작업을 `BLPOP` 방식으로 가져옵니다. 두 큐를 번갈아 확인합니다. 입력 데이터 형식은 다음과 같습니다:
    ```json
    {
        "request_id": "unique-request-id",
        "image_id": "image-filename.jpg",
        "original_size": [height, width],
        "padding_info": [pad_top, pad_right, pad_bottom, pad_left],
        "preprocessed_img_shm_info": { "shm_name": "...", "shape": [...], "dtype": "...", "size": ... },
        "preprocessed_mask_shm_info": { "shm_name": "...", "shape": [...], "dtype": "...", "size": ... },
        "is_long": true/false
    }
    ```

2.  **배치 처리 (Batch Processing):** 작업을 큐 유형(long/short)에 따라 지정된 크기(`INPAINTING_BATCH_SIZE_LONG` 또는 `INPAINTING_BATCH_SIZE_SHORT` 설정값)의 배치로 수집합니다. 동일한 유형의 작업만 배치로 처리하여 효율성을 높입니다.

3.  **LaMa 모델 추론 (LaMa Model Inference):** 전처리된 이미지와 마스크 배치를 사용하여 통합된 LaMa 모델(`lama.bin.inference.batch_inference`)로 인페인팅 추론을 수행합니다. GPU 가속(`USE_CUDA`)과 FP16 최적화(`USE_FP16`)를 적용하여 성능을 최대화합니다.

4.  **결과 후처리 (Result Postprocessing):** 추론 결과 각각에 대해 다음을 수행합니다:
    *   패딩을 제거하고 원본 이미지 크기로 복원합니다 (`restore_from_padding` 함수 사용).
    *   결과 이미지를 RGB에서 BGR 형식으로 다시 변환합니다.

5.  **결과 저장 (Save Result):**
    *   최종 인페인팅된 이미지를 새로운 공유 메모리 세그먼트에 저장합니다.
    *   결과 데이터를 Redis Hash(`inpainting_result:{request_id}`)에 저장합니다.
    *   전처리된 이미지와 마스크의 공유 메모리를 정리합니다.

6.  **성능 로깅 (Performance Logging):** 배치 처리 시간(총 시간, 추론 시간, 후처리 시간)을 로깅하여 성능을 모니터링합니다.

## Docker 빌드 및 실행

### 이미지 빌드
```bash
# inpainting_worker 디렉토리에서 실행
docker build -t inpainting-worker .
```

### 컨테이너 실행
```bash
docker run -it --rm --gpus all \
  --name inpainting-worker-container \
  -v /path/to/core:/app/core \
  -v /path/to/worker.py:/app/workers/inpainting_worker/worker.py \
  inpainting-worker
```

## 의존성

모든 의존성이 Docker 이미지에 포함되어 있습니다:
*   PyTorch 1.8.0 (CUDA 11.1 지원)
*   NumPy, OpenCV, scikit-image 등 (베이스 의존성)
*   Redis 클라이언트 (redis-py, aioredis)
*   LaMa 관련 의존성 (PyTorch Lightning, Hydra 등)

## 설정

*   주요 설정은 `core/config.py` 파일에서 관리됩니다.
*   **주요 설정값:**
    *   Redis 연결 정보 및 큐 이름 (`LAMA_INFERENCE_LONG_TASKS_QUEUE`, `LAMA_INFERENCE_SHORT_TASKS_QUEUE`)
    *   처리 배치 크기 (`INPAINTING_BATCH_SIZE_LONG`, `INPAINTING_BATCH_SIZE_SHORT`)
    *   LaMa 모델 설정 파일 및 체크포인트 경로 (`LAMA_CONFIG_PATH=/model/config.yaml`, `LAMA_CHECKPOINT_PATH=/model/best.ckpt`)
    *   하드웨어 가속 옵션 (`USE_CUDA`, `USE_FP16`)
    *   로그 레벨 (`LOG_LEVEL`)

## 디렉토리 구조

```
workers/inpainting_worker/
├── Dockerfile                    # 통합된 Docker 설정
├── base_requirements.txt         # Python 의존성
├── worker.py                     # 메인 워커 코드
├── Readme.md                     # 이 파일
├── lama-fourier/                 # LaMa 모델 파일
│   ├── config.yaml
│   └── models/
│       ├── best.ckpt
│       └── last.ckpt
└── lama/                         # LaMa 추론 코드
    ├── bin/
    │   └── inference.py
    └── saicinpainting/
        └── ...
```

## 실행

*   Redis 서버가 실행 중이고 접근 가능해야 합니다.
*   Docker Compose를 사용하거나 직접 Docker 컨테이너를 실행하여 워커를 시작할 수 있습니다.

```bash
# 직접 실행 예시 (프로젝트 루트 디렉토리에서)
python workers/inpainting_worker/worker.py
```

이 통합 버전은 `lama_base_image_setup` 없이도 완전히 독립적으로 작동합니다.
