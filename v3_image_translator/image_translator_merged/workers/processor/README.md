# Processor Worker

이 워커는 이미지 번역 파이프라인의 세 번째 단계로, OCR 워커로부터 처리된 결과를 받아 후속 작업을 위해 데이터를 가공하고 분배하는 역할을 합니다.

## 주요 기능

1.  **입력 수신:** Redis의 `ocr:results` 큐(`PROCESSOR_TASK_QUEUE` 설정값)에서 OCR 처리 결과를 `BLPOP` 방식으로 가져옵니다. 입력 데이터 형식은 아래와 같습니다:
    ```json
    {
        "request_id": "unique-request-id",
        "image_id": "image-filename.jpg",
        "is_long": true, // 또는 false
        "shm_info": { "shm_name": "...", "shape": [...], "dtype": "...", "size": ... },
        "ocr_result": [ /* PaddleOCR 결과 리스트 */ ]
    }
    ```
2.  **빈 OCR 결과 처리:** `ocr_result`가 비어있는 경우, 해당 요청 정보를 `hosting:tasks` 큐(`HOSTING_TASKS_QUEUE` 설정값)로 전달하여 다른 처리를 하도록 합니다.
3.  **(선택적) 중국어 필터링:**`ONLY_CHINESE_FILTER`가 `true`로 설정된 경우, `ocr_result`에서 중국어가 포함되지 않은 텍스트 항목을 필터링합니다.
4.  **마스크 생성:** 필터링된 OCR 결과의 바운딩 박스 정보를 사용하여 OpenCV를 통해 이미지 마스크(흰색 전경, 검은색 배경)를 생성합니다.
5.  **마스크 공유 메모리 저장:** 생성된 마스크를 공유 메모리에 저장하고, 해당 `shm_info` (이름, 모양, 타입 등)를 얻습니다. (`core.shm_manager.create_shm_from_array` 필요)
6.  **Inpainting 작업 큐잉:** 원본 이미지 SHM 정보와 마스크 SHM 정보를 포함한 작업을 Inpainting 워커 큐로 보냅니다. 이미지의 `is_long` 값에 따라 `inpainting:longtasks` 또는 `inpainting:shorttasks` 큐(`INPAINTING_LONG_TASKS_QUEUE`, `INPAINTING_SHORT_TASKS_QUEUE` 설정값)로 분배됩니다.
7.  **(목업) 번역 API 호출:** 원본 OCR 결과에서 텍스트만 추출하여 목업 번역 API(`call_translation_api`)를 비동기적으로 호출합니다. (현재는 입력 텍스트를 그대로 반환)
8.  **번역 결과 및 렌더링 데이터 저장:** 번역된 텍스트, 원본 바운딩 박스, 원본 글자 수 정보를 조합하여 `translate_result` 배열을 생성합니다. 이 데이터를 포함한 렌더링에 필요한 정보를 Redis Hash에 저장합니다. 키는 `translate_text_result:{request_id}` (`TRANSLATE_TEXT_RESULT_HASH_PREFIX` 설정값) 형식을 사용합니다.

## 의존성

*   Python 3.8+
*   redis-py (asyncio 지원 버전 4.2+ 권장)
*   NumPy
*   OpenCV (opencv-python 또는 opencv-python-headless)
*   `core` 모듈 (`config.py`, `shm_manager.py`)

`requirements.txt` 파일을 참조하여 필요한 라이브러리를 설치하세요.

## 설정

필요한 설정값(Redis URL, 큐 이름, 필터링 여부 등)은 `core/config.py` 파일에서 관리됩니다. 일부 설정은 환경 변수를 통해 오버라이드될 수 있습니다.

## 실행

Docker Compose를 사용하거나 직접 Python 스크립트를 실행하여 워커를 시작할 수 있습니다.

```bash
# 직접 실행 예시 (프로젝트 루트에서)
python workers/processor/worker.py
```

실행 전 Redis 서버가 실행 중이고 접근 가능한지 확인해야 합니다. 또한 `core.shm_manager` 모듈에 필요한 함수 (`get_array_from_shm`, `create_shm_from_array`)가 구현되어 있어야 합니다.
