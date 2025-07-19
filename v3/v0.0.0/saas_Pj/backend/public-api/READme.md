# Public API Module

## 개요
외부 클라이언트가 상품 소싱 서비스에 접근할 수 있도록 제공되는 Public API 모듈입니다. Enterprise 플랜 사용자만 이용 가능합니다.

## 모듈 구조
```
public-api/
├── getProductInfo/
│   ├── db/
│   │   └── getproductdata.js      # 데이터베이스 접근 로직
│   ├── getDetailData.js           # 상품 상세 데이터 조회
│   ├── getProductList.js          # 상품 리스트 조회
│   └── getSoldProduct.js          # 판매된 상품 검색 ⚠️
├── sourcing.js                    # URL 소싱 API
├── index.js                       # 메인 라우터
├── API-docs.md                    # API 상세 문서
└── READme.md                      # 이 파일
```

## ⚠️ 중요한 의존성 문제

### getSoldProduct.js 의존성 이슈
`getSoldProduct.js`는 현재 `modules/orderControl`에 의존하고 있습니다:
```javascript
import { searchProduct } from '../../modules/orderControl/service/searchProduct.js';
```

**문제점:**
- Public API는 독립적인 모듈이어야 하나, 내부 모듈에 직접 의존
- 아키텍처 원칙 위반 (Public API → Internal Module 의존)
- 향후 리팩토링 필요

**임시 해결책:**
- 현재는 기능 구현을 위해 임시로 직접 import 사용
- 추후 공통 서비스 레이어나 별도 API로 분리 필요

## API 엔드포인트

### 1. URL 소싱 (`/sourcing`)
- **Rate Limit**: 초당 1회
- **기능**: URL 배열을 받아 상품 ID 추출 후 소싱 처리
- **의존성**: 내부 `urlSourcing` API 호출

### 2. 상품 상세 조회 (`/product-detail`)
- **Rate Limit**: 초당 5회  
- **기능**: productId로 pre_register 테이블의 JSON 데이터 조회
- **의존성**: 독립적 (DB 직접 접근)

### 3. 상품 리스트 조회 (`/product-list`)
- **Rate Limit**: 초당 10회
- **기능**: 사용자별 상품 ID 목록 조회 (중복 제거/그룹 필터링 지원)
- **의존성**: 독립적 (DB 직접 접근)

### 4. 판매된 상품 검색 (`/sold-product`) ⚠️
- **Rate Limit**: 초당 5회
- **기능**: 식별코드/상품명으로 판매 상품 검색
- **의존성**: `orderControl` 모듈에 직접 의존 (문제)

## 인증 및 보안

### API Key 인증
```javascript
// 모든 요청에 API Key 필수
headers: {
  'X-API-Key': 'sk_{userid}_{고유번호}' 
}
```

### Rate Limiting
```javascript
// 각 엔드포인트별 제한
- sourcing: 1/sec
- product-detail: 5/sec  
- product-list: 10/sec
- sold-product: 5/sec
```

### 사용자 격리
- 모든 API는 `req.user.userid` 기반으로 데이터 격리
- API Key에서 userid 추출하여 인증

## 미들웨어 스택

### 공통 미들웨어
1. **API Key 인증** (`apikeyauth.js`)
   - API Key 검증 및 사용자 정보 추출
   - 401 오류 시 인증 실패

2. **Rate Limiter** (`publicApiRateLimiter.js`)
   - 사용자별 요청 횟수 제한
   - 메모리 기반 (Redis 없이 구현)
   - 429 오류 시 제한 초과

## 데이터베이스 테이블

### 사용하는 테이블
- `pre_register`: 상품 JSON 데이터 저장
- `user_info`: API Key 인증 정보
- 기타: orderControl 모듈의 테이블들 (getSoldProduct 전용)

### API별 테이블 접근
```
sourcing         → 내부 API 호출
product-detail   → pre_register (직접)
product-list     → pre_register (직접)  
sold-product     → products_detail, item_images_raw, product_options (간접)
```

## 응답 형식

### 표준 응답 구조
```json
{
  "success": boolean,
  "message": string,
  "data": object | array | null
}
```

### 오류 응답 구조
```json
{
  "success": false,
  "message": string,
  "error": string (선택사항)
}
```

## 사용 제한사항

### 플랜 제한
- **Enterprise 플랜**만 Public API 사용 가능
- API Key 발급은 별도 엔드포인트에서 처리

### 요청 제한
- URL 소싱: 최대 99개 URL
- 상품 리스트: 최대 10개 반환
- 모든 요청: JSON 형식만 지원

## 향후 개선 사항

### 1. 아키텍처 개선
```
현재: Public API → Internal Module (문제)
목표: Public API → Service Layer → Internal Module
```

### 2. getSoldProduct 리팩토링
- 공통 서비스 레이어 도입
- 또는 별도 검색 API 서버 분리
- 의존성 역전 원칙 적용

### 3. 성능 최적화
- Redis 기반 Rate Limiting
- 응답 캐싱 도입
- 데이터베이스 인덱스 최적화

### 4. 모니터링
- API 사용량 통계
- 에러율 모니터링  
- 성능 메트릭 수집

## 개발 가이드

### 새 엔드포인트 추가 시
1. `getProductInfo/` 하위에 라우터 파일 생성
2. `index.js`에 라우터 등록 및 Rate Limit 설정
3. `API-docs.md`에 문서 추가
4. 테스트 파일 작성

### 의존성 원칙
- **권장**: DB 직접 접근 또는 외부 API 호출
- **비권장**: 내부 모듈 직접 import (현재 getSoldProduct만 예외)

## 테스트

### 테스트 파일
- `test/unittest/testOpenApi.js`: 통합 테스트
- 모든 엔드포인트 기능 검증
- Rate Limit 동작 확인

### 테스트 실행
```bash
node test/unittest/testOpenApi.js
```

## 문서
- **API 상세 문서**: `API-docs.md`
- **엔드포인트 명세**: 각 라우터 파일 주석 참고
- **사용 예시**: `API-docs.md`의 cURL/JavaScript 예제
