# Order Control Module

## 개요
주문 관리를 위한 상품 검색 기능을 제공하는 모듈입니다. 식별코드와 상품명을 통한 상품 검색을 지원합니다.

## 모듈 구조
```
orderControl/
├── controller/
│   └── searchProduct.js    # API 컨트롤러
├── repository/
│   └── findProduct.js      # 데이터베이스 접근 로직
├── service/
│   └── searchProduct.js    # 비즈니스 로직
├── index.js               # 라우터 설정
├── api.md                 # API 명세서
└── readme.md              # 이 파일
```

## 주요 기능

### 1. 상품 검색 (GET /order/search-product)
- **식별코드 검색**: 숫자로 시작하는 검색어를 식별코드로 인식
- **상품명 검색**: 문자가 포함된 검색어를 상품명으로 인식
- **옵션 정보 제공**: 식별코드에 옵션 정보가 포함된 경우 옵션 상세 정보 반환

## 기능 상세

### 식별코드 검색
- `sellerProductCode`: 기본 상품 정보만 반환
- `optionManageCode`: 상품 정보 + 옵션 정보 반환
- 옵션 정보는 번역된 옵션명/값과 옵션 이미지를 포함

### 상품명 검색
- 정확 일치 검색 (완전 일치)
- 가장 적합한 첫 번째 결과만 반환
- 검색 우선순위: 최적화된 제목 > 번역된 제목 > 원본 제목

## 데이터베이스 테이블

### 사용하는 테이블
- `products_detail`: 상품 기본 정보
- `item_images_raw`: 상품 이미지
- `product_options`: 옵션 정보 (옵션명, 옵션값, 이미지)

### 테이블 관계
```
products_detail (1) ──── (N) item_images_raw
                    │
                    └──── (N) product_options (via prop_path)
```

## 사용 예시

### 1. 기본 상품 검색
```javascript
// 식별코드로 검색
GET /order/search-product?searchTerm=123456789

// 상품명으로 검색
GET /order/search-product?searchTerm=나이키 운동화
```

### 2. 옵션 포함 상품 검색
```javascript
// 옵션 정보가 포함된 식별코드
GET /order/search-product?searchTerm=123456789;1:2:색상:빨강;3:4:사이즈:XL
```

## 비즈니스 로직

### 검색어 판별 로직
```javascript
function isIdentifierCode(str) {
    return /^[0-9]/.test(str);  // 숫자로 시작하면 식별코드
}
```

### 식별코드 파싱
```javascript
// 입력: "123456789;1:2:색상:빨강;3:4:사이즈:XL"
// 파싱 결과:
{
    productId: "123456789",
    hasOptions: true,
    optionParts: ["1:2:색상:빨강", "3:4:사이즈:XL"]
}
```

### prop_path 생성
```javascript
// 옵션 부분에서 optionId:valueId 추출
// "1:2:색상:빨강" → prop_path: "1:2"
```

## 에러 처리

### 입력 검증
- `userid` 필수 검증
- `searchTerm` 필수 검증
- 식별코드 형식 검증

### 데이터베이스 오류
- 연결 실패 시 서버 오류 반환
- 쿼리 실패 시 적절한 오류 메시지 반환

### 검색 결과 없음
- 식별코드 검색: "상품을 찾을 수 없습니다."
- 상품명 검색: "해당 상품명으로 상품을 찾을 수 없습니다."

## 성능 최적화

### 데이터베이스 쿼리 최적화
- 인덱스 활용: `userid`, `productid`
- 필요한 컬럼만 SELECT
- LIMIT을 통한 결과 제한

### 이미지 조회 최적화
- 모든 검색에서 첫 번째 이미지만 조회
- 상품명 검색 시에도 단일 상품만 반환하므로 효율적

## 확장 가능성

### 추가 검색 옵션
- 카테고리별 검색
- 가격대별 필터링
- 브랜드별 필터링

### 정렬 옵션
- 가격 순 정렬
- 등록일 순 정렬
- 인기도 순 정렬

## 의존성
- `connectDB.js`: 데이터베이스 연결
- `express`: 웹 프레임워크
- MySQL: 데이터베이스

## ⚠️ 역방향 의존성 경고

### Public API 모듈의 의존성 문제
현재 `public-api/getProductInfo/getSoldProduct.js`가 이 모듈의 `searchProduct` 함수를 직접 import하고 있습니다:

```javascript
// 문제가 되는 의존성
import { searchProduct } from '../../modules/orderControl/service/searchProduct.js';
```

**문제점:**
- **아키텍처 원칙 위반**: Public API(외부 접점)가 내부 모듈에 직접 의존
- **결합도 증가**: 내부 모듈 변경 시 Public API에 영향
- **테스트 복잡성**: Public API 테스트 시 내부 모듈 전체 의존성 필요

**임시 상황:**
- 현재는 기능 구현을 위해 **임시로** 직접 의존 허용
- 향후 아키텍처 개선 시 **우선 순위 높음**으로 리팩토링 필요

이 의존성은 **예외적이며 임시적**인 상황임을 명시합니다.

## 테스트
상세한 테스트 예시는 `api.md` 파일을 참고하세요.
