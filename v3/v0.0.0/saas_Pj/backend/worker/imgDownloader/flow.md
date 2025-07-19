# 이미지 다운로드 시스템 플로우

## 개요
이미지 핫링크 차단 방지를 위한 이미지 다운로드 및 URL 교체 시스템

## 시스템 구성 요소

### 1. 큐 시스템
- **큐 이름**: `image:download:queue` (QUEUE_NAMES.IMAGE_DOWNLOAD_QUEUE)
- **목적**: 다운로드할 이미지 정보를 대기열에 저장

### 2. 데이터 구조

#### 메인/상세 이미지
```javascript
{
  productid: string,        // 상품 ID
  imageurl: string,         // 원본 이미지 URL
  imageType: string,        // 이미지 타입: 'main', 'description'
  imageOrder: number        // 이미지 순서
}
```

#### 옵션 이미지
```javascript
{
  imageurl: string,         // 원본 이미지 URL
  imageType: string,        // 이미지 타입: 'option'
  prop_path: string        // 옵션 식별자 (고유키)
}
```

## 플로우 단계

### Phase 1: 이미지 큐 등록 (완료)
**위치**: `saveProductDetail.js`



## 테이블별 URL 업데이트 대상

### 메인 이미지
- **테이블**: `item_images_raw`
- **조건**: `productid` + `imageorder` (복합키)
- **컬럼**: `imageurl`

### 상세 이미지  
- **테이블**: `item_images_des_raw`
- **조건**: `productid` + `imageorder` (복합키)
- **컬럼**: `imageurl`

### 옵션 이미지
- **테이블**: `product_options`
- **조건**: `prop_path` (고유키)
- **컬럼**: `imageurl`
- **특이사항**: productid 없이 prop_path만으로 식별


## 설정값

### API_SETTINGS
- `IMAGE_DOWNLOAD_DELAY_MS`: 100ms (다운로드 간격)
- `CONCURRENCY_LIMITS.IMAGE_DOWNLOAD_WORKER`: 20 (동시 처리 제한)

### 환경변수
- `IMG_DOWNLOAD_AUTH_KEY`: Cloudflare Worker 인증 키


