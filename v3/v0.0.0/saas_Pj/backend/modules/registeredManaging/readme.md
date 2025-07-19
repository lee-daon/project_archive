# Registered Managing Module

등록된 상품을 관리하는 모듈입니다. 쿠팡, 네이버, 11번가에 등록된 상품들의 조회, 관리, 트래킹 통계 조회, 가격 변경 기능을 제공합니다.

## 🚀 빠른 시작

### 기본 사용법
```bash
# 등록된 상품 조회
GET /regmng/get-registering-info?platform=coopang

# 트래킹 통계 조회  
GET /regmng/get-tracking-stats?productId=123

# 상품 가격 변경
POST /regmng/change-price

# 상품 삭제
DELETE /regmng/delete-products
```

## 📋 주요 기능

- **등록 상품 조회**: 플랫폼별 등록된 상품 목록 조회
- **트래킹 통계**: 상품별 조회수 통계 및 날짜별 상세 데이터 (Loopton Analytics 연동)
- **상품 관리**: 마켓에서 내리기, 영구 삭제
- **가격 변경**: 최소 마진 보장하며 할인율 적용한 가격 변경
- **상태별 통계**: 전체 플랫폼 상태별 상품 개수 제공
- **다중 필터링**: 그룹코드, 상품명, 마켓번호 등으로 필터링

## 📊 지원 플랫폼

| 플랫폼 | 상태 | 상품번호 필드 | 관리 테이블 |
|--------|------|---------------|-------------|
| 쿠팡 | ✅ 구현완료 | `registered_product_number` | `coopang_register_management` |
| 네이버 | ✅ 구현완료 | `originProductNo` | `naver_register_management` |
| 11번가 | ✅ 구현완료 | `originProductNo` | `elevenstore_register_management` |

## 🚀 사용 예시

### 1. 등록된 상품 조회
```javascript
GET /regmng/get-registering-info?platform=coopang&page=1&pageSize=20
```

### 2. 상품명으로 필터링
```javascript
GET /regmng/get-registering-info?platform=naver&productName=스마트폰&sortOrder=desc
```

### 3. 그룹코드별 조회
```javascript
GET /regmng/get-registering-info?platform=coopang&groupCode=GROUP001&marketNumber=1
```

### 4. 마켓에서 상품 내리기
```javascript
POST /regmng/remove-from-market
{
  "platform": "coopang",
  "products": [
    { "productid": "123", "productNumber": "12345678" }
  ]
}
```

### 5. 상품 영구 삭제
```javascript
DELETE /regmng/delete-products
{
  "platform": "coopang", 
  "products": [
    { "productid": "123", "productNumber": "12345678" }
  ]
}
```

### 6. 트래킹 통계 조회
```javascript
GET /regmng/get-tracking-stats?days=30&market=total&sortOrder=desc
```

### 7. 상품별 날짜별 조회수
```javascript
GET /regmng/get-tracking-details?productId=123&days=14
```

### 8. 상품 가격 변경 (최소 마진 보장)
```javascript
POST /regmng/change-price
{
  "productIds": ["123", "456", "789"],
  "platform": "coopang",
  "discountPercent": 15
}
```

### 9. 조회수 범위 필터링
```javascript
GET /regmng/get-tracking-stats?minViews=10&maxViews=100&market=cou&days=7
```

### 10. 응답에 포함되는 전체 플랫폼 상태별 개수
```json
{
  "statusCounts": {
    "pending": 25,    // 쿠팡 + 네이버 + 11번가 전체 대기 중
    "success": 120,   // 쿠팡 + 네이버 + 11번가 전체 성공
    "fail": 5        // 쿠팡 + 네이버 + 11번가 전체 실패
  }
}
```

## 📊 지원 플랫폼

| 플랫폼 | 상태 | 상품번호 필드 | 관리 테이블 |
|--------|------|---------------|-------------|
| 쿠팡 | ✅ 구현완료 | `registered_product_number` | `coopang_register_management` |
| 네이버 | ✅ 구현완료 | `originProductNo` | `naver_register_management` |
| 11번가 | ✅ 구현완료 | `originProductNo` | `elevenstore_register_management` |

## 📚 API 전체 목록 (6개)

1. **GET** `/regmng/get-tracking-stats` - 상품 조회수 통계
2. **GET** `/regmng/get-tracking-details` - 상품별 날짜별 조회수  
3. **GET** `/regmng/get-registering-info` - 등록된 상품 조회
4. **POST** `/regmng/remove-from-market` - 마켓에서 상품 내리기
5. **DELETE** `/regmng/delete-products` - 상품 영구 삭제
6. **POST** `/regmng/change-price` - 상품 가격 변경 (마진 보장)

## 📚 문서

- **[API 명세서](./api.md)**: 상세한 API 엔드포인트 문서 (6개 API)
- **[아키텍처](./architecture.md)**: 모듈 구조 및 설계 문서

## 🔍 식별코드 시스템

| 타입 | 형태 | 예시 |
|------|------|------|
| 단일 상품 | `{productId}` | `2431242` |
| 옵션 상품 | `{productId};{optionInfo}` | `2431242;32:3:크기:25;124:323:색상:노랑` |

## ⚠️ 주의사항

- **인증 필요**: 모든 API는 JWT 토큰 인증 필요
- **외부 API**: 트래킹 통계는 외부 서비스 연동으로 응답 시간이 길 수 있음 (최대 30초)
- **11번가 기능**: 가격 변경 및 전시중지 기능 지원 (전체 등록 기능은 추후 예정)
- **가격 변경**: 최소 마진 보장으로 요청된 할인율이 자동 조정될 수 있음
- **API 호출 간격**: 쿠팡(1초), 네이버(벌크), 11번가(0.3초)
- **트래킹 데이터**: 외부 API에서 조회된 상품만 내부 DB 정보와 결합하여 반환
