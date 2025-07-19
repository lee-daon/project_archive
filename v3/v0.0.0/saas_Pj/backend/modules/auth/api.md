# 인증 모듈 API 문서

## 기본 URL
```
http://localhost:3000/auth
```

---

## 1. 네이버 소셜 로그인

### 로그인 URL 생성
```
GET /naver/login
```

**응답:**
```json
{
  "success": true,
  "loginUrl": "네이버_로그인_URL",
  "state": "random_state"
}
```

### 콜백 처리
```
POST /naver/callback
```

**요청:**
```json
{
  "code": "authorization_code",
  "state": "state_value"
}
```

**응답:**
```json
{
  "success": true,
  "message": "네이버 로그인에 성공했습니다.",
  "user": {
    "userid": 1,
    "id": "localId123",
    "name": "홍길동",
    "email": "user@naver.com",
    "loginType": "both",
    "plan": "free",
    "isNewUser": false
  }
}
```

**신규 사용자 회원가입 응답:**
```json
{
  "success": true,
  "message": "네이버 회원가입이 완료되었습니다.",
  "user": {
    "userid": 1,
    "id": null,
    "name": "홍길동",
    "email": "user@naver.com",
    "loginType": "naver",
    "plan": "free",
    "isNewUser": true
  }
}
```

---

## 2. 로컬 로그인

```
POST /login
```

**요청:**
```json
{
  "id": "user123",
  "password": "Password123!"
}
```

**응답:**
```json
{
  "success": true,
  "message": "로그인에 성공했습니다.",
  "user": {
    "userid": 1,
    "id": "user123",
    "name": "홍길동",
    "email": "user@example.com",
    "loginType": "both",
    "plan": "free",
    "isNewUser": false
  }
}
```

---

## 3. 로컬 크리덴셜 설정

### 설정/변경
```
POST /local-credentials/set
```

**요청:** (인증 필요)
```json
{
  "id": "myLocalId",
  "password": "MyPassword123!"
}
```

**응답:**
```json
{
  "success": true,
  "message": "로컬 로그인 정보가 설정되었습니다."
}
```

**변경 시 응답:**
```json
{
  "success": true,
  "message": "로컬 로그인 정보가 변경되었습니다."
}
```

---

## 4. 인증 상태 확인

```
GET /status
```

**응답:** (인증 필요)
```json
{
  "success": true,
  "authenticated": true,
  "user": {
    "userid": 1,
    "id": "user123",
    "name": "홍길동",
    "email": "user@example.com",
    "plan": "free",
    "hasLocalCredentials": true
  }
}
```

**네이버 전용 사용자 응답:**
```json
{
  "success": true,
  "authenticated": true,
  "user": {
    "userid": 1,
    "id": null,
    "name": "홍길동",
    "email": "user@naver.com",
    "plan": "free",
    "hasLocalCredentials": false
  }
}
```

---

## 5. API 키 관리

### API 키 발급
```
POST /api-key/generate
```

**인증:** JWT 토큰 필요 (enterprise 플랜만 가능)

**응답:**
```json
{
  "success": true,
  "message": "API 키가 성공적으로 발급되었습니다. 이 키는 다시 확인할 수 없으니 안전한 곳에 보관해주세요.",
  "apiKey": "sk_123_abcd1234efgh5678ijkl9012mnop3456",
  "issuedAt": "2024-01-15T10:30:45.123Z"
}
```

**오류 응답:**
```json
{
  "success": false,
  "message": "API 키는 24시간에 한 번만 발급 가능합니다. 12시간 후에 다시 시도해주세요."
}
```

### API 키 상태 확인
```
GET /api-key/status
```

**인증:** JWT 토큰 필요

**응답:**
```json
{
  "success": true,
  "hasApiKey": true,
  "lastIssuedAt": "2024-01-15T10:30:45.123Z",
  "nextAvailableTime": "2024-01-16T10:30:45.123Z",
  "canIssueNew": false
}
```

---

## API 키 인증 사용법

API 키는 두 가지 방법으로 전달할 수 있습니다:

### 1. X-API-Key 헤더 사용
```http
GET /api/endpoint
X-API-Key: sk_123_abcd1234efgh5678ijkl9012mnop3456
```

### 2. Authorization Bearer 토큰 사용
```http
GET /api/endpoint
Authorization: Bearer sk_123_abcd1234efgh5678ijkl9012mnop3456
```

### API 키 형식
- `sk_userid_고유번호` 형태
- 예: `sk_123_abcd1234efgh5678ijkl9012mnop3456`

---

## 주요 오류 코드

| 코드 | 설명 |
|------|------|
| 200 | 성공 |
| 201 | 회원가입 성공 |
| 400 | 잘못된 요청 |
| 401 | 인증 필요 / 유효하지 않은 API 키 |
| 403 | 권한 없음 (enterprise 플랜 필요) |
| 409 | 중복 아이디 |
| 429 | 요청 제한 (API 키 발급 24시간 제한) |
| 500 | 서버 오류 |

---

## 유효성 검사 규칙

- **아이디**: 4~20자 영문자, 숫자
- **비밀번호**: 8자 이상 영문자, 숫자, 특수문자
- **이름**: 2~20자 문자열
- **API 키**: `sk_` 접두사로 시작하는 고유 키

## 기본 정보

### 사용자 플랜
- **free**: 기본 무료 플랜 (새 회원가입 시 기본값)
- **basic**: 기본 유료 플랜
- **enterprise**: 엔터프라이즈 플랜 (API 키 발급 가능)
