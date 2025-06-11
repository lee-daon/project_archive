FROM python:3.9-slim

WORKDIR /app

# 시스템 의존성 설치
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# 필요한 Python 패키지 설치
COPY ./workers/rendering_worker/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 코어 모듈 및 워커 코드 복사
COPY ./workers/rendering_worker/. /app
COPY ./core /app/core

# 출력 디렉토리 생성
RUN mkdir -p /app/output

# 환경 변수 설정
ENV PYTHONPATH=/app

# 워커 실행
CMD ["python", "worker.py"]
