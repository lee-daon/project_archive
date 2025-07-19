# 후처리 모듈 아키텍처

## 개요

후처리 모듈은 모듈형 아키텍처 패턴을 따르며, 다음과 같은 레이어로 구성되어 있습니다:

1. **Controller Layer**: HTTP 요청 처리 및 응답 생성
2. **Service Layer**: 비즈니스 로직 처리
3. **Repository Layer**: 데이터베이스 접근 및 데이터 조작

이 아키텍처는 관심사 분리(Separation of Concerns) 원칙을 따라 각 레이어가 특정 책임을 담당하도록 설계되었습니다.

## 디렉토리 구조

```
postprocessing/
├── index.js                 # 모듈 진입점 및 라우터 설정
├── README.md                # 모듈 설명 및 사용 방법
├── ARCHITECTURE.md          # 아키텍처 설명 (현재 파일)
├── API.md                   # API 문서
├── controller/              # 컨트롤러 레이어
│   ├── getProcessingInfo.js # 상품 처리 상태 조회 컨트롤러
│   ├── approve.js           # 상품 승인 처리 컨트롤러
│   ├── discard.js           # 상품 폐기 처리 컨트롤러
│   ├── getProducts.js       # 상품 리스트 및 상세 조회 컨트롤러
│   ├── putProduct.js        # 상품 정보 수정 컨트롤러
│   ├── generate-register-data.js  # 마켓 등록용 JSON 데이터 생성 컨트롤러
│   └── categorymapping.js   # 카테고리 매핑 관리 컨트롤러
├── service/                 # 서비스 레이어
│   ├── createOwnership.js   # 소유권 생성 서비스
│   ├── putProduct.js        # 상품 정보 수정 서비스
│   ├── createBaseSchema.js  # 마켓 등록용 JSON 스키마 생성 서비스
│   └── categorymapping.js   # 카테고리 매핑 비즈니스 로직 서비스
└── repository/              # 리포지토리 레이어
    ├── getProcessingInfo.js      # 상품 처리 상태 데이터 접근 객체
    ├── approveStatusControl.js   # 승인 상태 변경 리포지토리
    ├── discardStatusControl.js   # 폐기 상태 변경 리포지토리
    ├── groupcode.js              # 상품 그룹 관리 리포지토리
    ├── Ownership.js              # 소유권 관리 리포지토리
    ├── getProducts.js            # 상품 리스트 및 상세 조회 리포지토리
    ├── putProduct.js             # 상품 정보 수정 리포지토리
    ├── buildJsonInfo.js          # JSON 생성용 데이터 조회 리포지토리
    ├── registerReadyStatus.js    # 등록 준비 상태 관리 리포지토리
    └── categorymapping.js        # 카테고리 매핑 데이터 접근 리포지토리
```

## 파일별 역할 설명

### 1. 진입점

- **index.js**: 모듈의 진입점으로, Express 라우터를 설정하고 각 컨트롤러를 적절한 경로에 매핑합니다.

### 2. 컨트롤러 (Controller)

- **getProcessingInfo.js**
  - 상품 처리 상태 정보 조회 API 엔드포인트 처리
  - 쿼리 파라미터: status, order, limit
  - 상태별 카운트 및 상품 목록 조회 기능
  - 오류 처리 및 응답 포맷팅

- **approve.js**
  - 상품 승인 처리 API 엔드포인트 처리
  - 요청 본문 파라미터: productids, memo, commitcode
  - 상품 상태를 'commit'으로 변경
  - 소유권 정보 생성
  - 상품 그룹 정보 저장
  - 트랜잭션 관리 및 오류 처리

- **discard.js**
  - 상품 폐기 처리 API 엔드포인트 처리
  - 요청 본문 파라미터: productids
  - 상품 상태를 'discard'로 변경
  - status 테이블의 discarded 필드 업데이트
  - 오류 처리 및 응답 포맷팅

- **getProducts.js**
  - 상품 리스트 조회 API 엔드포인트 처리 (`GET /`)
  - 상품 상세 정보 조회 API 엔드포인트 처리 (`GET /:productid`)
  - 쿼리 파라미터: page, limit, order, search
  - 페이지네이션 및 검색 기능 지원
  - 승인된 상품(commit 상태)만 조회

- **putProduct.js**
  - 상품 정보 수정 API 엔드포인트 처리 (`PUT /:productid`)
  - 요청 본문 파라미터: title_optimized, keywords, representative_image_type 등
  - 입력 데이터 검증 및 오류 처리
  - 서비스 레이어와 연동하여 비즈니스 로직 처리

- **generate-register-data.js**
  - 마켓 등록용 JSON 데이터 생성 API 엔드포인트 처리
  - 요청 본문 파라미터: productids (상품 ID 배열)
  - 상품 ID 배열을 받아 각 상품의 JSON 스키마 생성
  - 배치 처리를 통한 여러 상품 동시 처리
  - 에러 로깅 및 상태 업데이트 관리
  - 성공/실패 카운트 및 실패 상품 목록 응답

- **categorymapping.js**
  - 카테고리 매핑 관리 API 엔드포인트 처리
  - `GET /`: 매핑이 필요한 카테고리 정보 조회
  - `GET /samples`: 특정 카테고리의 상품 샘플 조회 (catid, limit)
  - `POST /update`: 카테고리 매핑 정보 업데이트 (mappings 배열)
  - 사용자 인증 및 입력 데이터 검증
  - 카테고리 매핑 완료 시 자동 상태 업데이트

### 3. 서비스 (Service)

- **createOwnership.js**
  - 소유권 정보 생성 로직 구현
  - 다양한 처리 상태에 따른 이미지, 속성, 옵션 데이터 구성
  - 단일 상품 및 여러 상품에 대한 소유권 정보 생성 기능
  - 에러 핸들링 및 결과 집계

- **putProduct.js**
  - 상품 정보 수정 비즈니스 로직 처리
  - 키워드 포맷팅 (`[키워드1,키워드2]` 형식 자동 변환)
  - 대표 이미지 타입별 처리 로직
  - 입력 데이터 검증 및 유효성 확인
  - 여러 리포지토리 함수 조합 및 트랜잭션 관리

- **createBaseSchema.js**
  - 마켓 등록용 JSON 스키마 생성 서비스
  - 개인 테이블(`private_*`)에서 가공된 데이터를 수집하여 마켓플레이스 등록 형식으로 변환
  - 가격 필터링 로직: 중앙값의 1/3 이하 가격 SKU 제외
  - 대표 이미지 선택: 누끼 이미지 우선, 없으면 메인 이미지 첫 번째
  - 옵션 스키마 및 변형(variant) 생성 (최대 50개 제한)
  - 키워드 배열 파싱 및 속성 정보 구성
  - 에러 발생시 자동 로깅 처리

- **categorymapping.js**
  - 카테고리 매핑 비즈니스 로직 처리 서비스
  - `getCategoryMappingInfoService`: 매핑이 필요한 카테고리 정보 조회 및 누락된 카테고리 기본 레코드 생성
  - `getCategoryProductSamplesService`: 카테고리별 상품 샘플 조회 (이미지 포함)
  - `updateCategoryMappingService`: 매핑 정보 업데이트 및 완료된 상품의 상태 자동 업데이트
  - 매핑 완료 검증 로직 (네이버, 쿠팡 ID 모두 존재)
  - 데이터 유효성 검증 및 에러 핸들링

### 4. 리포지토리 (Repository)

- **getProcessingInfo.js**
  - processing_status 테이블에서 상태별 카운트 조회 함수 제공
  - 상태별 상품 목록 조회 함수 제공
  - SQL 쿼리 실행 및 데이터 포맷팅

- **approveStatusControl.js**
  - 상품 상태를 'commit'으로 변경하는 함수 제공
  - 트랜잭션 관리 및 롤백 처리
  - 성공/실패 결과 반환

- **discardStatusControl.js**
  - 상품 상태를 'discard'로 변경하는 함수 제공
  - status 테이블의 discarded 필드 업데이트 함수 제공
  - 트랜잭션 관리 및 롤백 처리
  - 성공/실패 결과 반환

- **groupcode.js**
  - pre_register 테이블에 상품 그룹 정보 저장 함수 제공
  - 상품 그룹 정보 조회 함수 제공
  - 트랜잭션 관리 및 에러 처리
  - JSON 데이터 처리

- **Ownership.js**
  - ownership 테이블 데이터 생성 및 업데이트 함수 제공
  - 다양한 이미지, 속성, 옵션 정보 조회 함수 제공
  - JSON 필드 파싱 및 직렬화 처리
  - SQL 쿼리 생성 및 실행

- **getProducts.js**
  - 승인된 상품 리스트 조회 함수 제공 (`getProductsList`)
  - 상품 상세 정보 조회 함수 제공 (`getProductDetail`)
  - 페이지네이션, 정렬, 검색 기능 구현
  - 메인/누끼/상세 이미지, 속성, 옵션 정보 조회
  - MySQL 연결 관리 및 SQL 쿼리 실행

- **putProduct.js**
  - 상품 기본 정보 업데이트 함수 (`updateProductDetails`)
  - 이미지 삭제 함수들 (`deleteMainImages`, `deleteDescriptionImages`, `deleteNukkiImages`)
  - 대표 이미지 순서 변경 함수 (`swapMainImageOrder`)
  - 옵션 및 속성 업데이트 함수 (`updateOptions`, `updateProperties`)
  - 트랜잭션 관리 및 undefined 값 처리

- **buildJsonInfo.js**
  - JSON 생성용 데이터 조회 리포지토리
  - `private_*` 테이블에서 가공된 이미지, 속성, 옵션 데이터 조회
  - `products_detail` 테이블에서 상품 기본 정보 조회
  - `skus` 테이블에서 가격 및 재고 정보 조회
  - 이미지 순서(`image_order`) 기준 정렬 및 배열 생성
  - 대표 이미지 우선순위 로직 (누끼 → 메인 첫 번째)
  - 개별 함수별 에러 처리 및 로깅

- **registerReadyStatus.js**
  - 등록 준비 상태 관리 리포지토리
  - `pre_register` 테이블에 JSON 데이터 저장 (기존 그룹 정보 유지)
  - `processing_status` 테이블의 status를 'ended'로 업데이트
  - 단일 상품 및 배치 처리 지원
  - 트랜잭션 관리 및 롤백 처리
  - 성공/실패 결과 집계 및 반환

- **categorymapping.js**
  - 카테고리 매핑 데이터 접근 리포지토리
  - `getRequiredCategoryIds`: status 테이블에서 category_mapping_required가 true인 상품들의 catid 조회
  - `getCategoryMappingInfo`: categorymapping 테이블에서 기존 매핑 정보 조회
  - `createMissingCategoryRecords`: 누락된 카테고리에 대한 기본 레코드 생성
  - `getCategoryProductSamples`: 특정 카테고리의 상품 샘플 및 이미지 조회
  - `upsertCategoryMapping`: 카테고리 매핑 정보 UPSERT (INSERT + UPDATE)
  - `getCompletedMappingProductIds`: 매핑이 완료된 카테고리의 상품 ID 조회

## 데이터 흐름

### 1. 상품 처리 상태 조회 흐름

```
클라이언트 요청
    ↓
getProcessingInfo.js (컨트롤러)
  - 요청 파라미터 검증
  - 인증 확인
    ↓
getProcessingInfo.js (리포지토리)
  - getStatusCounts(): 상태별 카운트 조회
  - getProductsByStatus(): 상품 목록 조회
    ↓
컨트롤러에서 응답 구성
    ↓
클라이언트 응답
```

### 2. 상품 승인 처리 흐름

```
클라이언트 요청 (productids, memo, commitcode)
    ↓
approve.js (컨트롤러)
  - 요청 파라미터 검증
  - 인증 확인
    ↓
approveStatusControl.js (리포지토리)
  - updateApproveStatus(): 상태를 'commit'으로 변경
    ↓
createOwnership.js (서비스)
  - generateMultipleOwnerships(): 소유권 정보 생성
    ↓
Ownership.js (리포지토리)
  - createOwnership(): ownership 테이블 데이터 생성/업데이트
  - getProcessingStatus(), getTranslatedMainImages() 등: 관련 데이터 조회
    ↓
groupcode.js (리포지토리)
  - saveProductGroup(): 상품 그룹 정보 저장
    ↓
컨트롤러에서 응답 구성
    ↓
클라이언트 응답
```

### 3. 상품 폐기 처리 흐름

```
클라이언트 요청 (productids)
    ↓
discard.js (컨트롤러)
  - 요청 파라미터 검증
  - 인증 확인
    ↓
discardStatusControl.js (리포지토리)
  - updateDiscardStatus(): 상태를 'discard'로 변경, discarded 필드 업데이트
    ↓
컨트롤러에서 응답 구성
    ↓
클라이언트 응답
```

### 4. 상품 리스트 조회 흐름

```
클라이언트 요청 (page, limit, order, search)
    ↓
getProducts.js (컨트롤러)
  - 쿼리 파라미터 검증 (page, limit, order, search)
  - 인증 확인 (userid)
    ↓
getProducts.js (리포지토리)
  - getProductsList(): 승인된 상품 리스트 조회
    ↓
컨트롤러에서 응답 구성 (products, pagination)
    ↓
클라이언트 응답
```

### 5. 상품 상세 정보 조회 흐름

```
클라이언트 요청 (productid)
    ↓
getProducts.js (컨트롤러)
  - URL 파라미터 검증 (productid)
  - 인증 확인 (userid)
    ↓
getProducts.js (리포지토리)
  - getProductDetail(): 상품 기본 정보, 이미지, 속성, 옵션 조회
    ↓
컨트롤러에서 응답 구성 (product_info, main_images, nukki_images, description_images, properties, options)
    ↓
클라이언트 응답
```

### 6. 상품 정보 수정 흐름

```
클라이언트 요청 (title_optimized, keywords, representative_image_type, deleted_images, updated_options 등)
    ↓
putProduct.js (컨트롤러)
  - URL 파라미터 검증 (productid)
  - 요청 본문 검증
  - 인증 확인 (userid)
    ↓
putProduct.js (서비스)
  - validateUpdateData(): 입력 데이터 검증
  - formatKeywords(): 키워드 포맷팅 ([키워드] 형식)
  - updateProduct(): 메인 업데이트 로직 실행
    ↓
putProduct.js (리포지토리)
  - updateProductDetails(): 기본 정보 업데이트
  - deleteMainImages(), deleteDescriptionImages(), deleteNukkiImages(): 이미지 삭제
  - swapMainImageOrder(): 대표 이미지 순서 변경
  - updateOptions(), updateProperties(): 옵션/속성 업데이트
    ↓
컨트롤러에서 응답 구성
    ↓
클라이언트 응답
```

### 7. 마켓 등록용 JSON 데이터 생성 흐름

```
클라이언트 요청 (productids 배열)
    ↓
generate-register-data.js (컨트롤러)
  - 요청 본문 검증 (productids 배열)
  - 인증 확인 (userid)
  - 각 상품에 대해 JSON 스키마 생성 반복
    ↓
createBaseSchema.js (서비스)
  - createProductSchema(): 상품별 JSON 스키마 생성
    ↓
buildJsonInfo.js (리포지토리)
  - fetchProductBasicInfo(): 상품 기본 정보 조회
  - fetchRepresentativeImage(): 대표 이미지 조회 (누끼 우선)
  - fetchMainImages(): 메인 이미지 배열 조회 (대표 이미지 제외)
  - fetchDescriptionImages(): 상세 이미지 배열 조회
  - fetchAttributes(): 속성 정보 조회
  - fetchSkuData(): SKU 가격/재고 정보 조회
  - fetchPrivateOptions(): 개인 옵션 정보 조회
    ↓
createBaseSchema.js (서비스)
  - 가격 필터링: 중앙값의 1/3 이하 SKU 제외
  - 옵션 스키마 및 변형(variant) 생성
  - 최종 JSON 구조 구성
    ↓
registerReadyStatus.js (리포지토리)
  - batchSaveProductJsonAndUpdateStatus(): 배치 저장
  - pre_register 테이블에 JSON 데이터 저장
  - processing_status를 'ended'로 업데이트
    ↓
GlobalStatus.js (유틸리티)
  - updateBaseJsonCompletedStatus(): status 테이블의 baseJson_completed를 true로 설정
    ↓
error_log.js (유틸리티)
  - saveErrorLog(): 실패한 상품들의 에러 로그 저장
    ↓
컨트롤러에서 응답 구성 (processed_count, failed_count, failed_products)
    ↓
클라이언트 응답
```

### 8. 카테고리 매핑 정보 조회 흐름

```
클라이언트 요청
    ↓
categorymapping.js (컨트롤러)
  - 사용자 인증 확인 (userid)
    ↓
categorymapping.js (서비스)
  - getCategoryMappingInfoService(): 매핑 정보 조회 서비스
    ↓
categorymapping.js (리포지토리)
  - getRequiredCategoryIds(): 매핑이 필요한 카테고리 ID 조회
  - getCategoryMappingInfo(): 기존 매핑 정보 조회
  - createMissingCategoryRecords(): 누락된 카테고리 기본 레코드 생성
    ↓
컨트롤러에서 응답 구성 (categories 배열)
    ↓
클라이언트 응답
```

### 9. 카테고리별 상품 샘플 조회 흐름

```
클라이언트 요청 (catid, limit)
    ↓
categorymapping.js (컨트롤러)
  - 사용자 인증 확인 (userid)
  - 쿼리 파라미터 검증 (catid, limit)
    ↓
categorymapping.js (서비스)
  - getCategoryProductSamplesService(): 상품 샘플 조회 서비스
    ↓
categorymapping.js (리포지토리)
  - getCategoryProductSamples(): 카테고리 상품 샘플 및 이미지 조회
    ↓
컨트롤러에서 응답 구성 (products 배열)
    ↓
클라이언트 응답
```

### 10. 카테고리 매핑 업데이트 흐름

```
클라이언트 요청 (mappings 배열)
    ↓
categorymapping.js (컨트롤러)
  - 사용자 인증 확인 (userid)
  - 요청 본문 검증 (mappings)
    ↓
categorymapping.js (서비스)
  - updateCategoryMappingService(): 매핑 업데이트 서비스
    ↓
categorymapping.js (리포지토리)
  - upsertCategoryMapping(): 각 매핑 정보 UPSERT
  - getCompletedMappingProductIds(): 완료된 카테고리의 상품 ID 조회
    ↓
GlobalStatus.js (유틸리티)
  - updateCategoryMappingRequired(): 완료된 상품들의 category_mapping_required를 false로 업데이트
    ↓
컨트롤러에서 응답 구성 (updated_count, updated_products_count)
    ↓
클라이언트 응답
```

## 확장성

이 아키텍처는 새로운 기능 추가가 용이하도록 설계되었습니다:

1. 새로운 API 엔드포인트를 추가하려면 새 컨트롤러 파일을 생성하고 `index.js`에 라우트를 추가합니다.
2. 새로운 비즈니스 로직은 서비스 레이어에 추가합니다.
3. 새로운 데이터 접근 로직은 리포지토리 레이어에 추가합니다.

## 주요 기술적 특징

### 1. 트랜잭션 관리
- 데이터 일관성을 위한 MySQL 트랜잭션 사용
- 오류 발생 시 자동 롤백 처리

### 2. 데이터 검증
- 서비스 레이어에서 비즈니스 룰 검증
- 컨트롤러 레이어에서 HTTP 요청 검증

### 3. 오류 처리
- 계층별 오류 처리 및 로깅
- 적절한 HTTP 상태 코드 반환

### 4. 데이터베이스 최적화
- 연결 풀을 통한 데이터베이스 연결 관리
- undefined 값을 null로 변환하여 MySQL2 호환성 확보
