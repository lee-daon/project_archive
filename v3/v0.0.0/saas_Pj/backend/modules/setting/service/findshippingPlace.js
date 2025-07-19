import { createCoupangAuthHeaders } from '../../../common/utils/coopang_auth.js';
import { proxyGet } from '../../../common/utils/proxy.js';

/**
 * 출고지 목록 조회
 * @param {string} accessKey - 쿠팡 액세스 키
 * @param {string} secretKey - 쿠팡 시크릿 키
 * @param {number} pageNum - 페이지 번호 (기본값: 1)
 * @param {number} pageSize - 페이지 크기 (기본값: 20)
 * @returns {Promise} 출고지 목록 응답
 */
export const getOutboundShippingPlaces = async (accessKey, secretKey, pageNum = 1, pageSize = 20) => {
  try {
    const method = 'GET';
    const path = '/v2/providers/marketplace_openapi/apis/api/v1/vendor/shipping-place/outbound';
    const query = `pageSize=${pageSize}&pageNum=${pageNum}`;
    
    // 인증 헤더 생성
    const headers = createCoupangAuthHeaders(accessKey, secretKey, method, path, query);
    
    // 프록시를 통한 요청
    const url = `api-gateway.coupang.com${path}`;
    const params = { pageSize, pageNum };
    
    console.log(`출고지 조회 요청: ${url} (페이지: ${pageNum}, 크기: ${pageSize})`);
    const response = await proxyGet(url, params, headers);
    
    return {
      success: true,
      data: response.data,
      message: '출고지 목록 조회 성공'
    };
  } catch (error) {
    console.error('출고지 조회 실패:', error.message);
    return {
      success: false,
      error: error.message,
      data: null,
      message: '출고지 목록 조회 실패'
    };
  }
};

/**
 * 반품지 목록 조회
 * @param {string} accessKey - 쿠팡 액세스 키
 * @param {string} secretKey - 쿠팡 시크릿 키
 * @param {string} vendorId - 벤더 ID
 * @param {number} pageNum - 페이지 번호 (기본값: 1)
 * @param {number} pageSize - 페이지 크기 (기본값: 20)
 * @returns {Promise} 반품지 목록 응답
 */
export const getReturnShippingCenters = async (accessKey, secretKey, vendorId, pageNum = 1, pageSize = 20) => {
  try {
    if (!vendorId) {
      throw new Error('벤더 ID는 필수 매개변수입니다.');
    }

    const method = 'GET';
    const path = `/v2/providers/openapi/apis/api/v4/vendors/${vendorId}/returnShippingCenters`;
    const query = `pageNum=${pageNum}&pageSize=${pageSize}`;
    
    // 인증 헤더 생성
    const headers = createCoupangAuthHeaders(accessKey, secretKey, method, path, query);
    
    // 프록시를 통한 요청
    const url = `api-gateway.coupang.com${path}`;
    const params = { pageNum, pageSize };
    
    console.log(`반품지 조회 요청: ${url} (페이지: ${pageNum}, 크기: ${pageSize})`);
    const response = await proxyGet(url, params, headers);
    
    return {
      success: true,
      data: response.data,
      message: '반품지 목록 조회 성공'
    };
  } catch (error) {
    console.error('반품지 조회 실패:', error.message);
    return {
      success: false,
      error: error.message,
      data: null,
      message: '반품지 목록 조회 실패'
    };
  }
};

/**
 * 배송지 조회 통합 함수
 * @param {string} type - 조회 타입 ('outbound' 또는 'return')
 * @param {string} accessKey - 쿠팡 액세스 키
 * @param {string} secretKey - 쿠팡 시크릿 키
 * @param {object} options - 추가 옵션 { vendorId, pageNum, pageSize }
 * @returns {Promise} 배송지 목록 응답
 */
export const findShippingPlace = async (type, accessKey, secretKey, options = {}) => {
  try {
    const { vendorId, pageNum = 1, pageSize = 20 } = options;
    
    // 입력값 유효성 검증
    if (!type || !accessKey || !secretKey) {
      throw new Error('필수 매개변수가 누락되었습니다: type, accessKey, secretKey');
    }

    if (type === 'outbound') {
      return await getOutboundShippingPlaces(accessKey, secretKey, pageNum, pageSize);
    } else if (type === 'return') {
      if (!vendorId) {
        throw new Error('반품지 조회 시 vendorId는 필수입니다.');
      }
      return await getReturnShippingCenters(accessKey, secretKey, vendorId, pageNum, pageSize);
    } else {
      throw new Error('잘못된 타입입니다. "outbound" 또는 "return"을 사용하세요.');
    }
  } catch (error) {
    console.error('배송지 조회 실패:', error.message);
    return {
      success: false,
      error: error.message,
      data: null,
      message: '배송지 조회 실패'
    };
  }
};

/**
 * 사용 가능한 출고지만 필터링하여 조회
 * @param {string} accessKey - 쿠팡 액세스 키
 * @param {string} secretKey - 쿠팡 시크릿 키
 * @param {number} pageNum - 페이지 번호
 * @param {number} pageSize - 페이지 크기
 * @returns {Promise} 사용 가능한 출고지 목록
 */
export const getUsableOutboundShippingPlaces = async (accessKey, secretKey, pageNum = 1, pageSize = 20) => {
  try {
    const result = await getOutboundShippingPlaces(accessKey, secretKey, pageNum, pageSize);
    
    if (result.success && result.data?.content) {
      const usablePlaces = result.data.content.filter(place => place.usable === true);
      
      return {
        success: true,
        data: {
          ...result.data,
          content: usablePlaces,
          usableCount: usablePlaces.length
        },
        message: `사용 가능한 출고지 ${usablePlaces.length}개 조회 성공`
      };
    }
    
    return result;
  } catch (error) {
    console.error('사용 가능한 출고지 조회 실패:', error.message);
    return {
      success: false,
      error: error.message,
      data: null,
      message: '사용 가능한 출고지 조회 실패'
    };
  }
};

/**
 * 사용 가능한 반품지만 필터링하여 조회
 * @param {string} accessKey - 쿠팡 액세스 키
 * @param {string} secretKey - 쿠팡 시크릿 키
 * @param {string} vendorId - 벤더 ID
 * @param {number} pageNum - 페이지 번호
 * @param {number} pageSize - 페이지 크기
 * @returns {Promise} 사용 가능한 반품지 목록
 */
export const getUsableReturnShippingCenters = async (accessKey, secretKey, vendorId, pageNum = 1, pageSize = 20) => {
  try {
    const result = await getReturnShippingCenters(accessKey, secretKey, vendorId, pageNum, pageSize);
    
    if (result.success && result.data?.data?.content) {
      const usableCenters = result.data.data.content.filter(center => center.usable === true);
      
      return {
        success: true,
        data: {
          ...result.data,
          data: {
            ...result.data.data,
            content: usableCenters,
            usableCount: usableCenters.length
          }
        },
        message: `사용 가능한 반품지 ${usableCenters.length}개 조회 성공`
      };
    }
    
    return result;
  } catch (error) {
    console.error('사용 가능한 반품지 조회 실패:', error.message);
    return {
      success: false,
      error: error.message,
      data: null,
      message: '사용 가능한 반품지 조회 실패'
    };
  }
};
