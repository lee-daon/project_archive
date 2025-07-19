# Registered Managing Module Architecture

## 📋 개요

`registeredManaging` 모듈은 등록된 상품들의 관리를 담당하는 모듈입니다. 상품 조회, 마켓에서 상품 내리기, 상품 삭제, 트래킹 통계 조회 등의 기능을 제공합니다.

---

## 🏗️ 모듈 구조

```
registeredManaging/
├── controller/          # 요청 처리 및 응답 관리
│   ├── getRegisteringInfo.js     # 등록된 상품 목록 조회
│   ├── removeFromMarket.js       # 마켓에서 상품 내리기  
│   ├── deleteProducts.js         # 상품 영구 삭제
│   ├── getTrackingStats.js       # 상품 조회수 통계
│   ├── getTrackingDetails.js     # 상품별 날짜별 조회수
│   └── ChangePrice.js            # 상품 가격 변경
├── repository/          # 데이터베이스 접근 계층
│   ├── getRegisteringInfo.js     # 상품 목록 조회 쿼리
│   ├── findaccountInfo.js        # 계정 정보 조회
│   ├── deleteAllRows.js          # 상품 데이터 삭제
│   ├── makeRegisterable.js       # 상품 상태 변경
│   ├── getTrackingInfo.js        # 트래킹 상품 정보 조회
│   ├── updatePriceStatus.js      # 가격 변경 마진 관리
│   └── statusControl.md          # 상태 관리 문서
├── service/             # 비즈니스 로직 계층
│   ├── coopangControl/  # 쿠팡 마켓 제어
│   │   ├── changeDeliverStatus.js
│   │   ├── changePrice.js
│   │   └── deleteProduct.js
│   ├── naverControl/    # 네이버 마켓 제어
│   │   ├── changePrice.js
│   │   ├── deleteProduct.js
│   │   └── orderinfo.js
│   ├── elevenstoreControl/ # 11번가 마켓 제어
│   │   ├── changePrice.js
│   │   └── deleteProduct.js
│   ├── trackingService.js        # 트래킹 API 연동
│   └── PriceChangeControl.js     # 마진 제어 가격 변경
├── index.js             # 라우터 설정
├── api.md              # API 문서
├── architecture.md     # 아키텍처 문서
└── readme.md           # 모듈 설명
```

---

## 🎯 계층별 책임

### Controller Layer
- **역할**: HTTP 요청/응답 처리, 파라미터 검증, 에러 핸들링
- **책임**: 
  - 요청 파라미터 유효성 검사
  - 비즈니스 로직 호출
  - 응답 형식 표준화
  - 에러 응답 처리

### Repository Layer  
- **역할**: 데이터베이스 직접 접근, 쿼리 실행
- **책임**:
  - SQL 쿼리 작성 및 실행
  - 데이터베이스 트랜잭션 관리
  - 원시 데이터 반환

### Service Layer
- **역할**: 비즈니스 로직 처리, 외부 API 연동
- **책임**:
  - 복잡한 비즈니스 규칙 처리
  - 외부 마켓 API 호출
  - 데이터 변환 및 가공
  - 트래킹 API 연동

---

## 🔄 데이터 흐름

```
Request → Controller → Service → Repository → Database
                    ↓
                External APIs (Coupang, Naver, 11st, Tracking)
                    ↓
Response ← Controller ← Service ← Repository
```

### 1. 상품 조회 플로우
1. **Controller**: 요청 파라미터 검증
2. **Repository**: 데이터베이스에서 상품 정보 조회
3. **Service**: 데이터 가공 및 필터링
4. **Controller**: 응답 형식으로 변환

### 2. 상품 삭제 플로우
1. **Controller**: 요청 데이터 검증
2. **Service**: 마켓 API 호출하여 상품 삭제
3. **Repository**: 데이터베이스에서 상품 데이터 삭제
4. **Controller**: 삭제 결과 응답

### 3. 트래킹 통계 플로우
1. **Controller**: 요청 파라미터 검증
2. **Service**: 외부 트래킹 API 호출
3. **Service**: 트래킹 데이터와 상품 정보 조합
4. **Controller**: 통합된 응답 반환

### 4. 가격 변경 플로우
1. **Controller**: 요청 데이터 검증 (상품 ID, 할인율)
2. **Service**: 마진 정보 조회 및 할인율 계산
3. **Service**: 최소 마진 보장 로직 적용
4. **Service**: 플랫폼별 가격 변경 API 호출
5. **Repository**: 새로운 마진 정보 업데이트
6. **Controller**: 개별 상품별 성공/실패 결과 반환

---

## 🗄️ 주요 데이터베이스 테이블

### 상품 관리 테이블
- `products_detail`: 상품 기본 정보
- `coopang_register_management`: 쿠팡 등록 관리
- `naver_register_management`: 네이버 등록 관리
- `elevenstore_register_management`: 11번가 등록 관리
- `pre_register`: 등록 준비 데이터
- `status`: 상품 상태 관리

### 이미지 테이블
- `private_main_image`: 상품 메인 이미지
- `private_description_image`: 상품 설명 이미지
- `private_nukki_image`: 누끼 이미지

### 상품 속성 테이블
- `private_properties`: 상품 속성
- `private_options`: 상품 옵션

---

## 🔌 외부 연동

### 마켓 API
- **쿠팡 파트너스 API**: 상품 등록/수정/삭제/가격변경
- **네이버 커머스 API**: 상품 등록/수정/삭제/가격변경  
- **11번가 API**: 상품 가격변경/전시중지 (구현완료)

### 트래킹 API
- **Loopton Analytics API**: 상품 조회수 통계
- **엔드포인트**: `https://an.loopton.com/api/views`
- **인증**: Bearer Token 방식

---

## 🔒 보안 고려사항

### 인증/인가
- JWT 토큰 기반 사용자 인증
- 사용자별 데이터 격리 (`userid` 기반)
- 마켓 API 키 보안 관리

### 데이터 보호
- 민감한 API 키는 환경변수로 관리
- SQL 인젝션 방지 (parameterized query)
- 입력 데이터 검증 및 sanitization

---

## ⚡ 성능 최적화

### 데이터베이스 최적화
- 적절한 인덱스 설계
- 페이징을 통한 대용량 데이터 처리
- JOIN 최적화

### API 성능
- 외부 API 호출 타임아웃 설정
- 에러 재시도 메커니즘
- 응답 캐싱 (필요시)

---

## 🚨 에러 처리

### 에러 분류
1. **클라이언트 에러 (4xx)**
   - 잘못된 파라미터
   - 권한 없음
   - 리소스 없음

2. **서버 에러 (5xx)**
   - 데이터베이스 연결 실패
   - 외부 API 호출 실패
   - 시스템 내부 오류

### 에러 응답 형식
```json
{
  "success": false,
  "message": "사용자 친화적 에러 메시지",
  "error": "개발자용 상세 에러 정보"
}
```

---

## 🔄 확장성 고려사항

### 새로운 마켓 추가
1. Service Layer에 새 마켓 제어 모듈 추가
2. 해당 마켓의 등록 관리 테이블 생성
3. Controller에서 새 플랫폼 지원

### 새로운 기능 추가
1. Controller → Service → Repository 패턴 유지
2. 기존 API와 일관된 응답 형식 사용
3. 적절한 에러 처리 구현

---

## 📊 모니터링 & 로깅

### 로깅 전략
- 요청/응답 로깅
- 에러 상세 로깅
- 외부 API 호출 로깅
- 성능 메트릭 로깅

### 모니터링 포인트
- API 응답 시간
- 에러 발생률
- 외부 API 상태
- 데이터베이스 성능

---

## 🛠️ 개발 가이드

### 새로운 플랫폼 추가
1. **Repository Layer**
   - `getRegisteringProducts()` 함수에 플랫폼 케이스 추가
   - 해당 플랫폼의 관리 테이블 구조 정의
   - 상품번호 필드명 매핑 추가

2. **Service Layer**
   - 플랫폼별 마켓 제어 모듈 추가 (`service/{platform}Control/`)
   - API 인증 및 상품 등록/삭제 로직 구현

3. **Controller Layer**
   - 기존 컨트롤러에서 새 플랫폼 지원 추가
   - 에러 메시지 및 응답 형식 일관성 유지

### 새로운 필터 추가
1. Controller에서 query parameter 추가
2. Repository에서 WHERE 조건 추가
3. API 문서 업데이트
4. TypeScript 타입 정의 업데이트

### 새로운 트래킹 기능 추가
1. **외부 API 연동**: `trackingService.js`에 새로운 API 엔드포인트 추가
2. **데이터 결합**: `getTrackingInfo.js`에 DB 조회 로직 추가
3. **Controller 구현**: 요청 검증 및 응답 처리
4. **에러 처리**: 외부 API 타임아웃, 인증 실패 등 핸들링

### 가격 변경 시스템 확장
1. **마진 계산 로직**: `PriceChangeControl.js`에 새로운 계산 공식 추가
2. **플랫폼 지원**: 새로운 마켓의 가격 변경 API 연동
3. **검증 규칙**: 최소/최대 할인율, 마진 제한 등 비즈니스 규칙 추가
4. **배치 처리**: 대량 상품 가격 변경 최적화

### 데이터베이스 인덱스 최적화
```sql
-- 쿠팡 등록 관리 테이블 인덱스
CREATE INDEX idx_coopang_userid_status ON coopang_register_management (userid, status);
CREATE INDEX idx_coopang_market_status ON coopang_register_management (userid, market_number, status);
CREATE INDEX idx_coopang_userid_productid ON coopang_register_management (userid, productid);

-- 네이버 등록 관리 테이블 인덱스
CREATE INDEX idx_naver_userid_status ON naver_register_management (userid, status);
CREATE INDEX idx_naver_market_status ON naver_register_management (userid, market_number, status);  
CREATE INDEX idx_naver_userid_productid ON naver_register_management (userid, productid);

-- 11번가 등록 관리 테이블 인덱스
CREATE INDEX idx_elevenstore_userid_status ON elevenstore_register_management (userid, status);
CREATE INDEX idx_elevenstore_market_status ON elevenstore_register_management (userid, market_number, status);
CREATE INDEX idx_elevenstore_userid_productid ON elevenstore_register_management (userid, productid);

-- 상품 상세 테이블 검색 최적화
CREATE INDEX idx_products_detail_userid_title_optimized ON products_detail (userid, title_optimized);
CREATE INDEX idx_products_detail_userid_productid ON products_detail (userid, productid);

-- 트래킹을 위한 그룹 코드 인덱스
CREATE INDEX idx_pre_register_userid_productid ON pre_register (userid, productid);
CREATE INDEX idx_pre_register_group_code ON pre_register (userid, product_group_code);

-- 이미지 조회 최적화
CREATE INDEX idx_private_main_image_userid_productid_order ON private_main_image (userid, productid, imageorder);
```

### 성능 최적화 전략
- **개별 쿼리**: 쿠팡, 네이버, 11번가 테이블에 개별 쿼리 후 애플리케이션 합산
- **병렬 실행**: Promise.all()로 복수 플랫폼 동시 조회
- **인덱스 활용**: 각 테이블별 복합 인덱스 완벽 활용
- **페이징 최적화**: OFFSET 대신 커서 기반 페이징 고려 (대용량 데이터)
- **트래킹 API 캐싱**: 자주 조회되는 통계 데이터 임시 캐싱 (구현 예정)
- **가격 변경 배치**: 플랫폼별 API 제한 고려한 배치 처리 및 지연 시간 적용
  - 쿠팡: 1초 간격, 네이버: 벌크 처리, 11번가: 0.3초 간격
- **마진 계산 최적화**: 복잡한 마진 계산을 메모리에서 처리 후 DB 업데이트
