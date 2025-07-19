# 쿠팡 등록 워커 상세 구조 문서

## 프로세스 전체 플로우

### 1. 데이터 수집 단계

#### `getConfig(userid, productid)` - 사용자 설정 조회
사용자별 쿠팡 등록 설정을 데이터베이스에서 조회합니다.

**출력 구조 (실제 테스트 결과 기준):**
```javascript
{
  coopangConfig: {
    deliveryCompanyCode: "KGB",
    afterServiceGuideContent: "테스트상품입니다",
    afterServiceTelephone: "01048408754",
    maxOptionCount: 10,
    returnInfo: {
      returnChargeName: "1302동 1103호",
      returnCenterCode: "1002151345",
      companyContactNumber: "010-4840-8754",
      returnZipCode: "16543",
      returnAddress: "경기도 수원시 영통구 인계로220번길 6-75",
      returnAddressDetail: "매탄동 3층 W1호(매탄동)",
      outboundShippingPlaceCode: "22683805",
      returnDeliveryFee: 5000
    }
  },
  priceConfig: {
    minimumMargin: 5000,
    minimumProfitMargin: 10,
    profitMargin: 20,
    deliveryFee: "6000.00",
    buyingFee: 2,
    importDuty: 8,
    importVat: 10,
    chinaExchangeRate: 210,
    usaExchangeRate: 1400,
    minPercentage: 10,
    maxPercentage: 30,
    freeShipping: 1,
    includeImportDuty: 0
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

#### `getBaseData(userid, productid)` - 기본 상품 데이터 조회
pre_register 테이블에서 JSON 데이터와 categorymapping에서 쿠팡 카테고리 ID를 조회합니다.

**출력 구조:**
```javascript
{
  jsonData: {
    success: true,
    variants: [
      {
        price: "3000.00",
        stockQuantity: 200,
        optionCombination: [
          {
            valueId: "25155353817",
            optionId: "1627207"
          }
        ]
      }
    ],
    productInfo: {
      url: "//item.taobao.com/item.htm?id=721963707226",
      video: null,
      images: ["https://pub-b852f1bb5d3a419d93134a68870b6ea5.r2.dev/..."],
      keywords: ["소형 롤러", "보행식 롤러", "탑승식 롤러", ...],
      brandName: "나이키/Nike",
      productId: "721963707226",
      attributes: [
        { name: "모델", value: "SRD03 C6JS" },
        { name: "브랜드", value: "산추이" },
        // ...
      ],
      categoryId: "127742003",
      deliveryFee: "0.00",
      productName: "산투이 3톤 소형 롤러 ",
      descriptionImages: [],
      representativeImage: "https://pub-b852f1bb5d3a419d93134a68870b6ea5.r2.dev/..."
    },
    optionSchema: [
      {
        optionId: "1627207",
        optionName: "색상 분류",
        optionValues: [
          {
            valueId: "25155353817",
            imageUrl: "https://pub-b852f1bb5d3a419d93134a68870b6ea5.r2.dev/...",
            valueName: "산투이 핸드 가이드 양륜 예약금"
          }
        ]
      }
    ]
  },
  coopangCatId: 64302
}
```

### 2. 데이터 가공 단계

#### `createInitialJson()` - 초기 JSON 데이터 생성

**처리 과정:**
1. AI 카테고리 매핑 (`mapOptionsForCoupang`)
2. 옵션 이미지와 이름 매핑 생성
3. 상세페이지 HTML 생성 (`generateDetailContent`)
4. 가격 계산 (`calculatePrices`)
5. 할인률 생성 (`generateRandomDiscount`)
6. 최종 JSON 구조 생성

**출력 구조 (실제 테스트 결과):**
```javascript
{
  success: true,
  message: "createInitialJson 함수 모든 단계 완료 - AI 카테고리 매핑 + 최종 JSON 생성됨",
  initialJson: {
    productId: "721963707226",
    productName: "산투이 3톤 소형 롤러 ",
    coopangCatId: 64302,
    brandName: "나이키/Nike",
    keywords: ["소형 롤러", "보행식 롤러", ...],
    representativeImage: "https://pub-b852f1bb5d3a419d93134a68870b6ea5.r2.dev/...",
    images: ["https://pub-b852f1bb5d3a419d93134a68870b6ea5.r2.dev/..."],
    contents: "<div class=\"product-detail-container\" style=\"...\">...</div>",
    optionSchema: [
      {
        optionId: "1627207",
        optionName: "사이즈",
        optionValues: [
          {
            valueId: "25155353817",
            valueName: "산투이 핸드 가이드 양륜 예약금",
            imageUrl: "https://pub-b852f1bb5d3a419d93134a68870b6ea5.r2.dev/..."
          }
        ]
      },
      {
        optionId: "1627208",
        optionName: "수량",
        optionValues: [
          {
            valueId: "1",
            valueName: "1개"
          }
        ]
      }
    ],
    variants: [
      {
        stockQuantity: 200,
        calculatedPrice: 876280,  // 계산된 최종 판매가
        cost: 642600,            // 계산된 원가
        optionCombination: [
          {
            optionId: "1627207",
            valueId: "25155353817"
          },
          {
            optionId: "1627208",
            valueId: "1"
          }
        ]
      }
    ],
    deliveryInfo: {
      deliveryFee: 0,
      freeShipping: 1
    },
    discountRate: 29  // 적용된 할인률
  },
  aiMappingUsed: true
}
```

### 3. 쿠팡 매핑 단계

#### `mapToCoupangFormat()` - 쿠팡 API 형식으로 변환

**주요 매핑 로직:**
1. 카테고리 이름 조회 (`findCategoryName`) - coupang-categories.json 사용
2. 배송 정보 설정 (무료/유료 배송 구분)
3. 공지사항 조회 (`getCoupangCategoryNotices`)
4. variants를 items로 변환
5. 가격 10원 단위 올림 처리 (`calculateOriginalPrice`)

**출력 구조 (실제 테스트 결과):**
```javascript
{
  success: true,
  totalItems: 4,
  data: {
    displayCategoryCode: 64302,
    sellerProductName: "산투이 3톤 소형 롤러 ",
    vendorId: "A01297100",
    saleStartedAt: "2025-06-03T12:54:03",  // yyyy-MM-dd'T'HH:mm:ss 형식
    saleEndedAt: "2099-01-01T23:59:59",
    displayProductName: "산투이 3톤 소형 롤러 ",
    generalProductName: "산투이 3톤 소형 롤러 ",
    productGroup: "기타 적재/운반도구",  // coupang-categories.json에서 조회
    deliveryMethod: "AGENT_BUY",
    deliveryCompanyCode: "KGB",
    deliveryChargeType: "FREE",
    deliveryCharge: 0,
    freeShipOverAmount: 500000,
    deliveryChargeOnReturn: 5000,
    remoteAreaDeliverable: "Y",
    unionDeliveryType: "NOT_UNION_DELIVERY",
    returnCenterCode: "1002151345",
    returnChargeName: "1302동 1103호",
    companyContactNumber: "010-4840-8754",
    returnZipCode: "16543",
    returnAddress: "경기도 수원시 영통구 인계로220번길 6-75",
    returnAddressDetail: "매탄동 3층 W1호(매탄동)",
    returnCharge: 5000,
    outboundShippingPlaceCode: "22683805",
    vendorUserId: "dlekdhs1",
    requested: false,
    items: [
      {
        itemName: "산투이 핸드 가이드 양륜 예약금_1개",
        originalPrice: 1234200,  // 10원 단위로 올림 처리됨
        salePrice: 876280,
        maximumBuyCount: 200,
        maximumBuyForPerson: 0,
        outboundShippingTimeDay: 3,
        maximumBuyForPersonPeriod: 1,
        unitCount: 1,
        adultOnly: "EVERYONE",
        taxType: "TAX",
        parallelImported: "NOT_PARALLEL_IMPORTED",
        overseasPurchased: "OVERSEAS_PURCHASED",
        pccNeeded: "true",
        externalVendorSku: "721963707226;사이즈:산투이 핸드 가이드 양륜 예약금;수량:1개",
        emptyBarcode: true,
        emptyBarcodeReason: "구매대행상품",
        certifications: [
          {
            certificationType: "NOT_REQUIRED",
            certificationCode: ""
          }
        ],
        searchTags: ["소형 롤러", "보행식 롤러", ...],
        images: [
          {
            imageOrder: 0,
            imageType: "REPRESENTATION",
            vendorPath: "https://pub-b852f1bb5d3a419d93134a68870b6ea5.r2.dev/..."
          },
          {
            imageOrder: 1,
            imageType: "DETAIL",
            vendorPath: "https://pub-b852f1bb5d3a419d93134a68870b6ea5.r2.dev/..."
          }
        ],
        notices: [
          {
            noticeCategoryName: "기타 재화",
            noticeCategoryDetailName: "품명 및 모델명",
            content: "상세페이지참조"
          },
          {
            noticeCategoryName: "기타 재화",
            noticeCategoryDetailName: "제조국(원산지)",
            content: "중국"
          },
          {
            noticeCategoryName: "기타 재화",
            noticeCategoryDetailName: "제조자(수입자)",
            content: "한국"
          },
          {
            noticeCategoryName: "기타 재화",
            noticeCategoryDetailName: "소비자상담 관련 전화번호",
            content: "01048408754"
          }
        ],
        attributes: [
          {
            attributeTypeName: "사이즈",
            attributeValueName: "산투이 핸드 가이드 양륜 예약금"
          },
          {
            attributeTypeName: "수량",
            attributeValueName: "1개"
          }
        ],
        contents: [
          {
            contentsType: "TEXT",
            contentDetails: [
              {
                content: "<html><div class=\"product-detail-container\">...</div></html>",
                detailType: "TEXT"
              }
            ]
          }
        ],
        offerCondition: "NEW",
        offerDescription: ""
      }
    ],
    requiredDocuments: [
      {
        templateName: "인보이스영수증(해외구매대행 선택시)",
        vendorDocumentPath: "http://image11.coupangcdn.com/image/product/content/vendorItem/2018/07/02/41579010/eebc0c30-8f35-4a51-8ffd-808953414dc1.jpg"
      }
    ]
  },
  message: "쿠팡 등록용 데이터 매핑 완료 - 4개 아이템"
}
```

### 4. 쿠팡 API 호출 단계

#### `registerProductToCoupang()` - 실제 쿠팡 등록

**성공 응답 (실제 테스트 결과):**
```javascript
{
  success: true,
  data: {
    code: "SUCCESS",
    message: "[]",
    data: 15568763006,  // 쿠팡에서 생성된 상품 번호
    details: null,
    errorItems: null
  },
  message: "쿠팡 상품 등록 성공 - 4개 아이템",
  registeredItems: 4,
  productName: "산투이 3톤 소형 롤러 ",
  registeredProductNumber: 15568763006
}
```

**실패 응답 (실제 테스트 결과):**
```javascript
{
  success: false,
  data: {
    code: "ERROR",
    message: "[옵션(핸드 가이드 양륜_1) : 정상가는 최소 10원 단위로 입력가능합니다. (1원단위 입력 불가)]",
    data: null,
    details: null,
    errorItems: null
  },
  error: "쿠팡 상품 등록 실패: ...",
  message: "쿠팡 상품 등록 실패: ...",
  registeredItems: 0
}
```

## 쿠팡 카테고리 메타데이터 처리

### getCoupangCategoryMeta(accessKey, secretKey, displayCategoryCode)
쿠팡 카테고리의 원본 메타데이터를 조회하는 기본 함수

```javascript
import { getCoupangCategoryMeta } from './service/assist/categoryMeta.js';

const result = await getCoupangCategoryMeta(accessKey, secretKey, 77426);
```

#### 리턴값
```javascript
{
  success: true,
  data: {
    // 쿠팡 API 원본 응답 데이터 전체
    code: "SUCCESS",
    message: "",
    data: {
      isAllowSingleItem: false,
      attributes: [...], // 모든 속성 정보
      noticeCategories: [...], // 공지사항 카테고리 정보
      requiredDocumentNames: [...], // 필수 서류 정보
      certifications: [...], // 인증 정보
      allowedOfferConditions: ["NEW"]
    }
  },
  message: "카테고리 77426 메타데이터 조회 성공"
}
```

### getCoupangCategoryEssentials(accessKey, secretKey, displayCategoryCode)
카테고리 메타데이터 조회 및 필요한 속성만 추출

```javascript
import { getCoupangCategoryEssentials } from './service/assist/categoryMeta.js';

const result = await getCoupangCategoryEssentials(accessKey, secretKey, 77426);

if (result.success) {
  const attributes = result.data.attributes; // 최대 3개
}
```

#### 리턴값
```javascript
{
  success: true,
  data: {
    attributes: [
      {
        name: "퍼즐/블럭 조각 수",
        dataType: "NUMBER", 
        inputType: "INPUT",
        required: "MANDATORY",
        basicUnit: "개"
      },
      {
        name: "색상",
        dataType: "STRING",
        inputType: "INPUT",
        required: "MANDATORY",
        basicUnit: "없음"
      },
      {
        name: "입체퍼즐 종류",
        dataType: "STRING",
        inputType: "SELECT", 
        required: "OPTIONAL",
        inputValues: ["교통수단", "건물", "캐릭터", "동물"]
      }
    ]
  },
  message: "카테고리 77426 속성 추출 성공"
}
```

### getCoupangCategoryNotices(accessKey, secretKey, displayCategoryCode, phoneNumber)
카테고리 메타데이터에서 공지사항 정보를 추출하여 상품 등록용 형태로 변환

```javascript
import { getCoupangCategoryNotices } from './service/assist/categoryMeta.js';

const result = await getCoupangCategoryNotices(accessKey, secretKey, 77426, "02-1234-5678");

if (result.success) {
  const notices = result.data.notices;
}
```

#### 리턴값 (실제 테스트 결과 기준)
```javascript
{
  success: true,
  data: {
    notices: [
      {
        noticeCategoryName: "기타 재화",
        noticeCategoryDetailName: "품명 및 모델명",
        content: "상세페이지참조"
      },
      {
        noticeCategoryName: "기타 재화",
        noticeCategoryDetailName: "인증/허가 사항",
        content: "상세페이지참조"
      },
      {
        noticeCategoryName: "기타 재화",
        noticeCategoryDetailName: "제조국(원산지)",
        content: "중국"
      },
      {
        noticeCategoryName: "기타 재화",
        noticeCategoryDetailName: "제조자(수입자)",
        content: "한국"
      },
      {
        noticeCategoryName: "기타 재화",
        noticeCategoryDetailName: "소비자상담 관련 전화번호",
        content: "02-1234-5678"
      }
    ]
  },
  message: "카테고리 77426 공지사항 추출 성공"
}
```

## 가격 계산 로직

### calculatePrices() 함수 (`priceCalculator.js`)
원가에서 최종 판매가까지 계산하는 복합 함수입니다.

**계산 과정:**
1. 원가 (variants.price: "3000.00")
2. 환율 적용 (중국: 210원, 미국: 1400원)
3. 수수료 적용 (구매수수료 2%)
4. 관세/부가세 적용 (수입관세 8%, 수입부가세 10%)
5. 배송비 추가
6. 마진 적용 (기본 마진 20%)
7. 최종 판매가 계산

**결과:**
- `calculatedPrice`: 876280 (최종 판매가)
- `cost`: 642600 (총 비용)

### generateRandomDiscount() 함수
설정된 범위 내에서 랜덤 할인률을 생성합니다.

**설정값 (실제 테스트 기준):**
- `minPercentage`: 10%
- `maxPercentage`: 30%
- **결과**: 29% (랜덤 생성)

### 10원 단위 올림 처리
쿠팡 요구사항에 따라 `originalPrice`는 반드시 10원 단위여야 합니다.

```javascript
function calculateOriginalPrice(salePrice, discountRate) {
  if (!discountRate || discountRate <= 0) {
    const price = salePrice * 1.1; // 기본 10% 할인 적용
    return Math.ceil(price / 10) * 10; // 10원 단위로 올림
  }
  
  // 할인률을 역산: 원가 = 판매가 / (1 - 할인률/100)
  const originalPrice = salePrice / (1 - discountRate / 100);
  return Math.ceil(originalPrice / 10) * 10; // 10원 단위로 올림
}
```

**예시:**
- `salePrice`: 876280
- `discountRate`: 29%
- 계산: 876280 / (1 - 29/100) = 1234194.366...
- **결과**: 1234200 (10원 단위로 올림)

## 공지사항 처리 로직
1. **우선순위**: "기타 재화" 카테고리 우선, 없으면 첫 번째 카테고리 사용
2. **자동 값 설정**:
   - 제조국(원산지) 또는 제조국 → "중국"
   - 제조자(수입자) → "한국"
   - A/S 책임자와 전화번호 또는 소비자상담 관련 전화번호 → 파라미터로 받은 전화번호
   - 그 외 모든 필드 → "상세페이지참조"

## 속성 필터링 로직
1. `exposed === "EXPOSED"` 속성만 선택
2. `groupNumber`가 정수인 경우 동일한 번호 중 1개만 선택
3. `groupNumber`가 "NONE"인 경우 모두 포함
4. 최대 3개까지 반환

## 에러 처리
모든 함수는 동일한 에러 처리 구조를 사용합니다:

```javascript
{
  success: false,
  error: "에러 메시지",
  message: "카테고리 77426 메타데이터 조회 실패",
  data: null
}
```

## 최종 operator.js 반환 구조

```javascript
{
  success: true/false,
  message: "처리 결과 메시지",
  registeredProductNumber: 15568763006,  // 성공 시만
  itemsCount: 4,                        // 등록된 아이템 수
  error: "에러 메시지",                  // 실패 시만
  statusData: {                         // worker.js에서 상태 저장에 사용
    mappingData: {...},                 // 매핑된 쿠팡 데이터
    discountRate: 29,                   // 할인률
    marketNumber: 2                     // 마켓 번호
  },
  userid: 2,
  productid: 721963707226
}
```