# Registered Managing API 문서

## 🔗 Base URL
```
/regmng
```

## 📝 인증
모든 API는 JWT 토큰 기반 인증이 필요합니다. `req.user.userid`를 통해 사용자 정보를 획득합니다.

---

## 📋 API 목록

### 1. 상품 조회수 통계

#### `GET /regmng/get-tracking-stats`

등록된 상품들의 트래킹 조회수 통계를 가져옵니다. 트래킹 API에서 조회된 상품들에 대해서만 내부 DB 정보를 결합하여 반환합니다.

#### 요청 파라미터

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|------|--------|------|
| `productId` | string | ❌ | - | 특정 상품 ID로 필터링 |
| `groupId` | string | ❌ | - | 특정 그룹 ID로 필터링 |
| `days` | number | ❌ | 30 | 검색에 포함할 과거 일수 (최대 365) |
| `market` | string | ❌ | 'total' | 정렬 기준 마켓 (`cou`, `nav`, `ele`, `esm`, `total`) |
| `minViews` | number | ❌ | - | 최소 조회수 필터 |
| `maxViews` | number | ❌ | - | 최대 조회수 필터 |
| `sortOrder` | string | ❌ | 'desc' | 정렬 순서 (`asc`, `desc`) |

#### 요청 예시
```bash
# 기본 조회 (최근 30일, 전체 마켓 기준)
GET /regmng/get-tracking-stats

# 특정 상품 조회
GET /regmng/get-tracking-stats?productId=123

# 그룹별 조회 (최근 7일, 쿠팡 기준 내림차순)
GET /regmng/get-tracking-stats?groupId=456&days=7&market=cou&sortOrder=desc

# ESM 마켓 기준 조회
GET /regmng/get-tracking-stats?market=esm&days=14

# 조회수 범위 필터링 (10회 이상 100회 이하)
GET /regmng/get-tracking-stats?minViews=10&maxViews=100&market=nav
```

#### 성공 응답 (200)
```json
{
  "success": true,
  "data": [
    {
      "productId": "789",
      "productName": "스마트폰 케이스",
      "groupCode": "GROUP001",
      "imageUrl": "https://example.com/image.jpg",
      "platforms": {
        "coopang": {
          "productNumber": "12345678",
          "currentMargin": 15.5
        },
        "naver": {
          "productNumber": "N987654321",
          "currentMargin": 12.3
        },
        "elevenstore": {
          "productNumber": "E123456789",
          "currentMargin": 14.2
        },
        "esm": {
          "productNumber": "ESM123456",
          "currentMargin": 13.8
        }
      },
      "totalViews": 150,
      "couViews": 50,
      "navViews": 80,
      "eleViews": 10,
      "esmViews": 10
    },
    {
      "productId": "101",
      "productName": "무선 이어폰",
      "groupCode": "GROUP002",
      "imageUrl": "https://example.com/image2.jpg",
      "platforms": {
        "coopang": {
          "productNumber": "87654321",
          "currentMargin": 18.2
        },
        "naver": null,
        "elevenstore": null,
        "esm": null
      },
      "totalViews": 95,
      "couViews": 30,
      "navViews": 60,
      "eleViews": 0,
      "esmViews": 5
    }
  ],
  "message": "트래킹 통계를 성공적으로 가져왔습니다."
}
```

#### 트래킹 데이터 없음 (200)
```json
{
  "success": true,
  "data": [],
  "message": "조회된 트래킹 데이터가 없습니다."
}
```

#### 오류 응답

**400 Bad Request**
```json
{
  "success": false,
  "message": "days 파라미터는 1~365 범위여야 합니다.",
  "error": "Invalid parameter range"
}
```

**401 Unauthorized**
```json
{
  "success": false,
  "message": "트래킹 API 오류: Unauthorized",
  "error": {
    "error": "Unauthorized"
  }
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "message": "트래킹 통계 조회 중 오류가 발생했습니다.",
  "error": "Database connection failed"
}
```

---

### 2. 상품별 날짜별 조회수

#### `GET /regmng/get-tracking-details`

특정 상품의 날짜별 상세 조회수 데이터를 가져옵니다. 상품 정보와 함께 일별 조회수 통계를 제공합니다.

#### 요청 파라미터

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|------|--------|------|
| `productId` | string | ✅ | - | 조회할 상품 ID |
| `days` | number | ❌ | 14 | 검색에 포함할 과거 일수 (최대 365) |

#### 요청 예시
```bash
# 기본 조회 (최근 14일)
GET /regmng/get-tracking-details?productId=123

# 특정 기간 조회 (최근 7일)
GET /regmng/get-tracking-details?productId=123&days=7

# 장기간 조회 (최근 90일)
GET /regmng/get-tracking-details?productId=123&days=90
```

#### 성공 응답 (200)
```json
{
  "success": true,
  "data": {
    "productId": "123",
    "productName": "스마트폰 케이스",
    "groupCode": "GROUP001",
    "imageUrl": "https://example.com/image.jpg",
    "platforms": {
      "coopang": {
        "productNumber": "12345678",
        "currentMargin": 15.5
      },
      "naver": {
        "productNumber": "N987654321",  
        "currentMargin": 12.3
      },
      "elevenstore": {
        "productNumber": "E123456789",
        "currentMargin": 14.2
      },
      "esm": {
        "productNumber": "ESM123456",
        "currentMargin": 13.8
      }
    },
    "dailyStats": [
      {
        "date": "2024-01-15",
        "totalViews": 25,
        "couViews": 10,
        "navViews": 12,
        "eleViews": 2,
        "esmViews": 1
      },
      {
        "date": "2024-01-14",
        "totalViews": 18,
        "couViews": 8,
        "navViews": 7,
        "eleViews": 2,
        "esmViews": 1
      },
      {
        "date": "2024-01-13",
        "totalViews": 32,
        "couViews": 15,
        "navViews": 14,
        "eleViews": 2,
        "esmViews": 1
      }
    ]
  },
  "message": "날짜별 상세 조회수를 성공적으로 가져왔습니다."
}
```

#### 트래킹 데이터 없음 (200)
```json
{
  "success": true,
  "data": {
    "productId": "123",
    "dailyStats": []
  },
  "message": "해당 기간에 조회 데이터가 없습니다."
}
```

#### 오류 응답

**400 Bad Request**
```json
{
  "success": false,
  "message": "userId와 productId는 필수 파라미터입니다.",
  "error": "Missing required parameters"
}
```

**401 Unauthorized**
```json
{
  "success": false,
  "message": "트래킹 API 오류: Unauthorized",
  "error": {
    "error": "Unauthorized"
  }
}
```

**408 Request Timeout**
```json
{
  "success": false,
  "message": "트래킹 API 응답 시간이 초과되었습니다.",
  "error": "Timeout"
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "message": "트래킹 상세 조회 중 오류가 발생했습니다.",
  "error": "Database connection failed"
}
```

---

### 3. 등록된 상품 조회

#### `GET /regmng/get-registering-info`

등록된 상품 목록을 조회합니다. 다양한 필터링과 페이징을 지원합니다.

#### 요청 파라미터

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|---------|------|------|--------|------|
| `platform` | string | ✅ | - | 플랫폼 (`coopang`, `naver`, `elevenstore`, `esm`) |
| `page` | number | ❌ | 1 | 페이지 번호 |
| `pageSize` | number | ❌ | 20 | 페이지 크기 (최대 100) |
| `sortOrder` | string | ❌ | 'desc' | 정렬 순서 (`asc`, `desc`) |
| `groupCode` | string | ❌ | - | 상품 그룹 코드 |
| `productName` | string | ❌ | - | 상품명 검색어 (부분 검색) |
| `marketNumber` | number | ❌ | - | 마켓 번호 |

#### 요청 예시
```bash
# 기본 조회
GET /regmng/get-registering-info?platform=coopang

# ESM 플랫폼 조회
GET /regmng/get-registering-info?platform=esm&page=1&pageSize=20

# 필터링 조회
GET /regmng/get-registering-info?platform=naver&page=2&pageSize=50&productName=스마트폰&sortOrder=asc

# 그룹별 조회
GET /regmng/get-registering-info?platform=coopang&groupCode=GROUP001&marketNumber=1
```

#### 성공 응답 (200)
```json
{
  "success": true,
  "data": [
    {
      "userid": 1,
      "productid": "2431242",
      "productName": "스마트폰 케이스",
      "marketNumber": 1,
      "status": "success",
      "productNumber": "12345678",
      "groupCode": "GROUP001",
      "imageUrl": "https://example.com/image.jpg",
      "currentMargin": 15.5,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-02T00:00:00.000Z"
    },
    {
      "userid": 1,
      "productid": "2431243",
      "productName": "ESM 상품",
      "marketNumber": 1,
      "status": "success",
      "productNumber": "ESM123456",
      "groupCode": "GROUP002",
      "imageUrl": "https://example.com/image2.jpg",
      "currentMargin": 13.8,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-02T00:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "pageSize": 20,
    "totalCount": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  },
  "statusCounts": {
    "pending": 25,
    "success": 120,
    "fail": 5
  },
  "filters": {
    "platform": "esm",
    "groupCode": "GROUP001",
    "productName": "ESM",
    "marketNumber": 1,
    "sortOrder": "desc"
  },
  "message": "esm 플랫폼 등록 상품 2개 조회 완료 (pending: 25, success: 120, fail: 5)"
}
```

#### 오류 응답

**400 Bad Request**
```json
{
  "success": false,
  "message": "플랫폼(platform)이 필요합니다. (coopang, naver, elevenstore, esm 중 선택)"
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "message": "서버 오류가 발생했습니다.",
  "error": "Database connection failed"
}
```

---

### 4. 마켓에서 상품 내리기

#### `POST /regmng/remove-from-market`

선택된 상품들을 해당 플랫폼 마켓에서 **내리도록 처리**합니다. **ESM의 경우 API 호출 없이 서버에서만 처리**되며, 다른 마켓들은 큐에 작업을 등록합니다. **DB의 상품 상태는 '재사용 가능'으로 즉시 변경됩니다.**

#### 요청 바디
```json
{
  "platform": "coopang",
  "products": [
    {
      "productid": "2431242"
    },
    {
      "productid": "2431243"
    }
  ]
}
```

#### 파라미터 설명

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `platform` | string | ✅ | 플랫폼 (`coopang`, `naver`, `elevenstore`, `esm`) |
| `products` | array | ✅ | 상품 정보 배열 |
| `products[].productid` | string | ✅ | 우리 시스템의 상품 ID |

#### 성공 응답 (202 Accepted)

**일반 마켓 (coopang, naver, elevenstore)**
```json
{
  "success": true,
  "message": "2개 상품에 대한 내리기 요청이 처리되었습니다.",
  "totalCount": 2,
  "processedCount": 2,
  "failedCount": 0,
  "failedTasks": []
}
```

**ESM 마켓**
```json
{
  "success": true,
  "message": "2개 ESM 상품이 서버에서 내려졌습니다.",
  "totalCount": 2,
  "processedCount": 2,
  "failedCount": 0,
  "failedTasks": []
}
```

#### 실패 응답 (400)
```json
{
  "success": false,
  "message": "플랫폼이 필요합니다."
}
```

---

### 5. 상품 영구 삭제

#### `DELETE /regmng/delete-products`

**내부 DB에서 상품 데이터를 즉시 삭제**합니다. **ESM의 경우 서버에서만 처리**되며, 다른 마켓들은 등록되었던 모든 마켓에서 상품을 **내리도록 큐에 작업을 등록**합니다.

#### 요청 바디
```json
{
  "products": [
    {
      "productid": "2431242"
    },
    {
      "productid": "2431243"
    }
  ]
}
```

#### 파라미터 설명

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `products` | array | ✅ | 상품 정보 배열 |
| `products[].productid` | string | ✅ | 우리 시스템의 상품 ID |

#### 성공 응답 (200)
```json
{
  "success": true,
  "message": "2개 상품 중 2개 삭제 완료, 0개 실패.",
  "deletedCount": 2,
  "failedCount": 0,
  "totalCount": 2,
  "results": [
    {
      "productid": "2431242",
      "success": true,
      "message": "DB에서 삭제되었으며, 마켓 삭제 요청이 등록되었습니다. (ESM은 서버에서만 삭제됨)"
    },
    {
      "productid": "2431243",
      "success": true,
      "message": "DB에서 삭제되었으며, 마켓 삭제 요청이 등록되었습니다. (ESM은 서버에서만 삭제됨)"
    }
  ]
}
```

#### 실패 응답 (400)
```json
{
  "success": false,
  "message": "상품 정보가 필요합니다."
}
```

---

### 6. 상품 가격 변경

#### `POST /regmng/change-price`

선택된 상품들의 가격 변경 작업을 **큐에 등록**합니다. **ESM은 가격 변경을 지원하지 않습니다.** DB의 마진/할인율은 **즉시 선반영**되며, 실제 마켓 가격 반영까지 시간이 걸릴 수 있습니다.

**주요 특징:**
- **ESM 제외**: ESM 플랫폼은 가격 변경이 불가능
- 최소 마진 보장: 할인 후에도 설정된 최소 마진율 이하로 떨어지지 않음
- 정확한 마진 계산: 마진 공식 `(판매가 - 원가) / 판매가 × 100`에 기반한 정확한 할인율 계산
- 자동 조정: 요청된 할인율이 최소 마진을 위반할 경우 자동으로 안전한 수준으로 조정

#### 요청 바디
```json
{
  "productIds": ["2431242", "2431243", "2431244"],
  "platform": "coopang",
  "discountPercent": 15
}
```

#### 파라미터 설명

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `productIds` | array | ✅ | 상품 ID 배열 (최대 100개) |
| `platform` | string | ✅ | 플랫폼 (`coopang`, `naver`, `elevenstore`) - **ESM 제외** |
| `discountPercent` | number | ✅ | 할인율 (0~99) |

#### 응답 필드 설명 (202 Accepted)

| 필드 | 타입 | 설명 |
|------|------|------|
| `success` | boolean | 요청 접수 성공 여부 |
| `message` | string | 처리 결과 메시지 |
| `data.totalCount` | number | 요청된 총 상품 개수 |
| `data.processedCount` | number | DB 업데이트 및 큐 등록 대상이 된 상품 개수 |
| `data.failedCount` | number | 사전 검증에 실패한 상품 개수 |
| `data.failedItems` | array | 실패한 상품 목록과 실패 사유 |

#### 성공 응답 (202 Accepted)
```json
{
  "success": true,
  "message": "가격 변경 요청이 등록되었습니다. 3개 중 3개가 처리 대상입니다.",
  "statusCode": 202,
  "data": {
    "totalCount": 3,
    "processedCount": 3,
    "failedCount": 0,
    "failedItems": []
  }
}
```

#### ESM 플랫폼 오류 (400)
```json
{
  "success": false,
  "message": "플랫폼은 coopang, naver, 또는 elevenstore여야 합니다. ESM은 가격 변경을 지원하지 않습니다."
}
```

#### 부분 성공 응답 (202 Accepted)
```json
{
  "success": true,
  "message": "가격 변경 요청이 등록되었습니다. 3개 중 1개가 처리 대상입니다.",
  "statusCode": 202,
  "data": {
    "totalCount": 3,
    "processedCount": 1,
    "failedCount": 2,
    "failedItems": [
      {
        "productId": "2431243",
        "success": false,
        "error": "등록 정보를 찾을 수 없습니다."
      },
      {
        "productId": "2431244",
        "success": false,
        "error": "현재 마진(10%)이 최소 마진(10%)과 같거나 낮아 할인할 수 없습니다."
      }
    ]
  }
}
```

#### 실패 응답 (400)
```json
{
  "success": false,
  "message": "상품 ID 배열이 필요합니다."
}
```

---

## 🔧 기술적 고려사항

### 1. 외부 API 의존성
- **트래킹 API**: `https://an.loopton.com` 서비스와 연동
- **응답 시간**: 최대 30초 (외부 서비스 호출)
- **인증**: Bearer 토큰 방식 (`TRACKING_API_SECRET` 환경변수)

### 2. 데이터 일관성
- 트래킹 API에서 반환된 `productId`로만 내부 DB 조회
- 트래킹 데이터가 없으면 빈 배열 반환 (fallback 없음)
- 상품 정보는 우선순위에 따라 선택 (optimized → translated → raw)

### 3. ESM 특별 처리
- **가격 변경 불가**: ESM은 change-price API에서 완전 제외
- **API 호출 없음**: 삭제/내리기 시 외부 API 호출 없이 서버에서만 처리
- **esmViews 계산**: G마켓(gma) + 옥션(acu) 조회수 합계

### 4. 성능 최적화
- 다중 상품 조회 시 단일 쿼리로 처리
- 트래킹 API 타임아웃: 30초
- 상품 정보 캐싱 권장 (구현 예정)

### 5. 에러 처리
- 트래킹 API 실패 시 적절한 에러 메시지 반환
- 네트워크 타임아웃 별도 처리
- 내부 DB 오류와 외부 API 오류 구분

---

## 📊 플랫폼별 마켓 코드

| 플랫폼 | 마켓 코드 | 설명 |
|--------|-----------|------|
| 쿠팡 | `cou` | 쿠팡 마켓플레이스 |
| 네이버 | `nav` | 네이버 스마트스토어 |
| 11번가 | `ele` | 11번가 |
| ESM | `esm` | ESM (G마켓 + 옥션 합계) |
| 전체 | `total` | 모든 플랫폼 합계 |

