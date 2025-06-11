import os

# Redis 설정
REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379")
OCR_TASK_QUEUE = "ocr:tasks"
OCR_RESULT_QUEUE = "ocr:results" 
FINAL_RESULT_PREFIX = "result:"

# 공유 메모리 설정
# 공유 메모리 이름에 사용할 접두사 (프로세스 간 충돌 방지)
SHM_NAME_PREFIX = "img_shm_"

# 서버 설정
API_HOST = os.environ.get("API_HOST", "0.0.0.0")
API_PORT = int(os.environ.get("API_PORT", 8000))

# 로깅 설정 (main.py에서도 설정하지만, 여기서 기본값 관리 가능)
LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO").upper()

# === Processor Worker 설정 ===
# 입력 큐 (OCR 결과를 받는 큐)
PROCESSOR_TASK_QUEUE = "ocr:results"

# --- 출력 대상 ---
# OCR 결과가 비었을 때 전달될 큐
HOSTING_TASKS_QUEUE = "hosting:tasks"
# 긴 이미지 Inpainting 작업 큐
INPAINTING_LONG_TASKS_QUEUE = "inpainting:longtasks"
# 짧은 이미지 Inpainting 작업 큐
INPAINTING_SHORT_TASKS_QUEUE = "inpainting:shorttasks"
# Rendering 결과 저장용 Redis Hash 키 접두사 (Request ID별 저장) -> 번역 결과 저장용으로 변경
TRANSLATE_TEXT_RESULT_HASH_PREFIX = "translate_text_result:"

# === 번역 API (임시 목업 설정) ===
# 목업 번역 API 호출 시 인위적인 지연 시간 (초)
MOCK_TRANSLATION_DELAY = 0.2

# === 마스크 생성 설정 ===
# 텍스트 영역 주변 패딩 픽셀 수
MASK_PADDING_PIXELS = int(os.environ.get("MASK_PADDING_PIXELS", "1"))

# === Inpainting Worker 설정 ===
# 인페인팅 배치 크기 - 짧은 이미지와 긴 이미지 구분
INPAINTING_BATCH_SIZE_SHORT = int(os.environ.get("INPAINTING_BATCH_SIZE_SHORT", "4"))
INPAINTING_BATCH_SIZE_LONG = int(os.environ.get("INPAINTING_BATCH_SIZE_LONG", "4"))
# 기존 배치 크기 설정은 유지 (하위 호환성)
INPAINTING_BATCH_SIZE = int(os.environ.get("INPAINTING_BATCH_SIZE", "4"))
# 긴 이미지 목표 크기 (높이, 너비)
INPAINTING_LONG_SIZE = (864, 1504)
# 짧은 이미지 목표 크기 (높이, 너비)
INPAINTING_SHORT_SIZE = (1024, 1024)
# LaMa 추론 작업 큐 (전처리 워커 -> 인페인팅 워커)
LAMA_INFERENCE_LONG_TASKS_QUEUE = "lama_inference:longtasks"
LAMA_INFERENCE_SHORT_TASKS_QUEUE = "lama_inference:shorttasks"
# LaMa 모델 설정 경로 (Docker 환경 기준)
LAMA_CONFIG_PATH = os.environ.get("LAMA_CONFIG_PATH", "/app/lama/big-lama/config.yaml")
# LaMa 체크포인트 경로 (Docker 환경 기준)
LAMA_CHECKPOINT_PATH = os.environ.get("LAMA_CHECKPOINT_PATH", "/app/lama/big-lama/models/best.ckpt")
# CUDA 사용 여부
USE_CUDA = os.environ.get("USE_CUDA", "1") == "1"
# FP16 (반정밀도) 추론 사용 여부
USE_FP16 = os.environ.get("USE_FP16", "1") == "1"

# === Rendering Worker 설정 ===
# 렌더링 작업 큐 이름
RENDERING_TASKS_QUEUE = os.environ.get("RENDERING_TASKS_QUEUE", "rendering_tasks")
# 렌더링 결과 저장용 Redis Hash 키 접두사
RENDERING_RESULT_HASH_PREFIX = "rendering_result:"
# 출력 이미지 저장 디렉토리
RENDERING_OUTPUT_DIR = os.environ.get("RENDERING_OUTPUT_DIR", "output")

# 메인, 옵션 이미지 리사이즈 크기
RESIZE_TARGET_SIZE = (1000, 1000)
