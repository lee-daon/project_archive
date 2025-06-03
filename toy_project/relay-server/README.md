# IP 고정 릴레이 서버

외부 API 호출 시 IP를 고정하기 위한 릴레이 서버

## 프로젝트 목적

외부 서버와 연결할 때마다 IP를 지정해야 하는 불편함을 해결하기 위해 개발했습니다.

**문제상황:**
- 다양한 외부 API 호출 시 IP 주소가 계속 변경됨
- 외부 서비스에서 IP 화이트리스트 관리의 어려움

**해결방안:**
- 고정 IP를 가진 릴레이 서버를 통한 API 호출
- 인증 시스템을 통한 접근 제어

## 사용법

```bash
npm install
echo "AUTH_KEY=your-secret-key" > .env
npm start
```

API 호출:
```bash
curl -H "internal-key: your-secret-key" \
     http://localhost:3000/api/example.com/users
```

## 주요 기능

- IP 고정으로 외부 API 릴레이
- 인증 헤더 필요 (`internal-key`)
- 모든 HTTP 메소드 지원

## 배포

```bash
pm2 start ecosystem.config.cjs
```

## 보안 주의

- `AUTH_KEY` 환경변수 필수 설정
- 프로덕션에서는 HTTPS 사용 