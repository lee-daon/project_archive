import os

# Redis 설정
REDIS_URL = os.environ.get("REDIS_URL")
OCR_TASK_QUEUE = "img:translate:tasks"
OCR_RESULT_QUEUE = "ocr:results"  # 내부 통신용 유지
ERROR_QUEUE = "img:translate:error" 

# 로깅 설정
LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO").upper()

# 공유 메모리 설정 (OCR Worker에서는 이미지 다운로드 시에만 사용)
SHM_NAME_PREFIX = "img_shm_"

# 이미지 처리 설정
JPEG_QUALITY = int(os.environ.get("JPEG_QUALITY", "95"))  # JPEG 변환 품질 

# 비동기 처리 제어 설정
MAX_CONCURRENT_DOWNLOADS = int(os.environ.get("MAX_CONCURRENT_DOWNLOADS", "5"))  # 동시 다운로드 최대 개수
MAX_PENDING_IMAGES = int(os.environ.get("MAX_PENDING_IMAGES", "10"))  # 대기 이미지 최대 개수
DOWNLOAD_COOLDOWN = int(os.environ.get("DOWNLOAD_COOLDOWN", "3"))  # 대기 이미지가 최대치일 때 휴식 시간(초) 