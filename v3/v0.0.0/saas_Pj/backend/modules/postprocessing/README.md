# 후처리 모듈

후처리 모듈은 상품 가공 완료 후 최종 검수 및 관리를 위한 종합적인 기능을 제공합니다.

## 주요 기능

### 상품 처리 상태 관리

- **처리 상태 모니터링**
  - 가공 단계별 상품 상태 추적
  - 상태별 통계 정보 제공 (pending, brandbanCheck, processing, success, fail)
  - 실시간 처리 현황 조회

### 상품 관리

- **승인 처리**
  - 가공 완료된 상품 승인
  - 상품 그룹 관리 및 메모 기능
  
- **폐기 처리**
  - 부적합 상품 폐기 처리
  - 상태 정보 업데이트

- **소유권 관리**
  - 이미지, 속성, 옵션 등의 소유권 정보 관리
  - 가공 단계별 데이터 추적 및 관리

### 카테고리 매핑 관리

- **카테고리 매핑 조회**
  - 매핑이 필요한 카테고리 정보 자동 조회
  - 누락된 카테고리에 대한 기본 레코드 자동 생성
  - 네이버, 쿠팡 마켓플레이스별 카테고리 매핑 정보 관리

- **상품 샘플 제공**
  - 카테고리별 대표 상품 샘플 조회 (이미지 포함)
  - 매핑 작업 시 참고할 수 있는 상품 예시 제공
  - 최신 상품 순서로 정렬된 샘플 제공

- **매핑 정보 업데이트**
  - 네이버, 쿠팡 카테고리 ID 및 이름 일괄 업데이트
  - 매핑 완료된 상품의 자동 상태 변경
  - UPSERT 방식으로 기존 정보 안전 업데이트

### 마켓 등록 데이터 생성

- **JSON 스키마 생성**
  - 가공된 상품 데이터를 마켓플레이스 등록용 JSON으로 변환
  - 개인 테이블(`private_*`)에서 최종 가공된 데이터 활용
  - 누끼 이미지 우선 대표 이미지 선택
  - 가격 필터링을 통한 비정상 SKU 제외

- **배치 처리**
  - 여러 상품 동시 처리 지원
  - 개별 상품 실패시에도 다른 상품 처리 계속
  - 성공/실패 카운트 및 실패 상품 목록 제공

- **자동 상태 관리**
  - `processing_status`를 'ended'로 업데이트
  - `status` 테이블의 `baseJson_completed`를 true로 설정
  - 실패 케이스 자동 에러 로깅

### 상품 검수 및 수정

- **상품 리스트 조회**
  - 승인된 상품 목록 페이지네이션 조회
  - 상품군 코드 검색 기능
  - 최신순/과거순 정렬 지원

- **상품 상세 정보 조회**
  - 개별 상품의 모든 정보 조회 (모달창 용)
  - 메인/누끼/상세 이미지 정보
  - 속성 및 옵션 정보 조회

- **상품 정보 수정**
  - 상품명, 키워드 수정
  - 대표 이미지 설정 (메인/누끼 선택)
  - 불필요한 이미지 삭제
  - 속성 및 옵션 정보 수정

## 데이터베이스 구조

이 모듈은 주로 다음 데이터베이스 테이블을 사용합니다:

- **processing_status**: 상품 가공 상태 정보 저장
- **status**: 메인 상태 관리 테이블 (baseJson_completed, category_mapping_required 포함)
- **ownership**: 상품 이미지, 속성, 옵션 등의 소유권 정보 저장
- **pre_register**: 승인된 상품의 그룹 정보 및 등록 전 JSON 데이터 저장
- **categorymapping**: 카테고리별 네이버, 쿠팡 매핑 정보 저장
- **private_main_image**: 개인 소유 메인 이미지 정보
- **private_description_image**: 개인 소유 상세 이미지 정보
- **private_nukki_image**: 개인 소유 누끼 이미지 정보
- **private_properties**: 개인 소유 상품 속성 정보
- **private_options**: 개인 소유 상품 옵션 정보
- **products_detail**: 상품 기본 정보 (제목, 키워드 등)
- **skus**: SKU 가격 및 재고 정보
- **item_images_raw**: 원본 상품 이미지 정보
- **error_log**: 에러 로그 정보 저장

## API 엔드포인트

주요 API 엔드포인트:

### 상품 처리 상태 관리
- `GET /postprc/getprocessinginfo`: 상품 처리 상태 정보 조회
- `POST /postprc/approve`: 상품 승인 처리
- `POST /postprc/discard`: 상품 폐기 처리

### 카테고리 매핑 관리
- `GET /postprc/categorymapping`: 카테고리 매핑 정보 조회
- `GET /postprc/categorymapping/samples`: 카테고리별 상품 샘플 조회
- `POST /postprc/categorymapping/update`: 카테고리 매핑 정보 업데이트

### 마켓 등록 데이터 생성
- `POST /postprc/generate-register-data`: 마켓 등록용 JSON 데이터 생성

### 상품 검수 및 수정
- `GET /postprc/getproducts`: 승인된 상품 리스트 조회
- `GET /postprc/getproducts/:productid`: 상품 상세 정보 조회 (모달용)
- `PUT /postprc/putproduct/:productid`: 상품 정보 수정
  
자세한 API 사용법은 [API.md](./API.md) 파일을 참조하세요.

## 모듈 구성

후처리 모듈은 다음과 같은 구성으로 이루어져 있습니다:

```
postprocessing/
├── controller/       # API 요청 처리
│   ├── getProcessingInfo.js  # 처리 상태 조회
│   ├── approve.js            # 상품 승인
│   ├── discard.js            # 상품 폐기
│   ├── getProducts.js        # 상품 리스트/상세 조회
│   ├── putProduct.js         # 상품 정보 수정
│   ├── generate-register-data.js  # 마켓 등록용 JSON 데이터 생성
│   └── categorymapping.js    # 카테고리 매핑 관리
├── service/          # 비즈니스 로직 처리
│   ├── createOwnership.js    # 소유권 생성
│   ├── putProduct.js         # 상품 수정 로직
│   ├── createBaseSchema.js   # JSON 스키마 생성 로직
│   └── categorymapping.js    # 카테고리 매핑 비즈니스 로직
└── repository/       # 데이터베이스 접근
    ├── getProcessingInfo.js     # 처리 상태 데이터
    ├── approveStatusControl.js  # 승인 상태 제어
    ├── discardStatusControl.js  # 폐기 상태 제어
    ├── groupcode.js             # 그룹 정보 관리
    ├── Ownership.js             # 소유권 관리
    ├── getProducts.js           # 상품 조회
    ├── putProduct.js            # 상품 수정
    ├── buildJsonInfo.js         # JSON 생성용 데이터 조회
    ├── registerReadyStatus.js   # 등록 준비 상태 관리
    └── categorymapping.js       # 카테고리 매핑 데이터 접근
```

아키텍처에 대한 자세한 내용은 [ARCHITECTURE.md](./ARCHITECTURE.md) 파일을 참조하세요.

## 사용 방법

### 모듈 연결

이 모듈은 다음과 같이 애플리케이션에 연결됩니다:

```javascript
// app.js 또는 메인 서버 파일
import postprocessingRouter from './modules/postprocessing/index.js';

app.use('/postprc', postprocessingRouter);
```

### 주요 워크플로우

1. **가공 상태 모니터링**: `getprocessinginfo` API로 현재 상태 확인
2. **카테고리 매핑**: `categorymapping` API로 필요한 카테고리 매핑 작업 수행
3. **상품 승인**: 가공 완료된 상품을 `approve` API로 승인 처리
4. **JSON 데이터 생성**: 승인된 상품을 `generate-register-data` API로 마켓 등록용 JSON 변환
5. **상품 검수**: `getproducts` API로 승인된 상품 리스트 조회
6. **상품 수정**: `putproduct` API로 필요시 상품 정보 수정
7. **최종 등록**: 검수 완료된 상품을 마켓플레이스에 등록

## 주요 특징

### 데이터 일관성
- MySQL 트랜잭션을 통한 데이터 일관성 보장
- 오류 발생 시 자동 롤백 처리

### 스마트 데이터 처리
- **가격 필터링**: 중앙값 기반 비정상 가격 SKU 자동 제외
- **이미지 우선순위**: 누끼 이미지 우선, 없으면 메인 이미지 사용
- **배치 처리**: 여러 상품 동시 처리로 효율성 향상
- **에러 핸들링**: 개별 상품 실패시에도 전체 처리 계속

### 사용자 중심 설계
- 페이지네이션을 통한 효율적인 대용량 데이터 처리
- 검색 및 정렬 기능으로 편리한 상품 관리
- 모달창을 위한 상세 정보 API 제공

### 유연한 이미지 관리
- 메인/누끼/상세 이미지 개별 관리
- 대표 이미지 타입 선택 (메인/누끼)
- 불필요한 이미지 일괄 삭제 기능

### 키워드 자동 포맷팅
- 키워드를 `[키워드1,키워드2]` 형식으로 자동 변환
- 일관된 데이터 형식 유지

### 스마트 카테고리 매핑
- 매핑이 필요한 카테고리 자동 감지
- 누락된 카테고리 기본 레코드 자동 생성
- 매핑 완료 시 관련 상품 상태 자동 업데이트
- 카테고리별 상품 샘플 제공으로 매핑 작업 지원

### 포괄적 로깅
- 모든 에러를 `error_log` 테이블에 자동 기록
- 실패 원인 추적 및 디버깅 지원
- 상품별 개별 에러 관리

## 의존성

- MySQL 데이터베이스
- Express 웹 프레임워크
- mysql2 (Promise 지원)
