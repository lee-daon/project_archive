FROM paddlepaddle/paddle:3.0.0-gpu-cuda11.8-cudnn8.9-trt8.6

ENV NVIDIA_VISIBLE_DEVICES=all
ENV NVIDIA_DRIVER_CAPABILITIES=compute,utility
ENV LD_LIBRARY_PATH=/usr/local/cuda/lib64:/usr/local/cuda/extras/CUPTI/lib64:$LD_LIBRARY_PATH

WORKDIR /app

# 시스템 패키지 업데이트 및 필요한 라이브러리 설치 (한국 미러 서버 사용)
RUN echo "deb http://mirror.kakao.com/ubuntu/ focal main restricted universe multiverse" > /etc/apt/sources.list && \
    echo "deb http://mirror.kakao.com/ubuntu/ focal-updates main restricted universe multiverse" >> /etc/apt/sources.list && \
    echo "deb http://mirror.kakao.com/ubuntu/ focal-backports main restricted universe multiverse" >> /etc/apt/sources.list && \
    apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Python 패키지 업그레이드
RUN pip install --upgrade pip

# NumPy 버전 호환성 문제 해결을 위해 호환되는 버전 설치
RUN pip install "numpy>=1.19.0,<1.25.0"

# OpenCV 호환 버전 설치
RUN pip install opencv-python-headless==4.8.1.78

# PaddleOCR 2.x 버전 설치 (NumPy 버전 지정 후)
RUN pip install paddleocr==2.7.3

# 추가 필요한 패키지들 설치
RUN pip install \
    Pillow \
    shapely

# requirements.txt 복사 및 의존성 설치
COPY ./workers/ocr_worker/requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# OCR Worker 내부 core 모듈 복사
COPY ./workers/ocr_worker/core /app/core

# 워커 코드 복사
COPY ./workers/ocr_worker/worker.py /app/

# PaddleOCR 모델 다운로드를 위한 디렉토리 생성
RUN mkdir -p /root/.paddleocr/whl

# 사용할 모델들을 컨테이너에 복사
COPY ./workers/ocr_worker/models/PP-OCRv3_mobile_rec_infer /root/.paddleocr/whl/rec/ch/ch_PP-OCRv3_rec_infer
COPY ./workers/ocr_worker/models/PP-OCRv4_mobile_det_infer /root/.paddleocr/whl/det/ch/ch_PP-OCRv4_det_infer

# 워커 실행
CMD ["python", "worker.py"]
