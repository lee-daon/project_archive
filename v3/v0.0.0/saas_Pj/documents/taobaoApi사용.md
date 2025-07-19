# 타오바오 API 사용 위치 정리

## 현재 상태 (2025-01-03)
- **V2 API 활성화**: 새로운 `taobao-1688-api1.p.rapidapi.com` 엔드포인트 사용
- **V1 API 주석처리**: 기존 `taobao-advanced.p.rapidapi.com` 엔드포인트는 백업용으로 보존

## API 함수 위치

### 1. API 호출 함수
**파일**: `backend/common/utils/taobaoApi.js`
- ✅ `getProductDetail_V2()` - V2 API 상품 상세 정보 (현재 사용)
- 💤 `getProductDetail()` - V1 API 상품 상세 정보 (주석처리)
- ✅ `getShopItems()` - V1 API 상점 상품 목록 (여전히 사용 중)

### 2. 워커 (백그라운드 처리)
**파일**: `backend/worker/taobaodetail/taobaoworker.js`
- ✅ V2 API 사용: `getProductDetail_V2()`
- ✅ V2 저장: `saveProductDetail_v2()`
- 💤 V1 관련 코드 모두 주석처리

**파일**: `backend/worker/taobaodetail/db/saveProductDetail_v2.js`
- ✅ V2 API 응답 구조에 맞춘 DB 저장 로직

**파일**: `backend/worker/taobaodetail/db/saveProductDetail.js`
- 💤 V1 API용 저장 로직 (백업 보존)

### 3. 소싱 모듈 (URL 기반 상품 추가)
**파일**: `backend/modules/sourcing/service/UrlSourcing.js`
- ✅ V2 API 사용: `getProductDetail_V2()`
- 💤 V1 관련 코드 주석처리

**파일**: `backend/modules/sourcing/repository/saveProductDetailV2.js`
- ✅ 소싱 모듈용 V2 저장 함수

**파일**: `backend/modules/sourcing/repository/saveProductDetail.js`
- 💤 V1 API용 저장 로직 (백업 보존)

## API 응답 구조 차이

### V1 API 구조 (주석처리)
```javascript
{
  result: {
    item: {
      title: "상품명",
      images: ["이미지URL"],
      sku_base: [{ price: 100, promotion_price: 80 }],
      // ...
    },
    seller: { seller_id: "123", shop_id: "456" }
  }
}
```

### V2 API 구조 (현재 사용)
```javascript
{
  success: true,
  data: {
    title: "상품명",
    medias: [{ link: "이미지URL", isVideo: false }],
    skuInfos: [{ price: 100, promotionPrice: 80 }],
    sellerId: "123",
    shopUrl: "https://shop456.taobao.com"
    // ...
  }
}
```

## 주요 변경사항
1. **이미지 처리**: `images[]` → `medias[]` (비디오/이미지 구분)
2. **SKU 정보**: `sku_base[]` → `skuInfos[]`
3. **판매자 정보**: `seller.seller_id` → `sellerId`
4. **상점 정보**: `seller.shop_id` → shopUrl에서 추출
5. **prop_path 형식**: 쉼표(,) → 세미콜론(;)으로 변환

## 향후 계획
- [ ] V1 API 완전 제거 (안정화 후)
- [ ] `getShopItems()` 함수도 V2로 마이그레이션 검토
- [ ] API 에러 처리 개선
