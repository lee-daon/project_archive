# Preprocessing Worker

이 워커는 이미지 번역 파이프라인의 전처리 단계를 담당합니다. Processor 워커로부터 원본 이미지와 마스크를 받아 CPU에서 디노이징, 리사이징, 패딩 등 전처리 작업을 수행한 후, 전처리된 결과를 LaMa 인페인팅 모델의 입력으로 전달합니다.

## 주요 기능

1. **입력 수신 (Receive Input):** 두 개의 Redis 큐, `inpainting:longtasks` (`INPAINTING_LONG_TASKS_QUEUE` 설정값)와 `inpainting:shorttasks` (`INPAINTING_SHORT_TASKS_QUEUE` 설정값)에서 작업을 `BLPOP` 방식으로 가져옵니다. 두 큐를 번갈아 확인합니다. 입력 데이터 형식은 다음과 같습니다:
   ```json
   {
       "request_id": "unique-request-id",
       "image_id": "image-filename.jpg",
       "shm_info": { "shm_name": "...", "shape": [...], "dtype": "...", "size": ... }, // 원본 이미지 공유 메모리 정보
       "mask_shm_info": { "shm_name": "...", "shape": [...], "dtype": "...", "size": ... } // 마스크 공유 메모리 정보
   }
   ```

2. **배치 처리 (Batch Processing):** 작업을 큐 유형(long/short)에 따라 지정된 크기(`INPAINTING_BATCH_SIZE_LONG` 또는 `INPAINTING_BATCH_SIZE_SHORT` 설정값)의 배치로 수집합니다.

3. **이미지 디노이징 (Image Denoising):** 원본 이미지에 Bilateral Filter를 적용하여 노이즈를 제거합니다:
   * `cv2.bilateralFilter`를 사용하여 디테일을 유지하면서 노이즈를 제거
   * 인페인팅 품질 향상을 위한 전처리 단계

4. **이미지 리사이징 및 패딩 (Image Resizing and Padding):**
   * 이미지의 비율을 유지하면서 목표 크기(`INPAINTING_LONG_SIZE` 또는 `INPAINTING_SHORT_SIZE`)로 리사이징
   * 필요한 경우 반사 패딩(reflection padding)을 적용하여 모델 입력 크기를 균일하게 맞춤
   * 패딩 정보를 저장하여 후처리 시 원본 크기 복원에 사용

5. **마스크 전처리 (Mask Preprocessing):**
   * 마스크를 그레이스케일로 변환
   * 이미지와 동일한 방식으로 리사이징 및 패딩 적용

6. **결과 저장 및 큐잉 (Save Result & Enqueue):**
   * 전처리된 이미지와 마스크를 새로운 공유 메모리에 저장
   * 결과 데이터(`request_id`, `image_id`, `original_size`, `padding_info`, `preprocessed_img_shm_info`, `preprocessed_mask_shm_info`, `is_long`)를 `lama_inference:longtasks` 또는 `lama_inference:shorttasks` 큐로 전송
   * 원본 마스크 공유 메모리는 작업 완료 후 정리 (원본 이미지 공유 메모리는 유지)

7. **병렬 처리 (Parallel Processing):** CPU에서 전처리를 수행하여 GPU 자원이 추론에만 집중되도록 함으로써 파이프라인 전체 처리량을 극대화합니다.

## 의존성

* Python 3.8+
* redis-py (asyncio 지원 버전 4.2+ 권장)
* NumPy
* OpenCV (opencv-python 또는 opencv-python-headless)
* `core` 모듈 (`config.py`, `shm_manager.py`, `redis_client.py`)

프로젝트 루트의 `requirements.txt` 파일을 참조하여 필요한 라이브러리를 설치하세요.

## 설정

* 주요 설정은 `core/config.py` 파일에서 관리됩니다.
* **주요 설정값:**
  * Redis 연결 정보 및 큐 이름 (`INPAINTING_LONG_TASKS_QUEUE`, `INPAINTING_SHORT_TASKS_QUEUE`, `LAMA_INFERENCE_LONG_TASKS_QUEUE`, `LAMA_INFERENCE_SHORT_TASKS_QUEUE`)
  * 처리 배치 크기 (`INPAINTING_BATCH_SIZE_LONG`, `INPAINTING_BATCH_SIZE_SHORT`)
  * 인페인팅 모델 입력 크기 (`INPAINTING_LONG_SIZE`, `INPAINTING_SHORT_SIZE`)
  * 로그 레벨 (`LOG_LEVEL`)

## 실행

* Redis 서버가 실행 중이고 접근 가능해야 합니다.
* Docker Compose를 사용하거나 직접 Python 스크립트를 실행하여 워커를 시작할 수 있습니다.

```bash
# 직접 실행 예시 (프로젝트 루트 디렉토리에서)
python workers/preprocessing_worker/worker.py
```

실행 전 `core` 모듈이 Python 경로(`sys.path`)에 포함되어 접근 가능해야 합니다. 스크립트 상단에서 관련 경로를 `sys.path`에 추가하는 로직을 확인하세요.
