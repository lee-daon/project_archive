# 번역 처리 모듈 (TranslateDetail) 명세서

## 1. 개요
TranslateDetail 모듈은 상품 정보 번역 및 가공 작업을 처리하는 모듈입니다. 각 상품마다 개별적인 번역 옵션을 적용할 수 있으며, Redis 큐를 통해 비동기적으로 작업을 처리합니다.

## 2. API 엔드포인트

### 번역 작업 요청 API
- **경로**: `/prc/translatedetail`
- **메소드**: POST
- **설명**: 여러 상품의 번역 및 가공 작업을 요청합니다.

#### 요청 형식
```json
[
  {
    "userId": 123,
    "productId": 456,
    "options": {
      "attributeTranslation": true,
      "optionTranslation": true,
      "keyword": {
        "type": "long",
        "include": ["brand", "category"]
      },
      "seo": {
        "type": "title",
        "include": ["keyword", "brand"],
        "category": "fashion",
        "includeBrand": true
      },
      "nukkiImages": {
        "enabled": true,
        "order": 1
      },
      "imageTranslation": {
        "main": true,
        "detail": true,
        "option": false
      },
      "brandFiltering": true
    }
  },
  {
    "userId": 123,
    "productId": 457,
    "options": {
      // 각 상품마다 다른 옵션 적용 가능
    }
  }
]
```

#### 응답 형식
```json
{
  "success": true,
  "message": "3개 상품의 번역 작업이 요청되었습니다.",
  "requestedAt": "2023-06-01T09:00:00.000Z"
}
```

## 3. Redis 큐 구조

### 큐 목록
| 큐 이름 | 설명 |
|---------|------|
| text:translation:queue | 텍스트 번역 관련 작업 큐 |
| image:translation:queue | 이미지 번역 관련 작업 큐 |
| nukki:image:queue | 누끼 이미지 생성 관련 작업 큐 |

### 큐 데이터 구조

#### 텍스트 번역 큐 (text:translation:queue)
```json
// 속성 번역
{
  "type": "attribute",
  "userId": 123,
  "productId": 456
}

// 옵션 번역
{
  "type": "option",
  "userId": 123,
  "productId": 456,
  "propPath": "1:2:3"
}

// 키워드 생성
{
  "type": "keyword",
  "userId": 123,
  "productId": 456,
  "keywordType": "basic",//advanced
  "include": ["brand", "category"]
}

// SEO 최적화
{
  "type": "seo",
  "userId": 123,
  "productId": 456,
  "seoType": "basic",//advanced
  "include": ["keyword", "brand"],
  "category": "fashion",
  "includeBrand": true
}
```

#### 이미지 번역 큐 (image:translation:queue)
```json
{
  "type": "main_image", // 또는 "detail_image", "option_image"
  "userId": 123,
  "productId": 456
}
```

#### 누끼 이미지 큐 (nukki:image:queue)
```json
{
  "type": "nukki",
  "userId": 123,
  "productId": 456,
  "order": 1
}
```

## 4. 처리 흐름

1. API 요청 수신
   - `/prc/translatedetail` 엔드포인트로 요청 수신
   - 요청 데이터 유효성 검사

2. 각 상품별 개별 처리
   - `processProduct` 함수를 통해 각 상품마다 다른 옵션으로 처리
   - Promise.all을 통한 병렬 처리

3. 작업 정보 조회
   - prop_path 정보 조회 (옵션 번역에 필요)
   - 이미지 개수 조회 (메인, 상세, 옵션)

4. 작업 개수 계산
   - 이미지 작업 개수, 옵션 작업 개수, 전체 작업 개수 계산

5. 가공 상태 업데이트
   - processing_status 테이블에 작업 정보 및 상태 업데이트

6. 작업 큐 등록
   - 각 작업 유형별로 해당 Redis 큐에 등록
   - 속성 번역, 옵션 번역, 키워드 생성, SEO 최적화, 누끼 이미지, 이미지 번역

7. 비동기 처리 및 응답
   - 큐 등록 후 즉시 성공 응답 반환
   - 배경에서 작업 처리 진행

8. 오류 처리
   - 작업 처리 중 오류 발생 시 상태를 'fail'로 업데이트
   - 오류 로깅 및 예외 처리

## 5. 데이터베이스 테이블 구조

### processing_status 테이블
| 필드명 | 타입 | 설명 |
|--------|------|------|
| userid | INT | 사용자 ID |
| productid | INT | 상품 ID |
| status | VARCHAR | 처리 상태 (pending, processing, brandbanned, notbanned, fail, completed) |
| brandfilter | BOOLEAN | 브랜드 필터링 사용 여부 |
| name_optimized | BOOLEAN | SEO 최적화 여부 |
| main_image_translated | BOOLEAN | 메인 이미지 번역 여부 |
| description_image_translated | BOOLEAN | 상세 이미지 번역 여부 |
| option_image_translated | BOOLEAN | 옵션 이미지 번역 여부 |
| attribute_translated | BOOLEAN | 속성 번역 여부 |
| keyword_generated | BOOLEAN | 키워드 생성 여부 |
| nukki_created | BOOLEAN | 누끼 이미지 생성 여부 |
| option_optimized | BOOLEAN | 옵션 최적화 여부 |
| banned | BOOLEAN | 금지 상품 여부 |
| img_tasks_count | INT | 이미지 작업 개수 |
| option_tasks_count | INT | 옵션 작업 개수 |
| overall_tasks_count | INT | 전체 작업 개수 |

## 6. 모듈 구조

```
backend/modules/processing/
├── controller/
│   └── translatedetail.js  # API 처리 컨트롤러
├── service/
│   ├── producer.js         # Redis 큐 생성 서비스
│   └── tasksProcessing.js  # 작업 처리 서비스
├── repository/
│   ├── controlPrcStatus.js # 가공 상태 관리 저장소
│   └── getTasksInfo.js     # 작업 정보 조회 저장소
└── TranslateDetail.md      # 모듈 명세서
```

## 7. 오류 처리 및 재시도

- 오류 발생 시 processing_status 테이블의 상태를 'fail'로 업데이트
- 로그에 상세 오류 정보 기록
- 브랜드 금지 상품은 'brandbanned' 상태로 처리되어 후속 작업 제외
- 개별 작업 처리 중 오류가 발생해도 다른 작업은 계속 진행
