# 11번가 등록 프로세스 데이터 구조 및 흐름

## 전체 프로세스 흐름

```
operator.js → getConfig/getBaseData → createInitialJson → mapping → XML 등록
```

## 1. operator.js - 메인 오퍼레이터

### 입력
- `userid` (number): 사용자 ID
- `productid` (number): 상품 ID

### 처리 순서
1. **getConfig()** - 설정 데이터 로드
2. **getBaseData()** - 기본 상품 데이터 로드
3. **createInitialJson()** - 1차 가공 처리
4. **mapping()** - 11번가 API 형식으로 매핑 (TODO)
5. **registerProduct()** - 실제 등록 (TODO)

### 출력
```javascript
{
    success: boolean,
    message: string,
    registeredProductNumber: string|null,
    itemsCount: number,
    error: string|null,
    statusData: {
        mappingData: object,
        discountRate: number,
        marketNumber: number,
        finalMainPrice: number,
        finalJson: object
    },
    userid: number,
    productid: number
}
```

---

## 2. getConfig.js - 설정 데이터 수집

### 데이터 소스
- `elevenstore_setting`: 11번가 특화 설정
- `common_setting`: 공통 설정 (마진, 환율, 이미지 등)
- `elevenstore_register_management`: 등록 관리 데이터
- `elevenstore_account_info`: API 키, 주소 정보

### 출력 구조
```javascript
{
    elevenstoreConfig: {
        overseasSizeChartDisplay: boolean,      // 해외사이즈 조견표 노출
        elevenstorePointAmount: number,         // 11번가 포인트 적립금
        optionArrayLogic: string,               // 옵션 배열 로직
        deliveryCompanyCode: string,            // 발송택배사번호
        asGuide: string,                        // A/S 안내
        returnExchangeGuide: string,            // 반품/교환 안내
        returnInfo: {
            returnCost: number,                 // 반품비용
            exchangeCost: number,               // 교환비용
            shippingAddressId: number,          // 출고지 주소 ID
            returnAddressId: number             // 반품지 주소 ID
        }
    },
    priceConfig: {
        minimumMargin: number,                  // 최소 마진
        minimumProfitMargin: number,            // 최소 수익률
        profitMargin: number,                   // 수익률
        deliveryFee: number,                    // 배송비
        buyingFee: number,                      // 구매 수수료
        importDuty: number,                     // 관세율
        importVat: number,                      // 부가세율
        chinaExchangeRate: number,              // 중국 환율
        usaExchangeRate: number,                // 미국 환율
        minPercentage: number,                  // 최소 할인율
        maxPercentage: number,                  // 최대 할인율
        includeDeliveryFee: boolean,            // 배송비 포함 여부
        includeImportDuty: boolean              // 관부가세 포함 여부
    },
    detailPageConfig: {
        topImages: string[],                    // 상단 이미지들
        bottomImages: string[],                 // 하단 이미지들
        includeProperties: boolean,             // 속성 포함 여부
        includeOptions: boolean                 // 옵션 포함 여부
    },
    registerManagement: {
        marketNumber: number                    // 11번가 상점 번호
    },
    elevenstoreApiAuth: {
        apiKey: string                          // 11번가 API 키
    }
}
```

---

## 3. getBaseData.js - 기본 상품 데이터 수집

### 데이터 소스
- `pre_register`: JSON 데이터, 상품 그룹 코드
- `products_detail`: 카테고리 ID
- `categorymapping`: 11번가 카테고리 ID

### 출력 구조
```javascript
{
    jsonData: {                                 // 상품 원본 JSON 데이터 (API-docs.md의 productData 구조와 동일)
        success: boolean,
        productInfo: {
            productId: string,                  // 상품 ID
            productName: string,                // 상품명
            brandName: string,                  // 브랜드명
            categoryId: string,                 // 카테고리 ID
            url: string,                        // 원본 상품 URL
            deliveryFee: string,                // 배송비
            representativeImage: string,        // 대표 이미지 URL
            images: string[],                   // 상품 이미지 URL 배열
            video: string|null,                 // 상품 동영상 URL
            keywords: string[],                 // 검색 키워드 배열
            attributes: [{                      // 상품 속성 배열
                name: string,                   // 속성명
                value: string                   // 속성값
            }],
            attributes_cut: string,             // 속성 요약
            descriptionImages: string[]         // 상품 설명 이미지 배열
        },
        optionSchema: [{                        // 옵션 스키마
            optionId: string,                   // 옵션 ID
            optionName: string,                 // 옵션명
            optionValues: [{                    // 옵션 값 배열
                valueId: string,                // 값 ID
                valueName: string,              // 옵션 값 이름
                imageUrl: string                // 옵션 이미지 URL
            }]
        }],
        variants: [{                            // 상품 변형 정보
            price: string,                      // 가격 (위안화)
            stockQuantity: number,              // 재고 수량
            optionCombination: [{               // 옵션 조합
                optionId: string,               // 옵션 ID
                valueId: string                 // 옵션 값 ID
            }]
        }]
    },
    elevenstoreCatId: number,                   // 11번가 카테고리 ID
    productGroupCode: string                    // 상품 그룹 코드
}
```

---

## 4. createInitialJson.js - 1차 가공 처리

### 주요 기능
1. **상세페이지 HTML 생성** (`generateDetailContent`)
2. **가격 계산** (`calculatePrices`)
3. **할인율 생성** (`generateRandomDiscount`)
4. **이미지 URL 정리** (`cleanImageUrl`)

### 입력
- `jsonData`: 상품 원본 데이터
- `elevenstoreCatId`: 11번가 카테고리 ID
- `priceConfig`: 가격 설정
- `elevenstoreConfig`: 11번가 설정
- `detailPageConfig`: 상세페이지 설정
- `userid`, `productid`, `productGroupCode`

### 처리 과정

#### 4.1. 상세페이지 HTML 생성
```javascript
// 트래킹 URL 생성
const trackingUrl = `https://an.loopton.com/ele/${userid}/${productid}/${productGroupCode}`;

// HTML 생성
const detailContent = generateDetailContent(
    descriptionImages,          // 상세 이미지
    attributes,                 // 상품 속성 (설정에 따라)
    optionNamesWithImages,      // 옵션 이미지 (설정에 따라)
    topImages,                  // 상단 이미지
    bottomImages,               // 하단 이미지
    trackingUrl                 // 트래킹 URL
);
```

#### 4.2. 가격 계산
```javascript
// 11번가 수수료: 13%
const priceCalculationResult = await calculatePrices(
    variants,
    priceConfig,
    productId
);

// 결과 구조
{
    variants: [{
        stockQuantity: number,
        calculatedPrice: number,    // 계산된 판매가 (10원 단위 올림)
        cost: number,              // 원가
        optionCombination: array   // 옵션 조합 정보
    }],
    deliveryInfo: {
        deliveryFee: number,       // 배송비
        freeShipping: boolean      // 무료배송 여부
    }
}
```

#### 4.3. 할인율 생성
```javascript
// 설정된 범위 내에서 랜덤 할인율 생성
const discountRate = generateRandomDiscount(priceConfig, productId);
// 예: 10% ~ 30% 범위에서 랜덤
```

### 출력 구조
```javascript
{
    success: true,
    message: string,
    initialJson: {
        productId: string,
        productName: string,
        elevenstoreCatId: number,
        brandName: string,
        keywords: string[],
        representativeImage: string,            // 대표 이미지 (정리됨)
        images: string[],                       // 상품 이미지들 (정리됨)
        contents: string,                       // 상세페이지 HTML
        optionSchema: [{                        // 옵션 스키마 (정리됨)
            optionName: string,
            optionValues: [{
                valueName: string,
                imageUrl: string                // 정리된 URL
            }]
        }],
        variants: [{                            // 가격 계산된 variants
            stockQuantity: number,
            calculatedPrice: number,
            cost: number,
            optionCombination: array
        }],
        deliveryInfo: {
            deliveryFee: number,
            freeShipping: boolean
        },
        discountRate: number
    }
}
```

---

## 5. 최종 XML 매핑 구조 (baseStructure.md 참조)

### 주요 매핑 포인트

#### 5.1. 기본 상품 정보
```xml
<prdNm>{productName}</prdNm>
<dispCtgrNo>{elevenstoreCatId}</dispCtgrNo>
<brand>{brandName}</brand>
<selPrc>{최저 calculatedPrice}</selPrc>
```

#### 5.2. 이미지 정보
```xml
<prdImage01>{representativeImage}</prdImage01>
<prdImage02>{images[0]}</prdImage02>
<prdImage03>{images[1]}</prdImage03>
<prdImage04>{images[2]}</prdImage04>
<htmlDetail>{contents}</htmlDetail>
```

#### 5.3. 할인 정보
```xml
<dscAmtPercnt>{discountRate}</dscAmtPercnt>
<cupnDscMthdCd>02</cupnDscMthdCd>
```

#### 5.4. 11번가 포인트
```xml
<pay11YN>Y</pay11YN>
<pay11Value>{elevenstorePointAmount}</pay11Value>
```

#### 5.5. 배송 정보
```xml
<dlvEtprsCd>{deliveryCompanyCode}</dlvEtprsCd>
<dlvCstInstBasiCd>{freeShipping ? '01' : '02'}</dlvCstInstBasiCd>
<dlvCst1>{deliveryFee}</dlvCst1>
```

#### 5.6. 조합형 옵션 (ProductRootOption + ProductOptionExt)
```xml
<optSelectYn>Y</optSelectYn>
<optMixYn>N</optMixYn>

<!-- UI 구조화 -->
<ProductRootOption>
    <colTitle>{optionSchema[0].optionName}</colTitle>
    <ProductOption>
        <colOptPrice>0</colOptPrice>
        <colValue0>{optionSchema[0].optionValues[0].valueName}</colValue0>
        <optionImage>{optionSchema[0].optionValues[0].imageUrl}</optionImage>
    </ProductOption>
</ProductRootOption>

<!-- 개별 가격/재고 설정 -->
<ProductOptionExt>
    <ProductOption>
        <useYn>Y</useYn>
        <colOptPrice>{variant.calculatedPrice - 기본가}</colOptPrice>
        <colOptCount>{variant.stockQuantity}</colOptCount>
        <optionMappingKey>{매핑키}</optionMappingKey>
    </ProductOption>
</ProductOptionExt>
```

#### 5.7. A/S 및 반품/교환 정보
```xml
<asDetail>{elevenstoreConfig.asGuide}</asDetail>
<rtngExchDetail>{elevenstoreConfig.returnExchangeGuide}</rtngExchDetail>
<rtngdDlvCst>{elevenstoreConfig.returnInfo.returnCost}</rtngdDlvCst>
<exchDlvCst>{elevenstoreConfig.returnInfo.exchangeCost}</exchDlvCst>
```

---

## 6. 다음 구현 예정 사항

### 6.1. mapping.js (TODO)
- `initialJson` → 11번가 XML 구조로 매핑
- 옵션 매핑키 생성 로직
- 개별 가격 설정 로직

### 6.2. registerProduct.js (TODO)
- 11번가 API 호출
- XML 전송 및 응답 처리
- 에러 처리 및 재시도 로직

### 6.3. worker.js (TODO)
- 상태 관리 및 DB 업데이트
- 큐 처리 로직

---

## 7. 11번가 특화 기능

### 7.1. 조견표 설정
```javascript
overseasSizeChartDisplay: boolean → <abrdSizetableDispYn>Y/N</abrdSizetableDispYn>
```

### 7.2. 옵션 배열 로직
```javascript
optionArrayLogic: 'most_products' | 'lowest_price'
// most_products: 가장 많은 상품 우선
// lowest_price: 최저가 우선
```

### 7.3. 관부가세 포함 설정
```javascript
includeImportDuty: boolean → <importFeeCd>01/02</importFeeCd>
// 01: 포함, 02: 미포함
```
