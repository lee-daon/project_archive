# Python 버전 지정 (필요시 변경)
FROM python:3.10-slim

# 작업 디렉토리 설정
WORKDIR /app

# 시스템 패키지 업데이트 및 OpenCV 의존성 설치 (선택적)
# RUN apt-get update && apt-get install -y --no-install-recommends \
#     libgl1-mesa-glx libglib2.0-0 \
#     && rm -rf /var/lib/apt/lists/*

# requirements.txt 복사 및 의존성 설치
COPY requirements.txt ./
# --no-cache-dir 옵션으로 이미지 크기 약간 줄이기
RUN pip install --no-cache-dir -r requirements.txt

# 애플리케이션 코드 복사
COPY . .

# 서버 실행 포트 노출
EXPOSE 8000

# uvicorn 서버 실행 (config.py의 API_HOST, API_PORT 사용)
# 프로덕션에서는 gunicorn + uvicorn 워커 사용 권장
# CMD ["gunicorn", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "main:app", "--bind", "0.0.0.0:8000"]
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
