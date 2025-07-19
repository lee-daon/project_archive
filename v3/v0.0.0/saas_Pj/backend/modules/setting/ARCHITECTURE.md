# Setting Module Architecture

## 아키텍처 개요

Setting 모듈은 **3-Layer Architecture** 패턴을 따라 설계되었습니다.

```
┌─────────────────┐
│   Controller    │  ← HTTP 요청/응답 처리
├─────────────────┤
│    Service      │  ← 비즈니스 로직
├─────────────────┤
│   Repository    │  ← 데이터 액세스
└─────────────────┘
```

## 디렉토리 구조

```
backend/modules/setting/
├── controller/           # HTTP 요청 처리 계층
│   ├── commonPolicy.js   # 공통 정책 설정 라우터
│   ├── NaverPolicy.js    # 네이버 정책 설정 라우터
│   ├── coopangPolicy.js  # 쿠팡 정책 설정 라우터
│   ├── elevenStorePolicy.js # 11번가 정책 설정 라우터
│   ├── marketSetting.js  # 마켓 계정 관리 라우터
│   ├── banWords.js       # 사용자 금지어 설정 라우터
│   ├── banSeller.js      # 판매자 차단 라우터
│   ├── coopangShippingPlace.js # 쿠팡 배송지 조회 라우터
│   ├── naver-address-book.js   # 네이버 주소록 조회 라우터
│   ├── elevenStoreAddress.js   # 11번가 주소 조회 라우터
│   ├── detailPage.js     # 상세페이지 설정 라우터
│   └── extraSetting.js   # 기타 설정 라우터 (심층 벤, 키워드 뛰어쓰기, 마켓별 상품개수)
├── service/              # 비즈니스 로직 계층
│   ├── marketSetting.js  # 마켓 설정 서비스 로직
│   ├── findshippingPlace.js # 쿠팡 배송지 서비스 로직
│   ├── naver-address-book.js # 네이버 주소록 서비스 로직
│   ├── elevenStoreAddress.js # 11번가 주소 조회 서비스 로직
│   ├── detailPage.js     # 상세페이지 설정 서비스 로직
│   └── countCorrection.js # 마켓별 상품개수 관리 서비스 로직
├── repository/           # 데이터 액세스 계층
│   ├── commonPolicy.js   # 공통 설정 DB 작업
│   ├── NaverPolicy.js    # 네이버 설정 DB 작업
│   ├── coopangPolicy.js  # 쿠팡 정책 DB 작업
│   ├── elevenStorePolicy.js # 11번가 정책 DB 작업
│   ├── marketSetting.js  # 마켓 계정 DB 작업
│   ├── banWordSetting.js # 사용자 금지어 DB 작업
│   ├── banSeller.js      # 판매자 차단 DB 작업
│   ├── detailPage.js     # 상세페이지 설정 DB 작업
│   ├── extraSetting.js   # 기타 설정 DB 작업
│   └── countCorrect.js   # 마켓별 상품개수 관리 DB 작업
├── index.js              # 라우터 통합
├── API.md                # API 문서
├── ARCHITECTURE.md       # 아키텍처 문서
└── README.md             # 모듈 개요
```

## 계층별 역할

### 1. Controller Layer (컨트롤러 계층)

**역할**: HTTP 요청/응답 처리, 라우팅, 기본 유효성 검증

**특징**:
- Express.js 라우터 사용
- JWT 토큰 기반 인증 (`req.user.userid`)
- 입력 데이터 기본 검증
- HTTP 상태 코드 관리
- 에러 응답 표준화

**예시**:
```javascript
// GET / - 설정 조회
router.get('/', async (req, res) => {
  try {
    const userid = req.user.userid;
    // 기본 유효성 검증
    if (!userid) {
      return res.status(400).json({
        success: false,
        message: 'userid가 필요합니다.'
      });
    }
    // Service 계층 호출
    const result = await getSettingService(userid);
    res.json({ success: true, data: result });
  } catch (error) {
    // 에러 처리
    res.status(500).json({
      success: false,
      message: '조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});
```

### 2. Service Layer (서비스 계층)

**역할**: 비즈니스 로직 처리, 복잡한 유효성 검증, 트랜잭션 관리

**특징**:
- 도메인 로직 구현
- 데이터 변환 및 가공
- 복잡한 유효성 검증
- 여러 Repository 조합
- 에러 처리 및 로깅

**예시**:
```javascript
// 마켓 생성 서비스
export const createMarketService = async (userid, market, marketData) => {
  try {
    // 비즈니스 로직: 마켓 타입별 처리
    if (market === 'naver') {
      validateNaverMarketData(marketData);  // 복잡한 유효성 검증
      const result = await createNaverMarket(userid, marketData);
      return {
        success: true,
        message: '네이버 마켓이 성공적으로 생성되었습니다.',
        insertId: result.insertId
      };
    }
    // ... 다른 마켓 타입 처리
  } catch (error) {
    throw new Error(`마켓 생성 서비스 오류: ${error.message}`);
  }
};
```

### 3. Repository Layer (리포지토리 계층)

**역할**: 데이터베이스 액세스, SQL 쿼리 실행, 데이터 CRUD

**특징**:
- MySQL 연결 풀 사용
- Prepared Statement로 SQL 인젝션 방지
- 트랜잭션 지원
- 에러 처리 및 로깅
- 민감정보 마스킹 (조회 시)

**예시**:
```javascript
// 네이버 마켓 생성
export const createNaverMarket = async (userid, marketData) => {
  try {
    const [result] = await promisePool.execute(
      `INSERT INTO naver_account_info (userid, naver_market_number, ...) 
       VALUES (?, ?, ...)`,
      [userid, marketData.naver_market_number, ...]
    );
    return result;
  } catch (error) {
    // 중복 키 오류 처리
    if (error.code === 'ER_DUP_ENTRY') {
      throw new Error('중복되는 마켓번호가 있습니다.');
    }
    throw new Error(`네이버 마켓 생성 실패: ${error.message}`);
  }
};
```

## 설계 원칙

### 1. 단일 책임 원칙 (SRP)
- 각 계층은 명확한 단일 책임을 가짐
- Controller: HTTP 처리만
- Service: 비즈니스 로직만
- Repository: 데이터 액세스만

### 2. 의존성 역전 원칙 (DIP)
- 상위 계층이 하위 계층에 의존
- Controller → Service → Repository
- 인터페이스를 통한 느슨한 결합

### 3. 개방-폐쇄 원칙 (OCP)
- 새로운 설정 타입 추가 시 기존 코드 수정 최소화
- 확장에는 열려있고 수정에는 닫혀있음

### 4. 관심사 분리 (SoC)
- 각 모듈은 독립적인 관심사 처리
- commonPolicy: 공통 설정
- NaverPolicy: 네이버 전용 설정
- coopangPolicy: 쿠팡 정책 설정
- elevenStorePolicy: 11번가 정책 설정
- marketSetting: 마켓 계정 관리
- banWords: 사용자 금지어 관리
- banSeller: 판매자/쇼핑몰 차단 관리
- coopangShippingPlace: 쿠팡 배송지 조회
- naver-address-book: 네이버 주소록 조회
- elevenStoreAddress: 11번가 주소 조회
- detailPage: 상세페이지 설정 관리
- extraSetting: 기타 설정 관리 (심층 벤, 키워드 뛰어쓰기, 마켓별 상품개수)

## 데이터 흐름

### 요청 처리 흐름
```
HTTP Request
    ↓
Controller (인증, 기본 검증)
    ↓
Service (비즈니스 로직, 복잡한 검증)
    ↓
Repository (DB 쿼리 실행)
    ↓
Database
    ↓
Repository (결과 반환, 마스킹)
    ↓
Service (데이터 가공)
    ↓
Controller (HTTP 응답)
    ↓
HTTP Response
```

### 에러 처리 흐름
```
Database Error
    ↓
Repository (에러 변환, 로깅)
    ↓
Service (비즈니스 에러 처리)
    ↓
Controller (HTTP 에러 응답)
    ↓
Client
```

## 보안 아키텍처

### 1. 인증 및 인가
- JWT 토큰 기반 인증
- 미들웨어를 통한 토큰 검증
- 사용자별 데이터 격리 (`userid` 기반)

### 2. 민감정보 보호
```javascript
// Repository에서 마스킹 처리
const maskedRows = rows.map(row => ({
  ...row,
  naver_client_secret: row.naver_client_secret ? '****' : null,
  naver_client_id: row.naver_client_id ? '****' : null
}));
```

### 3. SQL 인젝션 방지
- Prepared Statement 사용
- 입력값 검증 및 이스케이핑

## 확장성 고려사항

### 1. 새로운 마켓 추가
```javascript
// Service에서 새로운 마켓 타입 추가
if (market === 'amazon') {
  validateAmazonMarketData(marketData);
  const result = await createAmazonMarket(userid, marketData);
  // ...
}
```

### 2. 새로운 설정 타입 추가

**예시: 기타 설정 모듈 추가 과정**
1. **데이터베이스 스키마 확장**: `extra_setting` 테이블에 `use_deep_ban`, `allow_keyword_spacing` 컬럼 추가
2. **Repository 구현**: `extraSetting.js`, `countCorrect.js`에서 CRUD 작업 정의
3. **Service 로직**: `countCorrection.js`에서 비즈니스 로직 및 유효성 검증
4. **Controller 구현**: `extraSetting.js`에서 5개 API 엔드포인트 구현
5. **라우터 등록**: `index.js`에 `/extra` 경로로 등록
6. **문서 업데이트**: API.md, ARCHITECTURE.md, README.md 업데이트

### 3. 캐싱 전략
- Redis를 통한 설정 데이터 캐싱
- 자주 조회되는 설정의 성능 최적화

## 모니터링 및 로깅

### 1. 로깅 전략
```javascript
// 각 계층별 로깅
console.log(`사용자 ${userid}의 설정 조회 시작`);
console.error('설정 업데이트 실패:', error);
```

### 2. 메트릭 수집
- API 응답 시간
- 에러 발생률
- 사용자별 설정 변경 빈도

## 테스트 전략

### 1. 단위 테스트
- Repository: 데이터베이스 모킹
- Service: 비즈니스 로직 검증
- Controller: HTTP 요청/응답 테스트

### 2. 통합 테스트
- 전체 플로우 테스트
- 실제 데이터베이스 연동 테스트

### 3. 보안 테스트
- SQL 인젝션 테스트
- 인증/인가 테스트
- 민감정보 마스킹 테스트
