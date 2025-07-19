# Setting Module API 문서

SaaS 플랫폼의 사용자 설정 관리 API 문서입니다.

## 개요

Setting 모듈은 다음과 같은 설정 관리 기능을 제공합니다:
- **공통 정책 설정**: 마진, 환율, 수수료 등 전반적인 정책 설정
- **네이버 정책 설정**: 네이버 스마트스토어 등록 관련 설정
- **쿠팡 정책 설정**: 쿠팡 등록 관련 설정
- **11번가 정책 설정**: 11번가 등록 관련 설정
- **마켓 계정 관리**: 네이버/쿠팡 마켓 계정 정보 관리
- **사용자 금지어 설정**: 개별 사용자 금지어 관리
- **쿠팡 배송지 조회**: 쿠팡 출고지/반품지 정보 조회
- **네이버 주소록 조회**: 네이버 계정 주소록 정보 조회
- **11번가 주소 조회**: 11번가 출고지/반품지 주소 정보 조회
- **상세페이지 설정**: 상품 상세페이지 이미지 및 표시 옵션 관리
- **기타 설정**: 심층 벤 사용여부, 키워드 뛰어쓰기 허용여부 및 마켓별 상품개수 관리

## 인증

모든 API는 JWT 토큰 기반 인증이 필요합니다.

```
Authorization: Bearer {your_jwt_token}
```

## 공통 응답 형식

### 성공 응답
```json
{
  "success": true,
  "data": { ... },
  "message": "성공 메시지"
}
```

### 실패 응답
```json
{
  "success": false,
  "message": "에러 메시지",
  "error": "상세 에러 정보"
}
```

## 공통 정책 설정 API

### 기본 경로
`/setting/commonPolicy`

---

### 1. 공통 설정 조회

**GET** `/setting/commonpolicy/`

사용자의 공통 설정 정보를 조회합니다. 설정이 없는 경우 기본값으로 자동 생성됩니다.

#### Response

**성공 (200)**
```json
{
  "success": true,
  "data": {
    "userid": 1,
    "minimum_margin": 5000,
    "basic_minimum_margin_percentage": 10,
    "basic_margin_percentage": 20,
    "buying_fee": 2,
    "import_duty": 8,
    "import_vat": 10,
    "china_exchange_rate": 210,
    "usa_exchange_rate": 1400,
    "min_percentage": 10,
    "max_percentage": 30,
    "basic_delivery_fee": 3000,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**실패 (400)**
```json
{
  "success": false,
  "message": "userid가 필요합니다."
}
```

**실패 (500)**
```json
{
  "success": false,
  "message": "공통 설정 조회 중 오류가 발생했습니다.",
  "error": "에러 상세 메시지"
}
```

---

### 2. 공통 설정 수정

**PUT** `/setting/commonpolicy/`

사용자의 공통 설정 정보를 수정합니다.

#### Request Body
```json
{
  "minimum_margin": 5000,
  "basic_minimum_margin_percentage": 10,
  "basic_margin_percentage": 20,
  "buying_fee": 2,
  "import_duty": 8,
  "import_vat": 10,
  "china_exchange_rate": 210,
  "usa_exchange_rate": 1400,
  "min_percentage": 10,
  "max_percentage": 30,
  "basic_delivery_fee": 3000
}
```

#### Request Body Fields
| 필드명 | 타입 | 필수 | 제약조건 | 설명 |
|--------|------|------|----------|------|
| minimum_margin | number | ✓ | - | 최소 마진 (정수) |
| basic_minimum_margin_percentage | number | ✓ | ≤ 100 | 기본 최소 마진 퍼센트 |
| basic_margin_percentage | number | ✓ | ≤ 1000 | 기본 마진 퍼센트 |
| buying_fee | number | ✓ | ≤ 100 | 구매 수수료 |
| import_duty | number | ✓ | ≤ 100 | 수입 관세 |
| import_vat | number | ✓ | ≤ 100 | 수입 부가세 |
| china_exchange_rate | number | ✓ | - | 중국 환율 |
| usa_exchange_rate | number | ✓ | - | 미국 환율 |
| min_percentage | number | ✓ | 0-100, ≤ max_percentage | 최소 할인 퍼센트 |
| max_percentage | number | ✓ | 0-100, ≥ min_percentage | 최대 할인 퍼센트 |
| basic_delivery_fee | number | ✓ | ≥ 0 | 기본 배송비 |

#### Response

**성공 (200)**
```json
{
  "success": true,
  "message": "공통 설정이 성공적으로 업데이트되었습니다."
}
```

**실패 (400) - userid 누락**
```json
{
  "success": false,
  "message": "userid가 필요합니다."
}
```

**실패 (400) - 필수 필드 누락**
```json
{
  "success": false,
  "message": "필수 필드가 누락되었습니다: minimum_margin, basic_margin_percentage"
}
```

**실패 (400) - 유효성 검증 실패**
```json
{
  "success": false,
  "message": "기본 최소 마진 퍼센트는 100 이하여야 합니다."
}
```

**실패 (500)**
```json
{
  "success": false,
  "message": "공통 설정 업데이트 중 오류가 발생했습니다.",
  "error": "에러 상세 메시지"
}
```

---

### 데이터 유효성 검증 규칙

1. **basic_minimum_margin_percentage**: 100 이하
2. **basic_margin_percentage**: 1000 이하  
3. **buying_fee, import_duty, import_vat**: 각각 100 이하
4. **min_percentage**: 0 이상, max_percentage 이하
5. **max_percentage**: 100 이하, min_percentage 이상
6. **min_percentage ≤ max_percentage**: 최소 할인율은 최대 할인율보다 작거나 같아야 함

### 기본값

새로운 사용자의 경우 다음 기본값으로 설정이 생성됩니다:

- minimum_margin: 5000
- basic_minimum_margin_percentage: 10
- basic_margin_percentage: 20
- buying_fee: 2
- import_duty: 8
- import_vat: 10
- china_exchange_rate: 210
- usa_exchange_rate: 1400
- min_percentage: 10
- max_percentage: 30 
- basic_delivery_fee: 3000

---

## 네이버 정책 설정 API

### 기본 경로
`/setting/naverpolicy`

---

### 1. 네이버 등록 설정 조회

**GET** `/setting/naverpolicy/`

사용자의 네이버 등록 설정 정보를 조회합니다. 설정이 없는 경우 기본값으로 자동 생성됩니다.

#### Response

**성공 (200)**
```json
{
  "success": true,
  "data": {
    "userid": 1,
    "delivery_company": "CJGLS",
    "after_service_telephone": "010-0000-0000",
    "after_service_guide_content": "A/S (개봉 및 택 제거 후 반품 교환 환불 불가)",
    "naver_point": 1000,
    "return_delivery_fee": 5000,
    "exchange_delivery_fee": 5000,
    "purchase_point": 1000,
    "naver_cashback_price": 1000,
    "text_review_point": 1000,
    "photo_video_review_point": 1000,
    "after_use_text_review_point": 1000,
    "after_use_photo_video_review_point": 1000,
    "store_member_review_point": 2000,
    "include_delivery_fee": true,
    "include_import_duty": true,
    "price_setting_logic": "many",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**실패 (400)**
```json
{
  "success": false,
  "message": "userid가 필요합니다."
}
```

**실패 (500)**
```json
{
  "success": false,
  "message": "네이버 등록 설정 조회 중 오류가 발생했습니다.",
  "error": "에러 상세 메시지"
}
```

---

### 2. 네이버 등록 설정 수정

**PUT** `/setting/naverpolicy/`

사용자의 네이버 등록 설정 정보를 수정합니다.

#### Request Body
```json
{
  "delivery_company": "CJGLS",
  "after_service_telephone": "010-0000-0000",
  "after_service_guide_content": "A/S (개봉 및 택 제거 후 반품 교환 환불 불가)",
  "naver_point": 1000,
  "return_delivery_fee": 5000,
  "exchange_delivery_fee": 5000,
  "purchase_point": 1000,
  "naver_cashback_price": 1000,
  "text_review_point": 1000,
  "photo_video_review_point": 1000,
  "after_use_text_review_point": 1000,
  "after_use_photo_video_review_point": 1000,
  "store_member_review_point": 2000,
  "include_delivery_fee": true,
  "include_import_duty": true,
  "price_setting_logic": "many"
}
```

#### Request Body Fields
| 필드명 | 타입 | 필수 | 제약조건 | 설명 |
|--------|------|------|----------|------|
| delivery_company | string | ✓ | 최대 50자 | 배송업체 |
| after_service_telephone | string | ✓ | 최대 20자 | A/S 전화번호 |
| after_service_guide_content | text | ✓ | - | A/S 안내 내용 |
| naver_point | number | ✓ | ≥ 0 | 네이버포인트 할인 적용 금액 |
| return_delivery_fee | number | ✓ | ≥ 0 | 반품 배송비 |
| exchange_delivery_fee | number | ✓ | ≥ 0 | 교환 배송비 |
| purchase_point | number | ✓ | ≥ 0 | 구매 포인트 |
| naver_cashback_price | number | ✓ | ≥ 0 | 네이버 캐시백 가격 |
| text_review_point | number | ✓ | ≥ 0 | 텍스트 리뷰 포인트 |
| photo_video_review_point | number | ✓ | ≥ 0 | 포토/비디오 리뷰 포인트 |
| after_use_text_review_point | number | ✓ | ≥ 0 | 사용 후 텍스트 리뷰 포인트 |
| after_use_photo_video_review_point | number | ✓ | ≥ 0 | 사용 후 포토/비디오 리뷰 포인트 |
| store_member_review_point | number | ✓ | ≥ 0 | 스토어 멤버 리뷰 포인트 |
| include_delivery_fee | boolean | ✓ | - | 배송비 포함 여부 |
| include_import_duty | boolean | ✓ | - | 수입 관세 포함 여부 |
| price_setting_logic | string | ✓ | 'low_price', 'ai', 'many' | 가격 설정 로직 |

#### Response

**성공 (200)**
```json
{
  "success": true,
  "message": "네이버 등록 설정이 성공적으로 업데이트되었습니다."
}
```

**실패 (400) - userid 누락**
```json
{
  "success": false,
  "message": "userid가 필요합니다."
}
```

**실패 (400) - 필수 필드 누락**
```json
{
  "success": false,
  "message": "필수 필드가 누락되었습니다: delivery_company, after_service_telephone"
}
```

**실패 (400) - 유효성 검증 실패**
```json
{
  "success": false,
  "message": "배송업체는 필수입니다."
}
```

**실패 (500)**
```json
{
  "success": false,
  "message": "네이버 등록 설정 업데이트 중 오류가 발생했습니다.",
  "error": "에러 상세 메시지"
}
```

---

### 네이버 설정 유효성 검증 규칙

1. **delivery_company**: 필수, 빈 문자열 불가
2. **after_service_telephone**: 필수, 빈 문자열 불가
3. **after_service_guide_content**: 필수, 빈 문자열 불가
4. **모든 숫자 필드**: 0 이상의 값
5. **include_delivery_fee**: boolean 값 필수
6. **include_import_duty**: boolean 값 필수
7. **price_setting_logic**: 'low_price', 'ai', 'many' 중 하나

### 네이버 설정 기본값

새로운 사용자의 경우 다음 기본값으로 설정이 생성됩니다:

- delivery_company: "CJGLS"
- after_service_telephone: "010-0000-0000"
- after_service_guide_content: "A/S (개봉 및 택 제거 후 반품 교환 환불 불가)"
- naver_point: 1000
- return_delivery_fee: 5000
- exchange_delivery_fee: 5000
- purchase_point: 1000
- naver_cashback_price: 1000
- text_review_point: 1000
- photo_video_review_point: 1000
- after_use_text_review_point: 1000
- after_use_photo_video_review_point: 1000
- store_member_review_point: 2000
- include_delivery_fee: true
- include_import_duty: true
- price_setting_logic: "many"

---

## 쿠팡 정책 설정 API

### 기본 경로
`/setting/coopangpolicy`

---

### 1. 쿠팡 등록 설정 조회

**GET** `/setting/coopangpolicy/`

사용자의 쿠팡 등록 설정 정보를 조회합니다. 설정이 없는 경우 기본값으로 자동 생성됩니다.

#### Response

**성공 (200)**
```json
{
  "success": true,
  "data": {
    "userid": 1,
    "delivery_company_code": "KGB",
    "after_service_guide_content": "A/S (개봉 및 택 제거 후 반품 교환 환불 불가)",
    "after_service_telephone": "010-0000-0000",
    "free_shipping": true,
    "max_option_count": 10,
    "return_delivery_fee": 5000,
    "include_import_duty": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**실패 (400)**
```json
{
  "success": false,
  "error": "userid가 필요합니다."
}
```

**실패 (404)**
```json
{
  "success": false,
  "error": "쿠팡 정책을 찾을 수 없습니다."
}
```

**실패 (500)**
```json
{
  "success": false,
  "error": "쿠팡 정책 조회 중 오류가 발생했습니다.",
  "details": "에러 상세 메시지"
}
```

---

### 2. 쿠팡 등록 설정 수정

**PUT** `/setting/coopangpolicy/`

사용자의 쿠팡 등록 설정 정보를 수정합니다.

#### Request Body
```json
{
  "delivery_company_code": "KGB",
  "after_service_guide_content": "A/S (개봉 및 택 제거 후 반품 교환 환불 불가)",
  "after_service_telephone": "010-0000-0000",
  "free_shipping": true,
  "max_option_count": 10,
  "return_delivery_fee": 5000,
  "include_import_duty": true
}
```

#### Request Body Fields
| 필드명 | 타입 | 필수 | 제약조건 | 설명 |
|--------|------|------|----------|------|
| delivery_company_code | string | ✓ | 최대 50자, 빈 문자열 불가 | 택배사 코드 |
| after_service_guide_content | text | ✓ | 빈 문자열 불가 | A/S 안내 내용 |
| after_service_telephone | string | ✓ | 최대 20자, 빈 문자열 불가 | A/S 전화번호 |
| free_shipping | boolean | ✓ | - | 무료배송 여부 |
| max_option_count | number | ✓ | ≥ 0 | 최대 옵션 개수 |
| return_delivery_fee | number | ✓ | ≥ 0 | 반품 배송비 |
| include_import_duty | boolean | ✓ | - | 수입 관세 포함 여부 | 

#### Response

**성공 (200)**
```json
{
  "success": true,
  "message": "쿠팡 정책이 성공적으로 업데이트되었습니다.",
  "data": {
    "userid": 1,
    "delivery_company_code": "KGB",
    "after_service_guide_content": "A/S (개봉 및 택 제거 후 반품 교환 환불 불가)",
    "after_service_telephone": "010-0000-0000",
    "free_shipping": true,
    "max_option_count": 10,
    "return_delivery_fee": 5000,
    "include_import_duty": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**실패 (400) - userid 누락**
```json
{
  "success": false,
  "error": "userid가 필요합니다."
}
```

**실패 (400) - 필수 필드 누락**
```json
{
  "success": false,
  "error": "필수 필드가 누락되었습니다: delivery_company_code, free_shipping"
}
```

**실패 (400) - 유효성 검증 실패**
```json
{
  "success": false,
  "error": "free_shipping은 boolean 값이어야 합니다."
}
```

**실패 (500)**
```json
{
  "success": false,
  "error": "쿠팡 정책 업데이트 중 오류가 발생했습니다.",
  "details": "에러 상세 메시지"
}
```

---

### 쿠팡 설정 유효성 검증 규칙

1. **delivery_company_code**: 필수, 빈 문자열 불가, 최대 50자
2. **after_service_guide_content**: 필수, 빈 문자열 불가
3. **after_service_telephone**: 필수, 빈 문자열 불가, 최대 20자
4. **free_shipping**: boolean 값 필수
5. **max_option_count**: 0 이상의 숫자
6. **return_delivery_fee**: 0 이상의 숫자
7. **include_import_duty**: boolean 값 필수

### 쿠팡 설정 기본값

새로운 사용자의 경우 다음 기본값으로 설정이 생성됩니다:

- delivery_company_code: "KGB"
- after_service_guide_content: null (사용자 설정 필요)
- after_service_telephone: null (사용자 설정 필요)
- free_shipping: true
- max_option_count: 10
- return_delivery_fee: 5000
- include_import_duty: true

---

## 11번가 정책 설정 API

### 기본 경로
`/setting/elevenstorepolicy`

---

### 1. 11번가 등록 설정 조회

**GET** `/setting/elevenstorepolicy/`

사용자의 11번가 등록 설정 정보를 조회합니다. 설정이 없는 경우 기본값으로 자동 생성됩니다.

#### Response

**성공 (200)**
```json
{
  "success": true,
  "data": {
    "userid": 1,
    "overseas_size_chart_display": false,
    "include_import_duty": true,
    "include_delivery_fee": true,
    "elevenstore_point_amount": 1000,
    "option_array_logic": "most_products",
    "return_cost": 5000,
    "exchange_cost": 5000,
    "as_guide": "문의사항이 있으시면 고객센터로 연락주세요.",
    "return_exchange_guide": "상품 수령 후 7일 이내 반품/교환이 가능합니다.",
    "delivery_company_code": "00045",
    "overseas_product_indication": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**실패 (400)**
```json
{
  "success": false,
  "error": "userid가 필요합니다."
}
```

**실패 (404)**
```json
{
  "success": false,
  "error": "11번가 정책을 찾을 수 없습니다."
}
```

**실패 (500)**
```json
{
  "success": false,
  "error": "11번가 정책 조회 중 오류가 발생했습니다.",
  "details": "에러 상세 메시지"
}
```

---

### 2. 11번가 등록 설정 수정

**PUT** `/setting/elevenstorepolicy/`

사용자의 11번가 등록 설정 정보를 수정합니다.

#### Request Body
```json
{
  "overseas_size_chart_display": false,
  "include_import_duty": true,
  "include_delivery_fee": true,
  "elevenstore_point_amount": 1000,
  "option_array_logic": "most_products",
  "return_cost": 5000,
  "exchange_cost": 5000,
  "as_guide": "문의사항이 있으시면 고객센터로 연락주세요.",
  "return_exchange_guide": "상품 수령 후 7일 이내 반품/교환이 가능합니다.",
  "delivery_company_code": "00045",
  "overseas_product_indication": true
}
```

#### Request Body Fields
| 필드명 | 타입 | 필수 | 제약조건 | 설명 |
|--------|------|------|----------|------|
| overseas_size_chart_display | boolean | ✓ | - | 해외사이즈 조견표 노출여부 |
| include_import_duty | boolean | ✓ | - | 관부과세 포함 여부 |
| include_delivery_fee | boolean | ✓ | - | 배송비 포함 여부 |
| elevenstore_point_amount | number | ✓ | ≥ 0 | 11번가 포인트 적립 금액 |
| option_array_logic | string | ✓ | 'most_products', 'lowest_price' | 옵션 배열 로직 |
| return_cost | number | ✓ | ≥ 0 | 반품비용 |
| exchange_cost | number | ✓ | ≥ 0 | 교환비용 |
| as_guide | text | ✓ | 빈 문자열 불가 | A/S 안내 |
| return_exchange_guide | text | ✓ | 빈 문자열 불가 | 반품/교환 안내 |
| delivery_company_code | string | ✓ | 빈 문자열 불가 | 발송택배사번호 |
| overseas_product_indication | boolean | ✓ | - | 해외직구 상품 명시 여부 |

#### Response

**성공 (200)**
```json
{
  "success": true,
  "message": "11번가 정책이 성공적으로 업데이트되었습니다.",
  "data": {
    "userid": 1,
    "overseas_size_chart_display": false,
    "include_import_duty": true,
    "include_delivery_fee": true,
    "elevenstore_point_amount": 1000,
    "option_array_logic": "most_products",
    "return_cost": 5000,
    "exchange_cost": 5000,
    "as_guide": "문의사항이 있으시면 고객센터로 연락주세요.",
    "return_exchange_guide": "상품 수령 후 7일 이내 반품/교환이 가능합니다.",
    "delivery_company_code": "00045",
    "overseas_product_indication": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**실패 (400) - userid 누락**
```json
{
  "success": false,
  "error": "userid가 필요합니다."
}
```

**실패 (400) - 필수 필드 누락**
```json
{
  "success": false,
  "error": "필수 필드가 누락되었습니다: overseas_size_chart_display, include_import_duty"
}
```

**실패 (400) - 유효성 검증 실패**
```json
{
  "success": false,
  "error": "overseas_size_chart_display는 boolean 값이어야 합니다."
}
```

**실패 (500)**
```json
{
  "success": false,
  "error": "11번가 정책 업데이트 중 오류가 발생했습니다.",
  "details": "에러 상세 메시지"
}
```

---

### 11번가 설정 유효성 검증 규칙

1. **overseas_size_chart_display**: boolean 값 필수
2. **include_import_duty**: boolean 값 필수
3. **include_delivery_fee**: boolean 값 필수
4. **elevenstore_point_amount**: 0 이상의 숫자
5. **option_array_logic**: 'most_products' 또는 'lowest_price' 중 하나
6. **return_cost**: 0 이상의 숫자
7. **exchange_cost**: 0 이상의 숫자
8. **as_guide**: 빈 문자열 불가
9. **return_exchange_guide**: 빈 문자열 불가
10. **delivery_company_code**: 빈 문자열 불가
11. **overseas_product_indication**: boolean 값 필수

### 11번가 설정 기본값

새로운 사용자의 경우 다음 기본값으로 설정이 생성됩니다:

- overseas_size_chart_display: false
- include_import_duty: true
- include_delivery_fee: true
- elevenstore_point_amount: 1000
- option_array_logic: "most_products"
- return_cost: 5000
- exchange_cost: 5000
- as_guide: "문의사항이 있으시면 고객센터로 연락주세요."
- return_exchange_guide: "상품 수령 후 7일 이내 반품/교환이 가능합니다."
- delivery_company_code: "00045"
- overseas_product_indication: true

---

## 마켓 설정 API

### 기본 경로
`/setting/marketsetting`

---

### 1. 마켓 정보 조회

**GET** `/setting/marketsetting/?market={market}`

사용자의 마켓 정보를 조회합니다. 네이버, 쿠팡, 11번가 마켓의 모든 계정 정보를 반환합니다.

#### Query Parameters
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| market | string | ✓ | 마켓 타입 ('naver', 'coopang', 'elevenstore') |

#### Response

**성공 (200) - 네이버 마켓**
```json
{
  "success": true,
  "data": {
    "market": "naver",
    "markets": [
      {
        "shopid": 1,
        "naver_market_number": 12345,
        "naver_market_memo": "메인 네이버 스토어",
        "naver_maximun_sku_count": 1000,
        "naver_client_secret": "****",
        "naver_client_id": "****",
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

**성공 (200) - 쿠팡 마켓**
```json
{
  "success": true,
  "data": {
    "market": "coopang",
    "markets": [
      {
        "shopid": 1,
        "coopang_market_number": 67890,
        "coopang_market_memo": "메인 쿠팡 스토어",
        "coopang_maximun_sku_count": 500,
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

**성공 (200) - 11번가 마켓**
```json
{
  "success": true,
  "data": {
    "market": "elevenstore",
    "markets": [
      {
        "shopid": 1,
        "elevenstore_market_number": 11111,
        "elevenstore_market_memo": "메인 11번가 스토어",
        "elevenstore_maximun_sku_count": 800,
        "registered_sku_count": 150,
        "elevenstore_api_key": "your-api-key",
        "elevenstore_shipping_address_id": 12345,
        "elevenstore_return_address_id": 67890,
        "elevenstore_template_no": "4052064",
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

**실패 (400)**
```json
{
  "success": false,
  "message": "market 파라미터가 필요합니다. (naver, coopang, elevenstore)"
}
```

---

### 2. 새로운 마켓 생성

**POST** `/setting/marketsetting/?market={market}`

새로운 마켓 계정을 생성합니다.

#### Query Parameters
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| market | string | ✓ | 마켓 타입 ('naver', 'coopang', 'elevenstore') |

#### Request Body - 네이버 마켓
```json
{
  "naver_market_number": 12345,
  "naver_market_memo": "메인 네이버 스토어",
  "naver_maximun_sku_count": 1000,
  "naver_client_secret": "client_secret_value",
  "naver_client_id": "client_id_value"
}
```

#### Request Body - 쿠팡 마켓
```json
{
  "coopang_market_number": 67890,
  "coopang_market_memo": "메인 쿠팡 스토어",
  "coopang_maximun_sku_count": 500
}
```

#### Request Body - 11번가 마켓
```json
{
  "elevenstore_market_number": 11111,
  "elevenstore_market_memo": "메인 11번가 스토어",
  "elevenstore_maximun_sku_count": 800,
  "elevenstore_api_key": "your-api-key",
  "elevenstore_shipping_address_id": 12345,
  "elevenstore_return_address_id": 67890,
  "elevenstore_template_no": "4052064"
}
```

#### Request Body Fields - 네이버
| 필드명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| naver_market_number | number | ✓ | 네이버 마켓 번호 (양의 정수) |
| naver_market_memo | string | ✓ | 마켓 메모 |
| naver_maximun_sku_count | number | ✓ | 최대 SKU 개수 (양의 정수) |
| naver_client_secret | string | ○ | 네이버 클라이언트 시크릿 |
| naver_client_id | string | ○ | 네이버 클라이언트 ID |

#### Request Body Fields - 쿠팡
| 필드명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| coopang_market_number | number | ✓ | 쿠팡 마켓 번호 (양의 정수) |
| coopang_market_memo | string | ✓ | 마켓 메모 |
| coopang_maximun_sku_count | number | ✓ | 최대 SKU 개수 (양의 정수) |

#### Request Body Fields - 11번가
| 필드명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| elevenstore_market_number | number | ✓ | 11번가 마켓 번호 (양의 정수) |
| elevenstore_market_memo | string | ✓ | 마켓 메모 |
| elevenstore_maximun_sku_count | number | ✓ | 최대 SKU 개수 (양의 정수) |
| elevenstore_api_key | string | ○ | 11번가 API 키 |
| elevenstore_shipping_address_id | number | ○ | 출고지 주소 ID |
| elevenstore_return_address_id | number | ○ | 반품지 주소 ID |
| elevenstore_template_no | string | ○ | 발송마감 템플릿 번호 |

#### Response

**성공 (201)**
```json
{
  "success": true,
  "message": "네이버 마켓이 성공적으로 생성되었습니다.",
  "data": {
    "shopid": 1
  }
}
```

**실패 (400)**
```json
{
  "success": false,
  "message": "필수 필드가 누락되었습니다: naver_market_number",
  "error": "마켓 생성 서비스 오류: 필수 필드가 누락되었습니다: naver_market_number"
}
```

---

### 3. 마켓 정보 수정

**PUT** `/setting/marketsetting/{shopid}?market={market}`

기존 마켓 계정 정보를 수정합니다.

#### Path Parameters
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| shopid | number | ✓ | 수정할 마켓의 shopid |

#### Query Parameters
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| market | string | ✓ | 마켓 타입 ('naver', 'coopang', 'elevenstore') |

#### Request Body
네이버/쿠팡/11번가 마켓 생성과 동일한 형식

#### Response

**성공 (200)**
```json
{
  "success": true,
  "message": "네이버 마켓이 성공적으로 업데이트되었습니다."
}
```

**실패 (400)**
```json
{
  "success": false,
  "message": "shopid는 유효한 숫자여야 합니다."
}
```

---

### 4. 마켓 삭제

**DELETE** `/setting/marketsetting/{shopid}?market={market}`

마켓 계정을 삭제합니다.

#### Path Parameters
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| shopid | number | ✓ | 삭제할 마켓의 shopid |

#### Query Parameters
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| market | string | ✓ | 마켓 타입 ('naver', 'coopang', 'elevenstore') |

#### Response

**성공 (200)**
```json
{
  "success": true,
  "message": "네이버 마켓이 성공적으로 삭제되었습니다."
}
```

**실패 (400)**
```json
{
  "success": false,
  "message": "해당 네이버 마켓을 찾을 수 없습니다."
}
```

---

### 마켓 설정 유효성 검증 규칙

#### 네이버 마켓
1. **naver_market_number**: 양의 정수 필수
2. **naver_market_memo**: 문자열 필수
3. **naver_maximun_sku_count**: 양의 정수 필수
4. **naver_client_secret**: 문자열 (선택적, 민감정보)
5. **naver_client_id**: 문자열 (선택적, 민감정보)

#### 쿠팡 마켓
1. **coopang_market_number**: 양의 정수 필수
2. **coopang_market_memo**: 문자열 필수
3. **coopang_maximun_sku_count**: 양의 정수 필수

#### 11번가 마켓
1. **elevenstore_market_number**: 양의 정수 필수
2. **elevenstore_market_memo**: 문자열 필수
3. **elevenstore_maximun_sku_count**: 양의 정수 필수
4. **elevenstore_api_key**: 문자열 (선택적)
5. **elevenstore_shipping_address_id**: 양의 정수 (선택적)
6. **elevenstore_return_address_id**: 양의 정수 (선택적)
7. **elevenstore_template_no**: 문자열 (선택적)

### 지원 마켓
- **naver**: 네이버 스마트스토어
- **coopang**: 쿠팡 파트너스
- **elevenstore**: 11번가

### 보안 정책
- **민감정보 마스킹**: 네이버 클라이언트 정보(`naver_client_secret`, `naver_client_id`)는 조회 시 `****`로 마스킹되어 반환됩니다.
- **저장**: 민감정보는 데이터베이스에 원본 그대로 저장되지만, API 응답에서는 마스킹 처리됩니다.
- **수정**: 민감정보 수정 시에는 전체 값을 다시 전송해야 합니다.

---

## 상세페이지 설정 API

### 기본 경로
`/setting/detail-page`

---

### 1. 상세페이지 설정 조회

**GET** `/setting/detail-page`

사용자의 상세페이지 설정 정보를 조회합니다. 설정이 없는 경우 기본값으로 자동 생성됩니다.

#### Response

**성공 (200)**
```json
{
  "success": true,
  "message": "상세페이지 설정 조회 성공",
  "data": {
    "top_images": [
      {
        "url": "https://example.com/images/top1.jpg",
        "file": null,
        "changed": false
      },
      {
        "url": "https://example.com/images/top2.jpg", 
        "file": null,
        "changed": false
      },
      {
        "url": "",
        "file": null,
        "changed": false
      }
    ],
    "bottom_images": [
      {
        "url": "https://example.com/images/bottom1.jpg",
        "file": null,
        "changed": false
      },
      {
        "url": "",
        "file": null,
        "changed": false
      },
      {
        "url": "",
        "file": null,
        "changed": false
      }
    ],
    "include_properties": 1,
    "include_options": 0,
    "created_at": "2025-01-27T10:30:00Z",
    "updated_at": "2025-01-27T15:45:00Z"
  }
}
```

**실패 (400)**
```json
{
  "success": false,
  "message": "userid가 필요합니다."
}
```

**실패 (500)**
```json
{
  "success": false,
  "message": "설정 조회에 실패했습니다.",
  "error": "상세 에러 메시지"
}
```

---

### 2. 상세페이지 설정 업데이트

**POST** `/setting/detail-page`

상세페이지 설정을 업데이트합니다. 이미지가 변경된 경우에만 해당 이미지 데이터를 포함하여 전송합니다.

#### Request Headers
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

#### Request Body (FormData)

**기본 설정만 변경하는 경우:**
```
include_properties: 1
include_options: 0
```

**이미지도 함께 변경하는 경우:**
```
include_properties: 1
include_options: 0
top_images[0]: (File)  // 첫 번째 상단 이미지
bottom_images[1]: (File)  // 두 번째 하단 이미지
changed_images: {"top_changed":[0],"bottom_changed":[1],"top_deleted":[],"bottom_deleted":[2]}
deleted_bottom_images[2]: true  // 세 번째 하단 이미지 삭제
```

#### Request Fields
| 필드명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| include_properties | number | ○ | 속성 표시 여부 (1: 표시, 0: 숨김) |
| include_options | number | ○ | 옵션 표시 여부 (1: 표시, 0: 숨김) |
| top_images[0-2] | File | ○ | 상단 이미지 파일 (인덱스별) |
| bottom_images[0-2] | File | ○ | 하단 이미지 파일 (인덱스별) |
| changed_images | string | ○ | 변경/삭제 정보 JSON |
| deleted_top_images[0-2] | string | ○ | 개별 상단 이미지 삭제 ('true') |
| deleted_bottom_images[0-2] | string | ○ | 개별 하단 이미지 삭제 ('true') |

#### Response

**성공 (200)**
```json
{
  "success": true,
  "message": "상세페이지 설정이 성공적으로 저장되었습니다.",
  "data": {
    "top_images": [
      {
        "url": "https://example.com/images/new_top1.jpg",
        "file": null,
        "changed": false
      },
      {
        "url": "",
        "file": null,
        "changed": false
      },
      {
        "url": "",
        "file": null,
        "changed": false
      }
    ],
    "bottom_images": [
      {
        "url": "",
        "file": null,
        "changed": false
      },
      {
        "url": "https://example.com/images/new_bottom2.jpg",
        "file": null,
        "changed": false
      },
      {
        "url": "",
        "file": null,
        "changed": false
      }
    ],
    "include_properties": 1,
    "include_options": 0,
    "updated_at": "2025-01-27T16:20:00Z"
  }
}
```

**실패 (400) - 유효성 검증 실패**
```json
{
  "success": false,
  "message": "설정 저장에 실패했습니다.",
  "error": "유효성 검증 실패",
  "validation_errors": {
    "top_images[0]": ["이미지 파일 형식이 올바르지 않습니다."],
    "bottom_images[1]": ["파일 크기가 5MB를 초과합니다."]
  }
}
```

**실패 (400) - 파일 크기 초과**
```json
{
  "success": false,
  "message": "파일 크기가 5MB를 초과합니다.",
  "error": "LIMIT_FILE_SIZE"
}
```

**실패 (500)**
```json
{
  "success": false,
  "message": "설정 저장 중 오류가 발생했습니다.",
  "error": "상세 에러 메시지"
}
```

---

### 상세페이지 설정 데이터 형식

#### 변경 정보 JSON 형식
```json
{
  "top_changed": [0, 2],      // 변경된 상단 이미지 인덱스
  "bottom_changed": [1],      // 변경된 하단 이미지 인덱스  
  "top_deleted": [1],         // 삭제된 상단 이미지 인덱스
  "bottom_deleted": [0, 2]    // 삭제된 하단 이미지 인덱스
}
```

#### 이미지 필드 규칙
- **인덱스**: 0, 1, 2 (각각 첫 번째, 두 번째, 세 번째)
- **필드명 형식**: `{type}_images[{index}]` (예: `top_images[0]`, `bottom_images[2]`)
- **삭제 필드명**: `deleted_{type}_images[{index}]` (값: 'true')

### 파일 업로드 제약사항

- **허용 파일 형식**: JPG, JPEG, PNG, GIF, WEBP
- **최대 파일 크기**: 5MB
- **최대 파일 개수**: 6개 (상단 3개, 하단 3개)
- **저장 경로**: `/userPage/{userid}/`
- **파일명 규칙**: `{timestamp}_{original_filename}`

### 유효성 검증 규칙

1. **이미지 파일**: JPG, JPEG, PNG, GIF, WEBP만 허용
2. **파일 크기**: 5MB 이하
3. **include_properties**: 0 또는 1
4. **include_options**: 0 또는 1
5. **이미지 업로드**: 변경 처리 전에 삭제 처리 먼저 수행

### 이미지 처리 순서

1. **삭제 처리**: `changed_images.{type}_deleted` 및 `deleted_{type}_images[{index}]`
2. **업로드 처리**: 새로 업로드된 파일들을 Cloudflare R2에 저장
3. **데이터베이스 업데이트**: 모든 변경사항을 common_setting 테이블에 반영

---

## 기타 설정 API

### 기본 경로
`/setting/extra`

---

### 1. 기타 설정 조회

**GET** `/setting/extra/`

사용자의 기타 설정 정보를 조회합니다. 설정이 없는 경우 기본값으로 자동 생성됩니다.

#### Headers
```
Authorization: Bearer {JWT_TOKEN}
```

#### Response

**성공 (200)**
```json
{
  "success": true,
  "data": {
    "use_deep_ban": 0,
    "allow_keyword_spacing": 1
  }
}
```

**실패 (401)**
```json
{
  "success": false,
  "error": "인증이 필요합니다."
}
```

**실패 (500)**
```json
{
  "success": false,
  "error": "설정 조회에 실패했습니다.",
  "details": "에러 상세 정보"
}
```

---

### 2. 기타 설정 업데이트

**PUT** `/setting/extra/`

사용자의 기타 설정 정보를 업데이트합니다.

#### Headers
```
Authorization: Bearer {JWT_TOKEN}
```

#### Request Body
```json
{
  "use_deep_ban": 1,
  "allow_keyword_spacing": 0
}
```

#### Request Body Fields
| 필드명 | 타입 | 필수 | 제약조건 | 설명 |
|--------|------|------|----------|------|
| use_deep_ban | number | ✓ | 0 또는 1 | 심층 벤 사용여부 (0: 미사용, 1: 사용) |
| allow_keyword_spacing | number | ✓ | 0 또는 1 | 키워드 뛰어쓰기 허용여부 (0: 비허용, 1: 허용) |

#### Response

**성공 (200)**
```json
{
  "success": true,
  "message": "설정이 성공적으로 업데이트되었습니다."
}
```

**실패 (400)**
```json
{
  "success": false,
  "error": "use_deep_ban은 0 또는 1이어야 합니다."
}
```

**실패 (401)**
```json
{
  "success": false,
  "error": "인증이 필요합니다."
}
```

**실패 (500)**
```json
{
  "success": false,
  "error": "설정 업데이트에 실패했습니다.",
  "details": "에러 상세 정보"
}
```

---

### 3. 마켓번호 목록 조회

**GET** `/setting/extra/market-numbers/?market={market}`

사용자의 특정 마켓 계정 목록을 조회합니다.

#### Headers
```
Authorization: Bearer {JWT_TOKEN}
```

#### Query Parameters
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| market | string | ✓ | 마켓 종류 (naver, coupang, 11st) |

#### Response

**성공 (200)**
```json
{
  "success": true,
  "data": [
    {
      "number": 1,
      "name": "쇼핑몰 1호점"
    },
    {
      "number": 2,
      "name": "쇼핑몰 2호점"
    },
    {
      "number": 3,
      "name": "쇼핑몰 3호점"
    }
  ]
}
```

**실패 (400)**
```json
{
  "success": false,
  "error": "마켓 종류가 필요합니다."
}
```

**실패 (401)**
```json
{
  "success": false,
  "error": "인증이 필요합니다."
}
```

**실패 (500)**
```json
{
  "success": false,
  "error": "마켓번호 목록 조회에 실패했습니다.",
  "details": "지원하지 않는 마켓입니다."
}
```

---

### 4. 상품개수 조회

**GET** `/setting/extra/product-count/?market={market}&market_number={market_number}`

특정 마켓 계정의 등록된 상품개수를 조회합니다.

#### Headers
```
Authorization: Bearer {JWT_TOKEN}
```

#### Query Parameters
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| market | string | ✓ | 마켓 종류 (naver, coupang, 11st) |
| market_number | number | ✓ | 마켓번호 (정수) |

#### Response

**성공 (200)**
```json
{
  "success": true,
  "data": {
    "count": 1234,
    "market": "naver",
    "market_number": 1,
    "last_updated": "2025-01-20T10:30:00Z"
  }
}
```

**실패 (400)**
```json
{
  "success": false,
  "error": "마켓번호가 필요합니다."
}
```

**실패 (401)**
```json
{
  "success": false,
  "error": "인증이 필요합니다."
}
```

**실패 (404)**
```json
{
  "success": false,
  "error": "상품개수 조회에 실패했습니다.",
  "details": "해당 마켓번호를 찾을 수 없습니다."
}
```

**실패 (500)**
```json
{
  "success": false,
  "error": "상품개수 조회에 실패했습니다.",
  "details": "에러 상세 정보"
}
```

---

### 5. 상품개수 수정

**PUT** `/setting/extra/product-count/`

특정 마켓 계정의 등록된 상품개수를 수정합니다.

#### Headers
```
Authorization: Bearer {JWT_TOKEN}
```

#### Request Body
```json
{
  "market": "naver",
  "market_number": 1,
  "count": 1500
}
```

#### Request Body Fields
| 필드명 | 타입 | 필수 | 제약조건 | 설명 |
|--------|------|------|----------|------|
| market | string | ✓ | naver, coupang, 11st | 마켓 종류 |
| market_number | number | ✓ | 정수, > 0 | 마켓번호 |
| count | number | ✓ | 정수, ≥ 0 | 수정할 상품개수 |

#### Response

**성공 (200)**
```json
{
  "success": true,
  "message": "상품개수가 성공적으로 수정되었습니다.",
  "data": {
    "count": 1500,
    "market": "naver",
    "market_number": 1,
    "updated_at": "2025-01-20T10:35:00Z"
  }
}
```

**실패 (400)**
```json
{
  "success": false,
  "error": "마켓번호가 필요합니다."
}
```

**실패 (401)**
```json
{
  "success": false,
  "error": "인증이 필요합니다."
}
```

**실패 (500)**
```json
{
  "success": false,
  "error": "상품개수 수정에 실패했습니다.",
  "details": "유효하지 않은 상품개수입니다."
}
```

---

### 기타 설정 유효성 검증 규칙

1. **use_deep_ban**: 0(미사용) 또는 1(사용)만 허용
2. **allow_keyword_spacing**: 0(비허용) 또는 1(허용)만 허용
3. **market**: 'naver', 'coupang', '11st'만 지원
4. **market_number**: 양의 정수만 허용
5. **count**: 0 이상의 정수만 허용

### 기타 설정 기본값

새로운 사용자의 경우 다음 기본값으로 설정이 생성됩니다:
- use_deep_ban: 0 (미사용)
- allow_keyword_spacing: 1 (허용)

### 지원 마켓

- **naver**: 네이버 스마트스토어
- **coupang**: 쿠팡 파트너스  
- **11st**: 11번가

---

## 사용자 금지어 설정 API

### 기본 경로
`/setting/banwords`

---

### 1. 사용자 금지어 조회

**GET** `/setting/banwords?userid={userid}`

사용자의 개별 금지어 목록을 조회합니다. 레코드가 없으면 자동으로 빈 문자열로 생성됩니다.

#### Response
```json
{
  "success": true,
  "data": {
    "userid": 123,
    "bannedWords": ["금지어1", "금지어2"],
    "bannedWordsString": "금지어1, 금지어2"
  }
}
```

---

### 2. 사용자 금지어 저장

**PUT** `/setting/banwords`

사용자의 개별 금지어를 저장합니다.

#### Request Body
```json
{
  "userid": 123,
  "bannedWords": "금지어1, 금지어2, 금지어3"
}
```

#### Response
```json
{
  "success": true,
  "message": "사용자 금지어 설정이 저장되었습니다.",
  "data": {
    "userid": 123,
    "bannedWords": "금지어1, 금지어2, 금지어3"
  }
}
```

---

## 판매자 차단 API

### 기본 경로
`/setting/ban-seller`

---

### 1. 판매자 차단

**POST** `/setting/ban-seller/`

상품 ID를 통해 해당 상품의 판매자를 차단합니다. 차단된 판매자의 모든 상품은 자동으로 차단됩니다.

#### Headers
```
Authorization: Bearer {JWT_TOKEN}
```

#### Request Body
```json
{
  "product_id": "1234567890"
}
```

#### Request Body Fields
| 필드명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| product_id | string | ✓ | 차단할 판매자의 상품 ID |

#### Response

**성공 (200)**
```json
{
  "success": true,
  "message": "판매자가 성공적으로 차단되었습니다.",
  "data": {
    "product_id": "1234567890",
    "seller_id": "seller123",
    "seller_name": null,
    "shop_id": "shop456",
    "banned_products_count": 15,
    "banned_at": "2025-01-27 12:00:00"
  }
}
```

**실패 (400) - product_id 누락**
```json
{
  "success": false,
  "message": "잘못된 요청입니다.",
  "error": "product_id가 필요합니다."
}
```

**실패 (400) - userid 누락**
```json
{
  "success": false,
  "message": "잘못된 요청입니다.",
  "error": "userid가 필요합니다."
}
```

**실패 (404) - 상품 없음**
```json
{
  "success": false,
  "message": "상품을 찾을 수 없습니다.",
  "error": "해당 상품 ID로 등록된 상품이 없습니다."
}
```

**실패 (409) - 이미 차단됨**
```json
{
  "success": false,
  "message": "이미 차단된 판매자입니다.",
  "error": "해당 판매자는 이미 차단 목록에 등록되어 있습니다."
}
```

**실패 (500)**
```json
{
  "success": false,
  "message": "서버 오류가 발생했습니다.",
  "error": "에러 상세 메시지"
}
```

### API 동작 방식

1. **상품 정보 조회**: 제공된 `product_id`와 인증된 사용자의 `userid`로 `products_detail` 테이블에서 판매자 정보 조회
2. **중복 확인**: 이미 차단된 판매자인지 `ban_seller` 테이블에서 확인
3. **판매자 차단**: `ban_seller` 테이블에 차단 정보 추가/업데이트 (`ban=true`)
4. **쇼핑몰 차단**: `ban_shop` 테이블에 차단 정보 추가/업데이트 (`ban=true`)  
5. **상품 상태 업데이트**: 해당 판매자/쇼핑몰의 모든 상품을 `status` 테이블에서 `seller_banned=true`, `shop_banned=true`로 업데이트
6. **결과 반환**: 차단된 상품 개수와 함께 성공 응답

### 보안 고려사항

- **사용자 인증**: JWT 토큰을 통한 사용자 인증 필수
- **사용자별 격리**: `userid`를 통한 사용자별 차단 목록 관리
- **SQL 인젝션 방지**: Prepared Statement 사용
- **입력 검증**: `product_id` 유효성 검증
- **트랜잭션 처리**: 모든 데이터베이스 작업을 트랜잭션으로 처리하여 데이터 일관성 보장

### 영향받는 테이블

1. **ban_seller**: 판매자 차단 정보 저장
2. **ban_shop**: 쇼핑몰 차단 정보 저장  
3. **status**: 상품별 차단 상태 업데이트
4. **products_detail**: 판매자/쇼핑몰 정보 조회용

---

## 쿠팡 배송지 조회 API

### 기본 경로
`/setting/coupang-shipping`

---

### 배송지 정보 조회

**POST** `/setting/coupang-shipping/places`

쿠팡 출고지 및 반품지 정보를 조회합니다.

#### Request Body
```json
{
  "accessKey": "your_access_key",
  "secretKey": "your_secret_key", 
  "vendorId": "your_vendor_id"
}
```

#### Response
```json
{
  "success": true,
  "message": "쿠팡 배송지 조회 성공",
  "data": {
    "outboundPlaces": {
      "count": 2,
      "items": [
        {
          "outboundShippingPlaceCode": "CODE1",
          "shippingPlaceName": "출고지1",
          "returnZipCode": "12345",
          "returnAddress": "주소1"
        }
      ]
    },
    "returnCenters": {
      "count": 1,
      "items": [
        {
          "returnCenterCode": "RC001",
          "shippingPlaceName": "반품지1",
          "returnZipCode": "54321",
          "returnAddress": "반품주소1"
        }
      ]
    }
  }
}
```

---

## 네이버 주소록 조회 API

### 기본 경로
`/setting/naver-address-book`

---

### 주소록 조회

**POST** `/setting/naver-address-book`

네이버 계정의 주소록 정보를 조회합니다.

#### Request Body
```json
{
  "client_id": "naver_client_id",
  "client_secret": "naver_client_secret"
}
```

#### Response
```json
{
  "success": true,
  "data": [
    {
      "addressBookNo": 12345,
      "name": "홍길동",
      "addressType": "GENERAL",
      "baseAddress": "서울시 강남구",
      "detailAddress": "테헤란로 123",
      "address": "서울시 강남구 테헤란로 123",
      "phoneNumber1": "010-1234-5678"
    }
  ],
  "message": "주소록 조회 성공"
}
```

---

## 11번가 주소 및 발송마감 템플릿 조회 API

### 기본 경로
`/setting/elevenstore-address`

---

### 주소 정보 및 발송마감 템플릿 조회

**POST** `/setting/elevenstore-address/`

11번가 출고지, 반품/교환지 주소 및 발송마감 템플릿 정보를 한 번에 조회합니다.

#### Request Body
```json
{
  "apiKey": "your_11st_api_key"
}
```

#### Request Body Fields
| 필드명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| apiKey | string | ✓ | 11번가 Open API 키 |

#### Response

**성공 (200)**
```json
{
  "success": true,
  "message": "11번가 주소 및 발송마감 템플릿 조회 성공",
  "data": {
    "outboundPlaces": {
      "count": 1,
      "items": [
        {
          "addrSeq": "2",
          "addrNm": "은탄동",
          "addr": "경기도 성남시 분당구 인구동220번지 6-75 (은탄동) 은탄동 3층 W1호(은탄동)",
          "rcvrNm": "은탄",
          "gnrlTlphnNo": "010-4840-8754",
          "prtblTlphnNo": "010-4840-8754",
          "memNo": "75862888"
        }
      ]
    },
    "inboundPlaces": {
      "count": 1,
      "items": [
        {
          "addrSeq": "2",
          "addrNm": "은탄동",
          "addr": "경기도 성남시 분당구 인구동220번지 6-75 (은탄동) 은탄동 3층 W1호(은탄동)",
          "rcvrNm": "은탄",
          "gnrlTlphnNo": "010-4840-8754",
          "prtblTlphnNo": "010-4840-8754",
          "memNo": "75862888"
        }
      ]
    },
    "sendCloseTemplates": {
      "count": 3,
      "items": [
        {
          "prdInfoTmpltNo": "4052064",
          "prdInfoTmpltNm": "오늘 주문완료 건 2일내 발송처리"
        },
        {
          "prdInfoTmpltNo": "344836",
          "prdInfoTmpltNm": "오전 9시까지, 토요일 오전 9시까지 주문완료 건 당일 발송처리"
        }
      ]
    },
    "summary": {
      "totalOutbound": 1,
      "totalInbound": 1,
      "totalTemplates": 3
    }
  }
}
```

**실패 (400) - apiKey 누락**
```json
{
  "success": false,
  "message": "apiKey는 필수입니다.",
  "data": null
}
```

**실패 (500) - API 호출 실패**
```json
{
  "success": false,
  "message": "발송마감 템플릿 조회 실패: API 키가 유효하지 않습니다.",
  "data": null
}
```

### 응답 필드 설명

#### 주소 정보 (outboundPlaces.items, inboundPlaces.items)
| 필드명 | 타입 | 설명 |
|--------|------|------|
| addrSeq | string | 주소 순번 (11번가 마켓 설정에서 사용) |
| addrNm | string | 주소명 |
| addr | string | 전체 주소 |
| rcvrNm | string | 수신자명 |
| gnrlTlphnNo | string | 일반 전화번호 |
| prtblTlphnNo | string | 휴대폰 번호 |
| memNo | string | 회원번호 |

#### 발송마감 템플릿 정보 (sendCloseTemplates.items)
| 필드명 | 타입 | 설명 |
|--------|------|------|
| prdInfoTmpltNo | string | 템플릿 번호 (DB 저장용, 상품 등록 시 사용) |
| prdInfoTmpltNm | string | 템플릿명 (사용자 선택용) |

### API 특징

1. **인코딩 처리**: 11번가 API는 `euc-kr` 인코딩을 사용하므로 `iconv-lite` 라이브러리로 처리
2. **XML 파싱**: XML 응답을 JSON으로 변환하여 처리
3. **네임스페이스**: `ns2:` 접두사를 사용하는 XML 구조
4. **성공 판단**: `result_message` 대신 데이터 존재 여부로 성공/실패 판단
5. **통합 조회**: 하나의 API 호출로 출고지, 반품지, 발송마감 템플릿을 모두 조회
6. **addrSeq 활용**: 반환된 `addrSeq` 값은 11번가 마켓 설정에서 배송지/반품지 ID로 사용
7. **prdInfoTmpltNo 활용**: 반환된 템플릿 번호는 11번가 마켓 설정과 상품 등록 시 사용

### 사용 예시

```javascript
// 11번가 주소 및 발송마감 템플릿 조회
const response = await fetch('/setting/elevenstore-address/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    apiKey: 'your-11st-api-key'
  })
});

const result = await response.json();

if (result.success) {
  // 출고지 주소 사용
  const outboundAddresses = result.data.outboundPlaces.items;
  console.log('출고지 목록:', outboundAddresses);
  
  // 반품지 주소 사용
  const inboundAddresses = result.data.inboundPlaces.items;
  console.log('반품지 목록:', inboundAddresses);
  
  // 발송마감 템플릿 사용
  const sendCloseTemplates = result.data.sendCloseTemplates.items;
  console.log('발송마감 템플릿 목록:', sendCloseTemplates);
  
  // 11번가 마켓 설정에서 사용할 값들 추출
  const shippingAddressId = outboundAddresses[0].addrSeq;
  const returnAddressId = inboundAddresses[0].addrSeq;
  const templateNo = sendCloseTemplates[0].prdInfoTmpltNo;
  
  // 마켓 설정 저장 예시
  const marketData = {
    elevenstore_api_key: 'your-11st-api-key',
    elevenstore_shipping_address_id: shippingAddressId,
    elevenstore_return_address_id: returnAddressId,
    elevenstore_template_no: templateNo,
    // ... 기타 마켓 정보
  };
  
  console.log('마켓 설정 데이터:', marketData);
} else {
  console.error('오류:', result.message);
}
```

---

## 에러 코드 및 처리

### HTTP 상태 코드

| 코드 | 설명 | 예시 |
|------|------|------|
| 200 | 성공 | 조회, 수정, 삭제 성공 |
| 201 | 생성 성공 | 새로운 마켓 계정 생성 |
| 400 | 잘못된 요청 | 유효성 검증 실패, 필수 필드 누락 |
| 401 | 인증 실패 | JWT 토큰 없음 또는 만료 |
| 409 | 충돌 | 중복 마켓번호 |
| 500 | 서버 오류 | 데이터베이스 연결 실패 등 |

### 주요 에러 메시지

#### 공통 에러
- `"userid가 필요합니다."` - 인증 토큰에서 userid 추출 실패
- `"필수 필드가 누락되었습니다: {field_names}"` - 요청 데이터 누락

#### 마켓 설정 에러
- `"중복되는 마켓번호가 있습니다."` - 마켓번호 중복
- `"market은 naver 또는 coopang만 지원됩니다."` - 지원하지 않는 마켓 타입
- `"shopid는 유효한 숫자여야 합니다."` - 잘못된 shopid 형식

#### 유효성 검증 에러
- `"기본 최소 마진 퍼센트는 100 이하여야 합니다."` - 범위 초과
- `"최소 할인 퍼센트는 최대 할인 퍼센트보다 작거나 같아야 합니다."` - 논리적 오류

---

## 사용 예시

### 1. 초기 설정 플로우

```javascript
// 1. 공통 설정 조회 (없으면 자동 생성)
const commonSettings = await fetch('/setting/commonpolicy/', {
  headers: { 'Authorization': 'Bearer ' + token }
});

// 2. 네이버 설정 조회 (없으면 자동 생성)
const naverSettings = await fetch('/setting/naverpolicy/', {
  headers: { 'Authorization': 'Bearer ' + token }
});

// 3. 마켓 계정 조회
const naverMarkets = await fetch('/setting/marketsetting/?market=naver', {
  headers: { 'Authorization': 'Bearer ' + token }
});
```

### 2. 설정 업데이트 플로우

```javascript
// 1. 공통 설정 업데이트
await fetch('/setting/commonpolicy/', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    minimum_margin: 6000,
    basic_margin_percentage: 25,
    // ... 기타 필드
  })
});

// 2. 새 마켓 계정 추가
await fetch('/setting/marketsetting/?market=naver', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    naver_market_number: 12345,
    naver_market_memo: "서브 스토어",
    naver_maximun_sku_count: 500
  })
});
```

### 3. 기타 설정 플로우

```javascript
// 1. 기타 설정 조회
const extraSettings = await fetch('/setting/extra/', {
  headers: { 'Authorization': 'Bearer ' + token }
});

// 2. 마켓번호 목록 조회
const naverMarkets = await fetch('/setting/extra/market-numbers/?market=naver', {
  headers: { 'Authorization': 'Bearer ' + token }
});

// 3. 특정 마켓의 상품개수 조회
const productCount = await fetch('/setting/extra/product-count/?market=naver&market_number=1', {
  headers: { 'Authorization': 'Bearer ' + token }
});

// 4. 기타 설정 업데이트
await fetch('/setting/extra/', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    use_deep_ban: 1,
    allow_keyword_spacing: 0
  })
});

// 5. 상품개수 수정
await fetch('/setting/extra/product-count/', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    market: 'naver',
    market_number: 1,
    count: 1500
  })
});
```

### 4. 에러 처리 예시

```javascript
try {
  const response = await fetch('/setting/marketsetting/?market=naver', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify(marketData)
  });
  
  const result = await response.json();
  
  if (!result.success) {
    if (result.message.includes('중복되는 마켓번호')) {
      alert('이미 등록된 마켓번호입니다. 다른 번호를 사용해주세요.');
    } else {
      alert('오류: ' + result.message);
    }
    return;
  }
  
  console.log('마켓 생성 성공:', result.data.shopid);
} catch (error) {
  console.error('네트워크 오류:', error);
  alert('서버 연결에 실패했습니다.');
}
```

---

## 개발자 가이드

### 새로운 설정 API 추가 시

1. **데이터베이스 스키마 정의**
2. **Repository 함수 작성** (CRUD 작업)
3. **Service 로직 구현** (비즈니스 로직, 유효성 검증)
4. **Controller 라우트 추가** (HTTP 요청/응답 처리)
5. **index.js에 라우터 등록**
6. **API 문서 업데이트**

### 테스트 방법

```bash
# Postman 또는 curl을 사용한 테스트
curl -X GET "http://localhost:3000/setting/commonpolicy/" \
  -H "Authorization: Bearer your_jwt_token"

curl -X POST "http://localhost:3000/setting/marketsetting/?market=naver" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{"naver_market_number": 12345, "naver_market_memo": "테스트", "naver_maximun_sku_count": 1000}'

# 기타 설정 API 테스트
curl -X GET "http://localhost:3000/setting/extra/" \
  -H "Authorization: Bearer your_jwt_token"

curl -X PUT "http://localhost:3000/setting/extra/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{"use_deep_ban": 1, "allow_keyword_spacing": 0}'

curl -X GET "http://localhost:3000/setting/extra/market-numbers/?market=naver" \
  -H "Authorization: Bearer your_jwt_token"

curl -X GET "http://localhost:3000/setting/extra/product-count/?market=naver&market_number=1" \
  -H "Authorization: Bearer your_jwt_token"

curl -X PUT "http://localhost:3000/setting/extra/product-count/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_jwt_token" \
  -d '{"market": "naver", "market_number": 1, "count": 1500}'
```

---

## 버전 정보

**현재 버전**: v1.0.0

### 변경 이력
- **v1.0.0** (2024-01-01)
  - 공통 정책 설정 API 추가
  - 네이버 정책 설정 API 추가
  - 마켓 계정 관리 API 추가
  - 민감정보 마스킹 기능 추가