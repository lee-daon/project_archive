# Return 모듈

이 모듈은 이미지 처리 파이프라인의 마지막 단계를 담당하는 컴포넌트입니다. 처리된 이미지를 로컬 파일로 저장하는 역할을 수행합니다.

## 주요 기능

- Redis 큐에서 호스팅 작업을 가져와 처리
- 공유 메모리(SHM)에서 이미지 데이터 로드
- 로컬 디렉토리에 이미지 파일 저장
- 처리 결과를 JSON 파일로 기록
- 자원 관리 및 정리

## 의존성

필요한 패키지들은 `requirements.txt`에 명시되어 있습니다:

```
opencv-python>=4.8.0
numpy>=1.21.0
python-dotenv>=0.21.0
redis>=4.5.0
```

## 환경 변수 설정

`.env` 파일에 다음 환경 변수들을 설정해야 합니다:

- `OUTPUT_DIR`: 출력 디렉토리 경로 (기본값: ./output/translated)
- `JPEG_QUALITY`: 이미지 품질 (기본값: 80)
- `REDIS_URL`: Redis 서버 URL

## 사용 방법

### 단독 실행

1. 환경 변수 설정
2. 의존성 설치:
   ```bash
   pip install -r requirements.txt
   ```
3. 모듈 실행:
   ```bash
   python returner.py
   ```

### Docker Compose 사용

```bash
# 전체 파이프라인 실행
docker-compose up returner

# 또는 모든 서비스 실행
docker-compose up
```

### Docker 단독 사용

```bash
# 이미지 빌드
docker build -t image-returner -f ./return/dockerfile .

# 컨테이너 실행 (볼륨 마운트 포함)
docker run -v ./output:/app/output image-returner
```

## 아키텍처

- `ImageReturner`: 메인 워커 클래스
  - `_get_image_from_shm()`: 공유 메모리에서 이미지 로드
  - `_save_image_to_file()`: 로컬 파일로 이미지 저장
  - `_save_result_to_json()`: 결과를 JSON 파일에 기록
  - `process_hosting_task()`: 파일 저장 작업 처리
  - `start_worker()`: 워커 프로세스 시작

## 출력 구조

### 디렉토리 구조
```
output/
└── translated/
    ├── image_001_20241201_143022.jpg
    ├── image_002_20241201_143045.jpg
    └── results.json
```

### 파일 명명 규칙
- 이미지 파일: `{image_id}_{timestamp}.jpg`
- 타임스탬프 형식: `YYYYMMDD_HHMMSS`

### 결과 JSON 구조
```json
[
  {
    "timestamp": "2024-12-01T14:30:22.123456",
    "request_id": "req_001",
    "image_id": "image_001",
    "file_path": "/path/to/output/translated/image_001_20241201_143022.jpg",
    "status": "completed"
  }
]
```

## 로깅

모듈은 상세한 로깅을 제공하며, 다음 정보들을 기록합니다:
- 작업 시작/완료
- 오류 및 예외 상황
- 파일 저장 결과
- 리소스 관리 상태

## API 구조

### 내부 API

#### Redis 큐
- **큐 이름**: `HOSTING_TASKS_QUEUE`
- **메시지 형식**:
  ```json
  {
    "request_id": "string",
    "image_id": "string",
    "shm_info": {
      "shm_name": "string",
      "shape": [number, number, number],
      "dtype": "string",
      "size": number
    }
  }
  ```

#### 이미지 저장
- **출력 형식**: JPEG
- **품질**: `JPEG_QUALITY` 환경 변수로 설정
- **색상 공간**: RGB → BGR 자동 변환 (OpenCV 호환)

## Docker Compose 설정

```yaml
returner:
  build:
    context: .
    dockerfile: ./return/dockerfile
  volumes:
    - ./return:/app/return
    - ./core:/app/core
    - ./output:/app/output  # 출력 파일을 호스트와 공유
  environment:
    - REDIS_URL=redis://redis:6379
    - OUTPUT_DIR=/app/output/translated
    - JPEG_QUALITY=80
  depends_on:
    - redis
    - rendering_worker
```
