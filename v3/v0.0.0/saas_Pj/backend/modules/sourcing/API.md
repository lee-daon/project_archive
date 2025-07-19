# 소싱 모듈 API 문서

이 문서는 소싱 모듈에서 제공하는 API 엔드포인트들의 상세 정보를 다룹니다.

## 공통 사항

### 기본 URL
```
http://localhost:3000/src
```

### 인증
모든 API 요청은 다음 방법 중 하나로 사용자 ID를 전달해야 합니다:
- 인증 미들웨어를 통해 설정된 `req.user.userid`
- 쿼리 파라미터 `userid` (예: `?userid=1`)

### 응답 형식
모든 응답은 JSON 형식으로 반환됩니다.

---

## 1. 상품 업로드 API

상품 목록을 서버에 업로드하여 처리합니다.

### 엔드포인트
```
POST /upload
```

### 요청 형식

**쿼리 파라미터:**
- `userid` (number, 필수): 사용자 ID

**요청 본문 (JSON):**
```json
[
  {
    "productId": "607454902338",
    "productName": "상품명",
    "pic": "https://example.com/image.jpg",
    "price": 309,
    "sales": "100以内",
    "detail_url": "https://item.taobao.com/item.htm?id=607454902338"
  },
  ...
]
```

**요청 필드 설명:**
- `productId`: 상품 ID (필수)
- `productName`: 상품명 (필수)
- `pic`: 이미지 URL (필수)
- `price`: 가격 (필수)
- `sales`: 판매량 (문자열 또는 숫자)
- `detail_url`: 상세 페이지 URL (필수)

### 응답 형식

**성공 응답 (200 OK):**
```json
{
  "message": "처리가 완료되었습니다.",
  "success": true
}
```

**오류 응답 (400 Bad Request):**
```json
{
  "message": "유효한 사용자 ID가 제공되지 않았습니다."
}
```

**오류 응답 (500 Internal Server Error):**
```json
{
  "message": "상품 처리 중 오류가 발생했습니다.",
  "error": "오류 메시지"
}
```

### 처리 과정
1. 중복 상품 필터링 및 기존 상품 정보 업데이트 (가격, 이미지 URL, 판매량)
2. 신규 상품 저장
3. 중국어 문자가 포함된 상품명만 번역 처리
4. 금지어 체크 및 DB 업데이트
5. 처리 결과를 temp 테이블에 저장

---

## 2. 상품 ID 기반 직접 소싱 API

상품 ID 배열을 제공하여 직접 상품을 소싱합니다.

### 엔드포인트
```
POST /urlsourcing
```

### 요청 형식

**쿼리 파라미터:**
- `userid` (number, 선택적): 사용자 ID (미들웨어를 통해 설정되지 않은 경우)

**요청 본문 (JSON):**
```json
{
  "productIds": [718614821378, 741655261915]
}
```

### 응답 형식

**성공 응답 (200 OK):**
```json
{
  "success": true,
  "message": "2개 상품이 저장되었고, 1개 상품은 이미 존재합니다. 2개 신규 상품의 상세 정보 파싱이 요청되었습니다.",
  "savedCount": 2,
  "existingCount": 1
}
```

**오류 응답 (400 Bad Request):**
```json
{
  "success": false,
  "message": "유효한 사용자 ID가 제공되지 않았습니다."
}
```
또는
```json
{
  "success": false,
  "message": "유효한 상품 ID 배열이 제공되지 않았습니다."
}
```

**오류 응답 (500 Internal Server Error):**
```json
{
  "success": false,
  "message": "URL 소싱 중 오류 발생: 오류 메시지"
}
```

### 처리 과정
1. 제공된 상품 ID 배열에 대해 DataHub API 호출
2. 각 상품 ID에 대해 중복 확인
3. 신규 상품은 DB에 저장
4. 신규 상품(savedProducts)에 대해서만 상세 정보 파싱 요청

---

## 3. 상품 상세 정보 파싱 API

상품 상세 정보 파싱을 큐에 등록합니다.

### 엔드포인트
```
POST /detailparselist
```

### 요청 형식

**쿼리 파라미터:**
- `userid` (number, 필수): 사용자 ID

**요청 본문 (JSON):**
```json
{
  "products": [
    {
      "productId": "718614821378",
      "productName": "상품명"
    },
    ...
  ],
  "commitCode": 1
}
```

**요청 필드 설명:**
- `products`: 상품 정보 배열 (필수)
  - `productId`: 상품 ID (필수)
  - `productName`: 상품명 (필수)
- `commitCode`: 그룹 코드 (필수)

### 응답 형식

**성공 응답 (200 OK):**
```json
{
  "success": true,
  "message": "8개 상품의 상세 정보 파싱 요청이 접수되었습니다. (그룹코드: 1)",
  "queuedCount": 8,
  "statusUpdatedCount": 8,
  "statusInsertedCount": 8,
  "commitCode": 1
}
```

**응답 필드 설명:**
- `success`: 성공 여부
- `message`: 메시지
- `queuedCount`: 큐에 추가된 항목 수
- `statusUpdatedCount`: 상태 업데이트된 항목 수
- `statusInsertedCount`: status 테이블에 삽입된 항목 수
- `commitCode`: 그룹 코드

**오류 응답 (400 Bad Request):**
```json
{
  "success": false,
  "message": "유효한 사용자 ID가 제공되지 않았습니다."
}
```
또는
```json
{
  "success": false,
  "message": "유효한 상품 배열이 필요합니다."
}
```
또는
```json
{
  "success": false,
  "message": "commitCode가 필요합니다."
}
```

**오류 응답 (500 Internal Server Error):**
```json
{
  "success": false,
  "message": "상품 파싱 요청 처리 중 오류가 발생했습니다."
}
```

### 처리 과정
1. 상품 정보 및 commitCode를 Redis 큐에 추가
2. sourcing_status 테이블에 상태를 'pending'으로 설정 및 commitCode 저장
3. status 테이블에 항목 생성
4. 워커 프로세스가 큐에서 작업을 꺼내 처리

---

## 4. 쇼핑몰별 상품 조회 API

지정된 쇼핑몰에서 상품 목록을 수집합니다.

### 엔드포인트
```
POST /getbyshop
```

### 요청 형식

**요청 본문 (JSON):**
```json
{
  "url": "https://item.taobao.com/item.htm?id=12345678901",
  "count": 10,
  "ignoreBan": false,
  "is_shopurl": false
}
```

또는 상점 URL 직접 사용:
```json
{
  "url": "https://shop36448262.world.taobao.com/?spm=pc_detail.29232929.shop_block.dshopinfo.66fa7dd68hiPN6",
  "count": 10,
  "ignoreBan": false,
  "is_shopurl": true
}
```

### 매개변수 설명
- `url`: 상품 URL 또는 상점 URL (필수)
- `count`: 수집할 최대 상품 개수 (필수)
- `ignoreBan`: 금지 상태 무시 여부 (선택, 기본값: false)
- `is_shopurl`: 제공된 URL이 상점 URL인지 여부 (선택, 기본값: false)
  - `true`: URL에서 직접 상점 ID 추출 (예: shop36448262)
  - `false`: 상품 URL에서 상품 ID를 추출한 후 해당 상품의 상점 정보 조회

### 응답 형식

**성공 응답 (200 OK):**
```json
{
  "message": "처리가 완료되었습니다.",
  "success": true
}
```

**금지된 쇼핑몰/판매자 응답 (200 OK):**
```json
{
  "success": false,
  "warning": {
    "type": "seller",
    "message": "금지된 판매자입니다. 이 판매자의 상품은 수집할 수 없습니다.",
    "banned": true
  },
  "needsConfirmation": false,
  "shopId": "12345",
  "sellerId": "67890"
}
```

**확인이 필요한 쇼핑몰/판매자 응답 (200 OK):**
```json
{
  "success": false,
  "warning": {
    "type": "shop",
    "message": "7일 전에 소싱한 적이 있는 상점입니다. 계속 진행하시겠습니까?",
    "banned": false
  },
  "needsConfirmation": true,
  "shopId": "12345",
  "sellerId": "67890"
}
```

**상품 없음 응답 (200 OK):**
```json
{
  "success": true,
  "message": "수집된 상품이 없습니다.",
  "itemCount": 0
}
```

**오류 응답 (400 Bad Request):**
```json
{
  "success": false,
  "message": "올바른 상품 URL이 아닙니다. 상품 ID를 찾을 수 없습니다."
}
```

**오류 응답 (500 Internal Server Error):**
```json
{
  "success": false,
  "message": "쇼핑몰 상품 수집 중 오류 발생: 오류 메시지"
}
```

### 처리 과정
1. URL에서 상품 ID 또는 상점 ID 추출
2. 상품 URL인 경우 상세 정보에서 판매자 및 상점 정보 추출
3. 판매자/상점의 금지 상태 확인 (ignoreBan이 true가 아닌 경우)
   - 금지되었거나 이전에 소싱한 적이 있을 경우 관련 경고 반환
4. 판매자/상점 정보를 데이터베이스에 저장 (없는 경우에만)
5. 요청한 개수만큼 상품 수집
6. 수집된 상품을 /upload 엔드포인트로 전송
7. 결과 반환

---

## 5. 상품 목록 확인 API

상품 업로드 후 처리된 결과를 조회합니다.

### 엔드포인트
```
GET /listcheck
```

### 요청 형식

**쿼리 파라미터:**
- `userid` (number, 필수): 사용자 ID

### 응답 형식

**성공 응답 (200 OK):**
```json
{
  "bancheckedTarget": [...],
  "finalTargetCount": 10,
  "duplicationCount": 2,
  "includeBanCount": 1,
  "totalCount": 13,
  "dataReady": true,
  "timestamp": "2023-07-01T12:34:56.789Z"
}
```

**응답 필드 설명:**
- `bancheckedTarget`: 금지어 검사를 마친 상품 목록
- `finalTargetCount`: 최종 처리 가능한 상품 수
- `duplicationCount`: 중복 상품 개수
- `includeBanCount`: 금지어 포함 상품 개수
- `totalCount`: 전체 상품 개수
- `dataReady`: 데이터 준비 완료 여부
- `timestamp`: 타임스탬프

**오류 응답 (400 Bad Request):**
```json
{
  "success": false,
  "message": "유효한 사용자 ID가 제공되지 않았습니다."
}
```

**오류 응답 (404 Not Found):**
```json
{
  "success": false,
  "message": "상품 데이터를 찾을 수 없습니다."
}
```

**오류 응답 (500 Internal Server Error):**
```json
{
  "success": false,
  "message": "데이터 조회 중 오류가 발생했습니다.",
  "error": "오류 메시지"
}
```

### 처리 과정
1. temp 테이블에서 type_number가 1인 데이터 조회
2. 클라이언트에 응답 후 temp 테이블에서 데이터 삭제

---

## 6. 상품 금지 상태 업데이트 API

상품의 금지 상태를 업데이트합니다.

### 엔드포인트
```
POST /updateban
```

### 요청 형식

**쿼리 파라미터:**
- `userid` (number, 필수): 사용자 ID

**요청 본문 (JSON):**
```json
{
  "updatedData": [
    {
      "productId": "718614821378",
      "ban": true
    },
    ...
  ]
}
```

**요청 필드 설명:**
- `updatedData`: 업데이트할 상품 데이터 배열
  - `productId`: 상품 ID (필수)
  - `ban`: 금지 여부 (필수)

### 응답 형식

**성공 응답 (200 OK):**
```json
{
  "success": true,
  "message": "Ban 상태 업데이트 성공"
}
```

**오류 응답 (400 Bad Request):**
```json
{
  "success": false,
  "message": "유효한 사용자 ID가 제공되지 않았습니다."
}
```
또는
```json
{
  "success": false,
  "message": "updatedData는 배열이어야 합니다."
}
```

**오류 응답 (500 Internal Server Error):**
```json
{
  "success": false,
  "message": "서버 에러"
}
```

---

## 7. 상품 상태 코드 업데이트 API

상품의 테스트 코드 상태를 업데이트합니다.

### 엔드포인트
```
POST /updatestatus
```

### 요청 형식

**쿼리 파라미터:**
- `userid` (number, 필수): 사용자 ID

**요청 본문 (JSON):**
```json
{
  "commitcode": 1,
  "productIds": ["718614821378", "741655261915"]
}
```

**요청 필드 설명:**
- `productIds`: 상품 ID 배열 (필수)

### 응답 형식

**성공 응답 (200 OK):**
```json
{
  "success": true,
  "message": "상태 업데이트 완료: 2개 상품 commit 처리, 1개 상태 삭제, 2개 상품 sourcing_completed 처리, 2개 상품 카테고리 매핑 동기화",
  "committedCount": 2,
  "deletedCount": 1,
  "sourcingCompletedCount": 2,
  "categoryMappingSyncCount": 2
}
```

**응답 필드 설명:**
- `success`: 성공 여부
- `message`: 메시지
- `committedCount`: commit 상태로 변경된 상품 개수
- `deletedCount`: 삭제된 상품 상태 레코드 수
- `sourcingCompletedCount`: sourcing_completed 상태로 변경된 상품 개수
- `categoryMappingSyncCount`: 카테고리 매핑 동기화된 상품 개수

**오류 응답 (400 Bad Request):**
```json
{
  "success": false,
  "message": "유효한 사용자 ID가 제공되지 않았습니다."
}
```
또는
```json
{
  "success": false,
  "message": "유효하지 않은 요청입니다. productIds 배열이 필요합니다."
}
```

**오류 응답 (500 Internal Server Error):**
```json
{
  "success": false,
  "message": "서버 오류가 발생했습니다."
}
```

### 처리 과정
1. uncommit 상태의 상품을 commit 상태로 변경 (commitcode는 기존 값 유지)
2. 문제 상태(banshop, banseller, failsave, failapi)인 상품 레코드 삭제
3. commit 상태인 모든 상품의 sourcing_completed 상태 업데이트
4. commit된 상품들의 카테고리 매핑 상태 동기화
5. 각 처리 결과 반환

## 8. 소싱 상태 정보 조회 API

소싱 상태별 상품 개수와 처리 중인 상품 ID 목록을 조회합니다.

### 엔드포인트
```
GET /getstatus/setupinfo
```

### 요청 형식

**쿼리 파라미터:**
- `userid` (number, 필수): 사용자 ID
- `commitCode` (number, 선택적): 그룹 코드 필터

### 응답 형식

**성공 응답 (200 OK):**
```json
{
  "success": true,
  "successCount": 8,
  "failApiCount": 2,
  "failSaveCount": 1,
  "banShopCount": 3,
  "banSellerCount": 1,
  "pendingCount": 5,
  "totalCount": 20,
  "productIds": ["718614821378", "741655261915", "..."],
  "uncommitIds": ["718614821378", "..."],
  "pendingIds": ["741655261915", "..."],
  "failIds": ["123456789", "..."],
  "banIds": ["987654321", "..."],
  "commitCode": 1,
  "timestamp": "2023-07-01T12:34:56.789Z"
}
```

**응답 필드 설명:**
- `success`: 성공 여부
- `successCount`: uncommit 상태인 상품 개수
- `failApiCount`: failapi 상태인 상품 개수
- `failSaveCount`: failsave 상태인 상품 개수
- `banShopCount`: banshop 상태인 상품 개수
- `banSellerCount`: banseller 상태인 상품 개수
- `pendingCount`: pending 상태인 상품 개수
- `totalCount`: 전체 상품 개수
- `productIds`: 처리 중인 상품(uncommit, failapi, failsave, banshop, banseller, pending) ID 목록
- `uncommitIds`: uncommit 상태인 상품 ID 목록
- `pendingIds`: pending 상태인 상품 ID 목록
- `failIds`: failapi + failsave 상태인 상품 ID 목록
- `banIds`: banshop + banseller 상태인 상품 ID 목록
- `commitCode`: 필터링에 사용된 그룹 코드 (있는 경우)
- `timestamp`: 응답 시간

**오류 응답 (400 Bad Request):**
```json
{
  "success": false,
  "message": "유효한 사용자 ID가 제공되지 않았습니다."
}
```

**오류 응답 (500 Internal Server Error):**
```json
{
  "success": false,
  "message": "상태 정보 조회 중 오류가 발생했습니다."
}
```

### 처리 과정
1. 사용자 ID로 sourcing_status 테이블 조회 (commitCode 필터 적용 가능)
2. 상태별 상품 개수 집계
3. 처리 중인 상품 ID 목록을 상태별로 분류하여 반환 