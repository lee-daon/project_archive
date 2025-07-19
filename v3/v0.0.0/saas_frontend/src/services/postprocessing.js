import httpClient from './httpClient';

// 환경 변수에서 API URL 가져오기
const POSTPROCESSING_ENDPOINT = `/postprc`;

/**
 * 상품의 처리 상태 정보와 통계를 조회합니다
 * @param {Object} params - 요청 파라미터 (order, limit, status)
 * @returns {Promise} API 응답
 */
export const getProcessingInfo = async (params = {}) => {
  try {
    // 요청 파라미터 복사
    const requestParams = { ...params };
    
    
    // 'all' 상태인 경우 status 파라미터 제거
    if (requestParams.status === 'all') {
      delete requestParams.status;
    }
    
    const response = await httpClient.get(`${POSTPROCESSING_ENDPOINT}/getprocessinginfo`, { params: requestParams });
    
    return response.data;
  } catch (error) {
    console.error('상품 처리 상태 정보 조회 중 오류 발생:', error);
    throw error;
  }
};

/**
 * 선택한 상품들을 승인합니다
 * @param {Array} productids - 승인할 상품 ID 배열
 * @param {string} memo - 승인 관련 메모 (선택 사항)
 * @param {string} commitcode - 승인할 상품군 관리 코드 (선택 사항)
 * @returns {Promise} API 응답
 */
export const approveProducts = async (productids, memo = '', commitcode = '') => {
  try {
    const response = await httpClient.post(`${POSTPROCESSING_ENDPOINT}/approve`, {
      productids,
      memo,
      commitcode
    });
    return response.data;
  } catch (error) {
    console.error('상품 승인 중 오류 발생:', error);
    throw error;
  }
};

/**
 * 선택한 상품들을 폐기합니다
 * @param {Array} productids - 폐기할 상품 ID 배열
 * @returns {Promise} API 응답
 */
export const discardProducts = async (productids) => {
  try {
    const response = await httpClient.post(`${POSTPROCESSING_ENDPOINT}/discard`, {
      productids
    });
    return response.data;
  } catch (error) {
    console.error('상품 폐기 중 오류 발생:', error);
    throw error;
  }
};

/**
 * 카테고리 매핑이 필요한 상품들과 카테고리 정보를 조회합니다
 * @param {Object} params - 페이지네이션 파라미터 { page, limit }
 * @returns {Promise} API 응답
 */
export const getCategoryMappingInfo = async (params = {}) => {
  try {
    const response = await httpClient.get(`${POSTPROCESSING_ENDPOINT}/categorymapping`, { params });
    return response.data;
  } catch (error) {
    console.error('카테고리 매핑 정보 조회 중 오류 발생:', error);
    throw error;
  }
};

/**
 * 카테고리 매핑을 업데이트합니다
 * @param {Array} mappings - 카테고리 매핑 정보 배열
 * @returns {Promise} API 응답
 */
export const updateCategoryMapping = async (mappings) => {
  try {
    const response = await httpClient.post(`${POSTPROCESSING_ENDPOINT}/categorymapping/update`, {
      mappings
    });
    return response.data;
  } catch (error) {
    console.error('카테고리 매핑 업데이트 중 오류 발생:', error);
    throw error;
  }
};

/**
 * 특정 카테고리의 상품 샘플들을 조회합니다
 * @param {string} catid - 카테고리 ID
 * @param {number} limit - 조회할 상품 수 (기본값: 3)
 * @returns {Promise} API 응답
 */
export const getCategoryProductSamples = async (catid, limit = 3) => {
  try {
    const response = await httpClient.get(`${POSTPROCESSING_ENDPOINT}/categorymapping/samples`, {
      params: { catid, limit }
    });
    return response.data;
  } catch (error) {
    console.error('카테고리 상품 샘플 조회 중 오류 발생:', error);
    throw error;
  }
};

/**
 * 쿠팡 카테고리 추천을 요청합니다
 * @param {string} productName - 상품명
 * @returns {Promise} API 응답
 */
export const getCoopangCategorySuggestion = async (productName) => {
  try {
    const response = await httpClient.post(`${POSTPROCESSING_ENDPOINT}/coopang-suggestion`, {
      productName
    });
    return response.data;
  } catch (error) {
    console.error('쿠팡 카테고리 추천 조회 중 오류 발생:', error);
    throw error;
  }
};

/**
 * 매핑 완료된 카테고리 정보를 조회합니다
 * @param {Object} params - 페이지네이션 파라미터 { page, limit }
 * @returns {Promise} API 응답
 */
export const getCompletedCategoryMappingInfo = async (params = {}) => {
  try {
    const response = await httpClient.get(`${POSTPROCESSING_ENDPOINT}/categorymapping/completed`, { params });
    return response.data;
  } catch (error) {
    console.error('매핑 완료된 카테고리 정보 조회 중 오류 발생:', error);
    throw error;
  }
};


