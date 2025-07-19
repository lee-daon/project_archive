# 소싱 모듈 아키텍처 문서

이 문서는 소싱 모듈의 파일 연결 관계와 데이터 흐름을 설명합니다.

## 1. 아키텍처 개요

소싱 모듈은 MVC(Model-View-Controller) 패턴에 기반한 아키텍처로 구성되어 있습니다:

```
클라이언트 요청 → controller → service → repository → 데이터베이스
                ↑                               ↓
                └─────────────────응답──────────┘
```

- **Controller**: API 엔드포인트를 정의하고 요청을 처리합니다.
- **Service**: 비즈니스 로직을 구현합니다.
- **Repository**: 데이터베이스 액세스 로직을 구현합니다.

### 비동기 처리 아키텍처

```
클라이언트 요청 → controller → Redis 큐 ↔ 워커 프로세스 → 데이터베이스
                ↑                               ↓
                └─────────────────응답──────────┘
```

## 2. 파일 연결 관계

### 모듈 진입점

- **index.js**: 모든 API 엔드포인트 라우터를 정의하고 컨트롤러와 연결합니다.

```javascript
import express from 'express';
import uploadRouter from './controller/upload.js';
import getbyshopRouter from './controller/getbyshop.js';
import listcheckRouter from './controller/listcheck.js';
import updatestatusRouter from './controller/updatestatus.js';
import updatebanRouter from './controller/updateban.js';
import detailparselistRouter from './controller/detailparselist.js';
import setupinfoRouter from './controller/setupinfo.js';
import urlSourcingRouter from './controller/urlSourcing.js';

// 각 컨트롤러를 라우터에 연결
router.use('/upload', uploadRouter);
router.use('/getbyshop', getbyshopRouter);
router.use('/listcheck', listcheckRouter);
router.use('/updatestatus', updatestatusRouter);
router.use('/updateban', updatebanRouter);
router.use('/detailparselist', detailparselistRouter);
router.use('/getstatus/setupinfo', setupinfoRouter);
router.use('/urlsourcing', urlSourcingRouter);
// ...
```

### API 엔드포인트 및 데이터 흐름

#### 1. 상품 업로드 API (`/upload`)

```
upload.js(controller) → uploadservice.js(service) → productListUpdate.js(service) → Productlist.js(repository) → 데이터베이스
                                 ↓
                      geminiNameTranslator.js(service)
```

- **controller/upload.js**: 업로드 요청 처리
- **service/uploadservice.js**: 상품 처리 로직 관리
- **service/productListUpdate.js**: 중복 체크 및 신규 상품 DB 저장
- **service/geminiNameTranslator.js**: 중국어 문자가 포함된 상품명만 번역 처리
- **repository/Productlist.js**: 상품 정보 저장 및 업데이트

#### 2. 상품 상세 정보 파싱 API (`/detailparselist`)

```
detailparselist.js(controller) → detail_info.js(service) → sourcing_async.js(repository) → 데이터베이스
                                       ↓                           ↓
                                redisClient.js(utils) → Redis 큐 → taobaoworker.js(워커)
                                       ↓
                           GlobalStatus.js(utils) → 데이터베이스 (status 테이블)
```

- **controller/detailparselist.js**: 상세 정보 파싱 요청 처리 (products 배열과 commitCode 수신)
- **service/detail_info.js**: Redis 큐에 작업 등록 및 commitCode 처리
- **repository/sourcing_async.js**: 처리 상태 관리 (pending 상태 설정 및 commitCode 저장)
- **common/utils/redisClient.js**: Redis 큐 연동
- **common/utils/assistDb/GlobalStatus.js**: status 테이블 항목 생성
- **worker/taobaodetail/taobaoworker.js**: 큐 처리 워커

#### 3. 쇼핑몰별 상품 조회 API (`/getbyshop`)

```
getbyshop.js(controller) → getshopitems.js(service) → 외부 API 호출 → 상점/판매자 정보 추출
        ↓                                                      ↓
banCheck.js(repository) ← ────────────────────────────────────┘
        ↓
update_shopNseller.js(repository) → 데이터베이스(ban_seller, ban_shop 테이블) 
        ↓
외부 API 호출 → 상품 수집 → upload API → 데이터베이스(productlist 테이블)
```

- **controller/getbyshop.js**: 쇼핑몰별 상품 조회 요청 처리
- **service/getshopitems.js**: 외부 API 호출하여 판매자, 상점 정보 및 상품 목록 조회
- **repository/banCheck.js**: 판매자/상점의 금지 상태 확인
- **repository/update_shopNseller.js**: 판매자/상점 정보 저장 (없는 경우에만)
- 조회된 상품 목록을 upload API로 전달하여 처리

#### 4. 상품 목록 확인 API (`/listcheck`)

```
listcheck.js(controller) → temp.js(repository) → 데이터베이스
```

- **controller/listcheck.js**: 업로드 처리 결과 조회
- **repository/temp.js**: 임시 데이터 조회

#### 5. 상태 업데이트 API (`/updatestatus`)

```
updatestatus.js(controller) → UpdateStatus.js(service) → controlScrStatus.js(repository) → 데이터베이스
                          ↓
                   GlobalStatus.js(utils) → 데이터베이스 (status 테이블)
                          ↓
                   카테고리 매핑 상태 동기화 → 데이터베이스 (status 테이블)
```

- **controller/updatestatus.js**: 상태 업데이트 요청 처리
- **service/UpdateStatus.js**: 상태 처리 로직 (uncommit → commit, 오류 상태 삭제)
- **repository/controlScrStatus.js**: 상태 업데이트 및 삭제
- **utils/assistDb/GlobalStatus.js**: 글로벌 상태 관리 및 카테고리 매핑 동기화

#### 6. 소싱 상태 정보 조회 API (`/getstatus/setupinfo`)

```
setupinfo.js(controller) → controlScrStatus.js(repository) → 데이터베이스
```

- **controller/setupinfo.js**: 상태 정보 조회 요청 처리 (commitCode 필터링 지원)
- **repository/controlScrStatus.js**: 상태별 개수 및 ID 목록 조회 (상태별 분류 지원)

#### 7. 상품 ID 기반 직접 소싱 API (`/urlsourcing`)

```
urlSourcing.js(controller) → UrlSourcing.js(service) → getproductdetail.js(service) → DataHub API
                          ↓                      ↓
               upload API ← ────────────────────┘
```

- **controller/urlSourcing.js**: 상품 ID 기반 직접 소싱 요청 처리
- **service/UrlSourcing.js**: 상품 ID 처리 및 중복 확인
- **service/getproductdetail.js**: DataHub API 호출하여 상품 정보 획득
- 조회된 상품 정보를 upload API로 전달하여 처리

#### 8. 상품 금지 상태 업데이트 API (`/updateban`)

```
updateban.js(controller) → Productlist.js(repository) → 데이터베이스
```

- **controller/updateban.js**: 상품 금지 상태 업데이트 요청 처리
- **repository/Productlist.js**: 상품 금지 상태 업데이트

## 3. 주요 컴포넌트 의존성 관계

### Controller 의존성

| Controller | 의존하는 Service/Repository |
|------------|---------------------------|
| upload.js | uploadservice.js |
| detailparselist.js | detail_info.js, GlobalStatus.js |
| getbyshop.js | getshopitems.js, banCheck.js, update_shopNseller.js |
| listcheck.js | temp.js |
| updatestatus.js | UpdateStatus.js, GlobalStatus.js |
| updateban.js | Productlist.js |
| setupinfo.js | controlScrStatus.js |
| urlSourcing.js | UrlSourcing.js |

### Service 의존성

| Service | 의존하는 Repository/Utils |
|---------|--------------------------|
| uploadservice.js | productListUpdate.js, geminiNameTranslator.js |
| detail_info.js | sourcing_async.js, redisClient.js |
| getshopitems.js | 외부 API 클라이언트 |
| UpdateStatus.js | controlScrStatus.js |
| geminiNameTranslator.js | Productlist.js, gemini.js |
| UrlSourcing.js | getproductdetail.js |
| productListUpdate.js | Productlist.js |

### Repository 의존성

| Repository | 설명 |
|------------|------|
| Productlist.js | 상품 목록 관리 (저장, 조회, 업데이트) |
| sourcing_async.js | 소싱 상태 관리 (pending 상태 설정, commitCode 저장) |
| controlScrStatus.js | 상태 코드 관리 (상태별 개수 조회, 상태별 ID 분류) |
| banCheck.js | 판매자/상점 금지 상태 확인 |
| update_shopNseller.js | 판매자/상점 정보 저장 (없는 경우에만) |
| user_ban_settings.js | 사용자별 금지 설정 관리 |

## 4. 데이터 흐름도

### 상품 소싱 전체 워크플로우

1. **상품 데이터 소스 → 업로드**
   ```
   getbyshop API/urlsourcing API/수동 업로드 → upload API → 데이터베이스(productlist 테이블)
   ```

2. **상세 정보 처리 요청 → 비동기 처리**
   ```
   detailparselist API (products + commitCode) → Redis 큐 → 워커 프로세스 → 데이터베이스(products_detail, sourcing_status 테이블)
   ```

3. **처리 상태 조회 및 관리**
   ```
   setupinfo API → 상태 정보 조회 (commitCode 필터링 지원)
   updatestatus API → 상태 업데이트/삭제 → 글로벌 상태 관리 → 카테고리 매핑 동기화
   ```

### commitCode 처리 흐름

1. **요청 단계**
   - `detailparselist` API에서 products 배열과 commitCode를 함께 수신
   - commitCode는 상품 그룹을 식별하는 번호로 사용

2. **처리 단계**
   - `sourcing_status` 테이블에 pending 상태와 함께 commitCode 저장
   - Redis 큐에 상품 정보 전달 (commitCode는 상태 관리용)

3. **조회 단계**
   - `setupinfo` API에서 commitCode로 필터링하여 특정 그룹의 상태만 조회 가능
   - 상태별 개수와 상품 ID 목록을 분류하여 반환

4. **승인 단계**
   - `updatestatus` API에서 uncommit → commit 상태 변경 (commitCode는 기존 값 유지)
   - 글로벌 상태 및 카테고리 매핑 상태 자동 동기화

## 5. 상태 관리 시스템

### 소싱 상태 종류

- **pending**: 처리 요청 상태 (큐에 등록됨)
- **uncommit**: 처리 성공 상태 (승인 대기)
- **commit**: 승인된 상태 (후속 처리 가능)
- **failapi**: API 호출 실패
- **failsave**: DB 저장 실패
- **banshop**: 금지된 쇼핑몰
- **banseller**: 금지된 판매자

### 상태별 ID 분류 시스템

`controlScrStatus.js`에서 제공하는 상태별 ID 분류:

- **productIds**: 모든 처리 중인 상품 ID (호환성 유지)
- **uncommitIds**: uncommit 상태 상품 ID
- **pendingIds**: pending 상태 상품 ID  
- **failIds**: failapi + failsave 상태 상품 ID
- **banIds**: banshop + banseller 상태 상품 ID

### 글로벌 상태 동기화

`updatestatus` API 실행 시 자동으로 수행되는 동기화:

1. **sourcing_completed 상태 업데이트**: commit 상태인 모든 상품
2. **카테고리 매핑 상태 동기화**: 기존 categorymapping 정보에 따라 각 마켓플레이스별 매핑 준비 상태 설정

## 6. 번역 처리 시스템

### 조건부 번역 처리

`geminiNameTranslator.js`에서 구현된 조건부 번역:

- **중국어 문자 감지**: 상품명에 중국어 문자가 포함된 경우만 번역 실행
- **번역 실패 시 재시도**: 1차 실패 시 재시도, 2차 실패 시 전체 번역 과정 중지
- **DB 동기화**: 번역 성공 시 즉시 DB에 번역된 상품명 저장

## 7. 설정 및 공통 컴포넌트

### 설정 관리

- **common/config/settings.js**: 애플리케이션 전체 설정 관리
  - 큐 이름
  - API 호출 간격
  - 상태 코드 상수 (DELETE_TARGET_STATUSES)

### 유틸리티

- **common/utils/redisClient.js**: Redis 연결 및 큐 작업 관리
- **common/utils/connectDB.js**: 데이터베이스 연결 관리
- **common/utils/assistDb/GlobalStatus.js**: 글로벌 상태 관리 및 카테고리 매핑 동기화
- **common/utils/Globalratelimiter.js**: API 호출 제한 관리

## 8. 오류 처리 흐름

대부분의 컴포넌트는 다음과 같은 오류 처리 패턴을 따릅니다:

```javascript
try {
  // 작업 수행
  return { success: true, ... };
} catch (error) {
  console.error('오류 발생:', error);
  return { success: false, message: '오류 메시지' };
}
```

API 응답:
```json
{
  "success": false,
  "message": "오류 메시지"
}
``` 