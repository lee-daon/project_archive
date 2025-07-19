import httpClient from './httpClient';

const INSPECTION_ENDPOINT = '/postprc';

/**
 * 상품검수 목록을 조회합니다
 * @param {Object} params - 요청 파라미터
 * @returns {Promise} API 응답
 */
export const getInspectionProducts = async (params = {}) => {
  try {
    const response = await httpClient.get(`${INSPECTION_ENDPOINT}/getproducts`, { params });
    return response.data;
  } catch (error) {
    console.error('상품검수 목록 조회 중 오류 발생:', error);
    throw error;
  }
};

/**
 * 특정 상품의 상세 정보를 조회합니다
 * @param {number} productId - 상품 ID
 * @returns {Promise} API 응답
 */
export const getProductDetail = async (productId) => {
  try {
    const response = await httpClient.get(`${INSPECTION_ENDPOINT}/getproducts/${productId}`);
    return response.data;
  } catch (error) {
    console.error('상품 상세 정보 조회 중 오류 발생:', error);
    throw error;
  }
};

/**
 * 상품 정보를 수정합니다
 * @param {Object} updateData - 수정할 데이터
 * @returns {Promise} API 응답
 */
export const updateProductInfo = async (updateData) => {
  try {
    const response = await httpClient.put(`${INSPECTION_ENDPOINT}/putproduct/${updateData.productid}`, updateData);
    return response.data;
  } catch (error) {
    console.error('상품 정보 수정 중 오류 발생:', error);
    throw error;
  }
};

/**
 * 마켓 등록용 JSON 데이터를 생성합니다
 * @param {Object} data - 상품 ID 배열 등 데이터
 * @returns {Promise} API 응답
 */
export const generateRegisterData = async (data) => {
  try {
    const response = await httpClient.post(`${INSPECTION_ENDPOINT}/generate-register-data`, data);
    return response.data;
  } catch (error) {
    console.error('마켓 등록 데이터 생성 중 오류 발생:', error);
    throw error;
  }
}; 