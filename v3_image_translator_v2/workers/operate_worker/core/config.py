import os

# Redis 설정
REDIS_URL = os.environ.get("REDIS_URL")

# 공유 메모리 설정
SHM_NAME_PREFIX = "img_shm_"

# 로깅 설정
LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO").upper()

# === Worker 공통 설정 ===
# CPU 집약적 작업을 처리할 스레드 수 (시스템 코어 수에 맞춰 조절)
CPU_WORKER_COUNT = int(os.environ.get("CPU_WORKER_COUNT", "16"))

# === Inpainting Worker 설정 ===
# 입력 큐 (OCR 결과를 받는 큐)
PROCESSOR_TASK_QUEUE = "ocr:results"
# 성공 결과를 전달하는 큐
SUCCESS_QUEUE = "img:translate:success"
# 에러 결과를 전달하는 큐
ERROR_QUEUE = "img:translate:error"
# 레거시 호환성을 위한 별칭
HOSTING_TASKS_QUEUE = SUCCESS_QUEUE
# 번역 결과 저장용 Redis Hash 키 접두사
TRANSLATE_TEXT_RESULT_HASH_PREFIX = "translate_text_result:"

# 텍스트 영역 주변 패딩 픽셀 수
MASK_PADDING_PIXELS = int(os.environ.get("MASK_PADDING_PIXELS", "1"))

# 인페인팅 배치 크기 - 짧은/긴 이미지 구분
INPAINTING_BATCH_SIZE_SHORT = int(os.environ.get("INPAINTING_BATCH_SIZE_SHORT", "4"))
INPAINTING_BATCH_SIZE_LONG = int(os.environ.get("INPAINTING_BATCH_SIZE_LONG", "4"))
# 긴 이미지 목표 크기 (높이, 너비)
INPAINTING_LONG_SIZE = (864, 1504)
# 짧은 이미지 목표 크기 (높이, 너비)
INPAINTING_SHORT_SIZE = (1024, 1024)

# === 동시성 제어 설정 ===
# 동시에 처리할 수 있는 최대 작업 수
MAX_CONCURRENT_TASKS = int(os.environ.get("MAX_CONCURRENT_TASKS", "100"))
# 동시에 처리할 최대 후처리 작업 수
MAX_POSTPROCESS_TASKS = int(os.environ.get("MAX_POSTPROCESS_TASKS", "100"))

# === 큐 크기 설정 ===
# 인퍼런스 큐 최대 크기 (짧은/긴 이미지)
INFERENCE_QUEUE_SIZE_SHORT = int(os.environ.get("INFERENCE_QUEUE_SIZE_SHORT", "30"))
INFERENCE_QUEUE_SIZE_LONG = int(os.environ.get("INFERENCE_QUEUE_SIZE_LONG", "30"))
# 후처리 큐 최대 크기
POSTPROCESSING_QUEUE_SIZE = int(os.environ.get("POSTPROCESSING_QUEUE_SIZE", "50"))

# === 타임아웃 설정 ===
# 큐에서 작업을 가져올 때 타임아웃 (초)
QUEUE_GET_TIMEOUT = float(os.environ.get("QUEUE_GET_TIMEOUT", "2.0"))
# 후처리 큐 타임아웃 (초)
POSTPROCESS_QUEUE_TIMEOUT = float(os.environ.get("POSTPROCESS_QUEUE_TIMEOUT", "2.0"))
# 배치 수집 타임아웃 (초)
BATCH_COLLECT_TIMEOUT = float(os.environ.get("BATCH_COLLECT_TIMEOUT", "0.1"))

# === Rendering Worker 설정 ===
# 렌더링 작업 큐
RENDERING_TASKS_QUEUE = "rendering_tasks"
# 렌더링 결과 저장용 Redis Hash 키 접두사
RENDERING_RESULT_HASH_PREFIX = "rendering_result:"
# 렌더링 결과 이미지 저장 디렉토리
RENDERING_OUTPUT_DIR = os.environ.get("RENDERING_OUTPUT_DIR", "/app/output/rendered")
# 폰트 파일 경로.... 아니 gmarketSansTTFBold.ttf 개미쳤는데?
FONT_PATH = os.environ.get("FONT_PATH", "/app/workers/operate_worker/rendering_worker/modules/fonts/GmarketSansTTFBold.ttf")
# 리사이즈 목표 크기 (높이, 너비) - is_long=false일 때 사용
RESIZE_TARGET_SIZE = (
    int(os.environ.get("RESIZE_TARGET_HEIGHT", "1024")), 
    int(os.environ.get("RESIZE_TARGET_WIDTH", "1024"))
)

# LaMa 모델 경로 설정
LAMA_CONFIG_PATH = os.environ.get("LAMA_CONFIG_PATH", "/app/lama/big-lama/config.yaml")
LAMA_CHECKPOINT_PATH = os.environ.get("LAMA_CHECKPOINT_PATH", "/app/lama/big-lama/models/best.ckpt")

# GPU 설정
USE_CUDA = os.environ.get("USE_CUDA", "1") == "1"
USE_FP16 = os.environ.get("USE_FP16", "1") == "1"

# === HTTP 클라이언트 설정 ===
# 이미지 다운로드 재시도 횟수
IMAGE_DOWNLOAD_MAX_RETRIES = int(os.environ.get("IMAGE_DOWNLOAD_MAX_RETRIES", "3"))
# 재시도 간격 (초)
IMAGE_DOWNLOAD_RETRY_DELAY = int(os.environ.get("IMAGE_DOWNLOAD_RETRY_DELAY", "2"))
