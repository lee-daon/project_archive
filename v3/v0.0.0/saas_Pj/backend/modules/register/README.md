# Register Module

상품 등록 관리를 위한 API 모듈입니다.

## 개요

이 모듈은 ProductRegistration.vue 페이지에서 사용하는 상품 등록 관련 API 엔드포인트들을 제공합니다. 사용자가 상품을 검색하고, 이미지를 조회하며, 등록 또는 폐기할 수 있는 기능을 포함합니다.

## 주요 기능

- **초기 데이터 로딩**: 페이지 로딩 시 필요한 상품 목록, 그룹 코드, 마켓 정보 등을 제공
- **상품 검색**: 탭 정보와 그룹 코드에 따른 상품 필터링
- **이미지 조회**: 특정 상품의 메인 이미지 URL 제공
- **상품 등록**: 선택된 상품들을 지정된 마켓에 등록 (비동기 큐 처리)
- **상품 폐기**: 선택된 상품들을 폐기 처리
- **쿠팡 옵션 매핑**: AI를 활용한 자동 옵션 매핑 및 수동 매핑 관리

## 상품 등록 시스템

### 등록 프로세스
1. **마켓 결정**: 탭 정보(common/naver/coopang/elevenstore)에 따라 등록할 마켓 결정
2. **등록 제한 확인**: 각 마켓별 최대 SKU 수량 대비 현재 등록 수량 확인
3. **상태 업데이트**: 등록 관리 테이블에 상품별 등록 상태 저장
4. **큐 처리**: Redis 큐에 등록 작업 추가하여 백그라운드에서 실제 등록 수행

### 지원 마켓
- **네이버 스마트스토어**: `naver_register_management` 테이블로 관리
- **쿠팡**: `coopang_register_management` 테이블로 관리
- **11번가**: `elevenstore_register_management` 테이블로 관리

### 큐 시스템
- **NAVER_REGISTER**: 네이버 등록 작업 큐
- **COOPANG_REGISTER**: 쿠팡 등록 작업 큐
- **ELEVENSTORE_REGISTER**: 11번가 등록 작업 큐
- Redis를 사용한 비동기 작업 처리

## 쿠팡 옵션 매핑 시스템

### 매핑 프로세스
1. **매핑 필요 상품 식별**: `status = 'optionMapRequired'` 상품 조회
2. **카테고리 메타데이터 수집**: 쿠팡 API를 통한 카테고리별 필수/선택 속성 조회
3. **AI 자동 매핑**: ChatGPT를 활용한 옵션 조합 최적화 (최대 3개)
4. **수동 매핑**: 사용자가 직접 옵션 매핑 수정
5. **매핑 결과 저장**: `mapped_json` 필드에 최종 매핑 정보 저장

### 매핑 특징
- **AI 기반 자동화**: ChatGPT를 통한 지능형 옵션 매핑
- **제약사항 준수**: 쿠팡 최대 3개 옵션 조합 제한
- **필수 속성 보장**: MANDATORY 속성 누락 방지
- **수동 보정 지원**: AI 결과 검토 및 수동 수정 가능

## API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/reg/initial` | 초기 데이터 로딩 |
| GET | `/reg/search` | 상품 검색 |
| GET | `/reg/image/:productId` | 상품 이미지 조회 |
| POST | `/reg/register` | 상품 등록 |
| POST | `/reg/discard` | 상품 폐기 |
| GET | `/reg/coopangmapping/products` | 매핑 필요 상품 목록 |
| GET | `/reg/coopangmapping/product/:productid` | 상품 매핑 데이터 조회 |
| POST | `/reg/coopangmapping/manual/:productid` | 수동 옵션 매핑 저장 |
| POST | `/reg/coopangmapping/auto` | 자동 옵션 매핑 처리 |
| POST | `/reg/coopangmapping/discard` | 상품 등록 포기 |

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env

# 서버 실행
npm start
```

## 기술 스택

- **Node.js**: 백엔드 런타임
- **Express.js**: 웹 프레임워크
- **MySQL**: 데이터베이스 (상품 정보, 등록 상태 관리)
- **Redis**: 큐 시스템 (비동기 등록 작업 처리)
- **ChatGPT**: AI 옵션 매핑 엔진
- **ES6 Modules**: 모듈 시스템

## 의존성

```json
{
  "express": "^4.x.x",
  "mysql2": "^3.x.x", 
  "redis": "^4.x.x",
  "dotenv": "^16.x.x"
}
```

## 환경 변수

```env
# 데이터베이스 설정
DB_HOST=localhost
DB_USER=your_username
DB_PASS=your_password
DB_NAME=saas

# Redis 설정
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# 큐 설정
QUEUE_NAVER_REGISTER=naver_register_queue
QUEUE_COOPANG_REGISTER=coopang_register_queue
QUEUE_ELEVENSTORE_REGISTER=elevenstore_register_queue

# 쿠팡 API 설정
COOPANG_ACCESS_KEY=your_coupang_access_key
COOPANG_SECRET_KEY=your_coupang_secret_key
```

## 사용 예시

### 초기 데이터 로딩
```javascript
const response = await fetch('/api/reg/initial');
const data = await response.json();
```

### 상품 검색
```javascript
const response = await fetch('/api/reg/search?tabInfo=common&groupCode=GRP001');
const data = await response.json();
```

### 상품 등록

#### 공통 탭에서 모든 마켓 등록 (네이버 + 쿠팡 + 11번가)
```javascript
const response = await fetch('/api/reg/register', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your_jwt_token'
  },
  body: JSON.stringify({
    ids: [1, 2, 3],
    tabInfo: 'common',
    settings: {
      groupCode: 'GRP001',
      shippingFee: 6000,
      minMargin: 15,
      defaultMargin: 30,
      naverMarket: 'N001',
      coopangMarket: 'C001',
      elevenstoreMarket: 'E001'
    }
  })
});

const result = await response.json();
console.log(result);
// {
//   "success": true,
//   "message": "등록 요청이 처리되었습니다. 성공: 3개, 실패: 0개",
//   "successCount": 3,
//   "failCount": 0,
//   "results": [...]
// }
```

### 네이버만 등록
```javascript
const response = await fetch('/api/reg/register', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your_jwt_token'
  },
  body: JSON.stringify({
    ids: [4, 5],
    tabInfo: 'naver',
    settings: {
      naverMarket: 'N001',
      defaultMargin: 25,
      minMargin: 10,
      shippingFee: 5000
    }
  })
});
```

### 쿠팡만 등록
```javascript
const response = await fetch('/api/reg/register', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your_jwt_token'
  },
  body: JSON.stringify({
    ids: [6, 7],
    tabInfo: 'coopang',
    settings: {
      coopangMarket: 'C001',
      defaultMargin: 35,
      minMargin: 20,
      shippingFee: 7000
    }
  })
});
```

### 11번가만 등록
```javascript
const response = await fetch('/api/reg/register', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your_jwt_token'
  },
  body: JSON.stringify({
    ids: [8, 9],
    tabInfo: 'elevenstore',
    settings: {
      elevenstoreMarket: 'E001',
      defaultMargin: 30,
      minMargin: 15,
      shippingFee: 6000
    }
  })
});
```

### 쿠팡 자동 옵션 매핑
```javascript
const response = await fetch('/api/reg/coopangmapping/auto', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your_jwt_token'
  },
  body: JSON.stringify({
    productIds: ["12345", "67890"]
  })
});

const result = await response.json();
// {
//   "success": true,
//   "message": "자동 옵션 매핑 완료: 2/2개 성공",
//   "totalProcessed": 2,
//   "successCount": 2,
//   "results": [...]
// }
```

### 수동 옵션 매핑
```javascript
const response = await fetch('/api/reg/coopangmapping/manual/12345', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your_jwt_token'
  },
  body: JSON.stringify({
    mappedJson: {
      optionSchema: [...],
      variants: [...]
    }
  })
});
```

## 파일 구조 설명

### Controller Layer
- `controller/register.js`: 상품 등록 API 엔드포인트, 요청 검증 및 응답 처리
- `controller/coopangmaping.js`: 쿠팡 옵션 매핑 API 엔드포인트

### Service Layer  
- `service/register.js`: 상품 등록 비즈니스 로직, 마켓 결정 및 등록 프로세스 관리
- `service/queueManager.js`: Redis 큐 관리, 네이버/쿠팡 등록 작업 큐 추가
- `service/coopang_Category/AIcategoryMapper.js`: AI 기반 옵션 매핑 처리
- `service/coopang_Category/categoryMeta.js`: 쿠팡 카테고리 메타데이터 조회

### Repository Layer
- `repository/registerStatus.js`: 등록 상태 관리, 네이버/쿠팡 등록 관리 테이블 업데이트
- `repository/checkLimit.js`: 등록 제한 확인, 마켓별 SKU 수량 제한 검증
- `repository/coopangMapdata.js`: 쿠팡 매핑 관련 데이터 조회
- `repository/updateMappedInfo.js`: 매핑 정보 업데이트

## 등록 상태 관리

### 상태 값
- `pending`: 등록 대기 중 (큐에 추가됨)
- `processing`: 등록 진행 중
- `completed`: 등록 완료
- `failed`: 등록 실패
- `optionMapRequired`: 옵션 매핑 필요 (쿠팡 전용)

### 상태 추적
각 상품의 등록 상태는 마켓별로 독립적으로 관리되며, `registration_attempt_time` 필드로 시도 횟수를 추적합니다.

## 주요 특징

- **비동기 처리**: Redis 큐를 사용한 백그라운드 등록 처리
- **다중 마켓 지원**: 네이버, 쿠팡, 11번가 등록을 독립적으로 처리
- **등록 제한 검증**: 마켓별 SKU 수량 제한 사전 확인
- **상세한 응답**: 각 상품별, 마켓별 등록 결과 제공
- **에러 처리**: 계층별 에러 처리 및 상세한 에러 메시지 제공
- **AI 옵션 매핑**: ChatGPT를 활용한 지능형 옵션 매핑 (쿠팡)
- **실시간 매핑**: 쿠팡 카테고리별 동적 속성 조회 및 매핑

