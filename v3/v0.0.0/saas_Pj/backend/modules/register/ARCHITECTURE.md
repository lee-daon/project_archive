# Register Module Architecture

## 아키텍처 개요

Register 모듈은 3계층 아키텍처(3-Layer Architecture)를 기반으로 설계되었습니다.

```
┌─────────────────┐
│   Controller    │  ← HTTP 요청/응답 처리
├─────────────────┤
│    Service      │  ← 비즈니스 로직
├─────────────────┤
│   Repository    │  ← 데이터베이스 접근
└─────────────────┘
```

## 디렉토리 구조

```
backend/modules/register/
├── controller/               # HTTP 요청/응답 처리
│   ├── initial.js           # 초기 데이터 로딩
│   ├── search.js            # 상품 검색
│   ├── getImg.js            # 이미지 조회
│   ├── discard.js           # 상품 폐기
│   ├── register.js          # 상품 등록
│   └── coopangmaping.js     # 쿠팡 옵션 매핑 관리
├── service/                 # 비즈니스 로직
│   ├── initial.js           # 초기 데이터 조합 로직
│   ├── search.js            # 검색 필터링 로직
│   ├── register.js          # 상품 등록 비즈니스 로직
│   ├── queueManager.js      # Redis 큐 관리
│   └── coopang_Category/    # 쿠팡 카테고리 관리
│       ├── AIcategoryMapper.js   # AI 옵션 매핑 처리
│       └── categoryMeta.js       # 쿠팡 카테고리 메타데이터
├── repository/              # 데이터베이스 접근
│   ├── initial.js           # 초기 데이터 쿼리
│   ├── search.js            # 검색 쿼리
│   ├── getImg.js            # 이미지 쿼리
│   ├── discard.js           # 폐기 처리 쿼리
│   ├── registerStatus.js    # 등록 상태 관리 쿼리
│   ├── checkLimit.js        # 등록 제한 확인 쿼리
│   ├── coopangMapdata.js    # 쿠팡 매핑 데이터 조회
│   └── updateMappedInfo.js  # 매핑 정보 업데이트
├── index.js                 # 라우터 통합
├── README.md
├── ARCHITECTURE.md
└── API.md
```

## 계층별 역할

### 1. Controller Layer
- HTTP 요청/응답 처리
- 입력 데이터 유효성 검증
- 에러 처리 및 응답 형식 통일
- 인증 확인

**특징:**
- Express Router 사용
- 각 기능별로 독립적인 파일

### 2. Service Layer (선택적)
- 복잡한 비즈니스 로직 처리
- 여러 Repository 함수 조합
- 데이터 변환 및 조합
- AI 연동 처리 (쿠팡 옵션 매핑)

### 3. Repository Layer  
- 데이터베이스 쿼리 실행
- SQL 쿼리 관리
- 데이터베이스 연결 처리

## 설계 원칙

### 1. 관심사 분리 (Separation of Concerns)
```javascript
// Controller: HTTP 처리
router.get('/', async (req, res) => {
  const userid = req.user.userid;
  const data = await getInitialData(userid);
  res.json(data);
});

// Service: 비즈니스 로직
export const getInitialData = async (userid) => {
  const products = await getRegistrableProductIds(userid);
  // ... 복잡한 데이터 조합 로직
};

// Repository: 데이터 접근
export const getRegistrableProductIds = async (userid) => {
  const query = `SELECT productid FROM status WHERE ...`;
  const [rows] = await promisePool.execute(query, [userid]);
  return rows;
};
```

### 2. 단일 책임 원칙 (Single Responsibility Principle)
- 각 함수는 하나의 명확한 책임만 가짐
- 파일별로 기능 분리

### 3. 의존성 역전 원칙 (Dependency Inversion Principle)
- Controller → Service → Repository 순서로 의존
- 상위 계층이 하위 계층에 의존

## 데이터 흐름

### 1. 초기 데이터 로딩 (GET /reg/initial)
```
Client Request
    ↓
Controller (initial.js)
    ↓
Service (initial.js)
    ↓
Repository (initial.js) → Database
    ↓
Service (데이터 조합: 네이버, 쿠팡, 11번가)
    ↓
Controller (응답)
    ↓
Client Response
```

### 2. 상품 검색 (GET /reg/search)
```
Client Request (tabInfo, groupCode)
    ↓
Controller (search.js) - 파라미터 검증 (elevenstore 탭 지원)
    ↓
Service (search.js) - 필터링 로직 (11번가 조건 포함)
    ↓
Repository (search.js) → Database
    ↓
Service (데이터 조합: 11번가 등록 시도 횟수 포함)
    ↓
Controller (응답)
    ↓
Client Response
```

### 3. 상품 등록 (POST /reg/register)
```
Client Request (ids, tabInfo, settings)
    ↓
Controller (register.js) - 요청 검증
    ↓
Service (register.js) - 복잡한 등록 로직
    ├── 마켓 결정 (tabInfo 기반: naver/coopang/elevenstore)
    ├── Repository (checkLimit.js) - 등록 제한 확인 (11번가 포함)
    ├── Repository (registerStatus.js) - 상태 업데이트 (3개 마켓)
    └── Service (queueManager.js) - Redis 큐 추가 (ELEVENSTORE_REGISTER)
    ↓
Controller (응답)
    ↓
Client Response
```

### 4. 상품 폐기 (POST /reg/discard)
```
Client Request (ids)
    ↓
Controller (discard.js) - 요청 검증
    ↓
Repository (discard.js) - 3개 마켓 등록 관리 테이블 삭제
    ├── coopang_register_management
    ├── naver_register_management  
    └── elevenstore_register_management
    ↓
Controller (응답)
    ↓
Client Response
```

### 5. 쿠팡 옵션 매핑 (POST /reg/coopangmapping/auto)
```
Client Request (productIds)
    ↓
Controller (coopangmaping.js) - 요청 검증
    ↓
Repository (coopangMapdata.js) - 상품 정보 조회
    ↓
Service (categoryMeta.js) - 쿠팡 카테고리 메타데이터 조회
    ↓
Service (AIcategoryMapper.js) - AI 옵션 매핑 처리
    ├── ChatGPT API 호출
    ├── 옵션 조합 최적화 (최대 3개)
    └── 매핑 결과 생성
    ↓
Repository (updateMappedInfo.js) - 매핑 정보 저장
    ↓
Controller (응답)
    ↓
Client Response
```

### 6. 단순 처리 (이미지 조회, 폐기)
```
Client Request
    ↓
Controller - 검증 및 Repository 직접 호출
    ↓
Repository → Database
    ↓
Controller (응답)
    ↓
Client Response
```

## 성능 최적화

### 1. 쿼리 최적화
- JOIN 연산 최소화
- 개별 쿼리로 분리하여 병렬 처리
- 인덱스 활용

### 2. 병렬 처리
```javascript
// Promise.all을 사용한 병렬 쿼리 실행
const [products, markets, settings] = await Promise.all([
  getProductDetails(userid, productIds),
  getCoopangMarkets(userid),
  getDefaultSettings(userid)
]);
```

### 3. 메모리 효율성
- Map 자료구조 사용으로 O(1) 조회
- 불필요한 데이터 로딩 방지

### 4. AI 처리 최적화
- variants 개수 제한 (maxOptionCount)
- 사용되지 않는 optionValues 필터링
- 0.1초 간격 순차 처리로 API 레이트 리밋 방지

## 상품 등록 아키텍처 상세

### 1. 등록 프로세스 흐름
```
1. 마켓 결정 (tabInfo 기반)
   ├── common: naverMarket + coopangMarket + elevenstoreMarket 설정 확인
   ├── naver: naverMarket 설정만 확인
   ├── coopang: coopangMarket 설정만 확인
   └── elevenstore: elevenstoreMarket 설정만 확인

2. 등록 제한 확인 (각 마켓별)
   ├── naver_account_info 테이블 조회
   ├── coopang_account_info 테이블 조회
   └── elevenstore_account_info 테이블 조회
   └── 최대 SKU 수 vs 현재 등록 수 비교

3. 등록 상태 업데이트 (각 상품별, 마켓별)
   ├── naver_register_management 테이블
   ├── coopang_register_management 테이블
   └── elevenstore_register_management 테이블

4. 큐 작업 추가 (비동기 처리)
   ├── NAVER_REGISTER 큐
   ├── COOPANG_REGISTER 큐
   └── ELEVENSTORE_REGISTER 큐
```

### 2. 데이터베이스 테이블 구조
```sql
-- 네이버 계정 정보
naver_account_info (
  userid, naver_market_number, 
  naver_maximun_sku_count, registered_sku_count
)

-- 쿠팡 계정 정보  
coopang_account_info (
  userid, coopang_market_number,
  coopang_maximun_sku_count, registered_sku_count
)

-- 11번가 계정 정보
elevenstore_account_info (
  userid, elevenstore_market_number,
  elevenstore_maximun_sku_count, registered_sku_count
)

-- 네이버 등록 관리
naver_register_management (
  userid, productid, market_number, status,
  profit_margin, minimum_profit_margin,
  registration_attempt_time, delivery_fee,
  status_code, current_margin
)

-- 쿠팡 등록 관리
coopang_register_management (
  userid, productid, market_number, status,
  profit_margin, minimum_profit_margin, 
  registration_attempt_time, delivery_fee,
  status_code, current_margin,
  mapped_json, use_mapped_json  -- 매핑 관련 필드 추가
)

-- 11번가 등록 관리
elevenstore_register_management (
  userid, productid, market_number, status,
  profit_margin, minimum_profit_margin,
  registration_attempt_time, delivery_fee,
  status_code, current_margin,
  discount_rate, final_main_price, final_json
)

-- 상품 등록 대기 데이터
pre_register (
  userid, productid, product_group_code,
  product_group_memo, json_data
)

-- 카테고리 매핑
categorymapping (
  catid, coopang_cat_id, naver_cat_id, elevenstore_cat_id
)

-- 상태 관리
status (
  userid, productid,
  naver_mapping_ready, coopang_mapping_ready, elevenstore_mapping_ready,
  naver_registered, coopang_registered, elevenstore_registered,
  naver_register_failed, coopang_register_failed, elevenstore_register_failed
)
```

### 3. Redis 큐 구조
```javascript
// 큐 데이터 구조
{
  userid: number,
  productid: string,
  jobData: {
    userid: number,
    productid: string,
    marketType: 'naver' | 'coopang' | 'elevenstore',
    settings: object,
    timestamp: string
  },
  timestamp: number,
  jobId: string // "elevenstore_123_456_1234567890"
}
```

## 에러 처리 전략

### 1. 계층별 에러 처리
- **Repository**: 데이터베이스 에러 로깅 후 throw
- **Service**: 비즈니스 로직 에러 처리 (등록 제한, 마켓 설정, AI 처리 등)
- **Controller**: HTTP 상태 코드 및 응답 형식 통일

### 2. 등록 관련 에러 타입
- **마켓 설정 오류**: 필수 마켓 설정 누락
- **등록 제한 오류**: SKU 수량 초과
- **데이터베이스 오류**: 상태 업데이트 실패
- **큐 오류**: Redis 큐 추가 실패

### 3. 매핑 관련 에러 타입
- **카테고리 오류**: 쿠팡 카테고리 정보 없음
- **AI 처리 오류**: ChatGPT API 호출 실패
- **매핑 검증 오류**: AI 응답 형식 오류
- **저장 오류**: 매핑 정보 업데이트 실패

### 4. 에러 응답 형식
```javascript
{
  "success": false,
  "error": "에러 메시지",
  "code": "ERROR_CODE",
  "details": {
    "field": "오류 필드",
    "value": "잘못된 값"
  }
}
```
