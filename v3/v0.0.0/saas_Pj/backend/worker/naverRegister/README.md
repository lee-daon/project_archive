# 네이버 등록 워커 (Naver Register Worker)

## 개요

네이버 커머스 API를 사용하여 상품을 자동으로 등록하는 워커 시스템입니다. Redis 큐를 통해 작업을 수신하고, 다단계 처리 과정을 거쳐 네이버 스마트스토어에 상품을 등록합니다.

## 시스템 아키텍처

### 워커 플로우
```
Redis Queue → Worker → MainOperator → API 등록 → DB 상태 저장
```

### 주요 구성 요소

1. **Worker (worker.js)** - 메인 워커 프로세스
2. **MainOperator (mainOperator.js)** - 등록 프로세스 총괄 관리
3. **데이터베이스 모듈** - 설정 및 기본 데이터 조회
4. **서비스 모듈** - 데이터 처리 및 변환
5. **상태 저장 모듈** - 등록 결과 저장

## 주요 기능

### 1. 큐 기반 작업 처리
- Redis에서 작업을 수신하여 처리
- 사용자별 Rate Limiting (1초 간격)
- 오류 발생 시 자동 재시도 메커니즘

### 2. 다단계 데이터 처리
1. **설정 데이터 로드** - DB에서 네이버 등록 설정 정보 조회
2. **기본 데이터 로드** - JSON 상품 데이터 및 카테고리 매핑 정보 조회
3. **초기 JSON 생성** - 키워드 필터링, 이미지 처리, 가격 계산
4. **옵션 선택** - 가격 전략에 따른 옵션 필터링
5. **네이버 API 매핑** - 네이버 커머스 API 형식으로 데이터 변환
6. **상품 등록** - 네이버 API를 통한 실제 상품 등록

### 3. 가격 설정 전략
- **low_price**: 최저가 기준 ±50% 범위 내 옵션 포함
- **many**: 가장 많은 옵션을 포함할 수 있는 기준 가격 선택
- **ai**: 기준 가격의 50% 델타 범위 내 옵션 포함

## 파일 구조

```
naverRegister/
├── worker.js                 # 메인 워커 프로세스
├── mainOperator.js           # 등록 프로세스 총괄 관리
├── schema.md                 # 데이터 구조 스키마 문서
├── README.md                 # 이 문서
├── db/                       # 데이터베이스 관련 모듈
│   ├── getConfing.js         # 설정 데이터 조회
│   ├── getBaseData.js        # 기본 데이터 조회
│   └── saveStatus.js         # 등록 결과 상태 저장
└── service/                  # 서비스 로직 모듈
    ├── InitailJson.js        # 초기 JSON 데이터 생성
    ├── optionChoice.js       # 옵션 선택 및 가격 필터링
    ├── mapping.js            # 네이버 API 형식 변환
    └── 1st_Assist/           # 보조 기능 모듈들
```

## 모듈별 상세 기능

### Worker (worker.js)
- Redis 큐에서 작업 수신
- 사용자별 Rate Limiting 적용
- 오류 처리 및 상태 저장
- 프로세스 생명주기 관리

### MainOperator (mainOperator.js)
전체 등록 프로세스를 단계별로 실행:
1. 설정 데이터 로드 (`getConfig`)
2. 기본 데이터 로드 (`getBaseData`)
3. 초기 JSON 생성 (`InitialJson`)
4. 옵션 선택 (`optionChoice`)
5. 네이버 API 매핑 (`createNaverProductMapping`)
6. 네이버 API 인증 및 상품 등록

### 데이터베이스 모듈

#### getConfig.js
다음 테이블에서 설정 정보 조회:
- `naver_register_config`: 네이버 등록 기본 설정
- `common_setting`: 공통 가격 설정
- `naver_register_management`: 상품별 등록 관리 정보
- `naver_account_info`: 네이버 API 인증 정보

#### getBaseData.js
상품 데이터 조회:
- `pre_register`: JSON 형태의 상품 데이터
- `products_detail`: 상품 카테고리 정보
- `categorymapping`: 네이버 카테고리 매핑

#### saveStatus.js
등록 결과 저장:
- 성공 시: `naver_register_management`, `status` 테이블 업데이트
- 실패 시: 실패 상태 저장 및 `error_log` 테이블에 오류 기록

### 서비스 모듈

#### InitialJson.js
초기 JSON 데이터 생성 단계:
1. 키워드 필터링 (네이버 금지 키워드 제거)
2. 이미지 처리 및 네이버 CDN 업로드
3. A-Z 옵션 처리 (옵션명에 A, B, C... 접두어 추가)
4. 가격 계산 (환율, 마진, 배송비 등 적용)
5. 랜덤 할인율 생성
6. 상세페이지 HTML 생성

#### optionChoice.js
가격 설정 로직에 따른 옵션 필터링:
- **low_price**: 최저가 옵션 기준 ±50% 범위
- **many**: 최대 옵션 포함 가능한 기준 가격 선택
- **ai**: 기준 가격의 50% 델타 범위

각 옵션에 대해 `priceGap` 계산 (대표가격 대비 차액)

#### mapping.js
네이버 커머스 API 형식으로 데이터 변환:
- 상품 기본 정보 매핑
- 옵션 조합 생성
- 배송 정보 설정
- 고객 혜택 정보 구성
- 상품 상세 속성 설정

## 환경 설정

### 필요한 환경 변수
```env
# Redis 설정
REDIS_HOST=localhost
REDIS_PORT=6379

# 데이터베이스 설정
DB_HOST=localhost
DB_USER=username
DB_PASSWORD=password
DB_NAME=database_name
```

### 필요한 데이터베이스 테이블
- `naver_register_config`
- `common_setting`
- `naver_register_management`
- `naver_account_info`
- `pre_register`
- `products_detail`
- `categorymapping`
- `status`
- `error_log`

## 실행 방법

### 워커 시작
```bash
node worker.js
```

### Redis 큐에 작업 추가 예시
```javascript
{
  userid: 12345,
  productid: 67890,
  jobData: { /* 추가 작업 데이터 */ }
}
```

## 오류 처리

### 자동 오류 처리
- 네트워크 오류 시 자동 재시도
- 데이터베이스 연결 오류 복구
- Rate Limiting 적용

### 수동 처리가 필요한 오류
- 네이버 API 인증 실패
- 필수 설정 데이터 누락
- 카테고리 매핑 정보 부재

## 로그 확인

워커는 다음과 같은 로그를 출력합니다:
- 작업 수신 및 처리 상태
- 각 단계별 처리 결과
- 오류 발생 시 상세 정보
- 최종 등록 결과

## 모니터링

### 성능 지표
- 작업 처리 시간
- 성공/실패 비율
- 사용자별 처리량

### 상태 확인
- `status` 테이블의 `naver_registered` 컬럼
- `naver_register_management` 테이블의 `status` 컬럼
- `error_log` 테이블의 오류 기록

## 개발 및 확장

### 새로운 가격 전략 추가
`optionChoice.js`에 새로운 전략 함수를 추가하고, switch 문에 케이스를 추가합니다.

### 네이버 API 변경 대응
`mapping.js`에서 API 형식 변경에 따른 매핑 로직을 수정합니다.

### 추가 데이터 소스 연동
`getConfig.js` 또는 `getBaseData.js`에 새로운 테이블 조회 로직을 추가합니다.

## 보안 고려사항

- 네이버 API 인증 정보는 암호화하여 저장
- 데이터베이스 연결 정보 보안
- Rate Limiting을 통한 API 남용 방지
- 입력 데이터 검증 및 SQL Injection 방지

## 성능 최적화

- 데이터베이스 쿼리 최적화
- 이미지 처리 비동기 처리
- 메모리 사용량 모니터링
- 가비지 컬렉션 최적화
