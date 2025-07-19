# LogInfo API

## Base Path
`/admin/log-info`

## 엔드포인트 목록

### 1. GET /not-used-image
폐기 이미지 로그 조회

**Query Parameters:**
- `userid` (optional): 사용자 ID 필터링
- `page` (optional): 페이지 번호 (기본값: 1)
- `limit` (optional): 페이지당 항목 수 (기본값: 10, 최대: 100)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "userid": 123,
      "code": "settingchange",
      "image_url": "https://example.com/image.jpg",
      "reason": "폐기사유",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 10
}
```

### 2. GET /users
사용자 정보 및 통계 조회

**Query Parameters:**
- `userid` (optional): 사용자 ID 필터링
- `page` (optional): 페이지 번호 (기본값: 1)
- `limit` (optional): 페이지당 항목 수 (기본값: 10, 최대: 100)

**Response:**
- `user_info` 테이블과 `user_statistics` 테이블 LEFT JOIN 결과
- 모든 사용자 정보 + 통계 데이터

### 3. GET /usage
사용량 로그 조회

**Query Parameters:**
- `userid` (optional): 사용자 ID 필터링
- `page` (optional): 페이지 번호 (기본값: 1)
- `limit` (optional): 페이지당 항목 수 (기본값: 10, 최대: 100)

**Response:**
- `usage_log` 테이블에서 `usage_time` DESC 정렬

### 4. GET /error
에러 로그 조회

**Query Parameters:**
- `userid` (optional): 사용자 ID 필터링
- `page` (optional): 페이지 번호 (기본값: 1)
- `limit` (optional): 페이지당 항목 수 (기본값: 10, 최대: 100)

**Response:**
- `error_log` 테이블에서 `created_at` DESC 정렬

### 5. GET /info
정보 로그 조회

**Query Parameters:**
- `page` (optional): 페이지 번호 (기본값: 1)
- `limit` (optional): 페이지당 항목 수 (기본값: 10, 최대: 100)

**Response:**
- `info_log` 테이블에서 `created_at` DESC 정렬
- userid 필터링 없음 (info_log 테이블에 userid 컬럼 없음)

### 6. DELETE /not-used-image/:id
폐기 이미지 로그 삭제

**Path Parameters:**
- `id`: 삭제할 로그 ID (정수)

**Validation:**
- ID가 정수인지 검증
- 존재하지 않는 ID일 경우 404 응답

### 7. DELETE /usage/:id
사용량 로그 삭제

**Path Parameters:**
- `id`: 삭제할 로그 ID (정수)

**Validation:**
- ID가 정수인지 검증
- 존재하지 않는 ID일 경우 404 응답

### 8. DELETE /error/:log_id
에러 로그 삭제

**Path Parameters:**
- `log_id`: 삭제할 에러 로그 ID (정수)

**Validation:**
- log_id가 정수인지 검증
- 존재하지 않는 log_id일 경우 404 응답

### 9. DELETE /info/:log_id
정보 로그 삭제

**Path Parameters:**
- `log_id`: 삭제할 정보 로그 ID (정수)

**Validation:**
- log_id가 정수인지 검증
- 존재하지 않는 log_id일 경우 404 응답

## 공통 기능

### 페이지네이션
- `getPagination(page, limit)` 함수 사용
- page: Math.max(1, parseInt(page, 10) || 1)
- limit: Math.min(100, Math.max(1, parseInt(limit, 10) || 10))
- offset: (page - 1) * limit

### 필터링
- `userid` 파라미터로 특정 사용자 필터링
- 빈 문자열이나 NaN 값 처리
- parseInt로 정수 변환 후 사용

### 에러 처리
- console.error로 데이터베이스 에러 로깅
- 500 상태 코드로 에러 응답
- success: false, message: error.message 형태

### 데이터베이스 쿼리
- COUNT 쿼리로 전체 개수 조회
- 데이터 쿼리로 실제 데이터 조회
- LIMIT/OFFSET은 문자열 보간으로 처리 (파라미터 바인딩 문제 해결)
