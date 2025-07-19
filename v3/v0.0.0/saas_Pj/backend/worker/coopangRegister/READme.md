# 쿠팡 등록 워커 (Coupang Register Worker)

## 개요
쿠팡 상품 등록을 자동화하는 워커 시스템입니다. 상품 데이터를 가져와서 쿠팡 API 요구사항에 맞게 변환하고 실제 등록까지 수행합니다.

## 디렉토리 구조
```
backend/worker/coopangRegister/
├── worker.js                    # 메인 워커 (큐 처리, 상태 저장)
├── operator.js                  # 비즈니스 로직 오퍼레이터
├── db/
│   ├── getConfig.js             # 사용자별 설정 조회
│   ├── getBasedata.js           # 기본 상품 데이터 조회
│   ├── saveStatus.js            # 등록 상태 저장
│   └── coupang-categories.json  # 쿠팡 카테고리 데이터 (2.8MB)
└── service/
    ├── createInitialJson.js     # 초기 JSON 데이터 생성
    ├── mapping.js               # 쿠팡 등록용 데이터 매핑
    ├── registerProduct.js       # 쿠팡 API 호출
    └── assist/
        ├── categoryMeta.js      # 쿠팡 카테고리 메타데이터 처리
        ├── AIcategoryMapper.js  # AI 카테고리 매핑
        ├── priceCalculator.js   # 가격 계산
        └── generateDetailContents.js # 상품 상세 설명 생성
```

## 프로세스 플로우

### 1. 워커 시작 (`worker.js`)
- Redis 큐에서 작업 수신
- 사용자별 Rate Limiting (1초 간격)
- `mainOperator` 호출
- 결과에 따른 데이터베이스 상태 저장

### 2. 메인 오퍼레이터 (`operator.js`)
```javascript
mainOperator(userid, productid) 실행 순서:
1. getConfig(userid, productid)           // 사용자 설정 로드
2. getBaseData(userid, productid)         // 기본 상품 데이터 로드
3. createInitialJson()                    // 1차 가공 처리
4. mapToCoupangFormat()                   // 쿠팡 등록용 매핑
5. registerProductToCoupang()             // 실제 쿠팡 API 호출
```

### 3. 데이터 처리 단계

#### 3-1. 설정 로드 (`getConfig.js`)
```javascript
// 반환 구조
{
  coopangConfig: {
    deliveryCompanyCode: "KGB",
    afterServiceTelephone: "01048408754",
    maxOptionCount: 10,
    returnInfo: {
      returnChargeName: "1302동 1103호",
      returnCenterCode: "1002151345",
      // ... 반품 관련 정보
    }
  },
  priceConfig: {
    minimumMargin: 5000,
    profitMargin: 20,
    deliveryFee: "6000.00",
    // ... 가격 설정
  },
  registerManagement: {
    marketNumber: 2
  },
  coopangApiAuth: {
    accessKey: "8cd1a47b-ca95-481d-8d54-fe7710d22be5",
    secretKey: "264716568f7148871a2ad0d452439fca6c920130",
    vendorId: "A01297100",
    vendorUserId: "dlekdhs1"
  }
}
```

#### 3-2. 기본 데이터 로드 (`getBasedata.js`)
```javascript
// 반환 구조
{
  jsonData: {
    success: true,
    productInfo: {
      productId: "721963707226",
      productName: "산투이 3톤 소형 롤러 ",
      brandName: "나이키/Nike",
      keywords: ["소형 롤러", "보행식 롤러", ...],
      images: [...],
      attributes: [...]
    },
    optionSchema: [...],
    variants: [...]
  },
  coopangCatId: 64302
}
```

#### 3-3. 초기 JSON 생성 (`createInitialJson.js`)
- AI 카테고리 매핑으로 옵션 재구성
- 상세페이지 HTML 생성
- 가격 계산 (원가 → 판매가)
- 할인률 적용

```javascript
// 결과 구조
{
  success: true,
  message: "createInitialJson 함수 모든 단계 완료 - AI 카테고리 매핑 + 최종 JSON 생성됨",
  initialJson: {
    productId: "721963707226",
    productName: "산투이 3톤 소형 롤러 ",
    coopangCatId: 64302,
    variants: [
      {
        stockQuantity: 200,
        calculatedPrice: 876280,  // 계산된 판매가
        cost: 642600,            // 원가
        optionCombination: [...]
      }
    ],
    discountRate: 29  // 적용된 할인률
  },
  aiMappingUsed: true
}
```

#### 3-4. 쿠팡 매핑 (`mapping.js`)
쿠팡 API 요구사항에 맞는 데이터 구조로 변환:

```javascript
// 매핑 결과 구조
{
  success: true,
  totalItems: 4,
  data: {
    displayCategoryCode: 64302,
    sellerProductName: "산투이 3톤 소형 롤러 ",
    vendorId: "A01297100",
    saleStartedAt: "2025-06-03T12:54:03",  // yyyy-MM-dd'T'HH:mm:ss 형식
    deliveryChargeType: "FREE",
    items: [
      {
        itemName: "산투이 핸드 가이드 양륜 예약금_1개",
        originalPrice: 1234200,  // 10원 단위로 올림 처리
        salePrice: 876280,
        externalVendorSku: "721963707226;사이즈:산투이 핸드 가이드 양륜 예약금;수량:1개",
        contents: [
          {
            contentsType: "TEXT",
            contentDetails: [
              {
                content: "<html>...</html>",  // HTML 태그로 래핑
                detailType: "TEXT"
              }
            ]
          }
        ],
        notices: [...],  // categoryMeta.js에서 생성
        // ... 기타 쿠팡 필수 필드들
      }
    ],
    requiredDocuments: [
      {
        templateName: "인보이스영수증(해외구매대행 선택시)",
        vendorDocumentPath: "http://image11.coupangcdn.com/..."
      }
    ]
  }
}
```

#### 3-5. 쿠팡 등록 (`registerProduct.js`)
실제 쿠팡 API 호출 및 응답 처리:

```javascript
// 성공 시
{
  success: true,
  data: {
    code: "SUCCESS",
    message: "[]",
    data: 15568763006  // 쿠팡에서 생성된 상품 번호
  },
  registeredProductNumber: 15568763006
}

// 실패 시
{
  success: false,
  data: {
    code: "ERROR",
    message: "[옵션(핸드 가이드 양륜_1) : 정상가는 최소 10원 단위로 입력가능합니다. (1원단위 입력 불가)]"
  },
  error: "쿠팡 상품 등록 실패: ..."
}
```

### 4. 상태 저장 (`saveStatus.js`)

#### 성공 시 (`saveSuccessStatus`)
- `coopang_register_management` 테이블 업데이트:
  - `status` → 'success'
  - `final_json` → 매핑된 JSON 데이터
  - `discount_rate` → 할인률
  - `registered_product_number` → 쿠팡 상품 번호
- `coopang_account_info`: `registered_sku_count` +1
- `status`: `coopang_registered` → true

#### 실패 시 (`saveFailStatus`)
- `coopang_register_management`: `status` → 'fail'
- `status`: `coopang_register_failed` → true
- `error_log`: 매핑 데이터 + 오류 메시지 저장

## 주요 특징

### 데이터 변환 로직
1. **가격 계산**: 원가 → 수수료/관세/환율 적용 → 마진 추가 → 할인률 적용
2. **10원 단위 처리**: 쿠팡 요구사항에 맞춰 originalPrice는 10원 단위로 올림
3. **AI 카테고리 매핑**: 쿠팡 MANDATORY 속성에 맞춰 옵션 재구성
4. **HTML 컨텐츠**: 상품 속성, 옵션 정보를 HTML로 자동 생성

### 에러 처리
- 각 단계별 실패 시 조기 반환
- 데이터베이스 트랜잭션 처리
- 상세한 에러 로깅

### Rate Limiting
- 사용자별 1초 간격 제한
- 쿠팡 API 호출 제한 준수

## 사용 예시

```javascript
// 워커에서 자동 처리됨
const result = await mainOperator(userid, productid);

// 결과 확인
if (result.success) {
  console.log(`등록된 상품 번호: ${result.registeredProductNumber}`);
  console.log(`등록된 아이템 수: ${result.itemsCount}`);
} else {
  console.error(`등록 실패: ${result.message}`);
}
```

## 데이터베이스 테이블

### 관련 테이블
- `coopang_register_management`: 등록 관리
- `coopang_account_info`: 계정 정보
- `status`: 상품 상태
- `error_log`: 에러 로그
- `categorymapping`: 카테고리 매핑

### 처리 상태
- `pending`: 등록 대기
- `success`: 등록 성공  
- `fail`: 등록 실패

## 환경 설정
- Redis 큐 연결 필요
- MySQL 데이터베이스 연결 필요
- 쿠팡 API 키 설정 필요
