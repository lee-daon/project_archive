# 인증 모듈 (Authentication Module)

네이버 소셜 로그인, 로컬 로그인, 로컬 크리덴셜 설정, API 키 관리 및 인증 토큰 관리 기능을 제공합니다.

## 주요 기능

1. **네이버 소셜 로그인**: 네이버 계정으로 로그인/회원가입
2. **로컬 로그인**: ID/비밀번호로 로그인
3. **로컬 크리덴셜 설정**: 네이버 사용자의 로컬 로그인 정보 설정/변경
4. **인증 상태 확인**: 현재 로그인 상태 조회
5. **API 키 관리**: enterprise 플랜 사용자의 API 키 발급 및 관리
6. **API 키 인증**: API 키를 통한 인증 미들웨어 제공

## 파일 구조

```
/auth/
├── controller/              # API 엔드포인트
│   ├── apiKey.js           # API 키 발급/상태 확인
│   ├── authStatus.js       # 인증 상태 확인
│   ├── localCredentials.js # 로컬 크리덴셜 설정
│   ├── login.js            # 로컬 로그인
│   └── naverAuth.js        # 네이버 로그인/회원가입
├── service/                # 비즈니스 로직
│   ├── checkValidation.js  # 유효성 검사
│   ├── createJWT.js        # JWT 토큰 관리
│   ├── crypt.js           # 비밀번호 암호화
│   └── naverLogin.js      # 네이버 API 연동
└── repository/            # DB 액세스
    ├── apiKey.js         # API 키 관련 DB 함수
    ├── common.js         # 공통 DB 함수
    ├── naverAuth.js      # 네이버 관련 DB
    └── createDefaultTable.js # 기본 테이블 생성
```

## 로그인 타입 및 사용자 구분

### 로그인 타입 (응답 시 loginType 필드)
- **naver**: 네이버로만 로그인 (로컬 크리덴셜 미설정)
- **both**: 네이버/로컬 둘 다 로그인 가능 (크리덴셜 설정 완료)

### 인증 상태 확인 시 구분 (hasLocalCredentials 필드)
- **true**: 로컬 ID/비밀번호가 설정되어 있음
- **false**: 네이버 로그인만 가능

## API 키 기능

### API 키 특징
- **형식**: `sk_userid_고유번호` (예: `sk_123_abcd1234efgh5678ijkl9012mnop3456`)
- **발급 권한**: enterprise 플랜 사용자만 가능
- **발급 제한**: 24시간에 1회만 발급 가능
- **보안**: bcrypt로 해시화되어 저장
- **성능**: userid 기반 O(1) 인증으로 최적화

### api키 인증 동작
생성: sk_123_abcd1234efgh5678 → bcrypt → $2b$10$xyz... (DB 저장)
인증: sk_123_abcd1234efgh5678 → userid=123 추출 → DB에서 해시 조회 → 비교 성공!

### API 키 인증 방법
```http
# X-API-Key 헤더 방식
X-API-Key: sk_123_abcd1234efgh5678ijkl9012mnop3456

# Authorization Bearer 방식  
Authorization: Bearer sk_123_abcd1234efgh5678ijkl9012mnop3456
```

## 환경 변수

```env
NAVER_LOGIN_CLIENT_ID=네이버_클라이언트_ID
NAVER_LOGIN_CLIENT_SECRET=네이버_클라이언트_시크릿
NAVER_LOGIN_REDIRECT_URI=http://localhost:8080/naver-callback
```

## 더 자세한 정보

- API 문서: [api.md](./api.md)
