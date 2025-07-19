# 네이버 등록 워커 스키마

## Config 데이터 구조

### getConfig 함수 반환 구조

```javascript
{
  // naver_register_config 테이블에서 가져온 데이터
  naverConfig: {
    deliveryCompany: 'CJGLS',
    afterServiceTelephoneNumber: '010-0000-0000',
    afterServiceGuideContent: 'A/S 안내 내용',
    naverpoint: 1000, // 네이버포인트 할인 적용 금액
    claimDeliveryInfo: { // 반품/교환 배송비
      returnDeliveryFee: 5000, // 반품 배송비
      exchangeDeliveryFee: 5000, // 교환 배송비
      shippingAddressId: 12345, // 출고지 주소 ID
      returnAddressId: 12346, // 반품/교환지 주소 ID
    },
    purchasePoint: 1000,
    reviewPointPolicy: {
      textReviewPoint: 1000,
      photoVideoReviewPoint: 1000,
      afterUseTextReviewPoint: 1000,
      afterUsePhotoVideoReviewPoint: 1000,
      storeMemberReviewPoint: 2000,
    },
    naverCashbackPrice: 1000,
    priceSettingLogic: 'many' // 가격 설정 로직
  },
  
  // common_setting 테이블에서 가져온 데이터 + naver_register_management에서 가져온 데이터
  priceConfig: {
    minimumMargin: 5000,
    minimumProfitMargin: 20,
    profitMargin: 20,
    deliveryFee: 3000,
    buyingFee: 2,
    importDuty: 8,
    importVat: 10,
    chinaExchangeRate: 210,
    usaExchangeRate: 1400,
    minPercentage: 10,
    maxPercentage: 30,
    includeDeliveryFee: true, // 배송비 포함 여부
    includeImportDuty: true, // 수입 관세 포함 여부
  },
  
  // naver_register_management 테이블에서 가져온 데이터
  registerManagement: {
    marketNumber: 1
  },
  
  // naver_account_info 테이블에서 가져온 API 인증 정보
  naverApiAuth: {
    clientSecret: 'naver_client_secret_value',
    clientId: 'naver_client_id_value'
  }
}
```

### getBaseData 함수 반환 구조

```javascript
{
    jsonData: {}, // JSON 형태의 상품 데이터
  // categorymapping 테이블에서 가져온 데이터
    naverCatId: 50000001,
}
```

JSON 데이터는 다음 구조를 갖습니다:

```json
{
  "success": true,
  "productInfo": {
    "productId": "622706981192",
    "url": "https://detail.1688.com/offer/622706981192.html",
    "productName": "고급 면 반팔 셔츠 남성용",
    "categoryId": "CAT001",
    "brandName": "BRAND",
    "deliveryFee": 2500,
    "video": "https://video.url",
    "keywords": ["셔츠", "남성", "면", "반팔"],
    "representativeImage": "https://image.url/nukki/main.jpg",
    "images": [
      "https://image.url/main1.jpg",
      "https://image.url/main2.jpg"
    ],
    "descriptionImages": [
      "https://image.url/desc1.jpg",
      "https://image.url/desc2.jpg"
    ],
    "attributes": [
      {
        "name": "브랜드",
        "value": "BRAND"
      },
      {
        "name": "소재",
        "value": "면 100%"
      }
    ],
    "attributes_cut": "브랜드 / 소재"
  },
  "optionSchema": [
    {
      "optionId": "1627207",
      "optionName": "색상분류",
      "optionValues": [
        {
          "valueId": "1177220561",
          "valueName": "화이트",
          "imageUrl": "https://image.url/color_white.jpg"
        },
        {
          "valueId": "1177220562",
          "valueName": "블랙",
          "imageUrl": "https://image.url/color_black.jpg"
        }
      ]
    },
    {
      "optionId": "1627208",
      "optionName": "사이즈",
      "optionValues": [
        {
          "valueId": "3232478",
          "valueName": "M"
        },
        {
          "valueId": "3232479",
          "valueName": "L"
        }
      ]
    }
  ],
  "variants": [
    {
      "stockQuantity": 100,
      "price": "25000.00",
      "optionCombination": [
        {
          "optionId": "1627207",
          "valueId": "1177220561"
        },
        {
          "optionId": "1627208",
          "valueId": "3232478"
        }
      ]
    }
  ]
}
```

### InitialJson 함수 처리 후 생성될 데이터 구조 (1stAssembleSchema)

```javascript
{
  "initialJson": {
    "productId": "14971809051",
    "productName": "가정용 미세먼지 제거 공기청정기",
    "naverCategoryId": 50002543,
    "brandName": "원대/Yuanda",
    "keywords": [
      "알레르기제거",
      "새집증후군제거",
      "병균살균",
      "가정용공기청정기",
      "미세먼지제거",
      "포름알데히드제거",
      "실내공기질개선",
      "공기정화",
      "미세먼지청정",
      "꽃가루제거"
    ],
    "deliveryFee": 3000,
    "images": {
      "representativeImage": {
        "url": "https://shop-phinf.pstatic.net/20250416_220/17447754382289HkU1_JPEG/15193808284042344_671916220.jpg"
      },
      "optionalImages": [
        {
          "url": "https://shop-phinf.pstatic.net/20250416_20/1744775438576zxPIu_JPEG/15193808633327242_248789786.jpg"
        },
        {
          "url": "https://shop-phinf.pstatic.net/20250416_162/1744775438953gIlGy_JPEG/15193809008676503_467006051.jpg"
        }
      ]
    },
    "contents": "HTML 형태의 상품 상세 설명 (속성 테이블 + 상세 이미지+옵션이미지)",
    "optionSchema": [
      {
        "optionId": "1627207",
        "optionName": "색상",
        "optionValues": [
          {
            "valueId": "1177220561",
            "valueName": "A. 흰색",
            "imageUrl": "https://image.url/white.jpg"
          },
          {
            "valueId": "1177220562",
            "valueName": "B. 빨간색",
            "imageUrl": "https://image.url/red.jpg"
          }
        ]
      }
    ],
    "variants": [
      {
        "stockQuantity": 80,
        "calculatedPrice": 3835650,
        "cost": 2950500,
        "optionCombination": [
          {
            "optionId": "1627207",
            "valueId": "1177220561"
          }
        ]
      },
      {
        "stockQuantity": 100,
        "calculatedPrice": 3835650,
        "cost": 2950500,
        "optionCombination": [
          {
            "optionId": "1627207",
            "valueId": "1177220562"
          }
        ]
      }
    ],
    "discountRate": 20
  },
```

## 함수 시그니처

### mainOperator
```javascript
async function mainOperator(userid, productid)
```

### getConfig
```javascript
async function getConfig(userid, productid)
```

### getBaseData
```javascript
async function getBaseData(userid, productid)
```

### InitialJson
```javascript
async function InitialJson(jsonData, naverCatId, config)
```

### optionChoice
```javascript
async function optionChoice(processedJsonData, priceSettingLogic, discountRate)
```

### createNaverProductMapping
```javascript
async function createNaverProductMapping(initialJsonResult, optionChoiceResult, config)
```

### InitialJson 함수 반환 구조 (현재 구현 상태)

```javascript
{
  success: true,
  message: "InitialJson 함수 키워드 필터링, 이미지 업로드, A-Z 옵션 처리, 가격 계산 완료",
  
  // 1단계: 키워드 필터링 결과
  filteredKeywords: [
    "알레르기제거",
    "새집증후군제거", 
    "병균살균",
    "가정용공기청정기",
    "미세먼지제거"
  ],
  
  // 2단계: 이미지 업로드 결과 (네이버 CDN)
  imageData: {
    representativeImage: {
      url: "https://shop-phinf.pstatic.net/20250416_220/17447754382289HkU1_JPEG/main.jpg"
    },
    optionalImages: [
      {
        url: "https://shop-phinf.pstatic.net/20250416_20/1744775438576zxPIu_JPEG/image1.jpg"
      },
      {
        url: "https://shop-phinf.pstatic.net/20250416_162/1744775438953gIlGy_JPEG/image2.jpg"
      }
    ]
  },
  
  // 3단계: A-Z 옵션 처리 결과
  processedJsonData: {
    // 원본 JSON 데이터에서 optionSchema의 valueName이 A-Z 접두어로 수정된 버전
    productInfo: { /* 상품 정보 */ },
    optionSchema: [
      {
        "optionId": "1627207",
        "optionName": "색상분류",
        "optionValues": [
          {
            "valueId": "1177220561",
            "valueName": "A. 화이트",
            "imageUrl": "https://image.url/white.jpg"
          },
          {
            "valueId": "1177220562",
            "valueName": "B. 블랙",
            "imageUrl": "https://image.url/black.jpg"
          }
        ]
      }
    ],
    variants: [ /* 옵션 배열 */ ]
  },
  
  // 4단계: 가격 계산 결과
  priceCalculationResult: {
    variants: [
      {
        stockQuantity: 100,
        calculatedPrice: 89500,  // 계산된 최종 판매가
        cost: 67200,             // 총 비용 (원화)
        optionCombination: [
          {
            "optionId": "1627207",
            "valueId": "1177220561"
          },
          {
            "optionId": "1627208",
            "valueId": "3232478"
          }
        ]
      }
    ],
    deliveryInfo: {
      deliveryFee: 3000,
      includeDeliveryFee: true
    }
  },
  
  // 5단계: 랜덤 할인율
  discountRate: 25,
  
  // 6단계: 상세페이지 HTML 생성 결과
  detailContent: "HTML 형태의 상품 상세 설명 (속성 테이블 + 상세 이미지 + A-Z 처리된 옵션 이미지)",
  
  // 참조용 파라미터들
  parameters: {
    originalJsonData: { /* 원본 JSON 데이터 */ },
    naverCategoryId: 50002543,
    naverApiAuth: {
      clientId: "naver_client_id_value",
      clientSecret: "naver_client_secret_value"
    },
    useAzOption: true,
    priceConfig: {
      minimumMargin: 5000,
      profitMargin: 20,
      deliveryFee: 3000,
      includeDeliveryFee: true,
      includeImportDuty: true,
      // ... 기타 설정값들
    },
    useDeliveryFee: true,
    productTrackingUrl: ""
  }
}
```

### optionChoice 함수 반환 구조

```javascript
{
  representativePrice: 200000, // 대표 가격 (할인 전 가격)
  filteredJsonData: {
    // processedJsonData와 동일한 구조이지만 variants가 필터링됨
    productInfo: { /* 상품 정보 */ },
    optionSchema: [ /* A-Z 처리된 옵션 스키마 */ ],
    variants: [
      {
        stockQuantity: 100,
        calculatedPrice: 100000,  // 할인 후 가격
        cost: 75000,              // 총 비용
        optionCombination: [
          {
            "optionId": "1627207",
            "valueId": "1177220561"
          }
        ]
      }
      // ... 필터링된 다른 variants
    ]
  }
}
```

## 가격 설정 로직별 동작 방식

### 예시 데이터
- **할인 후 가격**: 100, 110, 120, 140, 150, 170, 200
- **할인율**: 50%
- **할인 전 가격**: 200, 220, 240, 280, 300, 340, 400

### 1. low_price 전략
- **기준**: 가장 낮은 할인 후 가격 (100)
- **허용 범위**: 100 × 0.5 ~ 100 × 1.5 = 50 ~ 150
- **포함되는 옵션**: 100, 110, 120, 140, 150 (5개)
- **대표 가격**: 200 (가장 낮은 가격의 할인 전 가격)
- **대표 가격 할인 후**: 100
- **priceGap**: 0, 10, 20, 40, 50 (각 옵션 할인후 가격 - 대표가격 할인후 가격)

### 2. many 전략
각 가격을 기준으로 ±50% 범위에서 포함되는 옵션 수를 계산:
- **100 기준** (50~150): 100,110,120,140,150 → 5개
- **110 기준** (55~165): 100,110,120,140,150 → 5개  
- **120 기준** (60~180): 100,110,120,140,150,170 → 6개
- **140 기준** (70~210): 100,110,120,140,150,170,200 → 7개 ✓
- **150 기준** (75~225): 100,110,120,140,150,170,200 → 7개
- **170 기준** (85~255): 100,110,120,140,150,170,200 → 7개
- **200 기준** (100~300): 100,110,120,140,150,170,200 → 7개

**결과**: 140을 기준으로 선택 (7개 포함, 할인 전 가격이 가장 낮음)
- **대표 가격**: 280
- **대표 가격 할인 후**: 140
- **포함되는 옵션**: 100,110,120,140,150,170,200 (7개)
- **priceGap**: -40, -30, -20, 0, 10, 30, 60

### 3. ai 전략
각 가격을 기준으로 할인 전 가격의 50%를 델타로 사용:
- **100 기준** (할인전 200, 델타 100): 할인후 범위 0~200 → 7개
- **110 기준** (할인전 220, 델타 110): 할인후 범위 0~220 → 7개
- **120 기준** (할인전 240, 델타 120): 할인후 범위 0~240 → 7개
- **140 기준** (할인전 280, 델타 140): 할인후 범위 0~280 → 7개
- **150 기준** (할인전 300, 델타 150): 할인후 범위 0~300 → 7개
- **170 기준** (할인전 340, 델타 170): 할인후 범위 0~340 → 7개
- **200 기준** (할인전 400, 델타 200): 할인후 범위 0~400 → 7개

**결과**: 100을 기준으로 선택 (7개 포함, 할인 전 가격이 가장 낮음)
- **대표 가격**: 200
- **대표 가격 할인 후**: 100
- **포함되는 옵션**: 100,110,120,140,150,170,200 (7개)
- **priceGap**: 0, 10, 20, 40, 50, 70, 100

### createNaverProductMapping 함수 반환 구조

```javascript
{
  originProduct: {
    statusType: "SALE",
    saleType: "NEW", 
    leafCategoryId: 50002543,
    name: "상품명",
    detailContent: "HTML 형태의 상품 상세 설명",
    images: {
      representativeImage: {
        url: "https://shop-phinf.pstatic.net/main.jpg"
      },
      optionalImages: [
        {
          url: "https://shop-phinf.pstatic.net/image1.jpg"
        }
      ]
    },
    salePrice: 200000, // 100원 단위 올림 처리된 대표 가격
    stockQuantity: 0, // 옵션 상품은 원상품 재고 0
    
    deliveryInfo: {
      deliveryType: "DELIVERY",
      deliveryAttributeType: "NORMAL",
      deliveryCompany: "CJGLS",
      deliveryBundleGroupUsable: false,
      deliveryFee: {
        deliveryFeeType: "FREE",
        delivertFeePayType: "PREPAID",
        deliveryFeeByArea: {
          deliveryAreaType: "AREA_2",
          area2extraFee: 3000,
          area3extraFee: 3000,
        },
      },
      claimDeliveryInfo: { /* config에서 가져온 반품/교환 정보 */ },
      businessCustomsClearanceSaleYn: true,
    },

    detailAttribute: {
      afterServiceInfo: {
        afterServiceTelephoneNumber: "010-0000-0000",
        afterServiceGuideContent: "A/S 안내 내용"
      },
      originAreaInfo: {
        originAreaCode: '03',
        content: '중국',
        plural: false
      },
      sellerCodeInfo: {
        sellerManagementCode: "상품ID",
      },
      optionInfo: {
        optionCombinationSortType: 'LOW_PRICE',
        optionCombinationGroupNames: {
          optionGroupName1: "색상분류",
          optionGroupName2: "사이즈"
        },
        optionCombinations: [
          {
            stockQuantity: 100,
            price: 0, // priceGap 값
            usable: true,
            optionName1: "A. 화이트",
            optionName2: "M",
            optionName3: "",
            sellerManagerCode: "상품ID-1"
          }
        ],
        useStockManagement: true
      },
      taxType: 'TAX',
      minorPurchasable: true,
      productInfoProvidedNotice: {
        productInfoProvidedNoticeType: "ETC",
        etc: { /* 상품정보제공고시 */ }
      },
      seoInfo: {
        pageTitle: "상품명",
        metaDescription: "상품명",
        sellerTags: [
          { text: "키워드1" },
          { text: "키워드2" }
        ]
      }
    },

    customerBenefit: {
      immediateDiscountPolicy: {
        discountMethod: {
          value: 25, // 할인율
          unitType: 'PERCENT',
        }
      },
      purchasePointPolicy: {
        value: 1000,
        unitType: 'WON'
      },
      reviewPointPolicy: { /* config에서 가져온 리뷰 포인트 정책 */ },
      naverCashbackPrice: 1000
    }
  },
  smartstoreChannelProduct: {
    naverShoppingRegistration: true,
    channelProductDisplayStatusType: "ON"
  }
}
```
