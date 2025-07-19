import { proxyDelete, proxyPut, proxyGet } from '../../../common/utils/proxy.js';
import { createCoupangAuthHeaders } from '../../../common/utils/coopang_auth.js';



/**
 * 쿠팡 상품 조회 - vendorItemId 배열 반환
 * @param {string} accessKey - 쿠팡 액세스 키
 * @param {string} secretKey - 쿠팡 시크릿 키
 * @param {number} sellerProductId - 등록상품ID
 * @returns {Promise<object>} vendorItemId 배열과 상품 정보
 */
const getVendorId = async (accessKey, secretKey, sellerProductId) => {
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
    
    console.log(`쿠팡 상품 조회 요청: ${url}`);
    const response = await proxyGet(url, {}, headers);
    
    // 성공 응답 처리
    if (response.data && response.data.code === 'SUCCESS') {
      const productData = response.data.data;
      
      // vendorItemId 배열 추출
      const vendorItemIds = [];
      if (productData.items && Array.isArray(productData.items)) {
        for (const item of productData.items) {
          if (item.vendorItemId) {
            vendorItemIds.push(item.vendorItemId);
          }
        }
      }
      
      return {
        success: true,
        vendorItemIds: vendorItemIds,
        productInfo: {
          sellerProductId: productData.sellerProductId,
          sellerProductName: productData.sellerProductName,
          statusName: productData.statusName,
          brand: productData.brand,
          generalProductName: productData.generalProductName,
          itemCount: productData.items ? productData.items.length : 0
        },
        message: '상품 조회 성공'
      };
    }
    
    // 실패 응답 처리
    return {
      success: false,
      vendorItemIds: [],
      error: response.data?.message || '알 수 없는 오류가 발생했습니다.',
      message: '상품 조회 실패',
      productId: sellerProductId
    };
    
  } catch (error) {
    console.error('상품 조회 실패:', error.message);
    
    // 쿠팡 API 에러 메시지 파싱
    let errorMessage = error.message;
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    }
    
    return {
      success: false,
      vendorItemIds: [],
      error: errorMessage,
      message: '상품 조회 실패',
      productId: sellerProductId
    };
  }
};


/**
 * 상품 아이템별 판매 중지 (내부 함수)
 * @param {string} accessKey - 쿠팡 액세스 키
 * @param {string} secretKey - 쿠팡 시크릿 키
 * @param {number} vendorItemId - 옵션ID
 * @returns {Promise<object>} 판매중지 결과
 */
const stopItemSales = async (accessKey, secretKey, vendorItemId) => {
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

    const method = 'PUT';
    const path = `/v2/providers/seller_api/apis/api/v1/marketplace/vendor-items/${vendorItemId}/sales/stop`;
    const query = '';
    
    // 인증 헤더 생성
    const headers = createCoupangAuthHeaders(accessKey, secretKey, method, path, query);
    
    // 프록시를 통한 PUT 요청 (body 없음)
    const url = `api-gateway.coupang.com${path}`;
    
    console.log(`쿠팡 옵션 판매중지 요청: ${url}`);
    const response = await proxyPut(url, {}, headers);
    
    // 성공 응답 처리
    if (response.data && response.data.code === 'SUCCESS') {
      return {
        success: true,
        message: response.data.message || '판매 중지 처리되었습니다.',
        vendorItemId: vendorItemId
      };
    }
    
    // 실패 응답 처리
    return {
      success: false,
      error: response.data?.message || '알 수 없는 오류가 발생했습니다.',
      message: '판매중지 실패',
      vendorItemId: vendorItemId
    };
    
  } catch (error) {
    console.error('판매중지 실패:', error.message);
    
    // 쿠팡 API 에러 메시지 파싱
    let errorMessage = error.message;
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    }
    
    return {
      success: false,
      error: errorMessage,
      message: '판매중지 실패',
      vendorItemId: vendorItemId
    };
  }
};

/**
 * 모든 옵션 판매중지 후 상품 삭제
 * @param {string} accessKey - 쿠팡 액세스 키
 * @param {string} secretKey - 쿠팡 시크릿 키
 * @param {number} sellerProductId - 등록상품ID
 * @returns {Promise<object>} 삭제 결과
 */
const deleteCoopangProduct = async (accessKey, secretKey, sellerProductId) => {
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

    console.log(`상품 삭제 프로세스 시작 - 상품ID: ${sellerProductId}`);

    // 1단계: vendorItemId 배열 조회
    console.log('1단계: vendorItemId 배열 조회 중...');
    const vendorResult = await getVendorId(accessKey, secretKey, sellerProductId);
    
    if (!vendorResult.success) {
      return {
        success: false,
        error: `vendorItemId 조회 실패: ${vendorResult.error}`,
        message: '상품 삭제 실패',
        productId: sellerProductId,
        step: 'vendorId_조회'
      };
    }

    const vendorItemIds = vendorResult.vendorItemIds;
    console.log(`조회된 vendorItemIds: [${vendorItemIds.join(', ')}]`);

    // vendorItemId가 없는 경우 (임시저장 상태 등)
    if (vendorItemIds.length === 0) {
      console.log('vendorItemId가 없음 - 바로 상품 삭제 진행');
    } else {
      // 2단계: 모든 옵션 판매중지
      console.log('2단계: 모든 옵션 판매중지 중...');
      const stopResults = [];
      
      for (const vendorItemId of vendorItemIds) {
        const stopResult = await stopItemSales(accessKey, secretKey, vendorItemId);
        stopResults.push(stopResult);
        
        if (!stopResult.success) {
          console.error(`옵션 ${vendorItemId} 판매중지 실패:`, stopResult.error);
        } else {
          console.log(`옵션 ${vendorItemId} 판매중지 성공`);
        }
        
        // API 레이트 리밋은 상위 컨트롤러에서 관리
      }
      await new Promise(resolve => setTimeout(resolve, 3000));

      // 판매중지 실패한 옵션 확인
      const failedStops = stopResults.filter(result => !result.success);
      if (failedStops.length > 0) {
        return {
          success: false,
          error: `${failedStops.length}개 옵션 판매중지 실패`,
          message: '상품 삭제 실패',
          productId: sellerProductId,
          step: '옵션_판매중지',
          stopResults: stopResults,
          failedStops: failedStops
        };
      }
      
      console.log('모든 옵션 판매중지 완료');
    }

    // 3단계: 상품 삭제
    console.log('3단계: 상품 삭제 중...');
    const method = 'DELETE';
    const path = `/v2/providers/seller_api/apis/api/v1/marketplace/seller-products/${sellerProductId}`;
    const query = '';
    
    // 인증 헤더 생성
    const headers = createCoupangAuthHeaders(accessKey, secretKey, method, path, query);
    
    // 프록시를 통한 DELETE 요청
    const url = `api-gateway.coupang.com${path}`;
    
    console.log(`쿠팡 상품 삭제 요청: ${url}`);
    const response = await proxyDelete(url, headers);
    
    // 성공 응답 처리
    if (response.data && response.data.code === 'SUCCESS') {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || '삭제되었습니다.',
        productId: sellerProductId,
        processedVendorItemIds: vendorItemIds,
        step: '완료'
      };
    }
    
    // 실패 응답 처리
    return {
      success: false,
      error: response.data?.message || '알 수 없는 오류가 발생했습니다.',
      message: '상품 삭제 실패',
      productId: sellerProductId,
      processedVendorItemIds: vendorItemIds,
      step: '상품_삭제'
    };
    
  } catch (error) {
    console.error('상품 삭제 프로세스 실패:', error.message);
    
    // 쿠팡 API 에러 메시지 파싱
    let errorMessage = error.message;
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    }
    
    return {
      success: false,
      error: errorMessage,
      message: '상품 삭제 프로세스 실패',
      productId: sellerProductId,
      step: '에러'
    };
  }
};



// Export
export { deleteCoopangProduct};

/**
 * ==========================================
 * 응답 형식 (Response Format)
 * ==========================================
 * 
 * deleteProduct() 성공 응답:
 * {
 *   success: true,
 *   data: "10***16568",
 *   message: "삭제되었습니다.",
 *   productId: 15607431994,
 *   processedVendorItemIds: [4279191312, 4279191317],
 *   step: "완료"
 * }
 * 
 * deleteProduct() 실패 응답 (vendorId 조회 실패):
 * {
 *   success: false,
 *   error: "vendorItemId 조회 실패: 상품(123456789)의 데이터가 없습니다.",
 *   message: "상품 삭제 실패",
 *   productId: 123456789,
 *   step: "vendorId_조회"
 * }
 * 
 * deleteProduct() 실패 응답 (옵션 판매중지 실패):
 * {
 *   success: false,
 *   error: "2개 옵션 판매중지 실패",
 *   message: "상품 삭제 실패",
 *   productId: 15607431994,
 *   step: "옵션_판매중지",
 *   stopResults: [
 *     {
 *       success: false,
 *       error: "판매중지에 실패했습니다. [옵션ID[5469***088] : 삭제된 상품은 변경이 불가능합니다.]",
 *       message: "판매중지 실패",
 *       vendorItemId: 5469088
 *     }
 *   ],
 *   failedStops: [...]
 * }
 * 
 * deleteProduct() 실패 응답 (상품 삭제 실패):
 * {
 *   success: false,
 *   error: "업체상품[103***11234]이 없거나 삭제가 불가능한 상태입니다. 삭제는 '저장중', '임시저장' 상태에서만 가능합니다.",
 *   message: "상품 삭제 실패",
 *   productId: 15607431994,
 *   processedVendorItemIds: [4279191312, 4279191317],
 *   step: "상품_삭제"
 * }
 * 
 */
