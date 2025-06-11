FROM python:3.9-slim

# 시스템 패키지 업데이트 및 필요한 라이브러리 설치
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# 작업 디렉토리 설정
WORKDIR /app

# requirements.txt 먼저 복사하여 Docker 캐시 활용
COPY requirements.txt .

# Python 패키지 설치
RUN pip install --no-cache-dir -r requirements.txt

# u2net 모델 파일 복사 (캐시된 모델 사용을 위해)
RUN mkdir -p /root/.u2net
COPY u2net.onnx /root/.u2net/u2net.onnx

# 애플리케이션 파일들 복사
COPY app.py .

# Cloud Run은 PORT 환경변수를 자동으로 설정하므로 EXPOSE 제거
# (Cloud Run이 동적으로 포트를 할당함)

# 프로덕션용 서버 실행
CMD ["python", "app.py"]