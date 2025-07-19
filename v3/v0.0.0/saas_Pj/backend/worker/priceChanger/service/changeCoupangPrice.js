import { proxyPut, proxyGet } from '../../../common/utils/proxy.js';
import { createCoupangAuthHeaders } from '../../../common/utils/coopang_auth.js';


/**
 * 쿠팡 상품 조회 - vendorItemId와 salePrice 세트 배열 반환
 * @param {string} accessKey - 쿠팡 액세스 키
 * @param {string} secretKey - 쿠팡 시크릿 키
 * @param {number} sellerProductId - 등록상품ID
 * @returns {Promise<object>} vendorItemId와 salePrice 세트 배열
 */
const getVendorItemPrices = async (accessKey, secretKey, sellerProductId) => {
  try {
    // 입력값 검증
    if (!accessKey || typeof accessKey !== 'string') {
      throw new Error('유효한 액세스 키가 필요합니다.');
    }

    if (!secretKey || typeof secretKey !== 'string') {
      throw new Error('유효한 시크릿 키가 필요합니다.');
    }

    if (!sellerProductId || !Number.isInteger(Number(sellerProductId))) {
      throw new Error('유효한 등록상품ID(숫자)가 필요합니다.');
    }

    const method = 'GET';
    const path = `/v2/providers/seller_api/apis/api/v1/marketplace/seller-products/${sellerProductId}`;
    const query = '';
    
    // 인증 헤더 생성
    const headers = createCoupangAuthHeaders(accessKey, secretKey, method, path, query);
    
    // 프록시를 통한 GET 요청
    const url = `api-gateway.coupang.com${path}`;
    
    console.log(`쿠팡 상품 가격 정보 조회 요청: ${url}`);
    const response = await proxyGet(url, {}, headers);
    
    // 성공 응답 처리
    if (response.data && response.data.code === 'SUCCESS') {
      const productData = response.data.data;
      
      // vendorItemId와 salePrice 세트 배열 추출
      const itemPrices = [];
      if (productData.items && Array.isArray(productData.items)) {
        for (const item of productData.items) {
          if (item.vendorItemId && item.salePrice !== undefined) {
            itemPrices.push({
              vendorItemId: item.vendorItemId,
              salePrice: item.salePrice,
              itemName: item.itemName || '',
              originalPrice: item.originalPrice || 0
            });
          }
        }
      }
      
      return {
        success: true,
        itemPrices: itemPrices,
        productInfo: {
          sellerProductId: productData.sellerProductId,
          sellerProductName: productData.sellerProductName,
          statusName: productData.statusName,
          itemCount: itemPrices.length
        },
        message: '상품 가격 정보 조회 성공'
      };
    }
    
    // 실패 응답 처리
    return {
      success: false,
      itemPrices: [],
      error: response.data?.message || '알 수 없는 오류가 발생했습니다.',
      message: '상품 가격 정보 조회 실패',
      productId: sellerProductId
    };
    
  } catch (error) {
    console.error('상품 가격 정보 조회 실패:', error.message);
    
    // 쿠팡 API 에러 메시지 파싱
    let errorMessage = error.message;
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    }
    
    return {
      success: false,
      itemPrices: [],
      error: errorMessage,
      message: '상품 가격 정보 조회 실패',
      productId: sellerProductId
    };
  }
};


/**
 * 개별 옵션 가격 변경
 * @param {string} accessKey - 쿠팡 액세스 키
 * @param {string} secretKey - 쿠팡 시크릿 키
 * @param {number} vendorItemId - 옵션ID
 * @param {number} newPrice - 새로운 가격
 * @returns {Promise<object>} 가격 변경 결과
 */
const changeItemPrice = async (accessKey, secretKey, vendorItemId, newPrice) => {
  try {
    // 입력값 검증
    if (!accessKey || typeof accessKey !== 'string') {
      throw new Error('유효한 액세스 키가 필요합니다.');
    }

    if (!secretKey || typeof secretKey !== 'string') {
      throw new Error('유효한 시크릿 키가 필요합니다.');
    }

    if (!vendorItemId || !Number.isInteger(Number(vendorItemId))) {
      throw new Error('유효한 옵션ID(숫자)가 필요합니다.');
    }

    if (!newPrice || !Number.isInteger(Number(newPrice)) || newPrice < 10) {
      throw new Error('유효한 가격(10원 이상)이 필요합니다.');
    }

    // 10원 단위로 조정
    const adjustedPrice = Math.round(newPrice / 10) * 10;

    const method = 'PUT';
    const path = `/v2/providers/seller_api/apis/api/v1/marketplace/vendor-items/${vendorItemId}/prices/${adjustedPrice}`;
    const query = 'forceSalePriceUpdate=true';
    
    // 인증 헤더 생성
    const headers = createCoupangAuthHeaders(accessKey, secretKey, method, path, query);
    
    // 쿼리 파라미터를 포함한 URL 구성
    const url = `api-gateway.coupang.com${path}?${query}`;
    
    console.log(`쿠팡 옵션 가격 변경 요청: ${url}`);
    const response = await proxyPut(url, {}, headers);
    
    // 성공 응답 처리
    if (response.data && response.data.code === 'SUCCESS') {
      return {
        success: true,
        message: response.data.message || '가격 변경을 완료했습니다.',
        vendorItemId: vendorItemId,
        newPrice: adjustedPrice,
        originalPrice: newPrice
      };
    }
    
    // 실패 응답 처리
    return {
      success: false,
      error: response.data?.message || '알 수 없는 오류가 발생했습니다.',
      message: '가격 변경 실패',
      vendorItemId: vendorItemId,
      newPrice: adjustedPrice
    };
    
  } catch (error) {
    console.error('가격 변경 실패:', error.message);
    
    // 쿠팡 API 에러 메시지 파싱
    let errorMessage = error.message;
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    }
    
    return {
      success: false,
      error: errorMessage,
      message: '가격 변경 실패',
      vendorItemId: vendorItemId,
      newPrice: newPrice
    };
  }
};

/**
 * 상품의 모든 옵션 가격을 할인율 적용하여 변경
 * @param {string} accessKey - 쿠팡 액세스 키
 * @param {string} secretKey - 쿠팡 시크릿 키
 * @param {number} sellerProductId - 등록상품ID
 * @param {number} discountPercent - 할인 퍼센트 (정수, 예: 10 = 10% 할인)
 * @returns {Promise<object>} 전체 가격 변경 결과
 */
const changeCoupangPrice = async (accessKey, secretKey, sellerProductId, discountPercent) => {
  try {
    // 입력값 검증
    if (!accessKey || typeof accessKey !== 'string') {
      throw new Error('유효한 액세스 키가 필요합니다.');
    }

    if (!secretKey || typeof secretKey !== 'string') {
      throw new Error('유효한 시크릿 키가 필요합니다.');
    }

    if (!sellerProductId || !Number.isInteger(Number(sellerProductId))) {
      throw new Error('유효한 등록상품ID(숫자)가 필요합니다.');
    }

    if (discountPercent === undefined || !Number.isInteger(Number(discountPercent))) {
      throw new Error('유효한 할인 퍼센트(정수)가 필요합니다.');
    }

    // 할인율 범위 검증 (0~99%)
    const discount = Number(discountPercent);
    if (discount < 0 || discount >= 100) {
      throw new Error('할인 퍼센트는 0~99 사이의 값이어야 합니다.');
    }

    console.log(`상품 가격 변경 프로세스 시작 - 상품ID: ${sellerProductId}, 할인율: ${discount}%`);

    // 1단계: 현재 가격 정보 조회
    console.log('1단계: 현재 가격 정보 조회 중...');
    const priceResult = await getVendorItemPrices(accessKey, secretKey, sellerProductId);
    
    if (!priceResult.success) {
      return {
        success: false,
        error: `가격 정보 조회 실패: ${priceResult.error}`,
        message: '상품 가격 변경 실패',
        productId: sellerProductId,
        step: '가격_정보_조회'
      };
    }

    const itemPrices = priceResult.itemPrices;
    console.log(`조회된 옵션 수: ${itemPrices.length}`);

    if (itemPrices.length === 0) {
      return {
        success: false,
        error: '변경할 수 있는 옵션이 없습니다. (vendorItemId가 없거나 임시저장 상태)',
        message: '상품 가격 변경 실패',
        productId: sellerProductId,
        step: '옵션_확인'
      };
    }

    // 2단계: 할인된 가격 계산 및 변경
    console.log('2단계: 각 옵션 가격 변경 중...');
    const changeResults = [];
    
    for (const item of itemPrices) {
      // 할인된 가격 계산 (할인율 적용)
      const discountedPrice = Math.round(item.salePrice * (100 - discount) / 100);
      
      // 최소 가격 검증 (10원 이상)
      const finalPrice = Math.max(discountedPrice, 10);
      
      console.log(`옵션 ${item.vendorItemId}: ${item.salePrice}원 → ${finalPrice}원 (${discount}% 할인)`);
      
      const changeResult = await changeItemPrice(accessKey, secretKey, item.vendorItemId, finalPrice);
      changeResults.push({
        vendorItemId: item.vendorItemId,
        newPrice: changeResult.success ? changeResult.newPrice : finalPrice,
        originalSalePrice: item.salePrice,
        originalPrice: item.originalPrice,
        discountPercent: discount,
        success: changeResult.success
      });
      
      if (!changeResult.success) {
        console.error(`옵션 ${item.vendorItemId} 가격 변경 실패:`, changeResult.error);
      } else {
        console.log(`옵션 ${item.vendorItemId} 가격 변경 성공`);
      }
      
      // API 레이트 리밋은 상위 컨트롤러에서 관리
    }
    
    // 결과 분석
    const successfulChanges = changeResults.filter(result => result.success);
    const failedChanges = changeResults.filter(result => !result.success);
    
    console.log(`가격 변경 완료 - 성공: ${successfulChanges.length}, 실패: ${failedChanges.length}`);
    
    return {
      success: failedChanges.length === 0,
      message: failedChanges.length === 0 
        ? `모든 옵션 가격 변경 완료 (${successfulChanges.length}개)`
        : `일부 옵션 가격 변경 실패 (성공: ${successfulChanges.length}, 실패: ${failedChanges.length})`,
      productId: sellerProductId,
      discountPercent: discount,
      totalItems: itemPrices.length,
      successCount: successfulChanges.length,
      failCount: failedChanges.length,
      results: changeResults,
      successfulChanges: successfulChanges,
      failedChanges: failedChanges,
      step: '완료'
    };
    
  } catch (error) {
    console.error('상품 가격 변경 프로세스 실패:', error.message);
    
    return {
      success: false,
      error: error.message,
      message: '상품 가격 변경 프로세스 실패',
      productId: sellerProductId,
      discountPercent: discountPercent,
      step: '에러'
    };
  }
};


// Export
export { changeCoupangPrice };

/**
 * ==========================================
 * 응답 형식 (Response Format)
 * ==========================================
 * 
 * changePrice() 성공 응답:
 * {
 *   success: true,                                    // 전체 성공 여부
 *   message: "모든 옵션 가격 변경 완료 (2개)",          // 결과 메시지
 *   productId: 15607431994,                           // 상품 ID
 *   discountPercent: 20,                              // 적용된 할인율
 *   totalItems: 2,                                    // 전체 옵션 수
 *   successCount: 2,                                  // 성공한 옵션 수
 *   failCount: 0,                                     // 실패한 옵션 수
 *   results: [
 *     {
 *       vendorItemId: 4279191312,                     // 옵션 ID
 *       newPrice: 1024770,                            // 새로운 옵션 가격
 *       originalSalePrice: 1280960,                   // 기존 가격
 *       originalPrice: 0,                             // 기존 원가격
 *       discountPercent: 20,                          // 최종 할인률
 *       success: true                                 // 해당 옵션 성공 여부
 *     }
 *   ],
 *   successfulChanges: [...],                         // 성공한 변경 목록
 *   failedChanges: [],                                // 실패한 변경 목록
 *   step: "완료"                                      // 진행 단계
 * }
 * 
 * changePrice() 실패 응답:
 * {
 *   success: false,                                     // 전체 성공 여부
 *   error: "가격 정보 조회 실패: 상품(123456789)의 데이터가 없습니다.",  // 에러 메시지
 *   message: "상품 가격 변경 실패",                       // 결과 메시지
 *   productId: 123456789,                               // 상품 ID
 *   discountPercent: 20,                                // 적용하려던 할인율
 *   step: "가격_정보_조회"                               // 실패한 단계
 * }
 * 
 */
