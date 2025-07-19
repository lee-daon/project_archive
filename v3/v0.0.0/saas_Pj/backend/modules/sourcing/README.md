# 소싱 모듈 (Sourcing Module)

이 모듈은 타오바오와 같은 해외 쇼핑몰에서 상품을 소싱하여 국내 마켓에 등록하기 위한 기능을 제공합니다.

## 개요

소싱 모듈은 다음과 같은 기능을 제공합니다:

1. **상품 수집**: 특정 쇼핑몰 또는 판매자로부터 상품 정보 수집
2. **상품 ID 직접 소싱**: DataHub API를 통한 상품 ID 기반 직접 소싱
3. **상품 필터링**: 중복/금지어 포함 상품 필터링 및 기존 상품 정보 업데이트
4. **조건부 번역**: 중국어 문자가 포함된 상품명만 선별적 번역 처리
5. **판매자/상점 관리**: 판매자와 상점 정보 추적 및 금지 상태 관리
6. **상품 상세 정보 수집**: 상품 상세 정보를 API를 통해 수집하고 저장
7. **그룹 기반 상태 관리**: commitCode를 통한 상품 그룹별 상태 관리 및 추적
8. **글로벌 상태 동기화**: sourcing_completed 상태 및 카테고리 매핑 상태 자동 동기화
9. **비동기 처리**: Redis 큐를 활용한 상품 정보 비동기 처리

## 디렉토리 구조

```
/sourcing/
├── controller/           # API 엔드포인트 처리기
│   ├── detailparselist.js  # 상품 상세 정보 파싱 요청 처리 (commitCode 지원)
│   ├── getbyshop.js        # 쇼핑몰별 상품 조회 및 수집 처리
│   ├── listcheck.js        # 소싱된 상품 목록 조회 처리
│   ├── setupinfo.js        # 소싱 상태 정보 조회 처리 (commitCode 필터링 지원)
│   ├── updateban.js        # 상품 금지 상태 업데이트 처리
│   ├── updatestatus.js     # 상품 상태 업데이트 처리 (글로벌 상태 동기화)
│   ├── upload.js           # 상품 업로드 처리
│   └── urlSourcing.js      # 상품 ID 기반 직접 소싱 처리
├── repository/           # 데이터베이스 액세스 레이어
│   ├── banCheck.js         # 판매자/상점 금지 상태 확인 기능
│   ├── controlScrStatus.js # 소싱 상태 관리 및 조회 기능 (상태별 ID 분류)
│   ├── Productlist.js      # 상품 목록 관련 DB 작업
│   ├── sourcing_async.js   # 소싱 비동기 처리 관련 DB 작업 (commitCode 지원)
│   ├── update_shopNseller.js # 판매자/상점 정보 저장 기능
│   └── user_ban_settings.js # 사용자별 금지 설정 관리 기능
├── service/              # 비즈니스 로직 레이어
│   ├── detail_info.js      # 상품 상세 정보 처리 로직 (commitCode 처리)
│   ├── geminiNameTranslator.js # 조건부 상품명 번역 서비스
│   ├── getproductdetail.js # 상품 상세 정보 획득 서비스
│   ├── getshopitems.js     # 쇼핑몰 상품 목록 획득 서비스
│   ├── productListUpdate.js # 상품 목록 업데이트 로직
│   ├── UpdateStatus.js     # 상품 상태 일괄 처리 로직
│   ├── uploadservice.js    # 업로드 관련 처리 로직
│   └── UrlSourcing.js      # 상품 ID 처리 및 DataHub API 연동 로직
├── index.js              # 모듈 엔트리 포인트 및 라우터 설정
├── API.md                # API 문서
├── ARCHITECTURE.md       # 아키텍처 문서
└── README.md             # 모듈 설명 문서
```

## 설치 및 의존성

이 모듈은 다음과 같은 외부 의존성을 가집니다:

- express - 라우팅 및 미들웨어
- mysql2/promise - 데이터베이스 접근
- axios - HTTP 요청
- ioredis - Redis 큐 관리
- p-limit - 동시 실행 제한

## 워크플로우

### 기본 소싱 워크플로우

1. **상품 수집**
   - 쇼핑몰이나 판매자 페이지에서 상품 목록 수집 (`getbyshop`)
   - 상품 ID 배열로 직접 소싱 (`urlsourcing`)
   - 판매자/상점 금지 상태 확인 및 정보 저장

2. **상품 처리 및 필터링** (`upload`)
   - 중복 상품 확인 및 기존 상품 정보 업데이트 (가격, 이미지 URL, 판매량)
   - 신규 상품 저장
   - 중국어 문자가 포함된 상품명만 선별적 번역 처리

3. **상품 상세 정보 수집** (`detailparselist`)
   - products 배열과 commitCode를 함께 전송
   - Redis 큐에 작업 등록 및 상태 관리
   - status 테이블에 항목 생성

4. **워커 프로세스 처리**
   - 큐에 등록된 작업을 워커가 처리
   - 처리 결과에 따라 상태 업데이트

5. **상태 조회 및 관리**
   - 상태 정보 조회 (`setupinfo`) - commitCode 필터링 지원
   - 상태별 상품 ID 분류 제공
   - 상태 업데이트 (`updatestatus`) - 글로벌 상태 동기화

### commitCode 기반 그룹 관리

1. **그룹 생성**: `detailparselist` API에서 상품 그룹에 고유 commitCode 할당
2. **그룹별 추적**: `setupinfo` API에서 commitCode로 특정 그룹 상태만 조회
3. **그룹 승인**: `updatestatus` API에서 그룹 내 상품들을 일괄 승인 처리
4. **상태 동기화**: 승인된 상품들의 후속 처리 상태 자동 업데이트

## 판매자/상점 관리 기능

1. **금지 상태 확인**: 상품 소싱 시 해당 판매자나 상점이 금지되었는지 확인
   - 완전 금지: 해당 판매자/상점에서 상품 수집 불가
   - 경고 상태: 이전에 소싱한 적이 있는 판매자/상점에서는 사용자 확인 후 수집

2. **판매자/상점 정보 저장**: 소싱 중 추출한 판매자와 상점 정보 자동 저장
   - 데이터베이스 테이블: `ban_seller`, `ban_shop`
   - 처음 소싱 시 자동으로 정보 저장 (ban=false로 초기화)

3. **UI 인터페이스**: 금지 상태에 따른 경고 모달 표시
   - 금지된 경우: 계속 진행 불가
   - 경고만 있는 경우: 사용자 확인 후 진행 가능

## 번역 처리 시스템

### 조건부 번역 기능

`geminiNameTranslator.js`에서 구현된 스마트 번역 시스템:

1. **중국어 문자 감지**: 상품명에 중국어 문자(`[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]`)가 포함된 경우만 번역
2. **한국어 상품명 보존**: 중국어 문자가 없는 상품명은 번역하지 않고 원본 유지
3. **재시도 메커니즘**: 
   - 1차 번역 실패 시 자동 재시도
   - 2차 실패 시 전체 번역 과정 중지로 시스템 안정성 보장
4. **실시간 DB 동기화**: 번역 성공 시 즉시 DB에 번역된 상품명 저장

## 비동기 처리 과정

1. 상품 상세 정보 처리 요청이 접수되면 Redis 큐에 등록 (`detail_info.js`)
2. commitCode와 함께 상태 관리로 그룹별 추적 가능
3. 워커 프로세스는 큐에서 작업을 가져와 처리 (`taobaoworker.js`)
4. 처리 결과에 따라 상태 업데이트 (uncommit, failapi, failsave 등)
5. 후속 처리를 위해 uncommit 상태 상품을 commit으로 변경 (`UpdateStatus.js`)

## 소싱 상태 관리

상품 소싱 상태는 다음과 같이 관리됩니다:

- **pending**: 처리 요청 상태 (큐에 등록됨)
- **uncommit**: 처리 성공 상태 (승인 대기)
- **commit**: 승인된 상태 (후속 처리 가능)
- **failapi**: API 호출 실패
- **failsave**: DB 저장 실패
- **banshop**: 금지된 쇼핑몰
- **banseller**: 금지된 판매자

### 상태 관리 API

1. **상태 정보 조회** (`setupinfo`)
   - 각 상태별 상품 개수 조회
   - 상태별 상품 ID 분류 제공:
     - `uncommitIds`: uncommit 상태 상품 ID
     - `pendingIds`: pending 상태 상품 ID
     - `failIds`: failapi + failsave 상태 상품 ID
     - `banIds`: banshop + banseller 상태 상품 ID
   - commitCode 필터링으로 특정 그룹만 조회 가능

2. **상태 업데이트** (`updatestatus`)
   - uncommit 상태 → commit 상태로 변경 (commitCode는 기존 값 유지)
   - 오류 상태(failapi, failsave, banshop, banseller) → 레코드 삭제
   - **자동 동기화 기능**:
     - commit된 상품들의 sourcing_completed 상태 자동 업데이트
     - 카테고리 매핑 상태 자동 동기화 (기존 categorymapping 정보 기반)

## 글로벌 상태 동기화

`updatestatus` API 실행 시 자동으로 수행되는 동기화 작업:

1. **sourcing_completed 상태 업데이트**: commit 상태인 모든 상품을 대상으로 실행
2. **카테고리 매핑 상태 동기화**: 
   - 기존 categorymapping 정보에 따라 각 마켓플레이스별 매핑 준비 상태 설정
   - 네이버, 쿠팡, 11번가 등 각 플랫폼별 개별 동기화

## 상품 ID 직접 소싱

### UrlSourcing 기능

`urlsourcing` API를 통한 직접 소싱 프로세스:

1. **DataHub API 연동**: 상품 ID 배열을 받아 타오바오 DataHub API 호출
2. **데이터 변환**: API 응답을 upload 형식에 맞는 데이터 구조로 변환
3. **자동 업로드**: 변환된 데이터를 upload API로 자동 전달하여 후속 처리

### 처리 과정

- 상품 ID별 개별 API 호출 및 rate limiting 적용
- 이미지 URL, 가격 정보, 판매량 데이터 추출 및 정규화
- 실패한 상품에 대한 오류 추적 및 보고

## 관련 모듈

- **worker/taobaodetail** - 타오바오 상세 정보 처리 워커
- **common/utils/assistDb/temp** - 임시 데이터 저장 유틸리티
- **common/utils/assistDb/GlobalStatus** - 글로벌 상태 관리 및 카테고리 매핑 동기화 유틸리티
- **common/utils/redisClient** - Redis 큐 관리 유틸리티
- **common/utils/connectDB.js** - 데이터베이스 연결 관리
- **common/utils/Globalratelimiter** - API 호출 제한 관리
- **common/config/settings** - 환경 설정 관리 (DELETE_TARGET_STATUSES 포함)

## 더 자세한 정보

- API 문서는 [API.md](./API.md)를 참조하세요.
- 아키텍처 문서는 [ARCHITECTURE.md](./ARCHITECTURE.md)를 참조하세요.