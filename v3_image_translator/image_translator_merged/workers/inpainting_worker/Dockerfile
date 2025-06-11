# PyTorch 베이스 이미지 사용 (CUDA 11.1 지원)
FROM pytorch/pytorch:1.8.0-cuda11.1-cudnn8-runtime

# 시스템 의존성 설치 (한국 미러 서버 사용)
RUN echo "deb http://mirror.kakao.com/ubuntu/ bionic main restricted universe multiverse" > /etc/apt/sources.list && \
    echo "deb http://mirror.kakao.com/ubuntu/ bionic-updates main restricted universe multiverse" >> /etc/apt/sources.list && \
    echo "deb http://mirror.kakao.com/ubuntu/ bionic-backports main restricted universe multiverse" >> /etc/apt/sources.list && \
    apt-get update && \
    apt-get install -y --no-install-recommends gcc build-essential libgl1-mesa-glx libglib2.0-0 && \
    rm -rf /var/lib/apt/lists/*

# 작업 디렉토리 설정
WORKDIR /app

# Python 의존성 파일 복사 (프로젝트 루트 기준)
COPY workers/inpainting_worker/base_requirements.txt .

# NumPy 먼저 설치 (다른 패키지들의 빌드 의존성)
RUN pip install --no-cache-dir numpy==1.23.5

# 베이스 의존성 설치
RUN pip install --no-cache-dir -r base_requirements.txt

# Redis 관련 추가 패키지 설치
RUN pip install --no-cache-dir redis>=4.2.0 aioredis>=2.0.1 omegaconf>=2.1.0

# LaMa 모델 파일 복사 (프로젝트 루트 기준)
COPY workers/inpainting_worker/lama-fourier /model/

# LaMa 코드 복사 (프로젝트 루트 기준)
COPY workers/inpainting_worker/lama /app/lama

# 프로젝트 디렉토리 구조 준비
RUN mkdir -p /app/core /app/workers/inpainting_worker

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

# 컨테이너 시작 시 실행할 명령
CMD ["python", "/app/workers/inpainting_worker/worker.py"]
