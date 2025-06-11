# Base Python image
FROM python:3.10

# Set working directory
WORKDIR /app

# Install system dependencies required by OpenCV
# (Debian/Ubuntu based image)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx \
    libglib2.0-0 \
 && rm -rf /var/lib/apt/lists/*

# Copy requirements file - 주석 유지
# COPY ./workers/processor/requirements.txt /app/requirements.txt

# 기존 redis 제거 (선택 사항)
# RUN pip uninstall -y redis || true

# Install Python dependencies - redis 버전 고정 및 다른 패키지
RUN pip install --no-cache-dir "redis==4.6.0" numpy>=1.20.0 opencv-python-headless>=4.5.0

# 추가: aiohttp 설치
RUN pip install --no-cache-dir aiohttp

# ---> 추가: 의존성 검사 <---
RUN pip check

# 설치된 redis 버전 확인
RUN python -c "import redis; print(f'Installed redis version: {redis.__version__}')"

# ---> 추가: asyncio 디렉토리 확인 <---
RUN echo "Checking for redis/asyncio directory..." && \
    ls /usr/local/lib/python3.10/site-packages/redis/asyncio && \
    echo "redis/asyncio directory found." || \
    echo "redis/asyncio directory NOT found!"
# -----------------------------------

# Copy the core module and the worker script
COPY ./core /app/core
COPY ./workers/processor/worker.py /app/worker.py

# Set environment variables (optional, can be overridden in docker-compose)
ENV PYTHONUNBUFFERED=1
ENV LOG_LEVEL=INFO
ENV REDIS_URL=redis://redis:6379

# Command to run the worker
# Note: sys.path manipulation might be unnecessary now due to WORKDIR and COPY structure
CMD ["python", "/app/worker.py"]
