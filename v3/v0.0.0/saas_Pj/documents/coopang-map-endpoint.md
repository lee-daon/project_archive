# 쿠팡 매핑 API 구조

## 1. 옵션 매핑 필요 상품 목록 조회
**GET** `/reg/coopangmapping/products`

### 설명
옵션 매핑이 필요한 상품들의 목록을 조회합니다. (최대 50개)

### 요청
- **Headers**: Authorization (Bearer Token)
- **Query Parameters**: 없음

### 응답
```json
{
  "success": true,
  "message": "옵션 매핑 필요 상품 목록 조회 성공",
  "count": 25,
  "products": [
    {
      "productid": "123456789",
      "title": "상품명",
      "imageurl": "https://example.com/image.jpg"
    }
  ]
}
```

### 오류 응답
```json
{
  "success": false,
  "error": "오류 메시지",
  "code": "ERROR_CODE"
}
```

## 2. 특정 상품의 매핑 데이터 조회
**GET** `/reg/coopangmapping/product/:productid`

### 설명
특정 상품의 옵션 매핑을 위한 상세 정보를 조회합니다.

### 요청
- **Headers**: Authorization (Bearer Token)
- **URL Parameters**: 
  - `productid` (required): 상품 ID

### 응답
```json
{
  "success": true,
  "message": "상품 매핑 데이터 조회 성공",
  "data": {
    "productInfo": {
      "productid": "123456789",
      "title": "상품명",
      "json_data": { /* JSON 데이터 */ }
    },
    "categoryAttributes": {
      "attributes": [
        {
          "name": "속성명",
          "dataType": "STRING",
          "inputType": "SELECT",
          "required": true,
          "inputValues": ["값1", "값2"]
        }
      ]
    }
  }
}
```

### 오류 응답
```json
{
  "success": false,
  "error": "오류 메시지",
  "code": "ERROR_CODE"
}
```

## 3. 수동 옵션 매핑 저장
**POST** `/reg/coopangmapping/manual/:productid`

### 설명
수동으로 매핑된 옵션 정보를 저장합니다.

### 요청
- **Headers**: Authorization (Bearer Token)
- **URL Parameters**: 
  - `productid` (required): 상품 ID
- **Body**:
```json
{
  "mappedJson": { /* 매핑된 JSON 데이터 */ }
}
```

### 응답
```json
{
  "success": true,
  "message": "수동 옵션 매핑이 저장되었습니다."
}
```

### 오류 응답
```json
{
  "success": false,
  "error": "오류 메시지",
  "code": "ERROR_CODE"
}
```

## 4. 자동 옵션 매핑 처리
**POST** `/reg/coopangmapping/auto`

### 설명
상품 ID 배열을 받아서 AI를 통한 자동 옵션 매핑을 처리합니다.

### 요청
- **Headers**: Authorization (Bearer Token)
- **Body**:
```json
{
  "productIds": ["123456789", "987654321"]
}
```

### 응답
```json
{
  "success": true,
  "message": "자동 옵션 매핑 완료: 2/2개 성공",
  "totalProcessed": 2,
  "successCount": 2,
  "results": [
    {
      "productid": "123456789",
      "success": true,
      "message": "자동 옵션 매핑이 완료되었습니다."
    },
    {
      "productid": "987654321",
      "success": true,
      "message": "자동 옵션 매핑이 완료되었습니다."
    }
  ]
}
```

### 오류 응답
```json
{
  "success": false,
  "error": "오류 메시지",
  "code": "ERROR_CODE"
}
```
