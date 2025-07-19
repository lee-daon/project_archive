# 소싱 모듈 (Sourcing Module)

소싱 모듈은 타오바오, 티몰 등의 중국 쇼핑몰에서 상품 정보를 수집, 처리하고 관리하는 기능을 제공합니다.

## 주요 기능

### 1. URL 소싱 (UrlCollection.vue)
- **기능**: 상품 URL 목록을 입력받아 상품 ID를 추출하고 해당 상품 정보를 수집
- **주요 API**: `urlSourcing`
- **인터페이스**: 텍스트 영역에 여러 URL 입력 가능
- **처리 로직**: 입력된 URL에서 상품 ID 추출 → 백엔드 API 호출 → 상품 정보 수집

### 2. 쇼핑몰 소싱 (ShopCollection.vue)
- **기능**: 상점 URL 또는 상품 URL을 입력받아 해당 상점의 상품을 수집
- **주요 API**: `shopSourcing`
- **인터페이스**: URL 입력 필드, 수집할 상품 개수 설정, 상점/상품 URL 자동 감지
- **특징**: 금지된 상점/판매자 감지 및 경고 표시 기능

### 3. 카테고리 소싱 (CategoryCollection.vue)
- **기능**: 크롬 확장 프로그램을 이용하여 타오바오/티몰에서 카테고리별 상품을 수집
- **주요 API**: `uploadProducts`
- **인터페이스**: 수집기 연결 상태 표시, 수집된 상품 목록 표시, 도움말 모달
- **처리 로직**: 확장 프로그램 연결 → 타오바오 페이지에서 상품 데이터 수집 → 수집 데이터 처리 및 저장
- **특징**: 크롬 확장 프로그램과의 window.postMessage를 통한 상호작용, 실시간 연결 상태 확인

### 4. 상품 목록 확인 (ProductListCheck.vue)
- **기능**: 소싱된 상품 목록을 표시하고 금지어 체크 및 상품 필터링
- **주요 API**: `getProductList`, `updateBanStatus`, `requestDetailParsing`
- **인터페이스**: 상품 통계 정보, 상품 목록 테이블, 금지 상태 토글
- **처리 로직**: 상품 목록 조회 → 금지 상태 설정 → 상세 정보 파싱 요청

### 5. 수집 결과 확인 (ResultsCheck.vue)
- **기능**: 수집된 상품의 상태를 확인하고 그룹 코드 지정 및 승인
- **주요 API**: `getSourcingStatus`, `updateProductStatus`
- **인터페이스**: 상태별 상품 개수 표시, 상품 선택, 그룹 코드 입력, 상품 승인
- **처리 로직**: 소싱 상태 조회 → 상품 선택 → 그룹 코드 지정 → 승인 요청

## 사용하는 API 엔드포인트

| API 경로 | 설명 |
|----------|------|
| `/src/upload` | 상품 목록 업로드 |
| `/src/urlsourcing` | 상품 ID 기반 직접 소싱 |
| `/src/detailparselist` | 상품 상세 정보 파싱 요청 |
| `/src/getbyshop` | 쇼핑몰별 상품 조회 |
| `/src/listcheck` | 상품 목록 확인 |
| `/src/updateban` | 상품 금지 상태 업데이트 |
| `/src/updatestatus` | 상품 상태 코드 업데이트 |
| `/src/getstatus/setupinfo` | 소싱 상태 정보 조회 |

## 워크플로우

1. **상품 수집**: URL 소싱, 쇼핑몰 소싱 또는 카테고리 소싱을 통해 상품 정보 수집
2. **상품 목록 확인**: 수집된 상품 검토 및 금지 상품 필터링
3. **상세 정보 파싱**: 선택된 상품의 상세 정보 수집
4. **상태 확인 및 승인**: 소싱 결과 확인 및 그룹 코드 지정하여 승인

## 모듈 아키텍처

```
src/views/main/product/sourcing/
├── UrlCollection.vue       # URL로 상품 수집 컴포넌트
├── ShopCollection.vue      # 쇼핑몰로 상품 수집 컴포넌트
├── CategoryCollection.vue  # 카테고리별 상품 수집 컴포넌트
├── ProductListCheck.vue    # 상품 목록 확인 컴포넌트
└── README.md               # 문서

src/views/main/product/
└── ResultsCheck.vue        # 수집 결과 확인 컴포넌트

src/services/
├── sourcing.js             # 소싱 관련 API 호출 함수
└── sourcing_service/       # 소싱 관련 유틸리티 함수
    ├── parseIdList.js      # URL에서 상품 ID 추출 기능
    └── mapping.js          # 상품 데이터 매핑 함수