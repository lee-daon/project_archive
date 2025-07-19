import httpClient from './httpClient';

// 환경 변수에서 API URL 가져오기
const MANAGER_ENDPOINT = `/order`;

/**
 * 주문 상품을 검색합니다
 * @param {string} searchTerm - 검색어 (상품명 또는 식별코드)
 * @returns {Promise} API 응답
 */
export const searchOrderProduct = async (searchTerm) => {
  try {
    const response = await httpClient.get(`${MANAGER_ENDPOINT}/search-product`, {
      params: {
        searchTerm: searchTerm
      }
    });
    return response.data;
  } catch (error) {
    console.error('주문 상품 검색 중 오류 발생:', error);
    throw error;
  }
};
