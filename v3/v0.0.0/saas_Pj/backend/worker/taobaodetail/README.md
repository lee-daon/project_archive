# 타오바오 상세 정보 워커

이 워커는 Redis 큐에서 작업을 가져와 타오바오 상품의
상세 정보를 처리하는 비동기 프로세스입니다.

## 개요

타오바오 상세 정보 워커는 다음과 같은 작업을 수행합니다:

1. Redis 큐(`taobao:detail:queue`)에서 작업 가져오기
2. 타오바오 API를 통해 상품 상세 정보 수집
3. 판매자/쇼핑몰의 금지 상태 확인
4. 상품 상세 정보를 데이터베이스에 저장
5. 소싱 상태 업데이트
6. 처리 결과 로깅

## 디렉토리 구조

```
/worker/taobaodetail/
├── db/                       # 데이터베이스 작업 모듈
│   ├── banCheck.js             # 금지 상태 확인 함수
│   ├── controlSorcingStatus.js # 소싱 상태 관리 함수
│   └── saveProductDetail.js    # 상품 상세 정보 저장 함수
├── getproductdetail.js        # 타오바오 API 호출 함수
├── taobaoworker.js            # 메인 워커 실행 파일
└── README.md                  # 문서
```

## 실행 방법

워커는 두 가지 방법으로 실행할 수 있습니다:

### 1. 독립 실행

```bash
node backend/worker/taobaodetail/taobaoworker.js
```

### 2. 서버와 함께 자동 실행

백엔드 서버 실행 시 자동으로 워커도 함께 시작됩니다:

```bash
node backend/server.js
```

## 워커 작동 방식

1. **작업 대기**: Redis 큐에서 작업을 가져올 때까지 대기
2. **작업 처리**:
   - API 호출하여 상품 상세 정보 가져오기
   - 금지된 판매자/쇼핑몰 확인
   - 상품 상세 정보 데이터베이스 저장
3. **상태 업데이트**:
   - 성공 시: `uncommit` 상태로 업데이트
   - API 오류 시: `failapi` 상태로 업데이트
   - 저장 실패 시: `failsave` 상태로 업데이트
   - 금지된 쇼핑몰: `banshop` 상태로 업데이트
   - 금지된 판매자: `banseller` 상태로 업데이트
4. **다음 작업 처리 전 지연**: API 호출 간격 유지 (기본값: 200ms)

## 주요 매개변수

- **큐 이름**: `taobao:detail:queue`
- **API 호출 간격**: 200ms (초당 5개 요청)
- **큐 대기 시간**: 30초 (비어있을 경우)

## API 호출 제한

타오바오 API는 다음과 같은 제한이 있습니다:
- 초당 최대 10개 요청
- IP당 일일 최대 5,000개 요청

안정적인 작동을 위해 기본적으로 초당 5개 요청(200ms 간격)으로 제한되어 있습니다.

## 오류 처리

워커는 다음과 같은 오류 상황을 처리합니다:

1. **API 오류**: 
   - 오류 로깅 후 상태를 `failapi`로 업데이트
   - API 제한(429 오류)의 경우 최대 2회 재시도

2. **저장 오류**: 
   - 오류 로깅 후 상태를 `failsave`로 업데이트
   - 데이터베이스 트랜잭션 롤백

3. **워커 오류**:
   - 치명적 오류 발생 시 로그 기록 후 종료
   - 서버에 의해 자동으로 재시작됨

## 워커 관리

### 모니터링

워커는 처리 상태를 콘솔에 로깅합니다:
- 처리 시작 및 완료 로그
- 오류 로그
- 100개 작업마다 통계 정보

### 확장

처리량을 늘리려면 다음과 같이 할 수 있습니다:
1. API 호출 간격 조정 (`API_DELAY_MS` 변경)
2. 여러 워커 인스턴스 실행 (다른 서버에서)

### 종료

워커를 안전하게 종료하려면 `SIGINT` 또는 `SIGTERM` 시그널을 보내세요:

```bash
# PID로 종료
kill -SIGTERM <worker_pid>

# 또는 서버 종료 시 자동으로 종료됨
``` 