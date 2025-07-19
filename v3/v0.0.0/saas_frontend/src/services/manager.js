import httpClient from './httpClient.js';

// 환경 변수에서 API URL 가져오기
const REGISTER_ENDPOINT = `/regmng`;

/**
 * 등록된 상품 목록을 조회합니다
 * @param {Object} params - 조회 파라미터
 * @param {string} params.platform - 플랫폼 (coopang, naver, elevenstore)
 * @param {number} params.page - 페이지 번호
 * @param {number} params.pageSize - 페이지 크기
 * @param {string} params.sortOrder - 정렬 순서 (asc, desc)
 * @param {string} params.groupCode - 상품 그룹 코드
 * @param {string} params.productName - 상품명 검색어
 * @param {number} params.marketNumber - 마켓 번호
 * @returns {Promise} API 응답
 */
export const getRegisteringInfo = async (params) => {
  try {
    const response = await httpClient.get(`${REGISTER_ENDPOINT}/get-registering-info`, {
      params: params
    });
    return response.data;
  } catch (error) {
    console.error('등록 상품 조회 중 오류 발생:', error);
    throw error;
  }
};

/**
 * 선택된 상품들을 마켓에서 내립니다
 * @param {Object} data - 요청 데이터
 * @param {string} data.platform - 플랫폼
 * @param {Array} data.products - 상품 정보 배열 [{productid: string, productNumber: string}, ...]
 * @returns {Promise} API 응답
 */
export const removeFromMarket = async (data) => {
  try {
    const response = await httpClient.post(`${REGISTER_ENDPOINT}/remove-from-market`, data);
    return response.data;
  } catch (error) {
    console.error('마켓에서 상품 내리기 중 오류 발생:', error);
    throw error;
  }
};

/**
 * 선택된 상품들을 영구 삭제합니다
 * @param {Object} data - 요청 데이터
 * @param {string} data.platform - 플랫폼
 * @param {Array} data.products - 상품 정보 배열 [{productid: string, productNumber: string}, ...]
 * @returns {Promise} API 응답
 */
export const deleteProductsPermanently = async (data) => {
  try {
    const response = await httpClient.delete(`${REGISTER_ENDPOINT}/delete-products`, { data });
    return response.data;
  } catch (error) {
    console.error('상품 영구 삭제 중 오류 발생:', error);
    throw error;
  }
};

/**
 * 상품 조회수 통계를 가져옵니다
 * @param {Object} params - 조회 파라미터
 * @param {string} params.productId - 특정 상품 ID로 필터링
 * @param {string} params.groupId - 특정 그룹 ID로 필터링
 * @param {number} params.days - 검색에 포함할 과거 일수 (최대 365)
 * @param {string} params.market - 정렬 기준 마켓 (cou, nav, ele, acu, gma, total)
 * @param {number} params.minViews - 최소 조회수 필터
 * @param {number} params.maxViews - 최대 조회수 필터
 * @param {string} params.sortOrder - 정렬 순서 (asc, desc)
 * @returns {Promise} API 응답
 */
export const getTrackingStats = async (params) => {
  try {
    const response = await httpClient.get(`${REGISTER_ENDPOINT}/get-tracking-stats`, {
      params: params
    });
    return response.data;
  } catch (error) {
    console.error('트래킹 통계 조회 중 오류 발생:', error);
    throw error;
  }
};

/**
 * 특정 상품의 날짜별 상세 조회수 데이터를 가져옵니다
 * @param {Object} params - 조회 파라미터
 * @param {string} params.productId - 조회할 상품 ID (필수)
 * @param {number} params.days - 검색에 포함할 과거 일수 (최대 365)
 * @returns {Promise} API 응답
 */
export const getTrackingDetails = async (params) => {
  try {
    const response = await httpClient.get(`${REGISTER_ENDPOINT}/get-tracking-details`, {
      params: params
    });
    return response.data;
  } catch (error) {
    console.error('트래킹 상세 조회 중 오류 발생:', error);
    throw error;
  }
};

/**
 * 선택된 상품들의 가격을 변경합니다
 * @param {Object} data - 요청 데이터
 * @param {Array} data.productIds - 상품 ID 배열
 * @param {string} data.platform - 플랫폼
 * @param {number} data.discountPercent - 할인율
 * @returns {Promise} API 응답
 */
export const changePrice = async (data) => {
  try {
    const response = await httpClient.post(`${REGISTER_ENDPOINT}/change-price`, data);
    return response.data;
  } catch (error) {
    console.error('상품 가격 변경 중 오류 발생:', error);
    throw error;
  }
};
