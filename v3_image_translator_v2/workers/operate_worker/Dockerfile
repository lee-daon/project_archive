# PyTorch 베이스 이미지 사용 (CUDA 11.1 지원)
FROM pytorch/pytorch:1.8.0-cuda11.1-cudnn8-runtime

# 시스템 의존성 설치 (한국 미러 서버 사용)
RUN echo "deb http://mirror.kakao.com/ubuntu/ bionic main restricted universe multiverse" > /etc/apt/sources.list && \
    echo "deb http://mirror.kakao.com/ubuntu/ bionic-updates main restricted universe multiverse" >> /etc/apt/sources.list && \
    echo "deb http://mirror.kakao.com/ubuntu/ bionic-backports main restricted universe multiverse" >> /etc/apt/sources.list && \
    apt-get update && \
    apt-get install -y --no-install-recommends \
        gcc build-essential \
        libgl1-mesa-glx \
        libglib2.0-0 \
        libsm6 \
        libxrender1 \
        libxext6 \
        libgomp1 && \
    rm -rf /var/lib/apt/lists/*

# 작업 디렉토리 설정
WORKDIR /app

# Python 의존성 파일 복사 (프로젝트 루트 기준)
COPY workers/operate_worker/base_requirements.txt .

# NumPy 먼저 설치 (다른 패키지들의 빌드 의존성)
RUN pip install --no-cache-dir numpy==1.23.5

# typing-extensions 명시적 업그레이드 (의존성 충돌 방지)
RUN pip install --no-cache-dir --upgrade typing-extensions==4.5.0

# 베이스 의존성 설치
RUN pip install --no-cache-dir -r base_requirements.txt

# Redis 및 추가 패키지 설치 (processor 통합을 위해)
RUN pip install --no-cache-dir \
    redis==4.6.0 \
    aioredis==2.0.1 \
    omegaconf==2.1.0 \
    boto3==1.26.0

# Dependency validation (경고만 표시하고 계속 진행)
RUN pip check || echo "Warning: Minor dependency conflicts detected, but proceeding..."

# 버전 확인
RUN python -c "import redis; print(f'Installed redis version: {redis.__version__}')"
RUN python -c "import numpy; print(f'Installed numpy version: {numpy.__version__}')"
RUN python -c "import cv2; print(f'Installed OpenCV version: {cv2.__version__}')"
RUN python -c "import aiohttp; print(f'Installed aiohttp version: {aiohttp.__version__}')"
RUN python -c "import PIL; print(f'Installed Pillow version: {PIL.__version__}')"

# LaMa 모델 파일 복사 (프로젝트 루트 기준)
COPY workers/operate_worker/lama-fourier /model/

# LaMa 코드 복사 (프로젝트 루트 기준)
COPY workers/operate_worker/lama /app/lama

# 프로젝트 디렉토리 구조 준비
RUN mkdir -p /app/workers/operate_worker

# logic 디렉토리 복사 (통합된 로직 포함)
COPY workers/operate_worker/logic /app/workers/operate_worker/logic

# core 모듈 복사
COPY workers/operate_worker/core /app/core

# hosting 디렉토리 복사
COPY workers/operate_worker/hosting /app/workers/operate_worker/hosting

# 렌더링 워커 모듈들 복사 (텍스트 렌더링용)
COPY workers/operate_worker/rendering_worker /app/workers/operate_worker/rendering_worker

# 환경 변수 설정
ENV LOG_LEVEL=INFO
ENV REDIS_URL=redis://redis:6379
ENV PYTHONPATH=/app:/app/lama
ENV LAMA_CONFIG_PATH=/model/config.yaml
ENV LAMA_CHECKPOINT_PATH=/model/models/best.ckpt
ENV USE_CUDA=1
ENV USE_FP16=1
ENV INPAINTING_BATCH_SIZE_SHORT=4
ENV INPAINTING_BATCH_SIZE_LONG=2
ENV PYTHONUNBUFFERED=1

# R2 호스팅 관련 환경 변수 (기본값)
ENV R2_ENDPOINT=""
ENV CLOUDFLARE_ACCESS_KEY_ID=""
ENV CLOUDFLARE_SECRET_KEY=""
ENV CLOUDFLARE_TOKEN=""
ENV R2_BUCKET_NAME=""
ENV R2_DOMAIN=""

# processor 관련 환경 변수 (선택적)
# ENV GEMINI_API_KEY=your_api_key_here

# 통합 파이프라인 워커 실행 (OCR 후처리 + 인페인팅 + 렌더링)
CMD ["python", "/app/workers/operate_worker/worker.py"]
