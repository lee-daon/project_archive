# Processing API 문서

## 커밋 상태 상품 정보 조회 API

### 설명
이 API는 사용자별 `sourcing_status` 테이블에서 commit 상태인 상품의 정보를 조회합니다.
다음 두 가지 정보를 제공합니다:
1. commit 상태인 상품의 총 개수
2. commit 상태인 상품을 commitcode별로 그룹화한 정보 (상품 ID 목록과 개수)

### 요청 정보
- **URL**: `/prc/getstatus`
- **메소드**: `GET`
- **인증**: 필수 (사용자 인증 정보가 요청에 포함되어야 함)

### 응답 형식
#### 성공 응답 (200 OK)
```json
{
  "success": true,
  "data": {
    "total_commit_count": 25,
    "commit_groups": [
      {
        "commitcode": 1,
        "count": 10,
        "productids": [1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008, 1009, 1010]
      },
      {
        "commitcode": 2,
        "count": 15,
        "productids": [2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015]
      }
    ]
  }
}
```

#### 오류 응답 (401 Unauthorized)
```json
{
  "success": false,
  "message": "인증되지 않은 요청입니다"
}
```

#### 오류 응답 (500 Internal Server Error)
```json
{
  "success": false,
  "message": "서버 오류가 발생했습니다",
  "error": "오류 메시지"
}
```

### 데이터 설명
- **total_commit_count**: commit 상태인 상품의 총 개수
- **commit_groups**: commitcode별로 그룹화된 상품 정보 배열
  - **commitcode**: 상품 그룹 코드
  - **count**: 해당 그룹의 상품 개수
  - **productids**: 해당 그룹에 속한 상품 ID 배열

## 가공 작업 시작 API

### 설명
이 API는 상품 가공 작업을 시작하는 엔드포인트입니다. 
다음과 같은 작업을 수행합니다:
1. 대상 상품 ID 배열 조회
2. 가공 상태 초기화 (processing_status 테이블 업데이트)
3. 브랜드 필터링 또는 번역 작업 시작

### 요청 정보
- **URL**: `/prc/manager`
- **메소드**: `POST`
- **인증**: 필수 (사용자 인증 정보가 요청에 포함되어야 함)
- **요청 본문**: JSON

### 요청 본문 형식
```json
{
  "options": {
    "brandFiltering": true,
    "optionTranslation": true,
    "attributeTranslation": true,
    "imageTranslation": {
      "main": true,
      "detail": true,
      "option": true
    },
    "keyword": {
      "type": "basic",
      "include": ["키워드1", "키워드2"]
    },
    "seo": {
      "type": "basic",
      "include": ["키워드1", "키워드2"],
      "category": "카테고리1,카테고리2",
      "includeBrand": false
    },
    "nukkiImages": {
      "enabled": true,
      "order": 1
    }
  },
  "targets": {
    "type": "commit",
    "commitCode": 0,
    "productIds": [622706981192, 721963707226]
  }
}
```

### 응답 형식
#### 성공 응답 (200 OK)
```json
{
  "success": true,
  "message": "10개 상품 가공 작업이 시작되었습니다.",
  "count": 10
}
```

#### 오류 응답 (404 Not Found)
```json
{
  "success": false,
  "message": "처리할 상품이 없습니다."
}
```

#### 오류 응답 (500 Internal Server Error)
```json
{
  "success": false,
  "message": "가공 작업 시작 중 오류가 발생했습니다.",
  "error": "오류 메시지"
}
```

### 데이터 설명
#### 요청 옵션 (options)
- **brandFiltering**: 브랜드 필터링 활성화 여부 (불리언)
- **optionTranslation**: 옵션 번역 활성화 여부 (불리언)
- **attributeTranslation**: 속성 번역 활성화 여부 (불리언)
- **imageTranslation**: 이미지 번역 옵션
  - **main**: 메인 이미지 번역 여부 (불리언)
  - **detail**: 상세 이미지 번역 여부 (불리언)
  - **option**: 옵션 이미지 번역 여부 (불리언)
- **keyword**: 키워드 생성 옵션
  - **type**: 키워드 생성 유형 ('basic' 또는 'advanced')
  - **include**: 포함할 키워드 배열
- **seo**: SEO 최적화 옵션
  - **type**: SEO 최적화 유형 ('basic' 또는 'advanced')
  - **include**: 포함할 키워드 배열
  - **category**: 카테고리 문자열 (콤마로 구분)
  - **includeBrand**: 브랜드 포함 여부 (불리언)
- **nukkiImages**: 누끼 이미지 생성 옵션
  - **enabled**: 누끼 이미지 생성 활성화 여부 (불리언)
  - **order**: 누끼 처리 우선순위 (1-5 사이 값)

#### 대상 상품 지정 (targets)
- **type**: 대상 상품 조회 방식 ('all', 'recent', 'past', 'commit' 중 하나)
- **count**: 'recent'나 'past' 타입 사용 시 조회할 상품 수
- **commitCode**: 'commit' 타입 사용 시 특정 commitCode를 가진 상품 조회
- **productIds**: 직접 상품 ID 배열을 지정할 경우 사용

## 브랜드밴 체크 상품 조회 API

### 설명
이 API는 사용자별 `processing_status` 테이블에서 브랜드밴 체크 상태인 상품의 정보를 조회합니다.
브랜드 필터링 과정에서 확인이 필요한 상품들에 대한 정보를 제공합니다.
`brandbanCheck.js` 컨트롤러에서 `getBrandBanCheckProducts` 리포지토리 함수를 호출하여 처리합니다.

### 요청 정보
- **URL**: `/prc/brandbancheck`
- **메소드**: `GET`
- **인증**: 필수 (사용자 인증 정보가 요청에 포함되어야 함)

### 응답 형식
#### 성공 응답 (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "productid": 622706981192,
      "brand_name": "Nike",
      "detail_url": "https://example.com/product/622706981192",
      "title_translated": "나이키 에어맥스 90 운동화"
    },
    {
      "productid": 721963707226,
      "brand_name": "Adidas",
      "detail_url": "https://example.com/product/721963707226",
      "title_translated": "아디다스 울트라부스트 20 운동화"
    }
  ]
}
```

#### 오류 응답 (401 Unauthorized)
```json
{
  "success": false,
  "message": "인증되지 않은 요청입니다"
}
```

#### 오류 응답 (500 Internal Server Error)
```json
{
  "success": false,
  "message": "브랜드밴 체크 상품 조회 중 오류가 발생했습니다."
}
```

### 데이터 설명
- **productid**: 상품 ID
- **brand_name**: 원본 브랜드명
- **detail_url**: 상품 상세 페이지 URL
- **title_translated**: 번역된 상품 제목

### 처리 과정
1. 사용자 인증 정보에서 userId 추출
2. `getBrandBanCheckProducts` 함수를 호출하여 브랜드밴 체크 상태인 상품 목록 조회
3. 조회된 상품 정보를 클라이언트에 반환

## 번역 작업 요청 API

### 설명
이 API는 상품 번역 및 가공 작업을 요청하는 엔드포인트입니다.
요청된 상품을 작업 큐에 등록하고 가공 상태를 업데이트합니다.
비동기적으로 작업을 처리하고 즉시 성공 응답을 반환합니다.
`translatedetail.js` 컨트롤러에서 `processProduct` 서비스 함수를 호출하여 처리합니다.

### 요청 정보
- **URL**: `/prc/translatedetail`
- **메소드**: `POST`
- **인증**: 선택 (사용자 ID는 요청 쿼리 또는 본문에서 추출)
- **요청 본문**: JSON 배열

### 요청 본문 형식
```json
[
  {
    "userId": 123,
    "productId": 622706981192,
    "options": {
      "optionTranslation": true,
      "attributeTranslation": true,
      "imageTranslation": {
        "main": true,
        "detail": true,
        "option": false
      },
      "keyword": {
        "type": "basic",
        "include": ["키워드1", "키워드2"]
      },
      "seo": {
        "type": "basic",
        "include": ["키워드1", "키워드2"],
        "category": "카테고리1,카테고리2",
        "includeBrand": false
      },
      "nukkiImages": {
        "enabled": true,
        "order": 1
      }
    }
  },
  {
    "userId": 123,
    "productId": 721963707226,
    "options": {
      "optionTranslation": true,
      "attributeTranslation": true
    }
  }
]
```

### 응답 형식
#### 성공 응답 (200 OK)
```json
{
  "success": true,
  "message": "2개 상품의 번역 작업이 요청되었습니다.",
  "requestedAt": "2023-09-01T12:34:56.789Z"
}
```

#### 오류 응답 (400 Bad Request)
```json
{
  "success": false,
  "message": "유효한 요청 데이터가 제공되지 않았습니다."
}
```

#### 오류 응답 (500 Internal Server Error)
```json
{
  "success": false,
  "message": "번역 요청 처리 중 오류가 발생했습니다.",
  "error": "오류 메시지"
}
```

### 데이터 설명
#### 요청 본문
- **userId**: 사용자 ID (선택, 쿼리 파라미터로도 전달 가능)
- **productId**: 가공할 상품 ID
- **options**: 가공 옵션 (manager API의 options와 동일한 형식)

### 처리 과정
1. 요청 데이터 유효성 검사
2. 사용자 ID 추출 (쿼리 또는 요청 본문에서)
3. 각 상품별로 `processProduct` 함수를 호출하여 비동기 처리
4. 비동기 작업 시작 후 즉시 성공 응답 반환
5. 백그라운드에서 처리 결과 로깅

## 번역된 이미지 수신 API

### 설명
이 API는 번역 서버로부터 번역된 이미지 정보를 수신하는 엔드포인트입니다.
번역된 이미지 URL을 저장하고 가공 상태를 업데이트합니다.
`imgTranslationController.js` 컨트롤러에서 `saveTranslatedImage` 및 `updateProcessingStatus` 함수를 호출하여 처리합니다.

### 요청 정보
- **URL**: `/prc/imgtranslation`
- **메소드**: `POST`
- **요청 본문**: JSON

### 요청 본문 형식
```json
{
  "image_id": "622706981192-1-main",
  "img_url": "https://example.com/translated_images/622706981192-1-main.jpg"
}
```

### 응답 형식
#### 성공 응답 (200 OK)
```json
{
  "success": true,
  "message": "번역된 이미지 정보가 성공적으로 저장되었습니다"
}
```

#### 오류 응답 (400 Bad Request)
```json
{
  "success": false,
  "message": "필수 필드가 누락되었습니다 (image_id, img_url)"
}
```

#### 오류 응답 (500 Internal Server Error)
```json
{
  "success": false,
  "message": "서버 오류가 발생했습니다",
  "error": "오류 메시지"
}
```

### 데이터 설명
#### 요청 본문
- **image_id**: 이미지 식별자 (형식: productId-순서-타입)
  - 예: "622706981192-1-main" (상품ID-순서-타입)
  - 타입은 'main', 'detail', 'option' 중 하나
- **img_url**: 번역된 이미지 URL

### 처리 과정
1. 요청 데이터 유효성 검사
2. 이미지 ID 파싱 (productId, 순서/prop_path, 타입)
3. 타입에 따라 적절한 저장 함수 호출:
   - 메인 이미지: item_image_translated 테이블에 저장
   - 상세 이미지: item_image_des_translated 테이블에 저장
   - 옵션 이미지: product_options 테이블의 imageurl_translated 필드 업데이트
4. 처리 상태 업데이트 (작업 카운트 감소 및 완료 여부 확인)
