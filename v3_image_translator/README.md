# V3 Image Translation Pipeline (Archived)

## 시연 예제
**데모 영상**: [https://pub-e396b742f1ae46678c7a5692530400d7.r2.dev/example1.mp4](https://pub-e396b742f1ae46678c7a5692530400d7.r2.dev/example1.mp4)

## 프로젝트 개요

GPU VM 환경에서 Docker 컨테이너 기반 병렬 처리를 통해 이미지 번역 파이프라인을 구현한 프로젝트입니다. 
Redis 큐-워커 패턴을 활용하여 OCR, 번역, Inpainting, 렌더링 작업을 독립적인 워커들이 병렬로 처리하도록 설계되었습니다.

## 아카이빙 사유

- **비용 문제**: GPU VM 운영 비용이 과도하게 높음
- **아키텍처 전환**: 서버리스 GPU 솔루션으로 전환 결정
- **유지보수 부담**: 다중 컨테이너 환경의 복잡성

## 주요 특징

### Docker 기반 마이크로서비스 아키텍처
- **컨테이너 격리**: CUDA 버전 충돌 문제 해결 (OCR ↔ LaMa 모델)
- **독립적 확장**: 병목 워커 개별 스케일링 가능
- **공유 메모리**: 컨테이너 간 대용량 이미지 데이터 효율적 전달

### 병렬 처리 최적화
- **비동기 큐**: Redis RPUSH/BLPOP 기반 선입선출 작업 처리
- **GPU/CPU 분리**: 전처리(CPU) ↔ 추론(GPU) 작업 분리
- **배치 처리**: 동일 유형 작업 그룹화로 GPU 활용률 향상

### 성능 개선 시도
- **FP16 연산**: OCR 및 LaMa 모델 추론 속도 향상
- **공유 메모리**: IPC 오버헤드 최소화
- **중간 결과 저장**: Redis Hash를 통한 결과 캐싱

## 시스템 구성

```
API Server → OCR Worker → Processor → Preprocessing → Inpainting → Result Checker → Rendering → Return
     ↓           ↓            ↓           ↓             ↓              ↓             ↓         ↓
   FastAPI   PaddleOCR   Gemini API   Bilateral   LaMa Model   Redis Hash   PIL+Text   결과 반환
```

## 성능 지표

**RTX 4050 환경**: 23장 처리 시 약 25초 소요 (첫 번째 결과까지 6초)

## 기술 스택

- **Container**: Docker, Docker Compose
- **Queue**: Redis
- **API**: FastAPI
- **OCR**: PaddleOCR (SVTR_LCNet)
- **Translation**: Google Gemini API
- **Inpainting**: LaMa (Fast Fourier Convolution)
- **GPU**: NVIDIA CUDA, FP16 최적화

## 실행 방법

### 1. 사전 준비

**LaMa 모델 다운로드:**
1. [LaMa 모델 링크](https://drive.google.com/drive/folders/1B2x7eQDgecTL0oh3LSIBDGj0fTxs6Ips)에서 `LaMa_models.zip` 다운로드
2. 압축 해제 후 `lama-fourier` 폴더를 프로젝트의 기존 `lama-fourier` 폴더 위치에 교체

**환경 설정:**
```bash
# .env 파일 생성
cp .env.example .env
```

**.env 파일 내용:**
```env
# 이미지 품질 설정
JPEG_QUALITY=80

# 내부 API 설정
INTERNAL_API_KEY=dwkjwguybds
AIN_API_URL=http://host.docker.internal:3000/prc/imgtranslation

# Gemini API 키 (실제 키로 교체 필요)
GEMINI_API_KEY=AIzaSyC-your-actual-gemini-api-key-here
```

### 2. 시스템 시작

```bash
# 전체 Docker 서비스 빌드 및 시작
docker compose up --build

# 백그라운드 실행의 경우
docker compose up --build -d
```

### 3. 테스트 실행

```bash
# 시뮬레이션 스크립트로 테스트 (별도 터미널)
python tests/integration/simulation.py

```

### 4. API 엔드포인트 (콜백형식으로 만든 프로젝트를 아카이빙 하는 과정입니다.)

```bash
# 이미지 번역 요청
POST http://localhost:8000/translate

# 실시간 결과 스트리밍
GET http://localhost:8000/stream-result/{request_id}
```

### 5. 모니터링 및 디버깅

```bash
# Redis 큐 상태 확인
docker exec image_translate_pipeline-redis-1 redis-cli LRANGE ocr:results 0 10

# 큐 크기 확인
docker exec image_translate_pipeline-redis-1 redis-cli LLEN ocr:results

# GPU 사용량 모니터링
nvidia-smi dmon -s u

# 큐 초기화 (필요시)
docker exec image_translate_pipeline-redis-1 redis-cli DEL ocr:tasks
```

### 6. 서비스 중지

```bash
# 전체 서비스 중지
docker-compose down

# 특정 워커만 재시작
docker-compose up rendering_worker
```

## 한계 및 개선점

### 비용 이슈
- GPU VM 24시간 운영 비용 과다
- 서버리스 GPU(Runpod, Modal)로 전환환

### 기술적 복잡성
- 7개 독립 컨테이너 간 상태 관리 복잡
- 공유 메모리 동기화 이슈
- 디버깅 및 모니터링 어려움

### 확장성 제한
- 단일 GPU VM 스케일링 한계
- 워커 간 의존성으로 인한 지연 전파

## 향후 방향

서버리스 GPU 기반 단순화된 아키텍처로 전환하여 비용 효율성과 유지보수성을 개선할 예정입니다.

---
*이 프로젝트는 학습 목적으로 아카이빙되었습니다.*
