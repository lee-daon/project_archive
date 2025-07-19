# Public API 문서

## 개요
이 API는 외부 클라이언트가 상품 소싱 서비스에 접근할 수 있도록 제공되는 Public API입니다.

## 기본 정보
```
Base URL: http://localhost:3000/apiEnterprise
인증 방식: API Key (enterprise 플랜만)
Rate Limit: 엔드포인트별로 상이 (sourcing: 초당 1회)
```

## API 키 발급
```http
POST /auth/api-key/generate
Authorization: Bearer JWT_TOKEN
```

## 인증

### API Key 인증
모든 요청에는 API Key가 필요합니다.

**권장 방식:**
```http
X-API-Key: sk_{userid}_{고유번호}
```

**또는:**
```http
Authorization: Bearer sk_{userid}_{고유번호}
```

## 엔드포인트

### 1. 상품 URL 직접 소싱 요청

**POST** `/sourcing`

상품 URL 리스트를 받아서 ID를 추출하고 직접 소싱하여 업로드까지 처리합니다.

#### Rate Limit
- 초당 1회 요청 제한

#### 요청 형식
```json
{
  "urls": [
    "https://example.com/product?id=839482",
    "https://example.com/product?id=123456",
  ]
}
```

#### 요청 제한사항
- `urls` 배열: 최소 1개, 최대 99개
- 각 URL: 필수, 유효한 URL 형식
- URL에서 상품 ID 추출 가능해야 함 (쿼리 파라미터 `id` 또는 경로 마지막 숫자)

#### 응답 형식

**성공 응답 (200)**
```json
{
  "success": true,
  "message": "2개 상품이 처리되었습니다. 1개 상품은 API 호출에 실패했습니다.",
  "successCount": 2,
  "failedCount": 1,
  "failedProducts": [
    {
      "productId": "invalid_product_id",
      "error": "API 호출 실패"
    }
  ]
}
```

#### 오류 응답

**400 - 잘못된 요청**
```json
{
  "success": false,
  "message": "유효한 urls 배열이 필요합니다."
}
```

**400 - 유효하지 않은 URL**
```json
{
  "success": false,
  "message": "일부 URL에서 상품 ID를 추출할 수 없습니다.",
  "invalidUrls": [
    {
      "index": 0,
      "url": "invalid-url",
      "reason": "유효하지 않은 URL"
    },
    {
      "index": 2,
      "url": "https://example.com/no-id",
      "reason": "URL에서 상품 ID를 추출할 수 없습니다"
    }
  ]
}
```

**400 - 상품 개수 초과**
```json
{
  "success": false,
  "message": "한 번에 요청할 수 있는 상품은 최대 99개입니다."
}
```

**401 - 인증 오류**
```json
{
  "success": false,
  "message": "API 키가 필요합니다."
}
```

**429 - Rate Limit 초과**
```json
{
  "success": false,
  "message": "초당 1개 요청을 초과했습니다. 1초 후 다시 시도해주세요.",
  "retryAfter": 1
}
  ```

### 2. 상품 상세 데이터 조회

**POST** `/product-detail`

상품 ID로 등록된 상품의 상세 JSON 데이터를 조회합니다.

#### Rate Limit
- 초당 5회 요청 제한

#### 요청 형식
```json
{
  "productId": "607454902338"
}
```

#### 요청 제한사항
- `productId`: 필수

#### 응답 형식

**성공 응답 (200)**
```json
{
  "success": true,
  "message": "상품 데이터를 성공적으로 조회했습니다.",
  "productData": {
    "success": true,
    "productInfo": {
      "productId": "721963707226",
      "productName": "산투이 3톤 소형 롤러",
      "brandName": "나이키/Nike",
      "categoryId": "127742003",
      "url": "//item.taobao.com/item.htm?id=721963707226",
      "deliveryFee": "0.00",
      "representativeImage": "https://pub-b852f1bb5d3a419d93134a68870b6ea5.r2.dev/translated/1747794844927-721963707226-4-main.jpg",
      "images": [
        "https://pub-b852f1bb5d3a419d93134a68870b6ea5.r2.dev/translated/1747794843777-721963707226-1-main.jpg",
        "https://pub-b852f1bb5d3a419d93134a68870b6ea5.r2.dev/translated/1747794843262-721963707226-2-main.jpg"
      ],
      "video": null,
      "keywords": [
        "소형 롤러",
        "보행식 롤러",
        "아스팔트 롤러",
        "건설 장비",
        "도로 장비"
      ],
      "attributes": [
        {
          "name": "모델",
          "value": "SRD03 C6JS"
        },
        {
          "name": "브랜드",
          "value": "산추이"
        },
        {
          "name": "색상 분류",
          "value": "산추이 핸드 가이드 2륜 예약금, 산추이 1톤 2륜 예약금"
        }
      ],
      "attributes_cut": "모델 / 브랜드 / 색상 분류",
      "descriptionImages": []
    },
    "optionSchema": [
      {
        "optionId": "1627207",
        "optionName": "색상 분류",
        "optionValues": [
          {
            "valueId": "25155353817",
            "valueName": "산투이 핸드 가이드 양륜 예약금",
            "imageUrl": "https://pub-b852f1bb5d3a419d93134a68870b6ea5.r2.dev/translated/1747796040357-721963707226-1627207:25155353817-option.jpg"
          },
          {
            "valueId": "25155353818",
            "valueName": "산투이 1톤 쌍륜 예약금",
            "imageUrl": "https://pub-b852f1bb5d3a419d93134a68870b6ea5.r2.dev/translated/1747796041647-721963707226-1627207:25155353818-option.jpg"
          }
        ]
      },
      {
        "optionId": "1627208",
        "optionName": "사이즈",
        "optionValues": [
          {
            "valueId": "25155353855",
            "valueName": "255",
            "imageUrl": "https://pub-b852f1bb5d3a419d93134a68870b6ea5.r2.dev/translated/1747796043421-721963707226-1627208:25155353855-option.jpg"
          },
          {
            "valueId": "25155353860",
            "valueName": "260",
            "imageUrl": "https://pub-b852f1bb5d3a419d93134a68870b6ea5.r2.dev/translated/1747796044156-721963707226-1627208:25155353860-option.jpg"
          }
        ]
      }
    ],
    "variants": [
      {
        "price": "3000.00",
        "stockQuantity": 200,
        "optionCombination": [
          {
            "optionId": "1627207",
            "valueId": "25155353817"
          },
          {
            "optionId": "1627208",
            "valueId": "25155353855"
          }
        ]
      },
      {
        "price": "3200.00",
        "stockQuantity": 150,
        "optionCombination": [
          {
            "optionId": "1627207",
            "valueId": "25155353817"
          },
          {
            "optionId": "1627208",
            "valueId": "25155353860"
          }
        ]
      },
      {
        "price": "3100.00",
        "stockQuantity": 180,
        "optionCombination": [
          {
            "optionId": "1627207",
            "valueId": "25155353818"
          },
          {
            "optionId": "1627208",
            "valueId": "25155353855"
          }
        ]
      },
      {
        "price": "3300.00",
        "stockQuantity": 120,
        "optionCombination": [
          {
            "optionId": "1627207",
            "valueId": "25155353818"
          },
          {
            "optionId": "1627208",
            "valueId": "25155353860"
          }
        ]
      }
    ]
  }
}
```

#### 오류 응답

**400 - 잘못된 요청**
```json
{
  "success": false,
  "message": "productId가 필요합니다."
}
```

**400 - 유효하지 않은 productId**
```json
{
  "success": false,
  "message": "유효한 productId 형식이 필요합니다."
}
```

**404 - 상품을 찾을 수 없음**
```json
{
  "success": false,
  "message": "해당 상품을 찾을 수 없습니다."
}
```

**429 - Rate Limit 초과**
```json
{
  "success": false,
  "message": "초당 5개 요청을 초과했습니다. 1초 후 다시 시도해주세요.",
  "retryAfter": 1
}
```

### 3. 상품 리스트 조회

**POST** `/product-list`

사용자의 등록된 상품 ID 목록을 조회합니다.

#### Rate Limit
- 초당 10회 요청 제한

#### 요청 형식
```json
{
  "allowDuplicates": true,
  "groupCode": "GROUP_001"
}
```

#### 요청 제한사항
- `allowDuplicates`: 선택사항, boolean (기본값: false)
- `groupCode`: 선택사항, 문자열
- 둘 다 제공하지 않으면 최근 등록된 10개 상품 ID 반환

#### 응답 형식

**성공 응답 (200)**
```json
{
  "success": true,
  "message": "5개의 상품을 조회했습니다.",
  "productIds": [
    721963707226,
    607454902338,
    123456789012,
    987654321098,
    555666777888
  ]
}
```

#### 오류 응답

**400 - 잘못된 요청**
```json
{
  "success": false,
  "message": "allowDuplicates는 boolean 타입이어야 합니다."
}
```

**400 - 잘못된 groupCode**
```json
{
  "success": false,
  "message": "groupCode는 문자열이어야 합니다."
}
```

**429 - Rate Limit 초과**
```json
{
  "success": false,
  "message": "초당 10개 요청을 초과했습니다. 1초 후 다시 시도해주세요.",
  "retryAfter": 1
}
```

### 4. 판매된 상품 검색

**POST** `/sold-product`

식별코드 또는 상품명으로 판매된 상품을 검색합니다.

#### Rate Limit
- 초당 5회 요청 제한

#### 요청 형식
```json
{
  "searchTerm": "123456789"
}
```

또는

```json
{
  "searchTerm": "나이키 운동화"
}
```

#### 요청 제한사항
- `searchTerm`: 필수, 문자열 (식별코드 또는 상품명)

#### 검색 로직
- 숫자로 시작하는 경우: 식별코드로 인식
- 문자가 포함된 경우: 상품명으로 인식 (정확히 일치, 첫 번째 결과만 반환)

#### 응답 형식

**성공 응답 - 식별코드 검색 (200)**
```json
{
  "success": true,
  "message": "상품을 성공적으로 찾았습니다.",
  "searchType": "identifierCode",
  "productData": {
    "userid": 123,
    "productId": "123456789",
    "titleRaw": "원본 상품명",
    "detailUrl": "https://detail.url",
    "image": "https://image.url",
    "hasOptions": true,
    "options": [
      {
        "propPath": "1:2",
        "optionName": "색상",
        "optionValue": "빨강",
        "imageUrl": "https://option-image.url",
        "translatedOptionName": "Color",
        "translatedOptionValue": "Red"
      }
    ]
  }
}
```

**성공 응답 - 상품명 검색 (200)**
```json
{
  "success": true,
  "message": "상품을 성공적으로 찾았습니다.",
  "searchType": "productName",
  "productData": {
    "userid": 123,
    "productId": "123456789",
    "titleRaw": "원본 상품명",
    "productTitle": "최적화된 상품명",
    "detailUrl": "https://detail.url",
    "image": "https://image.url",
    "hasOptions": false,
    "options": []
  }
}
```

#### 오류 응답

**400 - 잘못된 요청**
```json
{
  "success": false,
  "message": "searchTerm이 필요합니다."
}
```

**404 - 상품을 찾을 수 없음**
```json
{
  "success": false,
  "message": "상품을 찾을 수 없습니다.",
  "searchType": null,
  "productData": null
}
```

**429 - Rate Limit 초과**
```json
{
  "success": false,
  "message": "요청이 너무 많습니다. 초당 최대 5개의 요청만 허용됩니다.",
  "retryAfter": 1
}
```

#### 식별코드 형식
- **기본**: `{productId}`
- **옵션 포함**: `{productId};{optionId}:{valueId}:{optionName}:{optionValue};...`

#### 예시
```bash
# 식별코드로 검색
curl -X POST http://localhost:3000/apiEnterprise/sold-product \
  -H "X-API-Key: sk_123_abc123def456" \
  -H "Content-Type: application/json" \
  -d '{
    "searchTerm": "123456789"
  }'

# 상품명으로 검색
curl -X POST http://localhost:3000/apiEnterprise/sold-product \
  -H "X-API-Key: sk_123_abc123def456" \
  -H "Content-Type: application/json" \
  -d '{
    "searchTerm": "나이키 운동화"
  }'
```

## 주요 오류 코드

| 상태 코드 | 설명 |
|----------|------|
| 400 | 잘못된 요청 형식 |
| 401 | API 키 오류 |
| 403 | 권한 없음 |
| 429 | 요청 제한 초과 |
| 500 | 내부 서버 오류 |

## 사용 예시

### cURL 예시
```bash
# 상품 URL 소싱 요청
curl -X POST http://localhost:3000/apiEnterprise/sourcing \
  -H "X-API-Key: sk_123_abc123def456" \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://example.com/product?id=839482",
      "https://example.com/product?id=123456",
    ]
  }'
```

### JavaScript 예시
```javascript
const response = await fetch('http://localhost:3000/apiEnterprise/sourcing', {
  method: 'POST',
  headers: {
    'X-API-Key': 'sk_123_abc123def456',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    urls: [
      'https://example.com/product?id=839482',
      'https://example.com/product?id=123456',
      'https://example.com/item/789012'
    ]
  })
});

const result = await response.json();
console.log(result);
```

### 상품 상세 데이터 조회 예시

#### cURL 예시
```bash
# 상품 상세 데이터 조회
curl -X POST http://localhost:3000/apiEnterprise/product-detail \
  -H "X-API-Key: sk_123_abc123def456" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "607454902338"
  }'
```

#### JavaScript 예시
```javascript
const response = await fetch('http://localhost:3000/apiEnterprise/product-detail', {
  method: 'POST',
  headers: {
    'X-API-Key': 'sk_123_abc123def456',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    productId: '607454902338'
  })
});

const result = await response.json();
console.log(result);
```

### 상품 리스트 조회 예시

#### cURL 예시
```bash
# 기본 조회 (중복 제거, 최근 10개)
curl -X POST http://localhost:3000/apiEnterprise/product-list \
  -H "X-API-Key: sk_123_abc123def456" \
  -H "Content-Type: application/json" \
  -d '{}'

# 특정 그룹의 상품만 조회
curl -X POST http://localhost:3000/apiEnterprise/product-list \
  -H "X-API-Key: sk_123_abc123def456" \
  -H "Content-Type: application/json" \
  -d '{
    "groupCode": "GROUP_001"
  }'

# 중복 허용하여 조회
curl -X POST http://localhost:3000/apiEnterprise/product-list \
  -H "X-API-Key: sk_123_abc123def456" \
  -H "Content-Type: application/json" \
  -d '{
    "allowDuplicates": true,
    "groupCode": "GROUP_001"
  }'
```

#### JavaScript 예시
```javascript
// 기본 조회
const response = await fetch('http://localhost:3000/apiEnterprise/product-list', {
  method: 'POST',
  headers: {
    'X-API-Key': 'sk_123_abc123def456',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({})
});

// 특정 조건으로 조회
const response2 = await fetch('http://localhost:3000/apiEnterprise/product-list', {
  method: 'POST',
  headers: {
    'X-API-Key': 'sk_123_abc123def456',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    allowDuplicates: true,
    groupCode: 'GROUP_001'
  })
});

const result = await response.json();
console.log(result.productIds); // [721963707226, 607454902338, ...]
```

## productData 구조 설명

반환되는 `productData`는 소싱된 상품의 기본 정보와 옵션 데이터입니다:

### 주요 구성 요소

#### 1. **기본 정보**
- `success`: 처리 성공 여부 (boolean)

#### 2. **productInfo** - 기본 상품 정보
- `productId`: 상품 ID
- `productName`: 상품명
- `brandName`: 브랜드명
- `categoryId`: 카테고리 ID
- `url`: 원본 상품 URL
- `deliveryFee`: 배송비
- `representativeImage`: 대표 이미지 URL
- `images`: 상품 이미지 URL 배열
- `video`: 상품 동영상 URL (없으면 null)
- `keywords`: 검색 키워드 배열
- `attributes`: 상품 속성 배열
  - `name`: 속성명 (예: "모델", "브랜드", "색상 분류")
  - `value`: 속성값
- `attributes_cut`: 속성 요약 (슬래시로 구분)
- `descriptionImages`: 상품 설명 이미지 배열

#### 3. **optionSchema** - 옵션 스키마
상품의 선택 가능한 옵션들:
- `optionId`: 옵션 ID
- `optionName`: 옵션명 (예: "색상 분류")
- `optionValues`: 옵션 값 배열
  - `valueId`: 값 ID
  - `valueName`: 옵션 값 이름
  - `imageUrl`: 옵션 이미지 URL

#### 4. **variants** - 상품 변형 정보
각 변형별 가격과 재고, 옵션 조합:
- `price`: 가격 (문자열)
- `stockQuantity`: 재고 수량
- `optionCombination`: 옵션 조합 배열
  - `optionId`: 옵션 ID (optionSchema의 optionId와 매칭)
  - `valueId`: 옵션 값 ID (optionSchema의 valueId와 매칭)

이 데이터는 상품의 기본 정보와 모든 옵션 조합을 포함하여 상품 등록이나 관리에 필요한 핵심 정보를 제공합니다.

## 보안 주의사항

1. **Rate Limit**: 각 엔드포인트별로 요청 제한이 있습니다. 429 오류 시 `retryAfter` 값만큼 대기 후 재시도하세요.

2. **API Key 보안**: API Key는 안전하게 보관하고, 클라이언트 측 코드에 하드코딩하지 마세요.

3. **데이터 검증**: 요청 전에 클라이언트 측에서도 데이터를 검증하여 불필요한 요청을 방지하세요.

4. **오류 처리**: 모든 응답에 `success` 필드가 포함되므로, 이를 통해 성공/실패를 판단하세요.

5. **Enterprise 플랜**: Public API는 enterprise 플랜 사용자만 이용할 수 있습니다.
