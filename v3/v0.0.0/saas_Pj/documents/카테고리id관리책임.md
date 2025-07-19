# 카테고리 ID 관리 정책

본 문서는 시스템 내에서 사용되는 다양한 종류의 카테고리 ID (`catid`)의 역할과 관리 규칙을 정의합니다.

## 카테고리 ID 종류

시스템은 세 가지 종류의 카테고리 ID를 사용합니다.

1.  **플랫폼 카테고리 ID (Platform `catid`)**
    *   **설명**: Taobao와 같은 외부 소싱 플랫폼에서 직접 제공하는 고유한 카테고리 식별자입니다.
    *   **형식**: 플랫폼에 따라 다릅니다 (숫자 또는 문자열).
    *   **생성 시점**: `taobaoworker`가 상품 상세 정보를 API로 조회할 때 획득합니다.
    *   **주요 특징**: 가장 정확한 표준 카테고리 정보입니다.

2.  **그룹 지정 임시 카테고리 ID (12자리)**
    *   **설명**: 여러 상품을 동일한 카테고리로 우선 지정하고 싶을 때 사용자가 요청하여 생성되는 임시 그룹 ID입니다.
    *   **형식**: 12자리 숫자로 구성된 문자열입니다.
    *   **생성 시점**: 상품 소싱 요청 시 `sameCategory: true` 파라미터를 포함하면 `detailparselist.js`에서 생성됩니다.
    *   **주요 특징**:
        *   사용자가 의도적으로 묶은 상품 그룹에 대한 임시 식별자 역할을 합니다.
        *   `copyExistingProductData` 실행 시, 이 ID는 다른 상품에 임의로 복사되지 않습니다. 만약 복사 대상 상품이 12자리 ID를 가지고 있고, 현재 상품이 특정 그룹에 속하지 않는다면, 새로운 15자리 임시 ID가 생성됩니다.
        *   최종적으로는 사용자가 직접 플랫폼 카테고리 ID로 매핑해야 합니다.

3.  **개별 임시 카테고리 ID (15자리)**
    *   **설명**: API 응답에 `cat_id`가 없거나, 기존 데이터를 재사용할 수 없을 때 각 상품에 대해 고유하게 생성되는 임시 식별자입니다.
    *   **형식**: 15자리 숫자로 구성된 문자열입니다.
    *   **생성 시점**:
        *   `saveProductDetail.js`: API 응답에 `cat_id`가 없을 때 생성됩니다.
        *   `copyExistingProductData.js`: 복사하려는 원본 데이터의 `catid`가 12자리 그룹 ID인데, 현재 상품은 그룹에 속하지 않을 경우 새로 생성됩니다.
    *   **주요 특징**:
        *   `products_detail` 테이블과 `categorymapping` 테이블 간의 관계를 유지하기 위한 필수적인 임시 키입니다.
        *   각 상품에 대해 고유하므로, 다른 상품과 절대 공유되지 않습니다.
        *   상품 삭제 시 함께 삭제될 수 있는 대상입니다.

## 삭제 정책과 `deleteBatchProductStatus`

`backend/modules/sourcing/repository/controlScrStatus.js`의 `deleteBatchProductStatus` 함수는 소싱 목록에서 상품을 삭제할 때 관련 데이터를 정리하는 역할을 합니다.

```javascript
// controlScrStatus.js 中
// ...
// 2. 삭제 대상 productid에 연결된 15자리 임시 catid 조회
const findTempCatIdsQuery = `
  SELECT catid FROM products_detail 
  WHERE userid = ? AND productid IN (${placeholders}) AND LENGTH(catid) = 15
`;
// ...
// 3. 15자리 임시 catid가 존재하면 categorymapping 테이블에서 삭제
if (tempCatIds.length > 0) {
  // ... DELETE FROM categorymapping ...
}
// ...
```

*   **현재 로직**: `sourcing_status` 테이블에서 상품을 삭제한 후, `products_detail` 테이블에서 해당 상품들의 `catid`를 조회합니다. 이때 **ID 길이가 15자리인 경우에만** 해당 `catid`를 `categorymapping` 테이블에서 삭제합니다.
*   **정책 해석**:
    *   **15자리 ID**: 특정 상품에만 귀속된 "일회용" 임시 ID이므로, 상품이 삭제되면 해당 카테고리 매핑 정보도 더 이상 필요 없으므로 함께 삭제됩니다.
    *   **12자리 ID 및 플랫폼 ID**: 이 ID들은 여러 상품에 의해 공유될 수 있는 "공용" ID입니다. 따라서 일부 상품이 삭제되더라도 다른 상품들이 여전히 해당 카테고리 ID를 사용하고 있을 수 있으므로, `categorymapping` 테이블에서 자동으로 삭제하지 않습니다. 이는 데이터의 무결성을 보호하기 위한 중요한 정책입니다.
