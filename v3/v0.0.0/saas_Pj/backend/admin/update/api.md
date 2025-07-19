# Update API

## Base Path
`/admin/update`

## 엔드포인트 목록

## 사용자 관리 API

### 1. GET /userPayment/users/:identifier
특정 유저 조회 (email 또는 id로)

**Path Parameters:**
- `identifier`: 사용자 식별자 (email 또는 id)

**Validation:**
- identifier가 빈 문자열이거나 undefined일 경우 400 에러
- '@' 포함 시 email로 조회, 그 외는 id로 조회

**Database Query:**
```sql
SELECT ui.userid, ui.id, ui.name, ui.email, ui.plan, ui.maximum_market_count, ui.expired_at, ui.created_at, ui.updated_at, ui.is_active,
       us.image_processing_allinone_count, us.image_processing_single_count, 
       us.deep_brand_filter_count, us.total_sourced_products, us.total_registered_products
FROM user_info ui 
LEFT JOIN user_statistics us ON ui.userid = us.userid
WHERE ui.email = ? -- 또는 ui.id = ?
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "userid": 123,
    "id": "user123",
    "name": "홍길동",
    "email": "user@example.com",
    "plan": "basic",
    "maximum_market_count": 3,
    "expired_at": "2024-12-31T23:59:59.000Z",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z",
    "is_active": true,
    "image_processing_allinone_count": 10,
    "image_processing_single_count": 50,
    "deep_brand_filter_count": 5,
    "total_sourced_products": 100,
    "total_registered_products": 80
  }
}
```

**Error Responses:**
- 400: 유효한 식별자가 필요합니다
- 404: 해당 유저를 찾을 수 없습니다
- 500: 서버 오류

### 2. PUT /userPayment/users/:identifier
유저 정보 수정 (email 또는 id로)

**Path Parameters:**
- `identifier`: 사용자 식별자 (email 또는 id)

**Request Body:**
```json
{
  "expired_at": "2024-12-31 23:59:59",
  "plan": "enterprise",
  "maximum_market_count": 5,
  "image_processing_allinone_count": 20,
  "image_processing_single_count": 100,
  "deep_brand_filter_count": 10
}
```

**Fields:**
- `expired_at` (optional): 구독 만료 시간 (TIMESTAMP 형식)
- `plan` (optional): 플랜 (`free`, `basic`, `enterprise` 중 하나)
- `maximum_market_count` (optional): 최대 마켓 수 (1 이상의 정수)
- `image_processing_allinone_count` (optional): 이미지 가공권 allinone 수량 (0 이상의 숫자)
- `image_processing_single_count` (optional): 이미지 가공권 낱장 수량 (0 이상의 숫자)
- `deep_brand_filter_count` (optional): 딥브랜드 필터링 수량 (0 이상의 숫자)

**Validation:**
- identifier 빈 문자열 검증
- plan 값이 허용된 값 중 하나인지 검증
- 숫자 필드들이 0 이상의 숫자인지 검증
- maximum_market_count가 1 이상의 정수인지 검증

**Database Operations:**
1. 사용자 조회 (userid 획득)
2. 트랜잭션 시작
3. user_info 테이블 업데이트 (expired_at, plan, maximum_market_count)
4. user_statistics 테이블 업데이트 (이미지 가공권 수량들)
5. 트랜잭션 커밋

**Transaction Queries:**
```sql
-- user_info 업데이트
UPDATE user_info SET expired_at = ?, plan = ?, maximum_market_count = ?, updated_at = NOW() WHERE userid = ?

-- user_statistics 업데이트  
UPDATE user_statistics SET image_processing_allinone_count = ?, image_processing_single_count = ?, deep_brand_filter_count = ?, updated_at = NOW() WHERE userid = ?
```

**Response (200):**
```json
{
  "success": true,
  "message": "유저 정보가 성공적으로 수정되었습니다."
}
```

**Error Responses:**
- 400: 유효하지 않은 요청 데이터
- 404: 해당 유저를 찾을 수 없습니다
- 500: 서버 오류

## 공지사항 관리 API

### 3. GET /notices
공지사항 목록 조회

**Query Parameters:**
- `page` (optional): 페이지 번호 (기본값: 1)
- `limit` (optional): 페이지당 항목 수 (기본값: 10, 최대: 100)
- `type` (optional): 공지사항 타입 필터링
- `tag_type` (optional): 태그 타입 필터링 (`success`, `warning`, `info`, `error`)
- `is_active` (optional): 활성화 여부 필터링 (`true`, `false`, `1`, `0`)

**Filter Logic:**
- `type`: 빈 문자열이 아닌 경우 `type = ?` 조건 추가
- `tag_type`: allowedTagTypes 배열에 포함된 경우만 `tag_type = ?` 조건 추가
- `is_active`: 문자열 `'true'` 또는 `'1'`을 boolean으로 변환하여 필터링

**Response:**
```json
{
  "success": true,
  "data": [...],
  "total": 25,
  "page": 1,
  "limit": 10
}
```

**Database Query:**
- COUNT 쿼리로 전체 개수 조회
- 데이터 쿼리에서 `created_at DESC` 정렬

### 4. GET /notices/:id
특정 공지사항 조회

**Path Parameters:**
- `id`: 공지사항 ID (정수)

**Validation:**
- ID가 정수인지 검증 (`isNaN(parseInt(id))`)
- 존재하지 않는 ID일 경우 404 응답

**Response:**
- 단일 데이터 객체 반환 (`rows[0]`)

### 5. POST /notices
공지사항 작성

**Request Body:**
```json
{
  "type": "공지",
  "tag_type": "success",
  "title": "공지사항 제목",
  "content": "<p>공지사항 내용</p>"
}
```

**Required Fields:**
- `type`: 공지사항 타입 (필수)
- `tag_type`: 태그 타입 (필수)
- `title`: 공지사항 제목 (필수)

**Optional Fields:**
- `content`: 공지사항 내용 (HTML 형식, null 허용)

**Validation:**
- 필수 필드 누락 시 400 에러
- `tag_type`이 allowedTagTypes에 없을 경우 400 에러
- allowedTagTypes: `['success', 'warning', 'info', 'error']`

**Response (201):**
```json
{
  "success": true,
  "message": "공지사항이 성공적으로 작성되었습니다.",
  "data": {
    "id": 123
  }
}
```

### 6. PUT /notices/:id
공지사항 수정

**Path Parameters:**
- `id`: 수정할 공지사항 ID (정수)

**Request Body:**
```json
{
  "type": "공지",
  "tag_type": "success",
  "title": "수정된 제목",
  "content": "<p>수정된 내용</p>",
  "is_active": true
}
```

**Required Fields:**
- `type`: 공지사항 타입 (필수)
- `tag_type`: 태그 타입 (필수)
- `title`: 공지사항 제목 (필수)

**Optional Fields:**
- `content`: 공지사항 내용 (null 허용)
- `is_active`: 활성화 여부 (기본값: true)

**Database Query:**
```sql
UPDATE notices SET type = ?, tag_type = ?, title = ?, content = ?, is_active = ?, updated_at = NOW() WHERE id = ?
```

**Validation:**
- ID 정수 검증
- 필수 필드 검증
- tag_type 유효성 검증
- affectedRows === 0일 경우 404 응답

### 7. DELETE /notices/:id
공지사항 삭제

**Path Parameters:**
- `id`: 삭제할 공지사항 ID (정수)

**Validation:**
- ID가 정수인지 검증
- 존재하지 않는 ID일 경우 404 응답

**Database Query:**
```sql
DELETE FROM notices WHERE id = ?
```

## 공통 기능

### 페이지네이션
- `getPagination(page, limit)` 함수 사용
- page: Math.max(1, parseInt(page, 10) || 1)
- limit: Math.min(100, Math.max(1, parseInt(limit, 10) || 10))
- offset: (page - 1) * limit

### 필터링 로직
- 동적 WHERE 조건 생성
- conditions 배열에 조건 추가 후 AND로 연결
- COUNT 쿼리와 데이터 쿼리에 동일한 WHERE 절 적용

### 에러 처리
- console.error로 데이터베이스 에러 로깅
- 400: 잘못된 요청 (필수 필드 누락, 유효하지 않은 값)
- 404: 리소스를 찾을 수 없음
- 500: 서버 오류

### tag_type 검증
- allowedTagTypes: `['success', 'warning', 'info', 'error']`
- includes() 메서드로 유효성 검사
- 유효하지 않은 값일 경우 400 에러 응답

### ID 파라미터 처리
- `parseInt(id, 10)`로 정수 변환
- `isNaN()` 체크로 유효성 검증
- 유효하지 않은 ID일 경우 400 에러 응답
