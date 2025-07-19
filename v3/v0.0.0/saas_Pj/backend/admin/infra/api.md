# Admin Infrastructure API 문서

## 개요
관리자 전용 인프라 관리 API입니다. 모든 API는 관리자 권한(userid = 1)이 필요합니다.

## 공통 사항
- **Base URL**: `/admin/infra`
- **인증**: JWT 토큰 필요 (관리자만 접근 가능)
- **Content-Type**: `application/json`

## API 목록

### 1. 데이터베이스 백업

#### POST `/admin/infra/db-backup`

데이터베이스 전체를 백업하고 Cloudflare R2 비공개 버킷에 업로드합니다.

**요청**
```bash
POST /admin/infra/db-backup
```

**응답**
```json
{
  "success": true,
  "message": "데이터베이스 백업 및 비공개 버킷 업로드가 성공적으로 완료되었습니다.",
  "backupFileName": "2024-01-15T10-30-00.000Z.sql",
  "bucket": "db-backup"
}
```

**에러 응답**
```json
{
  "success": false,
  "error": "데이터베이스 백업 중 오류가 발생했습니다.",
  "code": "DB_BACKUP_ERROR"
}
```

### 2. 서버 상태 확인

#### GET `/admin/infra/health`

서버의 현재 상태와 리소스 사용량을 확인합니다. (CPU, RAM만)

**요청**
```bash
GET /admin/infra/health
```

**응답**
```json
{
  "success": true,
  "message": "서버 상태가 정상입니다.",
  "data": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "server": {
      "status": "running",
      "nodeVersion": "v18.17.0",
      "platform": "win32",
      "uptime": {
        "process": "2시간 15분",
        "system": "1일 5시간 30분"
      }
    },
    "memory": {
      "system": {
        "total": "16.0 GB",
        "used": "8.5 GB",
        "usagePercent": "53.1%"
      },
      "process": {
        "heapUsed": "95.2 MB",
        "heapUsagePercent": "74.4%"
      }
    },
    "cpu": {
      "cores": 8,
      "model": "Intel(R) Core(TM) i7-9700K CPU @ 3.60GHz",
      "loadAverage": {
        "1min": "1.25",
        "5min": "1.18",
        "15min": "1.05"
      }
    }
  }
}
```

### 3. 데이터베이스 상태 확인

#### GET `/admin/infra/db-health`

데이터베이스의 연결 상태와 성능을 확인합니다.

**요청**
```bash
GET /admin/infra/db-health
```

**응답 (정상)**
```json
{
  "success": true,
  "message": "데이터베이스 상태가 정상입니다.",
  "data": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "database": {
      "status": "connected",
      "responseTime": "15ms",
      "connected": true,
      "threadsConnected": "8",
      "uptime": "120시간"
    }
  }
}
```

**응답 (연결 실패)**
```json
{
  "success": false,
  "message": "데이터베이스 연결에 문제가 있습니다.",
  "data": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "database": {
      "status": "disconnected",
      "error": "Connection refused",
      "connected": false,
      "responseTime": null,
      "threadsConnected": null,
      "uptime": null
    }
  }
}
```

## 에러 코드

| 코드 | 설명 |
|------|------|
| `UNAUTHORIZED` | 인증이 필요함 |
| `FORBIDDEN` | 관리자 권한 없음 |
| `DB_BACKUP_ERROR` | 데이터베이스 백업 실패 |
| `HEALTH_CHECK_ERROR` | 서버 상태 확인 실패 |
| `DB_HEALTH_CHECK_ERROR` | DB 상태 확인 실패 |

## 사용 예시

```javascript
// DB 백업
const backupResponse = await fetch('/admin/infra/db-backup', {
  method: 'POST',
  credentials: 'include'
});

// 서버 상태 확인 (CPU, RAM)
const healthResponse = await fetch('/admin/infra/health', {
  method: 'GET',
  credentials: 'include'
});

// 데이터베이스 상태 확인
const dbHealthResponse = await fetch('/admin/infra/db-health', {
  method: 'GET',
  credentials: 'include'
});
```
