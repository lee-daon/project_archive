# PyTorch 공식 이미지를 기반으로 합니다.
FROM pytorch/pytorch:1.8.0-cuda11.1-cudnn8-devel

# 작업 디렉토리 설정
WORKDIR /workspace

# 기본 시스템 패키지 설치 (NVIDIA 저장소 제외)
RUN sed -i '/developer.download.nvidia.com/d' /etc/apt/sources.list.d/cuda.list && \
    sed -i '/developer.download.nvidia.com/d' /etc/apt/sources.list.d/nvidia-ml.list && \
    apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx \
    libsm6 \
    libxext6 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# requirements.txt 복사
COPY requirements.txt .

# 현재 디렉토리의 모든 내용을 WORKDIR로 복사
COPY . .

# pip 업그레이드 및 의존성 설치
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# 컨테이너 실행 시 실행될 기본 명령어
CMD ["python", "worker.py"] 