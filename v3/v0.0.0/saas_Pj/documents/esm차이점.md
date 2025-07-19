# ESM 마켓 차이점

ESM(Ebay Small Market - G마켓/옥션)은 다른 마켓들과 다음과 같은 차이점이 있습니다.

## 1. 등록 방식의 차이

### 다른 마켓들 (네이버, 쿠팡, 11번가)
- **자동 등록**: Redis 큐를 통한 백그라운드 자동 등록
- **실시간 처리**: Worker가 큐에서 작업을 가져와 API로 직접 등록
- **상태 관리**: pending → success/fail 상태로 실시간 업데이트

### ESM
- **수동 등록**: 엑셀 파일 생성 후 사용자가 직접 업로드
- **배치 처리**: 여러 상품을 한 번에 엑셀로 export
- **상태 관리**: prepared 상태로 설정 후 엑셀 다운로드 제공

## 2. COMMON 탭 포함 여부

### 포함되는 마켓
- 네이버 (naver)
- 쿠팡 (coopang) 
- 11번가 (elevenstore)
- **ESM (esm)**: COMMON 탭에 포함됨 (2024년 업데이트)

### ESM의 COMMON 탭 처리 방식
- **혼합 처리**: COMMON 탭에서 ESM과 다른 마켓을 함께 처리
- **ESM**: 엑셀 파일 생성 방식
- **나머지 마켓들**: Redis 큐 등록 방식
- **응답 구조**: ESM이 포함된 경우 `excelFile` 객체 추가 제공

## 3. 정책 설정의 차이

### 다른 마켓들
```javascript
// 네이버: A/S 안내, 전화번호 등 복잡한 설정
naver_register_config: {
  after_service_telephone,
  after_service_guide_content,
  delivery_company,
  // ... 기타 다양한 설정
}

// 쿠팡: A/S 정보, 배송 정책 등
coopang_setting: {
  after_service_guide_content,
  after_service_telephone,
  delivery_company_code,
  // ... 기타 설정
}
```

### ESM
```javascript
// ESM: 계정 정보만 확인
esm_account_info: {
  auction_id,
  gmarket_id,
  esm_market_number
  // 별도의 복잡한 정책 설정 없음
}
```

## 4. 응답 구조의 차이

### 다른 마켓들
```javascript
{
  success: true,
  message: "등록 요청이 처리되었습니다.",
  results: [
    {
      productId: 123,
      markets: [
        {
          market: "naver",
          status: "queued",
          message: "큐에 등록되었습니다."
        }
      ]
    }
  ]
}
```

### ESM
```javascript
{
  success: true,
  message: "등록 요청이 처리되었습니다. ESM 엑셀 파일이 생성되었습니다.",
  results: [
    {
      productId: 123,
      markets: [
        {
          market: "esm",
          status: "prepared",
          message: "엑셀 생성 준비가 완료되었습니다."
        }
      ]
    }
  ],
  excelFile: {
    fileName: "ESM_products_123_1640995200000.xlsx",
    filePath: "/path/to/file.xlsx",
    downloadUrl: "/download/excel/filename.xlsx",
    productCount: 10,
    createdAt: "2023-12-31T23:59:59.999Z"
  }
}
```

## 5. 데이터베이스 상태 필드

### status 테이블에서의 처리
```sql
-- 다른 마켓들
naver_mapping_ready = true
coopang_mapping_ready = true  
elevenstore_mapping_ready = true

-- ESM
esm_mapping_ready = true -- ESM도 매핑 필요
```

### 등록 관리 테이블
```sql
-- 다른 마켓들: 큐 방식으로 상태 업데이트
naver_register_management.status = 'pending' → 'success'/'fail'
coopang_register_management.status = 'pending' → 'success'/'fail'

-- ESM: 엑셀 생성 후 수동 처리
esm_register_management.status = 'pending' → 
```

## 6. 워크플로우 비교

### 일반 마켓 워크플로우
1. 상품 선택
2. 설정 입력
3. 등록 요청
4. 큐에 작업 추가
5. Worker가 자동 처리
6. 결과 확인

### ESM 워크플로우  
1. 상품 선택
2. 설정 입력
3. 등록 요청
4. **엑셀 파일 생성**
5. **사용자가 엑셀 다운로드**
6. **G마켓/옥션에 수동 업로드**

### COMMON 탭 혼합 워크플로우 (NEW)
1. 상품 선택
2. 여러 마켓 설정 입력 (네이버, 쿠팡, 11번가, ESM)
3. 등록 요청
4. **병렬 처리**:
   - 네이버/쿠팡/11번가: 큐에 작업 추가
   - ESM: 엑셀 파일 생성
5. **응답 제공**:
   - 큐 등록 결과 + ESM 엑셀 다운로드 URL
6. 사용자는 큐 처리 결과 확인 + ESM 엑셀 다운로드

## 7. 구현상의 차이점

### Queue Manager
```javascript
// 다른 마켓들
addNaverRegisterJob(userid, productid)
addCoopangRegisterJob(userid, productid)
addElevenstoreRegisterJob(userid, productid)

// ESM: 큐 사용 안 함
// 대신 createEsmExcel() 함수 사용
```

### Service Layer
```javascript
// 다른 마켓들: 큐에 작업 추가
if (marketType === 'naver') {
  await addNaverRegisterJob(userid, productId);
}

// ESM: 엑셀 생성
if (tabInfo === 'esm' && successCount > 0) {
  excelFile = await createEsmExcel(userid, successfulProductIds, settings);
}
```

## 8. 사용자 경험의 차이

### 다른 마켓들
- ✅ 자동화된 등록 과정
- ✅ 실시간 상태 확인 가능
- ❌ 개별 상품별 처리 시간 소요

### ESM  
- ✅ 대량 상품 일괄 처리 가능
- ✅ 엑셀로 데이터 검토 가능
- ❌ 수동 업로드 과정 필요
- ❌ 즉시 등록 불가

## 9. 파일 관리

### 다른 마켓들
- 별도 파일 생성 없음
- 모든 처리가 메모리/DB에서 진행

### ESM
- 임시 엑셀 파일 생성 (`temp/` 폴더)
- 파일 정리 작업 필요
- 다운로드 API 엔드포인트 필요

## 10. 확장성 고려사항

### 다른 마켓들
- Worker 스케일링으로 처리량 증대 가능
- Redis 클러스터링 지원

### ESM
- 엑셀 생성 시간이 상품 수에 비례
- 메모리 사용량 고려 필요
- 파일 저장소 용량 관리 필요

---

## 🔧 registeredManaging 모듈에서의 ESM 차이점

### 11. 가격 변경 불가

#### 다른 마켓들
```javascript
// 가격 변경 API 지원
POST /regmng/change-price
{
  "platform": "coopang", // naver, elevenstore도 가능
  "productIds": ["123", "456"],
  "discountPercent": 15
}
```

#### ESM
```javascript
// 가격 변경 API에서 완전 제외
POST /regmng/change-price
{
  "platform": "esm", // ❌ 400 오류 발생
  "productIds": ["123", "456"],
  "discountPercent": 15
}

// 응답: 400 Bad Request
{
  "success": false,
  "message": "플랫폼은 coopang, naver, 또는 elevenstore여야 합니다. ESM은 가격 변경을 지원하지 않습니다."
}
```

### 12. 삭제/내리기 시 API 호출 없음

#### 다른 마켓들
```javascript
// 1. DB에서 상태 변경
// 2. 외부 API 호출을 위한 큐 등록
// 3. Worker가 실제 마켓 API 호출

// 삭제 처리
await deleteSpecificTables(userid, productid);
await addToQueue(QUEUE_NAMES.MARKET_PRODUCT_REMOVAL_QUEUE, {
  userid, productid, platform: 'coopang', apiKeys
});
```

#### ESM
```javascript
// 1. DB에서 상태 변경만 수행
// 2. 외부 API 호출 없음 (큐 등록 스킵)

// ESM은 API 호출이 필요 없으므로 큐에 추가하지 않음
if (marketPlatform === 'esm') {
  continue; // 큐 등록 스킵
}

// 삭제 시 응답 메시지
"DB에서 삭제되었으며, 마켓 삭제 요청이 등록되었습니다. (ESM은 서버에서만 삭제됨)"
```

### 13. 등록 방식 차이로 인한 상품번호 관리

#### 다른 마켓들
```javascript
// 마켓에 자동 등록되어 실제 상품번호 획득
{
  "platforms": {
    "coopang": {
      "productNumber": "12345678",    // 쿠팡 API로 등록된 상품번호
      "currentMargin": 15.5
    },
    "naver": {
      "productNumber": "N987654321",  // 네이버 API로 등록된 상품번호
      "currentMargin": 12.3
    }
  }
}
```

#### ESM
```javascript
// ESM은 수동 등록이므로 엑셀 생성 시점에는 상품번호 없음
// 사용자가 G마켓/옥션에 업로드 후 수동으로 업데이트 필요
{
  "platforms": {
    "esm": {
      "productNumber": "ESM123456",   // 사용자가 수동 업데이트한 상품번호
      "currentMargin": 13.8
    }
  }
}
```

### 14. 트래킹에서 esmViews 처리

#### 개별 마켓 조회수
```javascript
// 기존 마켓별 조회수
{
  "couViews": 50,    // 쿠팡
  "navViews": 80,    // 네이버  
  "eleViews": 10,    // 11번가
  "acuViews": 5,     // 옥션
  "gmaViews": 5      // G마켓
}
```

#### ESM 합산 조회수
```javascript
// ESM 조회수 = G마켓 + 옥션 합계
const esmViews = (trackingItem.gma_views || 0) + (trackingItem.acu_views || 0);

// 응답에 esmViews 필드 추가
{
  "couViews": 50,
  "navViews": 80, 
  "eleViews": 10,
  "acuViews": 5,
  "gmaViews": 5,
  "esmViews": 10     // gma(5) + acu(5) = 10
}
```

### 15. 상품 조회 API 지원

#### 모든 플랫폼 지원
```javascript
// ESM도 다른 마켓과 동일하게 등록된 상품 조회 가능
GET /regmng/get-registering-info?platform=esm

// 응답 구조 동일 (productNumber는 수동 등록 후 업데이트된 값)
{
  "data": [
    {
      "productid": "123",
      "productName": "ESM 상품",
      "productNumber": "ESM123456",    // 수동 업데이트된 상품번호
      "status": "success",
      "currentMargin": 13.8
    }
  ]
}
```

### 16. makeRegisterable 처리

#### 모든 플랫폼 동일 처리
```sql
-- 모든 플랫폼에서 productNumber 컬럼을 NULL로 초기화
UPDATE coopang_register_management 
SET status = 'reuse', 
    registered_product_number = NULL,  -- 상품번호 초기화
    current_margin = NULL;

UPDATE esm_register_management 
SET status = 'reuse',
    productNumber = NULL,              -- ESM도 상품번호 초기화
    current_margin = NULL;
```

### 17. 에러 처리 패턴

#### 플랫폼 검증
```javascript
// 가격 변경에서 ESM 제외
const validPlatforms = ['coopang', 'naver', 'elevenstore']; // ESM 제외

// 상품 조회에서 ESM 포함  
const validPlatforms = ['coopang', 'naver', 'elevenstore', 'esm']; // ESM 포함
```

#### 조건부 처리
```javascript
// ESM 여부에 따른 분기 처리
if (platform === 'esm') {
  return { success: false, message: 'ESM은 가격 변경을 지원하지 않습니다.' };
}

// ESM 스킵 로직
if (marketPlatform === 'esm') {
  continue; // API 호출 관련 처리 스킵
}
```

이러한 차이점들로 인해 ESM은 다른 마켓들과는 별도의 처리 로직이 필요하며, 특히 **수동 처리**와 **API 호출 없음**이라는 핵심 특성을 모든 관련 모듈에서 일관되게 반영해야 합니다.

