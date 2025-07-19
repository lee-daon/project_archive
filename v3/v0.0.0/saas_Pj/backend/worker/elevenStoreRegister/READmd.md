# 11번가 상품 등록 워커 (elevenStoreRegister)

## 개요

11번가 상품 등록을 위한 워커 시스템입니다. Redis 큐 기반으로 작동하며, 상품 데이터를 11번가 API 형식으로 변환하여 등록합니다.

## 주요 기능

- **자동 상품 등록**: 큐에서 작업을 가져와 11번가에 상품을 자동 등록
- **가격 계산**: 마진율, 환율, 관세 등을 고려한 자동 가격 계산
- **옵션 필터링**: 11번가 정책에 맞는 옵션 선택 (최저가 기준 또는 최다 상품 기준)
- **XML 생성**: 11번가 API 요구사항에 맞는 XML 형식 생성
- **상태 관리**: 등록 성공/실패 상태를 데이터베이스에 저장
- **Rate Limiting**: 사용자별 API 호출 제한

## 파일 구조

```
elevenStoreRegister/
├── worker.js              # 메인 워커 프로세스
├── operator.js            # 등록 프로세스 총괄 관리
├── db/
│   ├── getConfig.js       # 설정 데이터 조회
│   ├── getBasedata.js     # 기본 상품 데이터 조회
│   └── saveStatus.js      # 등록 상태 저장
├── service/
│   ├── createInitialJson.js   # 초기 JSON 데이터 생성
│   ├── optionChoice.js        # 옵션 필터링 로직
│   ├── globalMapping.js       # 글로벌 상품 XML 매핑
│   ├── localMapping.js        # 로컬 상품 XML 매핑
│   ├── registerProduct.js     # 11번가 API 호출
│   └── assist/
│       ├── generateDetailContents.js # 상세페이지 HTML 생성
│       └── priceCalculator.js         # 가격 계산 로직
├── baseStructure.md       # 11번가 API XML 구조 문서
├── record.md              # 데이터 구조 및 프로세스 기록
├── READmd.md              # 이 문서
└── structure.md           # 모듈 구조 설명
```

## 실행 방법

### 1. 워커 실행
```bash
# 11번가 등록 워커 실행
node backend/worker/elevenStoreRegister/worker.js
```

### 2. 큐에 작업 추가
```javascript
// Redis 큐에 등록 작업 추가
const task = {
    userid: 1,
    productid: 12345,
    jobData: {} // 추가 작업 데이터
};
await addToQueue(QUEUE_NAMES.ELEVENSTORE_REGISTER, task);
```

## 설정 요구사항

### 데이터베이스 테이블
- `elevenstore_setting`: 11번가 기본 설정
- `common_setting`: 공통 설정 (마진, 환율, 이미지 등)
- `elevenstore_register_management`: 등록 관리 데이터
- `elevenstore_account_info`: API 키, 주소 정보
- `pre_register`: 상품 JSON 데이터
- `products_detail`: 상품 상세 정보
- `categorymapping`: 카테고리 매핑 데이터

### 환경변수
```bash
# Redis 설정
REDIS_HOST=localhost
REDIS_PORT=6379

# 데이터베이스 설정
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=database
```

## 처리 과정

### 1. 데이터 수집
- **getConfig**: 11번가 설정, 가격 설정, 상세페이지 설정 등 조회
- **getBaseData**: 상품 JSON 데이터, 카테고리 매핑 정보 조회

### 2. 데이터 가공
- **createInitialJson**: 상세페이지 HTML 생성, 가격 계산, 할인율 생성
- **optionChoice**: 옵션 필터링 (최저가 기준 또는 최다 상품 기준)

### 3. XML 매핑
- **globalMapping**: 해외 직구 상품용 XML 생성
- **localMapping**: 국내 상품용 XML 생성

### 4. 상품 등록
- **registerProduct**: 11번가 API 호출하여 실제 등록
- **saveStatus**: 등록 결과를 데이터베이스에 저장

## 옵션 필터링 로직

### 1. lowest_price (최저가 기준)
- 가장 낮은 가격을 기준으로 +100%까지의 옵션만 포함
- 대표 가격은 최저가의 할인 전 가격

### 2. most_products (최다 상품 기준)
- 가장 많은 옵션을 포함할 수 있는 기준가 설정
- 기준가 ±50% 범위 내 옵션 포함

## 가격 계산 로직

```javascript
// 1. 원가 계산 (위안화 → 원화)
const costKRW = itemPriceCNY * (1 + buyingFee/100) * chinaExchangeRate;

// 2. 관부가세 계산 (설정에 따라)
const dutyKRW = includeImportDuty ? costKRW * (importDuty/100) : 0;
const vatKRW = includeImportDuty ? (costKRW + dutyKRW) * (importVat/100) : 0;

// 3. 총 비용
const totalCostKRW = costKRW + dutyKRW + vatKRW + (includeDeliveryFee ? deliveryFee : 0);

// 4. 목표 판매가 (11번가 수수료 13% 고려)
const targetPriceKRW = (totalCostKRW * (1 + profitMargin/100)) / (1 - 0.13);

// 5. 최종 가격 (10원 단위 올림)
const finalPrice = Math.ceil(targetPriceKRW / 10) * 10;
```

## Rate Limiting

### 사용자별 제한
- 기본 제한: 5초 간격 (USER_RATE_LIMIT_MS)
- 동시 처리 제한: 1명씩 순차 처리
- 워커 처리 간격: 1초 (WORKER_DELAY_MS)

### 동시 실행 제한
- p-limit 사용하여 동시 실행 작업 수 제한
- 기본값: API_SETTINGS.CONCURRENCY_LIMITS.ELEVENSTORE_WORKER

## 오류 처리

### 자동 재시도
- 큐에서 작업 실패 시 자동으로 큐 뒤로 이동
- Rate limit 적용 시 큐 뒤로 이동

### 로그 기록
- 성공/실패 모든 상태를 데이터베이스에 기록
- error_log 테이블에 상세 오류 정보 저장

## 모니터링

### 처리 통계
- 100개 작업마다 처리 통계 출력
- 현재 처리 중인 사용자 수 표시

### 상태 확인
```sql
-- 등록 상태 확인
SELECT status, COUNT(*) FROM elevenstore_register_management GROUP BY status;

-- 오류 로그 확인
SELECT * FROM error_log WHERE productid = ? ORDER BY created_at DESC LIMIT 10;
```

## 11번가 API 특징

### XML 형식
- 인코딩: EUC-KR
- Content-Type: text/xml;charset=EUC-KR
- 조합형 옵션 지원 (개별 가격 설정 가능)

### 필수 필드
- 상품명, 브랜드, 카테고리 ID
- 이미지 4개까지 지원
- 상세페이지 HTML
- 배송비, 반품비 정보

### 옵션 처리
- ProductRootOption: UI 구조화용 옵션 정의
- ProductOptionExt: 실제 판매 조합 정의
- optionMappingKey: "옵션명:값†옵션명:값" 형식

## 주의사항

1. **API 키 보안**: 11번가 API 키는 안전하게 관리
2. **인코딩**: 모든 텍스트는 EUC-KR 인코딩 필요
3. **옵션 제한**: 11번가 정책에 따른 옵션 개수 제한 준수
4. **가격 정책**: 최소 마진 및 수익률 보장 필요
5. **이미지 호스팅**: 모든 이미지는 공개 URL로 호스팅 필요

## 관련 문서

- [baseStructure.md](./baseStructure.md): 11번가 API XML 구조 상세 설명
- [record.md](./record.md): 데이터 구조 및 프로세스 상세 기록
- [structure.md](./structure.md): 모듈 구조 및 아키텍처 설명
