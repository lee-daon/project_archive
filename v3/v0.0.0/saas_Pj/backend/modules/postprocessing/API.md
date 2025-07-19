# 후처리 모듈 API 문서

이 문서에서는 후처리 모듈에서 제공하는 API 엔드포인트들을 상세히 설명합니다.

## 목차

1. [상품 처리 상태 정보 조회 API](#상품-처리-상태-정보-조회-api)
2. [상품 승인 처리 API](#상품-승인-처리-api)
3. [상품 폐기 처리 API](#상품-폐기-처리-api)
4. [상품 리스트 조회 API](#상품-리스트-조회-api)
5. [상품 상세 정보 조회 API](#상품-상세-정보-조회-api)
6. [상품 정보 수정 API](#상품-정보-수정-api)
7. [마켓 등록용 JSON 데이터 생성 API](#마켓-등록용-json-데이터-생성-api)
8. [카테고리 매핑 정보 조회 API](#카테고리-매핑-정보-조회-api)
9. [카테고리별 상품 샘플 조회 API](#카테고리별-상품-샘플-조회-api)
10. [카테고리 매핑 업데이트 API](#카테고리-매핑-업데이트-api)

---

## 상품 처리 상태 정보 조회 API

상품의 처리 상태 정보와 통계를 조회하는 API입니다.

### 요청 정보

- URL: `/postprc/getprocessinginfo`
- 메소드: `GET`
- 인증: 필요 (사용자 인증 후 접근 가능)

### 쿼리 파라미터 (Query Parameters)

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| order | string | 아니오 | `asc` | 정렬 순서 (`asc`: 과거순, `desc`: 최신순) |
| limit | number | 아니오 | `10` | 조회할 상품 개수 |
| status | string | 아니오 | 없음 | 조회할 상태 (`pending`, `brandbanCheck`, `processing`, `success`, `fail`, `all`) |

※ 쿼리 파라미터가 없거나 누락된 경우 기본값이 적용됩니다.
※ status 파라미터가 없거나 빈 문자열인 경우, 또는 'all'인 경우 5개 상태(pending, brandbanCheck, processing, success, fail)만 조회됩니다.

### 응답

#### 성공 응답 (200 OK)

```json
{
  "success": true,
  "data": {
    "counts": {
      "pending": 5,
      "brandbanCheck": 2,
      "processing": 3,
      "success": 15,
      "fail": 1,
      "total": 26
    },
    "products": [
      {
        "productid": 12345678,
        "brandfilter": true,
        "status": "success",
        "name_optimized": true,
        "main_image_translated": true,
        "description_image_translated": true,
        "option_image_translated": true,
        "attribute_translated": true,
        "keyword_generated": true,
        "nukki_created": true,
        "option_optimized": true,
        "created_at": "2023-05-20T08:30:45Z"
      },
      // ... 추가 상품 정보
    ]
  }
}
```

#### 오류 응답

**잘못된 파라미터 (400 Bad Request)**

```json
{
  "success": false,
  "message": "유효하지 않은 상태 값입니다."
}
```

**서버 오류 (500 Internal Server Error)**

```json
{
  "success": false,
  "message": "서버 오류가 발생했습니다."
}
```

### 상태 값 설명

| 상태 값 | 설명 |
|---------|------|
| pending | 가공 요청된 상태 |
| brandbanCheck | 브랜드 필터링 승인 대기 중인 상태 |
| notbanned | 브랜드 필터링 통과 상태 |
| processing | 현재 가공 중인 상태 |
| success | 가공이 성공적으로 완료된 상태 |
| fail | 가공에 실패한 상태 |
| brandbanned | 브랜드가 금지되어 처리가 중단된 상태 |
| commit | 승인된 상태 |
| discard | 삭제된 상태 |

### 예제

#### 요청 예제 1: 특정 상태 조회

```
GET /postprc/getprocessinginfo?status=processing&limit=5&order=desc
```

#### 요청 예제 2: 5개 주요 상태 조회 (pending, brandbanCheck, processing, success, fail)

```
GET /postprc/getprocessinginfo?limit=10&order=asc
```

또는

```
GET /postprc/getprocessinginfo?status=all&limit=10&order=asc
```

#### 응답 예제

```json
{
  "success": true,
  "data": {
    "counts": {
      "pending": 5,
      "brandbanCheck": 2,
      "processing": 3,
      "success": 15,
      "fail": 1,
      "total": 26
    },
    "products": [
      {
        "productid": 87654321,
        "brandfilter": true,
        "status": "processing",
        "name_optimized": true,
        "main_image_translated": true,
        "description_image_translated": false,
        "option_image_translated": false,
        "attribute_translated": true,
        "keyword_generated": false,
        "nukki_created": false,
        "option_optimized": false,
        "created_at": "2023-05-21T15:45:30Z"
      },
      {
        "productid": 76543210,
        "brandfilter": true,
        "status": "processing",
        "name_optimized": true,
        "main_image_translated": true,
        "description_image_translated": true,
        "option_image_translated": false,
        "attribute_translated": false,
        "keyword_generated": false,
        "nukki_created": false,
        "option_optimized": false,
        "created_at": "2023-05-19T10:20:15Z"
      },
      {
        "productid": 65432109,
        "brandfilter": true,
        "status": "processing",
        "name_optimized": true,
        "main_image_translated": false,
        "description_image_translated": false,
        "option_image_translated": false,
        "attribute_translated": false,
        "keyword_generated": false,
        "nukki_created": false,
        "option_optimized": false,
        "created_at": "2023-05-18T09:12:45Z"
      }
    ]
  }
}
```

---

## 상품 승인 처리 API

가공이 완료된 상품을 승인 상태로 변경하고, 소유권 정보를 생성하며, 상품 그룹 정보를 저장하는 API입니다.

### 요청 정보

- URL: `/postprc/approve`
- 메소드: `POST`
- 인증: 필요 (사용자 인증 후 접근 가능)
- Content-Type: `application/json`

### 요청 본문 (Request Body)

```json
{
  "productids": [12345678, 23456789, 34567890],
  "memo": "5월 셔츠 상품군",
  "commitcode": "SHIRT-2023-05"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| productids | Array<number> | 예 | 승인할 상품 ID 배열 |
| memo | string | 아니오 | 상품 그룹에 대한 메모 |
| commitcode | string | 예 | 상품 그룹 코드 (등록 시 사용) |

### 응답

#### 성공 응답 (200 OK)

```json
{
  "success": true,
  "message": "3개 상품이 승인 처리되었습니다.",
  "results": {
    "approveStatus": {
      "success": true,
      "message": "3개 상품이 승인 처리되었습니다.",
      "processingUpdated": 3
    },
    "ownership": {
      "success": true,
      "message": "3개 상품의 소유권 정보가 생성되었습니다.",
      "successCount": 3,
      "failedCount": 0
    },
    "groupInfo": {
      "success": true,
      "message": "3개 상품의 그룹 정보가 저장되었습니다.",
      "successCount": 3
    }
  }
}
```

#### 오류 응답

**잘못된 요청 (400 Bad Request)**

```json
{
  "success": false,
  "message": "승인할 상품 ID 배열이 필요합니다."
}
```

또는

```json
{
  "success": false,
  "message": "상품 그룹 코드(commitcode)가 필요합니다."
}
```

**서버 오류 (500 Internal Server Error)**

```json
{
  "success": false,
  "message": "서버 오류가 발생했습니다.",
  "error": "오류 메시지"
}
```

### 처리 설명

이 API는 다음과 같은 작업을 수행합니다:

1. 상품 상태를 'commit'으로 변경 (processing_status 테이블)
2. 소유권 정보 생성 (ownership 테이블)
   - 가공 상태에 따라 이미지, 속성, 옵션 등의 데이터 구성
3. 상품 그룹 정보 저장 (pre_register 테이블)
   - 제공된 commitcode와 memo를 사용하여 상품 그룹화

### 예제

#### 요청 예제

```
POST /postprc/approve
Content-Type: application/json

{
  "productids": [12345678, 23456789],
  "memo": "여름 드레스 상품",
  "commitcode": "SUMMER-DRESS-2023"
}
```

#### 응답 예제

```json
{
  "success": true,
  "message": "2개 상품이 승인 처리되었습니다.",
  "results": {
    "approveStatus": {
      "success": true,
      "message": "2개 상품이 승인 처리되었습니다.",
      "processingUpdated": 2
    },
    "ownership": {
      "success": true,
      "message": "2개 상품의 소유권 정보가 생성되었습니다.",
      "successCount": 2,
      "failedCount": 0
    },
    "groupInfo": {
      "success": true,
      "message": "2개 상품의 그룹 정보가 저장되었습니다.",
      "successCount": 2
    }
  }
}
```

---

## 상품 폐기 처리 API

가공 중이거나 완료된 상품을 폐기 상태로 변경하는 API입니다.

### 요청 정보

- URL: `/postprc/discard`
- 메소드: `POST`
- 인증: 필요 (사용자 인증 후 접근 가능)
- Content-Type: `application/json`

### 요청 본문 (Request Body)

```json
{
  "productids": [12345678, 23456789]
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| productids | Array<number> | 예 | 폐기할 상품 ID 배열 |

### 응답

#### 성공 응답 (200 OK)

```json
{
  "success": true,
  "message": "2개 상품이 폐기 처리되었습니다.",
  "processingUpdated": 2,
  "statusUpdated": 2
}
```

#### 오류 응답

**잘못된 요청 (400 Bad Request)**

```json
{
  "success": false,
  "message": "폐기할 상품 ID 배열이 필요합니다."
}
```

또는

```json
{
  "success": false,
  "message": "상품 폐기 처리 중 오류가 발생했습니다."
}
```

**서버 오류 (500 Internal Server Error)**

```json
{
  "success": false,
  "message": "서버 오류가 발생했습니다.",
  "error": "오류 메시지"
}
```

### 처리 설명

이 API는 다음과 같은 작업을 수행합니다:

1. 상품 상태를 'discard'로 변경 (processing_status 테이블)
2. status 테이블의 discarded 필드를 true로 설정

이 작업은 트랜잭션으로 처리되어, 모든 상태 변경이 함께 성공하거나 실패합니다.

### 예제

#### 요청 예제

```
POST /postprc/discard
Content-Type: application/json

{
  "productids": [12345678, 23456789]
}
```

#### 응답 예제

```json
{
  "success": true,
  "message": "2개 상품이 폐기 처리되었습니다.",
  "processingUpdated": 2,
  "statusUpdated": 2
}
```

---

## 상품 리스트 조회 API

승인된 상품의 리스트를 페이지네이션으로 조회하는 API입니다.

### 요청 정보

- URL: `/postprc/getproducts`
- 메소드: `GET`
- 인증: 필요 (사용자 인증 후 접근 가능)

### 쿼리 파라미터 (Query Parameters)

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| page | number | 아니오 | `1` | 페이지 번호 |
| limit | number | 아니오 | `60` | 페이지당 상품 수 (기본값: 60, 6x10) |
| order | string | 아니오 | `latest` | 정렬 방식 (`latest`: 최신순, `oldest`: 과거순) |
| search | string | 아니오 | `` | 상품군 코드 검색 |

### 응답

#### 성공 응답 (200 OK)

```json
{
  "success": true,
  "data": {
    "products": [
      {
        "productid": 12345678,
        "product_group_code": "SHIRT-2023-05",
        "title_optimized": "고급 면 반팔 셔츠 남성용",
        "main_image_url": "https://example.com/images/main/12345678_0.jpg"
      },
      {
        "productid": 23456789,
        "product_group_code": "SHIRT-2023-05",
        "title_optimized": "여성 블라우스 흰색 긴팔",
        "main_image_url": "https://example.com/images/nukki/23456789_0.jpg"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_count": 125
    }
  }
}
```

#### 오류 응답

**잘못된 파라미터 (400 Bad Request)**

```json
{
  "success": false,
  "message": "잘못된 페이지 파라미터입니다."
}
```

또는

```json
{
  "success": false,
  "message": "정렬 방식은 latest 또는 oldest만 가능합니다."
}
```

**서버 오류 (500 Internal Server Error)**

```json
{
  "success": false,
  "message": "서버 오류가 발생했습니다."
}
```

### 예제

#### 요청 예제

```
GET /postprc/getproducts?page=1&limit=20&order=latest&search=SHIRT
```

#### 응답 예제

```json
{
  "success": true,
  "data": {
    "products": [
      {
        "productid": 12345678,
        "product_group_code": "SHIRT-2023-05",
        "title_optimized": "고급 면 반팔 셔츠 남성용",
        "main_image_url": "https://example.com/images/nukki/12345678_0.jpg"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_count": 15
    }
  }
}
```

---

## 상품 상세 정보 조회 API

특정 상품의 상세 정보를 조회하는 API입니다. (모달창에서 사용)

### 요청 정보

- URL: `/postprc/getproducts/{productid}`
- 메소드: `GET`
- 인증: 필요 (사용자 인증 후 접근 가능)

### URL 파라미터

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| productid | number | 예 | 조회할 상품 ID |

### 응답

#### 성공 응답 (200 OK)

```json
{
  "success": true,
  "data": {
    "product_info": {
      "productid": 12345678,
      "title_optimized": "고급 면 반팔 셔츠 남성용",
      "keywords": "[셔츠,남성,면,반팔,고급]",
      "product_group_code": "SHIRT-2023-05"
    },
    "main_images": [
      {
        "imageurl": "https://example.com/images/main/12345678_0.jpg",
        "imageorder": 0,
        "is_representative": true
      },
      {
        "imageurl": "https://example.com/images/main/12345678_1.jpg",
        "imageorder": 1,
        "is_representative": false
      }
    ],
    "nukki_images": [
      {
        "image_url": "https://example.com/images/nukki/12345678_0.jpg",
        "image_order": 0
      }
    ],
    "description_images": [
      {
        "imageurl": "https://example.com/images/desc/12345678_0.jpg",
        "imageorder": 0
      },
      {
        "imageurl": "https://example.com/images/desc/12345678_1.jpg",
        "imageorder": 1
      }
    ],
    "properties": [
      {
        "property_name": "브랜드",
        "property_value": "BRAND",
        "property_order": 0
      },
      {
        "property_name": "소재",
        "property_value": "면 100%",
        "property_order": 1
      }
    ],
    "options": [
      {
        "prop_path": "1627207:1177220561",
        "private_optionname": "색상분류",
        "private_optionvalue": "화이트",
        "private_imageurl": "https://example.com/images/option/white.jpg"
      },
      {
        "prop_path": "1627207:1177220562",
        "private_optionname": "색상분류",
        "private_optionvalue": "블랙",
        "private_imageurl": "https://example.com/images/option/black.jpg"
      }
    ]
  }
}
```

#### 오류 응답

**잘못된 요청 (400 Bad Request)**

```json
{
  "success": false,
  "message": "상품 ID가 필요합니다."
}
```

**상품 없음 (404 Not Found)**

```json
{
  "success": false,
  "message": "상품을 찾을 수 없습니다."
}
```

**서버 오류 (500 Internal Server Error)**

```json
{
  "success": false,
  "message": "서버 오류가 발생했습니다."
}
```

### 예제

#### 요청 예제

```
GET /postprc/getproducts/12345678
```

---

## 상품 정보 수정 API

승인된 상품의 정보를 수정하는 API입니다.

### 요청 정보

- URL: `/postprc/putproduct/{productid}`
- 메소드: `PUT`
- 인증: 필요 (사용자 인증 후 접근 가능)
- Content-Type: `application/json`

### URL 파라미터

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| productid | number | 예 | 수정할 상품 ID |

### 요청 본문 (Request Body)

```json
{
  "title_optimized": "레이저 수평기 고정밀 그린 레이저",
  "keywords": "수평기,녹색 레이저,12라인,벽 부착식,투사 라인,고정밀",
  "representative_image_type": "main",
  "representative_image_order": 0,
  "deleted_main_images": [3],
  "deleted_description_images": [8, 3, 6],
  "deleted_nukki_images": [],
  "updated_options": [
    {
      "prop_path": "1627207:1177220561",
      "private_optionname": "颜色分类",
      "private_optionvalue": "标配送三脚架 全国联保"
    }
  ],
  "updated_properties": [
    {
      "property_order": 0,
      "property_name": "품牌",
      "property_value": "Bosch/博世"
    }
  ]
}
```

### 응답

#### 성공 응답 (200 OK)

```json
{
  "success": true,
  "message": "상품 정보가 성공적으로 수정되었습니다."
}
```

#### 오류 응답

**잘못된 요청 (400 Bad Request)**

```json
{
  "success": false,
  "message": "상품명이 필요합니다."
}
```

또는

```json
{
  "success": false,
  "message": "유효하지 않은 상품 ID입니다."
}
```

또는

```json
{
  "success": false,
  "message": "대표 이미지 타입은 main 또는 nukki만 가능합니다."
}
```

**서버 오류 (500 Internal Server Error)**

```json
{
  "success": false,
  "message": "서버 내부 오류가 발생했습니다."
}
```

### 처리 설명

이 API는 다음과 같은 작업을 수행합니다:

1. **기본 정보 업데이트**: `title_optimized`, `keywords` 수정
2. **키워드 포맷팅**: 키워드를 `[키워드1,키워드2]` 형식으로 자동 변환
3. **이미지 삭제**: 지정된 순서의 메인/상세/누끼 이미지 삭제
4. **대표 이미지 설정**: 
   - `main` 타입: 모든 누끼 이미지 삭제 + 지정된 순서를 0번으로 변경
   - `nukki` 타입: 별도 처리 없음
5. **옵션 정보 업데이트**: `private_options` 테이블 수정
6. **속성 정보 업데이트**: `private_properties` 테이블 수정

### 예제

#### 요청 예제

```
PUT /postprc/putproduct/12345678
Content-Type: application/json

{
  "title_optimized": "고급 면 반팔 셔츠 남성용 (수정됨)",
  "keywords": "셔츠,남성,면,반팔,고급,수정",
  "representative_image_type": "main",
  "representative_image_order": 1,
  "deleted_main_images": [2],
  "deleted_description_images": [],
  "deleted_nukki_images": [0],
  "updated_options": [
    {
      "prop_path": "1627207:1177220561",
      "private_optionname": "색상분류",
      "private_optionvalue": "화이트 (수정됨)"
    }
  ],
  "updated_properties": [
    {
      "property_order": 0,
      "property_name": "브랜드",
      "property_value": "BRAND (수정됨)"
    }
  ]
}
```

#### 응답 예제

```json
{
  "success": true,
  "message": "상품 정보가 성공적으로 수정되었습니다."
}
```

---

## 마켓 등록용 JSON 데이터 생성 API

가공이 완료된 상품들을 마켓플레이스 등록용 JSON 데이터로 변환하는 API입니다.

### 요청 정보

- URL: `/postprc/generate-register-data`
- 메소드: `POST`
- 인증: 필요 (사용자 인증 후 접근 가능)
- Content-Type: `application/json`

### 요청 본문 (Request Body)

```json
{
  "productids": [622706981192, 721963707226, 834567890123]
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| productids | Array<number> | 예 | JSON 데이터를 생성할 상품 ID 배열 |

### 응답

#### 성공 응답 (200 OK)

```json
{
  "success": true,
  "message": "JSON 데이터가 성공적으로 생성되었습니다.",
  "data": {
    "processed_count": 2,
    "failed_count": 1,
    "failed_products": [834567890123]
  }
}
```

#### 오류 응답

**잘못된 요청 (400 Bad Request)**

```json
{
  "success": false,
  "message": "유효한 상품 ID 배열이 필요합니다."
}
```

또는

```json
{
  "success": false,
  "message": "모든 상품 처리에 실패했습니다.",
  "data": {
    "processed_count": 0,
    "failed_count": 3,
    "failed_products": [622706981192, 721963707226, 834567890123]
  }
}
```

**인증 오류 (401 Unauthorized)**

```json
{
  "success": false,
  "message": "사용자 인증이 필요합니다."
}
```

**서버 오류 (500 Internal Server Error)**

```json
{
  "success": false,
  "message": "서버 내부 오류가 발생했습니다.",
  "error": "오류 메시지"
}
```

### 처리 설명

이 API는 다음과 같은 작업을 수행합니다:

1. **데이터 수집**: 개인 테이블(`private_*`)에서 가공된 데이터 수집
   - 상품 기본 정보 (제목, 브랜드, 카테고리, 배송비, 키워드 등)
   - 대표 이미지 (누끼 이미지 우선, 없으면 메인 이미지 첫 번째)
   - 메인 이미지 배열 (대표 이미지 제외)
   - 상세 설명 이미지 배열
   - 상품 속성 정보
   - 옵션 스키마 및 변형(variant) 정보

2. **데이터 가공**: 마켓플레이스 등록 형식에 맞게 변환
   - 키워드 배열 파싱
   - 가격 필터링 (중앙값의 1/3 이하 가격 제외)
   - 옵션 매핑 및 변형 생성
   - 최대 50개 변형 제한

3. **데이터 저장**: `pre_register` 테이블에 JSON 데이터 저장

4. **상태 업데이트**: 
   - `processing_status` 테이블의 status를 'ended'로 변경
   - `status` 테이블의 `baseJson_completed`를 true로 설정

5. **에러 로깅**: 모든 실패 케이스를 `error_log` 테이블에 기록

### JSON 데이터 구조

생성되는 JSON 데이터는 다음 구조를 갖습니다:

```json
{
  "success": true,
  "productInfo": {
    "productId": "622706981192",
    "url": "https://detail.1688.com/offer/622706981192.html",
    "productName": "고급 면 반팔 셔츠 남성용",
    "categoryId": "CAT001",
    "brandName": "BRAND",
    "deliveryFee": 2500,
    "video": "https://video.url",
    "keywords": ["셔츠", "남성", "면", "반팔"],
    "representativeImage": "https://image.url/nukki/main.jpg",
    "images": [
      "https://image.url/main1.jpg",
      "https://image.url/main2.jpg"
    ],
    "descriptionImages": [
      "https://image.url/desc1.jpg",
      "https://image.url/desc2.jpg"
    ],
    "attributes": [
      {
        "name": "브랜드",
        "value": "BRAND"
      },
      {
        "name": "소재",
        "value": "면 100%"
      }
    ],
    "attributes_cut": "브랜드 / 소재"
  },
  "optionSchema": [
    {
      "optionId": "1627207",
      "optionName": "색상분류",
      "optionValues": [
        {
          "valueId": "1177220561",
          "valueName": "화이트",
          "imageUrl": "https://image.url/color_white.jpg"
        },
        {
          "valueId": "1177220562",
          "valueName": "블랙",
          "imageUrl": "https://image.url/color_black.jpg"
        }
      ]
    },
    {
      "optionId": "1627208",
      "optionName": "사이즈",
      "optionValues": [
        {
          "valueId": "3232478",
          "valueName": "M"
        },
        {
          "valueId": "3232479",
          "valueName": "L"
        }
      ]
    }
  ],
  "variants": [
    {
      "stockQuantity": 100,
      "price": "25000.00",
      "optionCombination": [
        {
          "optionId": "1627207",
          "valueId": "1177220561"
        },
        {
          "optionId": "1627208",
          "valueId": "3232478"
    }
      ]
    },
    {
      "stockQuantity": 80,
      "price": "25000.00",
      "optionCombination": [
        {
          "optionId": "1627207",
          "valueId": "1177220561"
        },
        {
          "optionId": "1627208",
          "valueId": "3232479"
        }
      ]
  }
  ]
}
```

### 예제

#### 요청 예제

```
POST /postprc/generate-register-data
Content-Type: application/json

{
  "productids": [622706981192, 721963707226]
}
```

#### 응답 예제

```json
{
  "success": true,
  "message": "JSON 데이터가 성공적으로 생성되었습니다.",
  "data": {
    "processed_count": 2,
    "failed_count": 0,
    "failed_products": []
  }
}
```

### 가격 필터링 로직

API는 비정상적으로 낮은 가격의 SKU를 자동으로 제외합니다:

1. **가격 수집**: 모든 SKU의 가격(할인가 우선) 수집
2. **중앙값 계산**: 가격 배열의 중앙값 계산
3. **임계값 설정**: 중앙값의 1/3을 임계값으로 설정
4. **필터링 적용**: 임계값보다 높은 가격의 SKU만 선택
5. **로깅**: 필터링 결과를 콘솔에 출력

예: 중앙값이 30,000원인 경우, 10,000원 이하의 SKU는 제외됩니다.

---

## 카테고리 매핑 정보 조회 API

카테고리 매핑이 필요한 상품들의 카테고리 정보를 조회하는 API입니다.

### 요청 정보

- URL: `/postprc/categorymapping`
- 메소드: `GET`
- 인증: 필요 (사용자 인증 후 접근 가능)

### 쿼리 파라미터

없음

### 응답

#### 성공 응답 (200 OK)

```json
{
  "success": true,
  "categories": [
    {
      "catid": "50000671",
      "catname": "셔츠/블라우스",
      "naver_cat_id": "50000004",
      "naver_cat_name": "의류",
      "coopang_cat_id": "194176",
      "coopang_cat_name": "여성의류",
      "elevenstore_cat_id": "78001",
      "elevenstore_cat_name": "의류/잡화"
    },
    {
      "catid": "50014866",
      "catname": "원피스",
      "naver_cat_id": null,
      "naver_cat_name": null,
      "coopang_cat_id": null,
      "coopang_cat_name": null,
      "elevenstore_cat_id": null,
      "elevenstore_cat_name": null
    }
  ]
}
```

#### 오류 응답

**사용자 인증 오류 (400 Bad Request)**

```json
{
  "success": false,
  "message": "사용자 ID가 필요합니다.",
  "code": "MISSING_USER_ID"
}
```

또는

```json
{
  "success": false,
  "message": "유효하지 않은 사용자 ID입니다.",
  "code": "INVALID_USER_ID"
}
```

**서버 오류 (500 Internal Server Error)**

```json
{
  "success": false,
  "message": "서버 내부 오류가 발생했습니다.",
  "error": "오류 메시지"
}
```

### 처리 설명

이 API는 다음과 같은 작업을 수행합니다:

1. **매핑 필요 카테고리 조회**: `status` 테이블에서 `category_mapping_required`가 true인 상품들의 카테고리 ID 조회
2. **기존 매핑 정보 조회**: `categorymapping` 테이블에서 기존 매핑 정보 조회
3. **누락된 카테고리 처리**: 매핑 정보가 없는 카테고리의 경우 기본 레코드 생성
4. **통합 결과 반환**: 모든 카테고리의 매핑 정보를 통합하여 반환

### 예제

#### 요청 예제

```
GET /postprc/categorymapping
```

#### 응답 예제

```json
{
  "success": true,
  "categories": [
    {
      "catid": "50000671",
      "catname": "셔츠/블라우스",
      "naver_cat_id": "50000004",
      "naver_cat_name": "의류",
      "coopang_cat_id": "194176",
      "coopang_cat_name": "여성의류"
    }
  ]
}
```

---

## 카테고리별 상품 샘플 조회 API

특정 카테고리에 속한 상품의 샘플을 조회하는 API입니다.

### 요청 정보

- URL: `/postprc/categorymapping/samples`
- 메소드: `GET`
- 인증: 필요 (사용자 인증 후 접근 가능)

### 쿼리 파라미터

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| catid | string | 예 | 없음 | 조회할 카테고리 ID |
| limit | number | 아니오 | `3` | 조회할 상품 수 (1-10 범위) |

### 응답

#### 성공 응답 (200 OK)

```json
{
  "success": true,
  "products": [
    {
      "id": 622706981192,
      "name": "고급 면 반팔 셔츠 남성용",
      "imageurl": "https://example.com/images/main_image.jpg"
    },
    {
      "id": 721963707226,
      "name": "여성 블라우스 흰색 긴팔",
      "imageurl": "https://example.com/images/blouse.jpg"
    },
    {
      "id": 834567890123,
      "name": "체크무늬 셔츠",
      "imageurl": "https://example.com/images/check_shirt.jpg"
    }
  ]
}
```

#### 오류 응답

**잘못된 요청 (400 Bad Request)**

```json
{
  "success": false,
  "message": "카테고리 ID가 필요합니다.",
  "code": "MISSING_CATID"
}
```

또는

```json
{
  "success": false,
  "error": "조회할 상품 수는 1-10 사이여야 합니다.",
  "code": "INVALID_LIMIT"
}
```

**서버 오류 (500 Internal Server Error)**

```json
{
  "success": false,
  "message": "서버 내부 오류가 발생했습니다.",
  "error": "오류 메시지"
}
```

### 처리 설명

이 API는 다음과 같은 작업을 수행합니다:

1. **상품 목록 조회**: 지정된 카테고리의 상품들을 최신순으로 조회
2. **제목 우선순위**: `title_optimized`를 우선으로 하고, 없으면 `title_translated` 사용
3. **이미지 조회**: 각 상품의 첫 번째 이미지 조회
4. **결과 구성**: 상품 ID, 이름, 이미지 URL을 포함한 샘플 데이터 구성

### 예제

#### 요청 예제

```
GET /postprc/categorymapping/samples?catid=50000671&limit=5
```

#### 응답 예제

```json
{
  "success": true,
  "products": [
    {
      "id": 622706981192,
      "name": "고급 면 반팔 셔츠 남성용",
      "imageurl": "https://example.com/images/shirt.jpg"
    }
  ]
}
```

---

## 카테고리 매핑 업데이트 API

카테고리의 매핑 정보를 업데이트하는 API입니다.

### 요청 정보

- URL: `/postprc/categorymapping/update`
- 메소드: `POST`
- 인증: 필요 (사용자 인증 후 접근 가능)
- Content-Type: `application/json`

### 요청 본문 (Request Body)

```json
{
  "mappings": [
    {
      "catid": "50000671",
      "catname": "셔츠/블라우스",
      "naver_cat_id": "50000004",
      "naver_cat_name": "의류",
      "coopang_cat_id": "194176",
      "coopang_cat_name": "여성의류",
      "elevenstore_cat_id": "78001",
      "elevenstore_cat_name": "의류/잡화"
    },
    {
      "catid": "50014866",
      "catname": "원피스",
      "naver_cat_id": "50000005",
      "naver_cat_name": "원피스",
      "coopang_cat_id": "194177",
      "coopang_cat_name": "원피스",
      "elevenstore_cat_id": "78002",
      "elevenstore_cat_name": "원피스"
    }
  ]
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| mappings | Array<Object> | 예 | 매핑 정보 배열 |
| mappings[].catid | string | 예 | 카테고리 ID |
| mappings[].catname | string | 아니오 | 카테고리 이름 |
| mappings[].naver_cat_id | string | 아니오 | 네이버 카테고리 ID |
| mappings[].naver_cat_name | string | 아니오 | 네이버 카테고리 이름 |
| mappings[].coopang_cat_id | string | 아니오 | 쿠팡 카테고리 ID |
| mappings[].coopang_cat_name | string | 아니오 | 쿠팡 카테고리 이름 |
| mappings[].elevenstore_cat_id | string | 아니오 | 11번가 카테고리 ID |
| mappings[].elevenstore_cat_name | string | 아니오 | 11번가 카테고리 이름 |

### 응답

#### 성공 응답 (200 OK)

```json
{
  "success": true,
  "message": "카테고리 매핑이 성공적으로 업데이트되었습니다.",
  "updated_count": 2,
  "updated_products_count": 15
}
```

#### 오류 응답

**잘못된 요청 (400 Bad Request)**

```json
{
  "success": false,
  "message": "매핑 정보가 필요합니다.",
  "code": "MISSING_MAPPINGS"
}
```

또는

```json
{
  "success": false,
  "error": "모든 매핑 정보에 catid가 필요합니다.",
  "code": "MISSING_CATID"
}
```

**서버 오류 (500 Internal Server Error)**

```json
{
  "success": false,
  "message": "서버 내부 오류가 발생했습니다.",
  "error": "오류 메시지"
}
```

### 처리 설명

이 API는 다음과 같은 작업을 수행합니다:

1. **매핑 정보 업데이트**: `categorymapping` 테이블에 UPSERT 방식으로 매핑 정보 저장/업데이트
2. **완료 상품 확인**: 네이버, 쿠팡, 11번가 매핑이 모두 완료된 카테고리의 상품 ID 조회
3. **상태 업데이트**: 완료된 상품들의 `status` 테이블의 각 마켓플레이스별 매핑 준비 상태를 자동으로 동기화
4. **결과 반환**: 업데이트된 카테고리 수와 완료 처리된 상품 수 반환

### 예제

#### 요청 예제

```
POST /postprc/categorymapping/update
Content-Type: application/json

{
  "mappings": [
    {
      "catid": "50000671",
      "catname": "셔츠/블라우스",
      "naver_cat_id": "50000004",
      "naver_cat_name": "의류",
      "coopang_cat_id": "194176",
      "coopang_cat_name": "여성의류",
      "elevenstore_cat_id": "78001",
      "elevenstore_cat_name": "의류/잡화"
    }
  ]
}
```

#### 응답 예제

```json
{
  "success": true,
  "message": "카테고리 매핑이 성공적으로 업데이트되었습니다.",
  "updated_count": 1,
  "updated_products_count": 8
}