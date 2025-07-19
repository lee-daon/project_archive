# Order Control API 명세서

## 개요
주문 관리 모듈의 API 엔드포인트를 정의합니다.

## 엔드포인트

### 상품 검색 API

#### GET /order/search-product

상품 식별코드 또는 상품명으로 상품을 검색합니다.

**요청**
```
GET /order/search-product?searchTerm={검색어}
```

**Query Parameters**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| searchTerm | string | Y | 검색어 (식별코드 또는 상품명) |

**검색 로직**
- 숫자로 시작하는 경우: 식별코드로 인식
- 문자가 포함된 경우: 상품명으로 인식 (정확히 일치, 첫 번째 결과만 반환)

**요청 예시**
```bash
# 식별코드로 검색
GET /order/search-product?searchTerm=123456789

# 옵션 포함 식별코드로 검색
GET /order/search-product?searchTerm=123456789;1:2:색상:빨강;3:4:사이즈:XL

# 상품명으로 검색
GET /order/search-product?searchTerm=나이키 운동화
```

**응답**

**성공 응답 (식별코드 검색)**
```json
{
  "success": true,
  "data": {
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
  },
  "searchType": "identifierCode"
}
```

**성공 응답 (상품명 검색)**
```json
{
  "success": true,
  "data": {
    "userid": 123,
    "productId": "123456789",
    "titleRaw": "원본 상품명",
    "productTitle": "최적화된 상품명",
    "detailUrl": "https://detail.url",
    "image": "https://image.url",
    "hasOptions": false,
    "options": []
  },
  "searchType": "productName"
}
```

**실패 응답**
```json
{
  "success": false,
  "message": "상품을 찾을 수 없습니다.",
  "error": "상품을 찾을 수 없습니다."
}
```

**HTTP 상태 코드**
- `200`: 검색 성공
- `400`: 잘못된 요청 (검색어 누락)
- `404`: 상품을 찾을 수 없음
- `500`: 서버 내부 오류

**에러 메시지**
- `"검색어(searchTerm)가 필요합니다."`: searchTerm 파라미터 누락
- `"상품을 찾을 수 없습니다."`: 해당 조건의 상품이 존재하지 않음
- `"해당 상품명으로 상품을 찾을 수 없습니다."`: 상품명 검색 결과 없음
- `"서버 오류가 발생했습니다."`: 서버 내부 오류

## 데이터 구조

### Product 객체
```typescript
interface Product {
  userid: number;           // 사용자 ID
  productId: string;        // 상품 ID
  titleRaw: string;         // 원본 상품명
  productTitle?: string;    // 최적화된 상품명 (상품명 검색 시)
  detailUrl: string;        // 상품 상세 URL
  image: string | null;     // 대표 이미지 URL
  hasOptions: boolean;      // 옵션 보유 여부
  options: Option[];        // 옵션 배열
}
```

### Option 객체
```typescript
interface Option {
  propPath: string;                    // 옵션 경로 (예: "1:2")
  optionName: string;                  // 옵션명
  optionValue: string;                 // 옵션값
  imageUrl: string | null;             // 옵션 이미지 URL
  translatedOptionName: string | null; // 번역된 옵션명
  translatedOptionValue: string | null;// 번역된 옵션값
}
```

## 참고사항

### 식별코드 형식
- **sellerProductCode**: `{productId}`
- **optionManageCode**: `{productId};{optionId}:{valueId}:{optionName}:{optionValue};...`

### 검색 우선순위 (상품명 검색)
1. title_optimized (최적화된 제목)
2. title_translated (번역된 제목)
3. title_raw (원본 제목)

### 제한사항
- 상품명 검색 시 가장 적합한 첫 번째 결과만 반환
- 이미지는 각 상품의 첫 번째 이미지만 반환
