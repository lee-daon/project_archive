FROM python:3.9-slim

WORKDIR /app

# 필요한 Python 패키지 설치
COPY ./workers/result_checker/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 코어 모듈 및 워커 코드 복사
COPY ./workers/result_checker/worker.py .
COPY ./core /app/core

# 환경 변수 설정
ENV PYTHONPATH=/app

# 워커 실행
CMD ["python", "worker.py"] 