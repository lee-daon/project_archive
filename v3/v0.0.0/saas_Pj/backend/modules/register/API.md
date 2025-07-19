# Register Module API Documentation

## Base URL
```
{API_BASE_URL}/reg
```

---

## 1. 초기 데이터 로딩

### GET `/reg/initial`

페이지 로딩 시 필요한 초기 데이터를 가져옵니다.

**요청**
```http
GET /reg/initial
Authorization: Bearer {JWT_TOKEN}
```

**응답**
```json
{
  "products": [
    {
      "id": 1,
      "name": "무선 블루투스 이어폰",
      "naver_attempts": 2,
      "coopang_attemts": 3,
      "elevenstore_attempts": 1,
      "esm_attempts": 0,
      "url": "https://example.com/product/1"
    }
  ],
  "groupCodes": [
    {
      "code": "GRP001",
      "memo": "오늘 등록할꺼"
    }
  ],
  "coopang_markets": [
    {
      "market_number": "C001",
      "market_memo": "쿠팡 메인 계정",
      "maximun_sku_count": 1000,
      "sku_count": 750
    }
  ],
  "naver_markets": [
    {
      "market_number": "N001",
      "market_memo": "네이버 메인 스토어",
      "maximun_sku_count": 2000,
      "sku_count": 1200
    }
  ],
  "elevenstore_markets": [
    {
      "market_number": "E001",
      "market_memo": "11번가 메인 스토어",
      "maximun_sku_count": 1500,
      "sku_count": 800
    }
  ],
  "esm_markets": [
    {
      "market_number": "ESM001",
      "market_memo": "ESM 메인 계정",
      "maximun_sku_count": 3000,
      "sku_count": 1500
    }
  ],
  "defaultSettings": {
    "shippingFee": 8000,
    "defaultMargin": 30,
    "minMargin": 15
  }
}
```

---

## 2. 상품 검색

### GET `/reg/search`

탭 정보와 필터 조건에 따라 상품을 검색합니다.

**요청**
```http
GET /reg/search?tabInfo=common&groupCode=GRP001
Authorization: Bearer {JWT_TOKEN}
```

**쿼리 파라미터**
- `tabInfo` (required): 탭 타입 (`common`, `naver`, `coupang`, `elevenstore`, `esm`)
- `groupCode` (optional): 그룹 코드 필터

**응답**
```json
{
  "products": [
    {
      "id": 1,
      "name": "무선 블루투스 이어폰",
      "naver_attempts": 2,
      "coopang_attemts": 3,
      "elevenstore_attempts": 1,
      "esm_attempts": 0,
      "url": "https://example.com/product/1"
    },
    {
      "id": 2,
      "name": "스마트폰 케이스",
      "naver_attempts": 1,
      "coopang_attemts": 2,
      "elevenstore_attempts": 0,
      "esm_attempts": 2,
      "url": "https://example.com/product/2"
    }
  ]
}
```

**탭별 필터링 조건**
- `common`: 모든 마켓 등록 상태 확인 (네이버, 쿠팡, 11번가, ESM)
- `naver`: 네이버 등록 관련만 확인 (쿠팡, 11번가, ESM 조건 무시)
- `coupang`: 쿠팡 등록 관련만 확인 (네이버, 11번가, ESM 조건 무시)
- `elevenstore`: 11번가 등록 관련만 확인 (네이버, 쿠팡, ESM 조건 무시)
- `esm`: ESM 등록 관련만 확인 (네이버, 쿠팡, 11번가 조건 무시)

---

## 3. 상품 이미지 조회

### GET `/reg/image/{productId}`

특정 상품의 이미지 URL을 가져옵니다.

**요청**
```http
GET /reg/image/1
Authorization: Bearer {JWT_TOKEN}
```

**경로 파라미터**
- `productId` (required): 상품 ID (숫자)

**응답**
```json
{
  "imageUrl": "https://example.com/images/product/1.jpg"
}
```

**에러 응답**
```json
{
  "success": false,
  "error": "이미지를 찾을 수 없습니다.",
  "code": "IMAGE_NOT_FOUND"
}
```

---

## 4. 상품 등록

### POST `/reg/register`

선택된 상품들을 지정된 마켓에 등록합니다.

**요청**
```http
POST /reg/register
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**요청 본문**
```json
{
  "ids": [1, 2, 3],
  "tabInfo": "common",
  "settings": {
    "groupCode": "GRP001",
    "shippingFee": 8000,
    "minMargin": 15,
    "defaultMargin": 30,
    "coopangMarket": "23",
    "naverMarket": "231",
    "elevenstoreMarket": "31",
    "esmMarket": "1"
  }
}
```

**요청 필드 설명**
- `ids`: 등록할 상품 ID 배열 (숫자)
- `tabInfo`: 현재 탭 정보 (`common`, `naver`, `coupang`, `elevenstore`, `esm`)
- `settings.groupCode`: 그룹 코드 (선택사항)
- `settings.shippingFee`: 배송비 (사용자 입력, 기본값: 8000)
- `settings.minMargin`: 최소허용마진 (사용자 입력, 기본값: 15%)
- `settings.defaultMargin`: 기본마진 (사용자 입력, 기본값: 30%)
- `settings.coopangMarket`: 쿠팡 마켓 번호 (쿠팡 등록시 필수)
- `settings.naverMarket`: 네이버 마켓 번호 (네이버 등록시 필수)
- `settings.elevenstoreMarket`: 11번가 마켓 번호 (11번가 등록시 필수)
- `settings.esmMarket`: ESM 마켓 번호 (ESM 등록시 필수)

**응답**
```json
{
  "success": true,
  "message": "등록 요청이 처리되었습니다. 성공: 3개, 실패: 0개",
  "successCount": 3,
  "failCount": 0,
  "results": [
    {
      "productId": 1,
      "success": true,
      "message": "등록 요청이 완료되었습니다.",
      "markets": [
        {
          "market": "naver",
          "status": "queued",
          "message": "큐에 등록되었습니다."
        },
        {
          "market": "coopang",
          "status": "queued",
          "message": "큐에 등록되었습니다."
        },
        {
          "market": "elevenstore",
          "status": "queued",
          "message": "큐에 등록되었습니다."
        }
      ]
    }
  ]
}
```

**등록 처리 과정**
1. **마켓 결정**: `tabInfo`에 따라 등록할 마켓 결정
   - `common`: naverMarket, coopangMarket, elevenstoreMarket, esmMarket 설정에 따라 모든 마켓 등록 가능
   - `naver`: naverMarket 설정시에만 네이버에 등록
   - `coopang`/`coupang`: coopangMarket 설정시에만 쿠팡에 등록
   - `elevenstore`: elevenstoreMarket 설정시에만 11번가에 등록
   - `esm`: esmMarket 설정시에만 ESM에 등록 (**엑셀 생성 방식**)

2. **등록 제한 확인**: 각 마켓별로 등록 가능한 SKU 수 확인
   - 최대 등록 가능 수량 vs 현재 등록된 수량 비교
   - 요청 수량이 가능 수량을 초과하면 등록 거부

3. **등록 상태 업데이트**: 각 마켓별 등록 관리 테이블에 상태 저장
   - `naver_register_management` 테이블 (네이버)
   - `coopang_register_management` 테이블 (쿠팡)
   - `elevenstore_register_management` 테이블 (11번가)
   - `esm_register_management` 테이블 (ESM)
   - 상태: 'pending', 시도 횟수 증가

4. **등록 처리**: 마켓별로 다른 처리 방식 적용
   - **큐 방식** (네이버, 쿠팡, 11번가): Redis 큐에 등록 작업 추가
     - `NAVER_REGISTER` 큐 (네이버 등록 작업)
     - `COOPANG_REGISTER` 큐 (쿠팡 등록 작업)
     - `ELEVENSTORE_REGISTER` 큐 (11번가 등록 작업)
     - 백그라운드에서 실제 등록 처리
   - **엑셀 생성 방식** (ESM): 즉시 엑셀 파일 생성
     - 상품 정보를 ESM 형식으로 변환
     - XLSX 파일 생성 및 임시 저장
     - 다운로드 URL 제공

**에러 케이스**
```json
{
  "success": false,
  "error": "등록할 마켓이 지정되지 않았습니다. naverMarket, coopangMarket, elevenstoreMarket 또는 esmMarket 설정이 필요합니다.",
  "code": "REGISTRATION_ERROR"
}
```

```json
{
  "success": false,
  "error": "elevenstore 등록 가능한 상품 수를 초과했습니다. (요청: 5개, 가능: 3개)",
  "code": "REGISTRATION_ERROR"
}
```

**ESM 등록 응답 (엑셀 파일 포함)**
```json
{
  "success": true,
  "message": "등록 요청이 처리되었습니다. 성공: 2개, 실패: 0개. ESM 엑셀 파일이 생성되었습니다.",
  "successCount": 2,
  "failCount": 0,
  "results": [
    {
      "productId": 1,
      "success": true,
      "message": "등록 요청이 완료되었습니다.",
      "markets": [
        {
          "market": "esm",
          "status": "prepared",
          "message": "엑셀 생성 준비가 완료되었습니다."
        }
      ]
    }
  ],
  "excelFile": {
    "fileName": "ESM_products_123_1640995200000.xlsx",
    "filePath": "/temp/ESM_products_123_1640995200000.xlsx",
    "downloadUrl": "/reg/download/excel/ESM_products_123_1640995200000.xlsx",
    "productCount": 2,
    "createdAt": "2023-12-31T23:59:59.999Z"
  }
}
```

---

## 5. 상품 폐기

### POST `/reg/discard`

선택된 상품들을 폐기 처리합니다.

**요청**
```http
POST /reg/discard
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**요청 본문**
```json
{
  "ids": [1, 2],
  "tabInfo": "common",
  "settings": {
    "groupCode": "GRP001",
    "shippingFee": 8000,
    "minMargin": 15,
    "defaultMargin": 30,
    "coopangMarket": "C001",
    "naverMarket": "N001",
    "elevenstoreMarket": "E001"
  }
}
```

**응답**
```json
{
  "success": true,
  "message": "상품 폐기가 완료되었습니다.",
  "discardedCount": 2,
  "results": [
    {
      "productId": 1,
      "success": true,
      "message": "폐기 완료"
    },
    {
      "productId": 2,
      "success": true,
      "message": "폐기 완료"
    }
  ]
}
```

## 사용 예시

### 11번가만 등록
```javascript
const response = await fetch('/api/reg/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ids: [1, 2, 3],
    tabInfo: 'elevenstore',
    settings: {
      elevenstoreMarket: 'E001',
      defaultMargin: 30,
      minMargin: 15,
      shippingFee: 6000
    }
  })
});
```

### 모든 마켓 등록 (네이버 + 쿠팡 + 11번가 + ESM)
```javascript
const response = await fetch('/api/reg/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ids: [1, 2, 3],
    tabInfo: 'common',
    settings: {
      naverMarket: 'N001',
      coopangMarket: 'C001',
      elevenstoreMarket: 'E001',
      esmMarket: 'ESM001',
      defaultMargin: 30,
      minMargin: 15,
      shippingFee: 6000
    }
  })
});

// common 탭에서 ESM이 포함된 경우 응답에 excelFile 포함됨
if (response.excelFile) {
  // ESM 엑셀 파일 다운로드
  window.open(response.excelFile.downloadUrl, '_blank');
}
```

### ESM 등록 (엑셀 파일 생성)
```javascript
const response = await fetch('/api/reg/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ids: [1, 2, 3],
    tabInfo: 'esm',
    settings: {
      esmMarket: 'ESM001',
      defaultMargin: 30,
      minMargin: 15,
      shippingFee: 6000
    }
  })
});

// ESM 등록 시 응답에서 excelFile 정보 확인
if (response.excelFile) {
  // 엑셀 파일 다운로드
  window.open(response.excelFile.downloadUrl, '_blank');
}
```

---

## 6. 쿠팡 옵션 매핑

### GET `/reg/coopangmapping/products`

옵션 매핑이 필요한 상품 목록을 조회합니다.

**요청**
```http
GET /reg/coopangmapping/products
Authorization: Bearer {JWT_TOKEN}
```

**응답**
```json
{
  "success": true,
  "message": "옵션 매핑 필요 상품 목록 조회 성공",
  "count": 2,
  "products": [
    {
      "productid": "12345",
      "title": "무선 블루투스 이어폰",
      "imageurl": "https://example.com/image.jpg"
    }
  ]
}
```

### GET `/reg/coopangmapping/product/{productid}`

특정 상품의 매핑 데이터를 조회합니다.

**요청**
```http
GET /reg/coopangmapping/product/12345
Authorization: Bearer {JWT_TOKEN}
```

**응답**
```json
{
  "success": true,
  "message": "상품 매핑 데이터 조회 성공",
  "data": {
    "productInfo": {
      "productid": "12345",
      "title": "무선 블루투스 이어폰",
      "json_data": {...}
    },
    "categoryAttributes": [
      {
        "name": "색상",
        "dataType": "STRING",
        "inputType": "SELECT",
        "required": "MANDATORY",
        "inputValues": ["블랙", "화이트", "실버"]
      }
    ]
  }
}
```

### POST `/reg/coopangmapping/manual/{productid}`

수동 옵션 매핑을 저장합니다.

**요청**
```http
POST /reg/coopangmapping/manual/12345
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**요청 본문**
```json
{
  "mappedJson": {
    "optionSchema": [...],
    "variants": [...]
  }
}
```

**응답**
```json
{
  "success": true,
  "message": "수동 옵션 매핑이 저장되었습니다."
}
```

### POST `/reg/coopangmapping/auto`

자동 옵션 매핑을 처리합니다.

**요청**
```http
POST /reg/coopangmapping/auto
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**요청 본문**
```json
{
  "productIds": ["12345", "67890"]
}
```

**응답**
```json
{
  "success": true,
  "message": "자동 옵션 매핑 완료: 2/2개 성공",
  "totalProcessed": 2,
  "successCount": 2,
  "results": [
    {
      "productid": "12345",
      "success": true,
      "message": "자동 옵션 매핑이 완료되었습니다."
    }
  ]
}
```

### POST `/reg/coopangmapping/discard`

상품 등록을 포기합니다.

**요청**
```http
POST /reg/coopangmapping/discard
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**요청 본문**
```json
{
  "productId": "12345"
}
```

**응답**
```json
{
  "success": true,
  "message": "상품을 성공적으로 폐기했습니다."
}
```

---

## 공통 에러 응답

### HTTP 상태 코드
- `200`: 성공
- `400`: 잘못된 요청 (필수 파라미터 누락, 유효하지 않은 값)
- `401`: 인증 실패
- `403`: 권한 없음
- `404`: 리소스를 찾을 수 없음
- `500`: 서버 내부 오류

### 에러 응답 형식
```json
{
  "success": false,
  "error": "에러 메시지",
  "code": "ERROR_CODE",
  "details": {
    "field": "오류가 발생한 필드",
    "value": "잘못된 값"
  }
}
```

