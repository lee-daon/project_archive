# Processing 모듈 아키텍처

## 1. 개요

Processing 모듈은 상품 가공 작업을 관리하는 백엔드 시스템입니다. 이 모듈은 다음과 같은 주요 기능을 제공합니다:

- 상품 브랜드 필터링 (금지어 체크)
- 상품 번역 작업 관리
- 이미지 번역 작업 관리
- 가공 상태 관리 및 모니터링

## 2. 모듈 구조

이 모듈은 다음과 같은 계층형 아키텍처로 구성되어 있습니다:

```
processing/
├── controller/     # API 엔드포인트 및 라우팅 처리
├── service/        # 비즈니스 로직 및 도메인 규칙
└── repository/     # 데이터 액세스 및 영속성 계층
```

### 2.1 컨트롤러 (Controller)

컨트롤러 계층은 HTTP 요청을 처리하고 클라이언트와의 통신을 담당합니다.

- **manager.js**: 가공 작업 시작 및 전체 흐름 관리
- **brandfilter.js**: 브랜드 필터링 결과 처리
- **brandbanCheck.js**: 브랜드밴 체크 상태 상품 조회
- **translatedetail.js**: 번역 작업 관리 및 작업 큐 등록
- **getstatus.js**: 가공 상태 조회
- **imgTranslationController.js**: 번역된 이미지 수신 및 저장

### 2.2 서비스 (Service)

서비스 계층은 핵심 비즈니스 로직을 구현합니다.

- **brandfiltering.js**: 브랜드명 필터링 및 번역 로직
- **brandban.js**: 브랜드 금지 처리 로직
- **status.js**: 상태 관련 비즈니스 로직
- **tasksProcessing.js**: 번역 및 가공 작업 처리 로직
- **producer.js**: 작업 큐 등록 로직

### 2.3 리포지토리 (Repository)

리포지토리 계층은 데이터베이스 액세스를 담당합니다.

- **controlPrcStatus.js**: 가공 상태 테이블 관리
- **controlSrcStatus.js**: 소싱 상태 테이블 관리
- **brandchecker.js**: 브랜드 관련 데이터 액세스
- **getTargetIds.js**: 대상 상품 ID 조회
- **saveImages.js**: 번역된 이미지 저장
- **getTasksInfo.js**: 작업 정보 조회

## 3. 주요 프로세스 흐름

### 3.1 브랜드 필터링 프로세스

1. 클라이언트가 가공 작업 시작 요청 (/processing/manager)
2. 대상 상품 ID 조회 (getTargetIds.js)
3. 가공 상태 초기화 (initProcessingStatus)
4. 브랜드 필터링 수행 (filterBannedBrands)
5. 금지된 브랜드 항목 처리 및 상태 업데이트
6. 금지되지 않은 상품은 번역 작업으로 전달

### 3.2 브랜드밴 체크 프로세스

1. 클라이언트가 브랜드밴 체크 상품 조회 (/prc/brandbancheck)
2. 해당 상태의 상품 목록 조회 (getBrandBanCheckProducts)
3. 클라이언트가 결과 확인 후 필터링 결과 제출 (brandfilter.js)
4. 결과에 따라 상품을 분류하고 상태 업데이트
5. 허용된 상품은 번역 작업으로 전달

### 3.3 번역 작업 프로세스

1. 클라이언트가 번역 작업 요청 (/prc/translatedetail)
2. 요청된 상품 및 옵션 정보 검증
3. 각 상품별 작업 큐에 등록 (processProduct 함수)
4. 작업 상태 및 작업 개수 업데이트
5. 비동기적으로 작업 처리 (Promise.all)

### 3.4 이미지 번역 프로세스

1. 번역 서버가 번역된 이미지 정보 전송 (/prc/imgtranslation)
2. 이미지 ID 파싱 (productId-순서-타입)
3. 이미지 타입에 따라 적절한 저장 위치 결정
4. 번역된 이미지 URL 저장 (saveTranslatedImage)
5. 가공 상태 업데이트 (updateProcessingStatus)

## 4. 데이터 모델

### 4.1 주요 테이블

- **processing_status**: 상품 가공 상태 및 옵션 저장
  - userid: 사용자 식별자
  - productid: 상품 식별자
  - status: 가공 상태 (pending, brandbanCheck, brandbanned, processing, completed 등)
  - img_tasks_count: 이미지 번역 작업 개수
  - option_tasks_count: 옵션 번역 작업 개수
  - overall_tasks_count: 전체 작업 개수
  - 기타 가공 옵션 필드들

- **products_detail**: 상품 상세 정보
  - userid: 사용자 식별자
  - productid: 상품 식별자
  - brand_name: 원본 브랜드명
  - brand_name_translated: 번역된 브랜드명
  - detail_url: 상품 상세 URL
  - title_translated: 번역된 상품 제목

- **item_image_translated**: 번역된 메인 이미지 정보
  - productid: 상품 식별자
  - imageorder: 이미지 순서
  - imageurl: 번역된 이미지 URL

- **item_image_des_translated**: 번역된 상세 이미지 정보
  - productid: 상품 식별자
  - imageorder: 이미지 순서
  - imageurl: 번역된 이미지 URL

- **product_options**: 상품 옵션 정보
  - prop_path: 옵션 경로
  - imageurl_translated: 번역된 옵션 이미지 URL

## 5. 비동기 작업 처리

이 모듈은 다음과 같은 비동기 작업 처리 전략을 사용합니다:

1. 클라이언트 요청 즉시 응답 (작업 시작 확인)
2. 백그라운드에서 작업 계속 진행 (Promise.all)
3. Redis 큐를 활용한 작업 분산 처리
4. 작업 완료 시 상태 테이블 업데이트
5. 내부 API 호출을 통한 모듈 간 통신

## 6. 외부 의존성

- **Gemini API**: 브랜드명 번역에 사용
- **Redis**: 작업 큐 관리
- **번역 서버**: 이미지 번역 처리
- **이미지 처리 서비스**: 이미지 가공 및 누끼 처리

## 7. 상태 관리 책임

각 컴포넌트는 다음과 같은 상태 관리 책임을 가집니다:

### 7.1 상태 변경 주체

#### 컨트롤러 (Controller)
- **manager.js**: 
  - 가공 작업 시작 시 초기 상태('pending') 설정을 요청
  - 브랜드 필터링 작업 트리거
  - 번역 작업 요청
  
- **brandfilter.js**: 
  - 브랜드 필터링 결과에 따른 상태 변경 요청
  - 허용된 상품에 대한 번역 작업 요청

- **brandbanCheck.js**: 
  - 'brandbanCheck' 상태인 상품 조회만 수행 (상태 변경 없음)

- **translatedetail.js**:
  - 번역 작업 요청 처리 및 작업 큐 등록
  - 'processing' 상태로 업데이트 요청

- **imgTranslationController.js**:
  - 번역된 이미지 정보 수신 및 저장
  - 작업 완료 상태 업데이트

#### 서비스 (Service)
- **brandfiltering.js**: 
  - 브랜드 필터링 로직 실행
  - 금지어 포함 상품 식별 후 상태 변경 요청
  
- **brandban.js**: 
  - 브랜드 필터링 결과 처리
  - 금지/허용 상품 분류

- **tasksProcessing.js**:
  - 번역 및 가공 작업 처리
  - 작업 큐 등록 및 상태 업데이트

- **producer.js**:
  - 각종 작업을 Redis 큐에 등록

#### 리포지토리 (Repository)
- **controlPrcStatus.js**: 
  - `initProcessingStatus`: 상품의 가공 상태를 'pending'으로 초기화
  - `updateBrandBannedStatus`: 금지된 브랜드 상품의 상태를 'brandbanned'로 변경
  - `updateTasksCount`: 작업 개수 업데이트 및 'processing' 상태로 변경
  - `updateProcessingStatus`: 이미지 처리 후 작업 카운트 감소 및 상태 업데이트
  
- **brandchecker.js**: 
  - `updateBrandFilterStatus`: 금지어 검사가 필요한 상품의 상태를 'brandbanCheck'로 변경
  - `getBrandBanCheckProducts`: 'brandbanCheck' 상태인 상품 조회

- **saveImages.js**:
  - `saveTranslatedImage`: 번역된 이미지 URL 저장

### 7.2 주요 상태 전이

- **pending**: 
  - 생성 주체: manager.js → initProcessingStatus
  - 다음 상태: brandbanCheck 또는 processing
  
- **brandbanCheck**: 
  - 생성 주체: brandfiltering.js → updateBrandFilterStatus
  - 조회 주체: brandbanCheck.js → getBrandBanCheckProducts
  - 다음 상태: brandbanned 또는 processing
  
- **brandbanned**: 
  - 생성 주체: brandfilter.js → updateBrandBannedStatus
  - 최종 상태로 더 이상 상태 변경 없음

- **processing**:
  - 생성 주체: translatedetail.js → processProduct → updateTasksCount
  - 다음 상태: completed (모든 작업 완료 시)

- **completed**:
  - 생성 주체: imgTranslationController.js → updateProcessingStatus
  - 모든 작업이 완료된 최종 상태
