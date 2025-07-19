# 11번가 등록 워커 구조 (elevenStoreRegister)

## 아키텍처 개요

11번가 등록 워커는 **레이어드 아키텍처**와 **모듈형 설계**를 기반으로 구성되어 있습니다.

```
┌─────────────────────────────────────────────────────────────┐
│                        Worker Layer                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   worker.js     │  │   operator.js   │  │ Rate Limiting   │  │
│  │  (큐 처리)      │  │  (프로세스 관리)│  │  (사용자별 제한)│  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                      Service Layer                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │createInitialJson│  │  optionChoice   │  │    Mapping      │  │
│  │  (데이터 가공)  │  │  (옵션 필터링)  │  │  (XML 생성)     │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │registerProduct  │  │generateDetail   │  │priceCalculator  │  │
│  │  (API 호출)     │  │  (HTML 생성)    │  │  (가격 계산)    │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   getConfig     │  │  getBasedata    │  │   saveStatus    │  │
│  │  (설정 조회)    │  │  (상품 조회)    │  │  (상태 저장)    │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 모듈별 상세 구조

### 1. Worker Layer (워커 레이어)

#### worker.js - 메인 워커 프로세스
```javascript
// 주요 기능
- Redis 큐 모니터링 및 작업 처리
- 사용자별 Rate Limiting
- 동시 실행 제한 (p-limit)
- 오류 처리 및 재시도 로직

// 주요 변수
const userLastProcessTime = new Map();     // 사용자별 마지막 처리 시간
const processingUsers = new Set();         // 현재 처리 중인 사용자
const USER_RATE_LIMIT_MS = 5000;          // 사용자별 제한 시간
const WORKER_DELAY_MS = 1000;             // 워커 처리 간격

// 핵심 로직
while (true) {
    const task = await getFromQueue(QUEUE_NAMES.ELEVENSTORE_REGISTER, 0);
    if (checkUserRateLimit(userid) && !processingUsers.has(userid)) {
        await processElevenstoreRegister(task);
    }
}
```

#### operator.js - 프로세스 총괄 관리
```javascript
// 주요 기능
- 전체 등록 프로세스 순차 실행
- 각 단계별 오류 처리
- 최종 결과 취합 및 반환

// 처리 순서
1. getConfig() - 설정 데이터 로드
2. getBaseData() - 기본 상품 데이터 로드
3. createInitialJson() - 1차 가공 처리
4. optionChoice() - 옵션 필터링
5. mapping() - XML 매핑 (글로벌/로컬)
6. registerProduct() - 11번가 API 호출
```

### 2. Service Layer (서비스 레이어)

#### createInitialJson.js - 초기 JSON 데이터 생성
```javascript
// 주요 기능
- 상세페이지 HTML 생성
- 가격 계산 및 할인율 생성
- 이미지 URL 정리
- 옵션 이미지 매핑

// 의존성
import { generateDetailContent } from './assist/generateDetailContents.js';
import { calculatePrices, generateRandomDiscount } from './assist/priceCalculator.js';
import { cleanImageUrl, cleanImageArray } from '../../../common/utils/Validator.js';

// 출력 구조
{
    success: true,
    initialJson: {
        productId, productName, elevenstoreCatId,
        brandName, keywords, representativeImage,
        images, contents, optionSchema, variants,
        deliveryInfo, discountRate
    }
}
```

#### optionChoice.js - 옵션 필터링
```javascript
// 주요 기능
- 옵션 배열 로직에 따른 필터링
- 대표 가격 결정
- 개별 옵션 가격 계산

// 전략 패턴
switch (optionArrayLogic) {
    case 'lowest_price':
        return await lowPriceStrategy(data, discountRate);
    case 'most_products':
        return await manyStrategy(data, discountRate);
}

// 필터링 로직
- lowest_price: 최저가 기준 +100%까지 포함
- most_products: 최다 옵션 포함 기준가 ±50%
```

#### XML 매핑 (globalMapping.js / localMapping.js)
```javascript
// 주요 기능
- 11번가 API XML 형식 생성
- 옵션 매핑키 생성
- XML 특수문자 이스케이프

// 차이점
globalMapping: 해외 직구 상품 (abrdBuyPlace=D, forAbrdBuyClf=02)
localMapping: 국내 상품 (forAbrdBuyClf=01, prdInfoTmpltNo 추가)

// 옵션 매핑키 형식
"색상:빨강†사이즈:S" (†로 구분)
```

#### registerProduct.js - 11번가 API 호출
```javascript
// 주요 기능
- 11번가 API 호출
- EUC-KR 인코딩 처리
- 응답 파싱 및 오류 처리

// API 설정
const url = 'http://api.11st.co.kr/rest/prodservices/product';
const headers = {
    'Content-type': 'text/xml;charset=EUC-KR',
    'openapikey': apiKey
};

// 인코딩 처리
const encodedXml = iconv.encode(xmlString, 'euc-kr');
const decodedXml = iconv.decode(Buffer.from(buffer), 'euc-kr');
```

### 3. Assist Layer (보조 레이어)

#### generateDetailContents.js - 상세페이지 HTML 생성
```javascript
// 주요 기능
- 이미지 섹션 생성
- 옵션 정보 표시 (2열 flexbox)
- 속성 테이블 생성
- 트래킹 픽셀 삽입

// HTML 구조
<div class="product-detail-container">
    ${firstImagesHtml}          // 상단 이미지
    ${optionsHtml}              // 옵션 정보
    ${detailImagesHtml}         // 상세 이미지
    ${attributesHtml}           // 속성 테이블
    ${lastImagesHtml}           // 하단 이미지
    ${trackingDivHtml}          // 트래킹 픽셀
</div>
```

#### priceCalculator.js - 가격 계산
```javascript
// 주요 기능
- 위안화 → 원화 변환
- 관부가세 계산
- 11번가 수수료 고려 (13%)
- 최소 마진 보장

// 계산 공식
const costKRW = itemPriceCNY * (1 + buyingFee/100) * chinaExchangeRate;
const totalCostKRW = costKRW + dutyKRW + vatKRW + deliveryFee;
const targetPriceKRW = (totalCostKRW * (1 + profitMargin/100)) / (1 - 0.13);
const finalPrice = Math.ceil(targetPriceKRW / 10) * 10;
```

### 4. Data Layer (데이터 레이어)

#### getConfig.js - 설정 데이터 조회
```javascript
// 조회 테이블
- elevenstore_setting: 11번가 기본 설정
- common_setting: 공통 설정
- elevenstore_register_management: 등록 관리
- elevenstore_account_info: API 인증 정보

// 반환 구조
{
    elevenstoreConfig: {...},
    priceConfig: {...},
    detailPageConfig: {...},
    registerManagement: {...},
    elevenstoreApiAuth: {...}
}
```

#### getBasedata.js - 기본 상품 데이터 조회
```javascript
// 조회 테이블
- pre_register: JSON 데이터, 상품 그룹 코드
- products_detail: 카테고리 ID
- categorymapping: 11번가 카테고리 매핑

// 반환 구조
{
    jsonData: {...},                // 상품 원본 데이터
    elevenstoreCatId: number,       // 11번가 카테고리 ID
    productGroupCode: string        // 상품 그룹 코드
}
```

#### saveStatus.js - 등록 상태 저장
```javascript
// 성공 시 저장
- elevenstore_register_management: status='success', 상품번호, XML
- status: elevenstore_registered=TRUE
- elevenstore_account_info: registered_sku_count 증가

// 실패 시 저장
- elevenstore_register_management: status='fail'
- status: elevenstore_register_failed=TRUE
- error_log: 오류 메시지 기록
```

## 데이터 흐름도

```
┌─────────────────┐
│   Redis Queue   │
│  (작업 대기열)  │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│   worker.js     │
│  (큐 모니터링)  │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  operator.js    │
│ (프로세스 관리) │
└─────────────────┘
         │
         ▼
┌─────────────────┐    ┌─────────────────┐
│   getConfig     │    │  getBasedata    │
│   (설정 조회)   │    │  (상품 조회)    │
└─────────────────┘    └─────────────────┘
         │                       │
         └───────────┬───────────┘
                     ▼
         ┌─────────────────┐
         │createInitialJson│
         │  (데이터 가공)  │
         └─────────────────┘
                     │
                     ▼
         ┌─────────────────┐
         │  optionChoice   │
         │ (옵션 필터링)   │
         └─────────────────┘
                     │
                     ▼
         ┌─────────────────┐
         │    Mapping      │
         │   (XML 생성)    │
         └─────────────────┘
                     │
                     ▼
         ┌─────────────────┐
         │registerProduct  │
         │  (API 호출)     │
         └─────────────────┘
                     │
                     ▼
         ┌─────────────────┐
         │  saveStatus     │
         │  (상태 저장)    │
         └─────────────────┘
```

## 설정 의존성

### 필수 설정 테이블
1. **elevenstore_setting** - 11번가 기본 설정
   - overseas_size_chart_display: 조견표 표시 여부
   - overseas_product_indication: 해외 상품 구분
   - elevenstore_point_amount: 적립 포인트
   - option_array_logic: 옵션 필터링 로직
   - delivery_company_code: 택배사 코드
   - as_guide, return_exchange_guide: 안내 문구
   - return_cost, exchange_cost: 반품/교환 비용
   - include_import_duty, include_delivery_fee: 포함 여부

2. **common_setting** - 공통 설정
   - minimum_margin: 최소 마진
   - buying_fee: 구매 수수료
   - import_duty, import_vat: 관세율, 부가세율
   - china_exchange_rate, usa_exchange_rate: 환율
   - min_percentage, max_percentage: 할인율 범위
   - top_image_*, bottom_image_*: 상단/하단 이미지
   - include_properties, include_options: 포함 여부

3. **elevenstore_register_management** - 등록 관리
   - delivery_fee: 배송비
   - minimum_profit_margin, profit_margin: 수익률
   - market_number: 마켓 번호

4. **elevenstore_account_info** - 계정 정보
   - api_key: 11번가 API 키
   - shippingAddressId, returnAddressId: 주소 ID
   - prdInfoTmpltNo: 상품 정보 템플릿 번호

### 상품 데이터 테이블
1. **pre_register** - 상품 등록 준비
   - json_data: 상품 JSON 데이터
   - product_group_code: 상품 그룹 코드

2. **products_detail** - 상품 상세
   - catid: 카테고리 ID

3. **categorymapping** - 카테고리 매핑
   - catid → elevenstore_cat_id 매핑

## 오류 처리 전략

### 1. 레이어별 오류 처리
```javascript
// Worker Layer
try {
    await processElevenstoreRegister(task);
} catch (error) {
    await saveFailureStatus(userid, productid, error.message);
    return { success: false, error: error.message };
}

// Service Layer
try {
    const result = await createInitialJson(...);
    if (!result.success) throw new Error(result.message);
} catch (error) {
    throw new Error(`createInitialJson 실패: ${error.message}`);
}

// Data Layer
try {
    const [rows] = await promisePool.execute(query, params);
    if (rows.length === 0) throw new Error('데이터 없음');
} catch (error) {
    throw new Error(`DB 조회 실패: ${error.message}`);
}
```

### 2. 재시도 로직
```javascript
// Rate Limit 시 재시도
if (!checkUserRateLimit(userid)) {
    await addToQueue(QUEUE_NAMES.ELEVENSTORE_REGISTER, task);
    continue;
}

// 처리 중 사용자 재시도
if (processingUsers.has(userid)) {
    await addToQueue(QUEUE_NAMES.ELEVENSTORE_REGISTER, task);
    continue;
}
```

### 3. 트랜잭션 처리
```javascript
// saveStatus.js에서 트랜잭션 사용
const connection = await promisePool.getConnection();
try {
    await connection.beginTransaction();
    // 여러 테이블 업데이트
    await connection.commit();
} catch (error) {
    await connection.rollback();
    throw error;
} finally {
    connection.release();
}
```

## 성능 최적화

### 1. 동시 실행 제한
```javascript
// p-limit 사용
const limit = pLimit(API_SETTINGS.CONCURRENCY_LIMITS.ELEVENSTORE_WORKER);

// 작업 실행
limit(() => processElevenstoreRegister(task))
    .then(handleSuccess)
    .catch(handleError);
```

### 2. 메모리 관리
```javascript
// 오래된 Rate Limit 기록 정리
const maybeCleanupOldRateLimitEntries = createMaybeCleanup({
    map: userLastProcessTime,
    expireMs: 60 * 60 * 1000,    // 1시간
    intervalMs: 5 * 60 * 1000    // 5분마다 체크
});
```

### 3. 캐싱 전략
- 설정 데이터: 사용자별 캐싱 가능
- 카테고리 매핑: 전역 캐싱 가능
- 환율 정보: 일정 시간 캐싱 가능

## 모니터링 및 로깅

### 1. 통계 정보
```javascript
// 100개 작업마다 통계 출력
if (processedCount % 100 === 0) {
    console.log(`===== 처리 통계 =====`);
    console.log(`총 처리된 작업: ${processedCount}`);
    console.log(`현재 처리 중인 유저 수: ${processingUsers.size}`);
}
```

### 2. 로그 레벨
- **INFO**: 정상 처리 과정
- **WARN**: 주의 필요한 상황
- **ERROR**: 오류 발생 시

### 3. 데이터베이스 로그
- **error_log**: 상세 오류 정보
- **elevenstore_register_management**: 등록 상태 추적

## 확장성 고려사항

### 1. 멀티 워커 지원
- 여러 워커 인스턴스 실행 가능
- Redis 큐 기반 작업 분산
- 사용자별 순차 처리 보장

### 2. 설정 변경 대응
- 데이터베이스 기반 설정 관리
- 실시간 설정 변경 반영 가능

### 3. 새로운 옵션 로직 추가
- 전략 패턴 사용으로 확장 용이
- optionChoice.js에 새 전략 추가만 필요

이 구조는 **유지보수성**, **확장성**, **안정성**을 모두 고려하여 설계되었습니다.
