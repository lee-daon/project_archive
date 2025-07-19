# ESM 엑셀 생성 모듈 스키마

## 1. 기본 데이터 스키마 (getBaseData.js 반환값)

```javascript
// getBaseData(userid, productIds) 반환 배열의 각 요소
{
  productid: 123456789,
  jsonData: { // pre_register의 JSON 데이터 (파싱됨)
    success: true,
    productInfo: {
      productId: "622706981192",
      url: "https://detail.1688.com/offer/622706981192.html",
      productName: "고급 면 반팔 셔츠 남성용",
      categoryId: "CAT001",
      brandName: "BRAND",
      deliveryFee: 2500,
      video: "https://video.url",
      keywords: ["셔츠", "남성", "면", "반팔"],
      representativeImage: "https://image.url/nukki/main.jpg",
      images: ["https://image.url/main1.jpg", "https://image.url/main2.jpg"],
      descriptionImages: ["https://image.url/desc1.jpg", "https://image.url/desc2.jpg"],
      attributes: [{ name: "브랜드", value: "BRAND" }, { name: "소재", value: "면 100%" }],
      attributes_cut: "브랜드 / 소재"
    },
    optionSchema: [
      {
        optionId: "1627207",
        optionName: "색상분류",
        optionValues: [
          { valueId: "1177220561", valueName: "화이트", imageUrl: "https://image.url/color_white.jpg" },
          { valueId: "1177220562", valueName: "블랙", imageUrl: "https://image.url/color_black.jpg" }
        ]
      },
      {
        optionId: "1627208",
        optionName: "사이즈",
        optionValues: [{ valueId: "3232478", valueName: "M" }, { valueId: "3232479", valueName: "L" }]
      }
    ],
    variants: [
      {
        stockQuantity: 100,
        price: "25000.00",
        optionCombination: [
          { optionId: "1627207", valueId: "1177220561" },
          { optionId: "1627208", valueId: "3232478" }
        ]
      }
    ]
  },
  esmCatId: "CAT001",
  gmarketCatId: "GCAT001",
  auctionCatId: "ACAT001",
  productGroupCode: "GROUP123"
}
```

## 2. 설정 데이터 스키마 (getConfig.js 반환값)

```javascript
{
  esmConfig: {
    includeImportDuty: true,       // 관부과세 포함 여부
    includeDeliveryFee: true       // 배송비 포함 여부
  },
  priceConfig: {
    minimumMargin: 5000,           // 최소 마진 (정수)
    buyingFee: 2,                  // 구매 수수료 (%)
    importDuty: 8,                 // 수입 관세 (%)
    importVat: 10,                 // 수입 부가세 (%)
    chinaExchangeRate: 210,        // 중국 환율
    usaExchangeRate: 1400,         // 미국 환율
    minPercentage: 10,             // 최소 할인 퍼센트
    maxPercentage: 30,             // 최대 할인 퍼센트
    basicDeliveryFee: 8000         // 기본 배송비
  },
  detailPageConfig: {
    includeProperties: true,       // 속성 포함 여부
    includeOptions: true,          // 옵션 포함 여부
    useAzOption: true             // A-Z 옵션 사용 여부
  },
  productManagementMap: {          // 상품별 등록 관리 정보 (productid로 매핑)
    123456789: {
      productid: 123456789,
      delivery_fee: 2500,
      minimum_profit_margin: 10,
      profit_margin: 20,
      market_number: 1
    }
  },
  accountInfoMap: {                // 마켓별 계정 정보 (market_number로 매핑)
    1: {
      esm_market_number: 1,
      auction_id: "auction123",
      gmarket_id: "gmarket123",
      top_image_1: "https://...",
      top_image_2: "https://...",
      top_image_3: "https://...",
      bottom_image_1: "https://...",
      bottom_image_2: "https://...",
      bottom_image_3: "https://..."
    }
  },
  productIds: [123456789, 987654321] // 전체 상품 ID 목록
}
```

## 3. createInitialJson.js 반환값 (operator.js에서 사용)
```javascript
// createInitialJson 함수 반환값
{
  success: true,
  message: "ESM createInitialJson 함수 모든 단계 완료 - 최종 JSON 생성됨",
  initialJson: {
    productId: "622706981192",
    productName: "고급 면 반팔 셔츠 남성용",
    esmCatId: "ESM_CAT001",
    gmarketCatId: "G_CAT001",
    auctionCatId: "A_CAT001",
    brandName: "BRAND",
    keywords: ["셔츠", "남성", "면", "반팔"],
    representativeImage: "https://image.url/nukki/main.jpg",
    images: ["https://image.url/main1.jpg", "https://image.url/main2.jpg"],
    contents: "<html>...상품 상세 HTML...</html>",
    optionSchema: [
      {
        optionId: "1627207",
        optionName: "A. 색상분류", // A-Z 접두어 적용됨
        optionValues: [
          { valueId: "1177220561", valueName: "화이트", imageUrl: "https://image.url/color_white.jpg" },
          { valueId: "1177220562", valueName: "블랙", imageUrl: "https://image.url/color_black.jpg" }
        ]
      },
      {
        optionId: "1627208",
        optionName: "사이즈",
        optionValues: [{ valueId: "3232478", valueName: "M" }, { valueId: "3232479", valueName: "L" }]
      }
    ],
    variants: [
      {
        stockQuantity: 100,
        calculatedPrice: 32500,
        cost: 21000,
        optionCombination: [
          { optionId: "1627207", valueId: "1177220561" },
          { optionId: "1627208", valueId: "3232478" }
        ]
      }
    ],
    deliveryInfo: {
      deliveryFee: 0,
      freeShipping: true
    },
    discountRate: 15,
    accountInfo: {
      gmarketId: "gmarket123",
      auctionId: "auction123",
      esmMarketNumber: 1
    }
  }
}
```

## 4. 상태 저장 함수 스키마

### saveBulkStatus(userid, successProducts, failedProducts)
```javascript
// 여러 상품 일괄 상태 업데이트
// successProducts: [
//   { productid: 123, finalMainPrice: 32500, marketNumber: 1 },
//   { productid: 456, finalMainPrice: 45000, marketNumber: 1 }
// ]
// failedProducts: [
//   { productid: 111, errorMessage: "카테고리 매핑 오류" },
//   { productid: 222, errorMessage: "JSON 파싱 실패" }
// ]
```

## 5. 데이터베이스 스키마 변경점

### esm_setting 테이블 (신규 추가)
```sql
CREATE TABLE esm_setting (
    userid INT NOT NULL,
    include_import_duty BOOLEAN DEFAULT TRUE,  -- 관부과세 포함 여부
    include_delivery_fee BOOLEAN DEFAULT TRUE, -- 배송비 포함 여부
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (userid),
    FOREIGN KEY (userid) REFERENCES user_info(userid)
);
```

## 6. ESM 특징

1. **수동 등록**: API가 아닌 엑셀 파일 생성 후 수동 업로드
2. **상태**: 'success' (엑셀 생성 완료) 상태 사용
3. **originProductNo**: 업데이트하지 않음 (수동 등록 후 별도 업데이트 필요)
4. **일괄 처리**: 여러 상품을 한 번에 엑셀로 생성
5. **간단한 설정**: 관부과세/배송비 포함 여부만 관리
6. **개별 상품 등록**: 각 옵션 조합(variant)을 별도의 상품으로 분리하여 등록
7. **옵션 처리**: 모든 상품의 옵션타입을 "미사용"으로 고정하고, 옵션 정보는 상품명에 포함

## 7. ESM 엑셀 생성 로직

### 옵션 처리 방식
- **기존**: 하나의 상품에 여러 옵션 조합을 추천옵션 형식으로 처리
- **변경**: 각 옵션 조합(variant)을 개별 상품으로 분리
- **옵션타입**: 항상 "미사용"으로 고정
- **옵션명/옵션값**: 빈 값으로 설정
- **상품명**: 원본 상품명 그대로 사용 (옵션 정보 추가하지 않음, 최대 50글자)

### 가격 계산
- 각 variant의 개별 calculatedPrice 사용
- 할인률 기반 정가/판매가 역산 로직 적용
- 10원 단위 올림 처리

### 엑셀 매핑 (컬럼별)
```
B열: "옥션/G마켓" (고정)
C열: 옥션ID (accountInfo.auction_id)
D열: G마켓ID (accountInfo.gmarket_id)
E열: 상품명 (원본 상품명, 최대 50글자)
K열: ESM 카테고리코드
L열: 옥션 카테고리코드
M열: G마켓 카테고리코드
O열: 정가 (할인 전)
P열: 판매가 (정가와 동일)
Q열: 할인방식 ("정률(%)" 또는 빈값)
R열: 할인률
S열: 할인방식 (복사값)
T열: 할인률 (복사값)
W열: 옵션타입 ("미사용" 고정)
X열: 옵션명 (빈값)
Y열: 추천옵션 (빈값)
Z열: 기본이미지
AA열: 추가이미지URL
AB열: 상품상세설명
```

## 8. 원본 JSON 데이터 구조 (참고용 - jsonData 필드와 동일)

```