# Temp 테이블 사용 가이드

## 개요
`temp` 테이블은 서버 메모리에 저장되는 임시 데이터를 데이터베이스에 영구적으로 저장하기 위한 용도로 사용됩니다. 이를 통해 서버 재시작이나 여러 인스턴스 간 데이터 공유 문제를 해결할 수 있습니다.

- `userid`: 사용자 ID
- `type_number`: 데이터 타입 번호 (용도별 구분)
- `data`: JSON 형태로 저장되는 데이터
- `created_at`: 생성 시간
- `updated_at`: 업데이트 시간

## 데이터 타입 번호 (type_number) 정의

### 1: 상품 업로드 데이터
upload.js에서 사용하는 상품 업로드 처리 결과를 저장합니다.

#### 데이터 구조

```javascript
{
  bancheckedTarget: Array,         // 금지어 검사를 마친 상품 목록
  finalTargetCount: Number,        // 최종 처리 가능한 상품 수
  duplicationCount: Number,        // 중복 상품 개수
  includeBanCount: Number,         // 금지어 포함 상품 개수
  totalCount: Number,              // 전체 상품 개수
  dataReady: Boolean,              // 데이터 준비 완료 여부
  timestamp: String                // 타임스탬프
}
```

### 2: 가공 작업 옵션 데이터
manager.js에서 사용하는 가공 작업 옵션과 대상 상품 정보를 저장합니다.

#### 데이터 구조

```javascript
{
  options: {             // 가공 옵션 설정
    brandFiltering: Boolean,        // 브랜드 필터링 활성화 여부
    optionTranslation: Boolean,     // 옵션 번역 활성화 여부
    attributeTranslation: Boolean,  // 속성 번역 활성화 여부
    imageTranslation: {             // 이미지 번역 설정
      main: Boolean,                // 메인 이미지 번역 여부
      detail: Boolean,              // 상세 이미지 번역 여부
      option: Boolean               // 옵션 이미지 번역 여부
    },
    keyword: {                      // 키워드 설정
      type: String,                 // 키워드 타입 (basic/advanced)
      include: Array                // 포함할 키워드 배열
    },
    seo: {                          // SEO 설정
      type: String,                 // SEO 타입 (basic/advanced)
      include: Array,               // 포함할 키워드 배열
      category: String,             // 카테고리 정보
      includeBrand: Boolean         // 브랜드 포함 여부
    },
    nukkiImages: {                  // 누끼 이미지 설정
      enabled: Boolean,             // 활성화 여부
      order: Number                 // 순서 (5보다 작은 값)
    }
  },
  targets: Object,                  // 대상 상품 타입 정보
  productIds: Array,                // 처리할 상품 ID 배열
  created_at: Date                  // 생성 시간
}
```

### 3: 브랜드 필터링 결과
manager.js에서 사용하는 브랜드 필터링 결과 중 금지된 브랜드 상품 정보를 저장합니다.

#### 데이터 구조

```javascript
[
  {
    userId: Number,                 // 사용자 ID
    productId: Number,              // 상품 ID
    options: {                      // 가공 옵션 설정 (2번 타입의 options와 동일 구조)
      brandFiltering: Boolean,
      optionTranslation: Boolean,
      // ... 기타 옵션 값들
    }
  },
  // ... 금지된 브랜드 상품 항목들
]
```

