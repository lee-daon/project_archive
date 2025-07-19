# 11store 카테고리 매핑 시스템 추가

## 완료된 작업
✅ **스키마 확장**: categorymapping, status 테이블에 11store 필드 추가  
✅ **트리거 업데이트**: 3개 트리거에서 11store 처리 추가  
✅ **GlobalStatus.js 수정**: 상태 관리 함수들에 11store 지원 추가  
✅ **카테고리 매핑 API 업데이트**: Repository, Service, Controller에서 11store 처리 추가  
✅ **Register 모듈 11번가 지원**: 전체 등록 시스템에 11번가 완전 통합  
✅ **11번가 주소 조회 API**: euc-kr 인코딩 처리, XML 파싱, addrSeq 추출  
✅ **11번가 마켓 설정 API**: marketSetting에 elevenstore 지원 완전 추가  
✅ **Setting 모듈 문서화**: API.md, ARCHITECTURE.md, README.md 업데이트

## 추가된 필드
- `categorymapping`: `elevenstore_cat_id`, `elevenstore_cat_name`
- `status`: `elevenstore_mapping_ready`, `elevenstore_registered`, `elevenstore_register_failed`

## API 변경사항
- **GET** `/api/postprocessing/categorymapping`: 응답에 `elevenstore_cat_id`, `elevenstore_cat_name` 추가
- **POST** `/api/postprocessing/categorymapping/update`: 요청 body에 11store 필드 처리 추가
- **조건 로직**: 3개 마켓플레이스 중 하나라도 매핑되지 않으면 조회 대상

### Setting 모듈 신규 API
- **POST** `/setting/elevenstore-address/`: 11번가 주소 조회 (출고지/반품지)
- **GET** `/setting/marketsetting?market=elevenstore`: 11번가 마켓 계정 조회
- **POST** `/setting/marketsetting?market=elevenstore`: 11번가 마켓 계정 생성
- **PUT** `/setting/marketsetting/{shopid}?market=elevenstore`: 11번가 마켓 계정 수정
- **DELETE** `/setting/marketsetting/{shopid}?market=elevenstore`: 11번가 마켓 계정 삭제

## Register 모듈 11번가 지원 완료 ✅
### API 엔드포인트 업데이트
- **GET** `/reg/initial`: 응답에 `elevenstore_markets`, `elevenstore_attempts` 추가
- **GET** `/reg/search`: `tabInfo=elevenstore` 지원, 11번가 등록 시도 횟수 포함
- **POST** `/reg/register`: `elevenstoreMarket` 설정으로 11번가 등록 지원
- **POST** `/reg/discard`: 11번가 등록 관리 테이블도 함께 삭제

### 새로운 탭 지원
- `elevenstore`: 11번가 전용 탭 추가
- `common`: 네이버 + 쿠팡 + **11번가** 모두 지원

### 시스템 아키텍처 확장
- **큐 시스템**: `ELEVENSTORE_REGISTER` 큐 추가
- **등록 제한**: `elevenstore_account_info` 테이블 기반 SKU 제한 확인
- **상태 관리**: `elevenstore_register_management` 테이블 완전 지원
- **데이터 조회**: 11번가 마켓 정보 및 등록 시도 횟수 조회

## 향후 작업
⏳ 11store API 연동 모듈 개발  
⏳ 11store 등록 워커 개발  
⏳ 11store 옵션 매핑 시스템 개발 (쿠팡과 유사)  
⏳ 11store 전용 설정 테이블 생성
⏳ **RegisteredManaging 모듈 11번가 지원**: 등록된 상품 관리 기능 추가
  - `/service/elevenstoreControl` 디렉토리 생성 예정
  - 기존 `/service/coopangControl`, `/service/naverControl`과 동일한 패턴으로 개발
  - 11번가 등록된 상품의 가격 변경, 상품 삭제, 주문 정보 조회 등 기능 제공

## 기술적 구현 세부사항
### 1. 데이터베이스 변경
- `elevenstore_account_info`: 11번가 계정 정보 테이블
- `elevenstore_register_management`: 11번가 등록 관리 테이블
- `status` 테이블: 11번가 관련 상태 컬럼 추가

### 2. 백엔드 모듈 확장
- **Repository**: 11번가 데이터 CRUD 함수 추가
- **Service**: 11번가 비즈니스 로직 통합
- **Controller**: 11번가 탭 및 API 파라미터 지원
- **Queue**: 11번가 등록 작업 큐 시스템 추가

### 3. Setting 모듈 11번가 지원
- **elevenStoreAddress.js**: 11번가 주소 조회 API (`POST /setting/elevenstore-address/`)
- **marketSetting.js**: 11번가 마켓 계정 CRUD (`GET/POST/PUT/DELETE /setting/marketsetting?market=elevenstore`)
- **XML 처리**: `iconv-lite`로 euc-kr 인코딩, `xml2js`로 네임스페이스 파싱
- **의존성 추가**: `xml2js`, `iconv-lite` 라이브러리

### 4. 문서화 완료
- **documents/xml주의사항.md**: 11번가 XML API 인코딩 이슈 해결 가이드
- **backend/modules/setting/API.md**: 11번가 주소 조회 API 문서 추가
- **backend/modules/setting/ARCHITECTURE.md**: 11번가 모듈 아키텍처 업데이트
- **backend/modules/setting/README.md**: 11번가 기능 및 버전 히스토리 추가

### 5. 프론트엔드 연동 준비
- API 응답 스키마에 11번가 필드 추가
- 탭 시스템에서 `elevenstore` 옵션 지원
- 마켓 설정에서 `elevenstoreMarket` 필드 추가
