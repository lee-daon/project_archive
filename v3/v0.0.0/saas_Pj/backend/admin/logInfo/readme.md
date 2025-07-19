# Admin LogInfo API

## 개요
관리자 전용 로그 정보 조회 및 삭제 기능을 제공하는 API 모듈입니다.

## 기능
- 폐기 이미지 로그 조회/삭제
- 사용자 정보 및 통계 조회
- 사용량 로그 조회/삭제
- 에러 로그 조회/삭제

## 페이지네이션 응답 형태
모든 조회 API는 다음과 같은 형태로 응답합니다:

```json
{
  "success": true,
  "data": [...],
  "total": 실제_전체_데이터_개수,
  "page": 현재_페이지_번호,
  "limit": 페이지당_항목_수
}
```

## 사용 예시

### 폐기 이미지 로그 조회
```
GET /admin/log-info/not-used-image?page=1&limit=10&userid=123
```

### 사용자 정보 조회
```
GET /admin/log-info/users?page=1&limit=20
```

### 사용량 로그 조회
```
GET /admin/log-info/usage?page=2&limit=15&userid=456
```

### 에러 로그 조회
```
GET /admin/log-info/error?page=1&limit=10
```

## 필터링
- `userid`: 특정 사용자 ID로 필터링
- `page`: 페이지 번호 (기본값: 1)
- `limit`: 페이지당 항목 수 (기본값: 10, 최대: 100)

## 에러 처리
- 400: 잘못된 요청 (유효하지 않은 ID 등)
- 404: 리소스를 찾을 수 없음
- 500: 서버 오류 