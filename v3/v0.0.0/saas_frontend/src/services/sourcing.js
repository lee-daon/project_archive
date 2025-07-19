import httpClient from './httpClient';

// 환경 변수에서 API URL 가져오기
const SOURCING_ENDPOINT = `/src`;

/**
 * URL에서 추출한 상품 ID 목록으로 소싱을 시작합니다.
 * @param {Array} productIds - 상품 ID 배열
 * @returns {Promise} API 응답
 */
export const urlSourcing = async (productIds) => {
  try {
    const response = await httpClient.post(`${SOURCING_ENDPOINT}/urlsourcing`, { productIds });
    return response.data;
  } catch (error) {
    console.error('URL 소싱 요청 중 오류 발생:', error);
    throw error;
  }
};

/**
 * 쇼핑몰 URL로 소싱을 시작합니다.
 * @param {string} url - 상품 URL 또는 상점 URL
 * @param {number} count - 수집할 최대 상품 개수
 * @param {boolean} isShopUrl - 제공된 URL이 상점 URL인지 여부
 * @param {boolean} ignoreBan - 금지 상태 무시 여부
 * @returns {Promise} API 응답
 */
export const shopSourcing = async (url, count = 20, isShopUrl = false, ignoreBan = false) => {
  try {
    const response = await httpClient.post(`${SOURCING_ENDPOINT}/getbyshop`, {
      url,
      count,
      is_shopurl: isShopUrl,
      ignoreBan
    });
    return response.data;
  } catch (error) {
    console.error('쇼핑몰 소싱 요청 중 오류 발생:', error);
    throw error;
  }
};

/**
 * 상품 목록을 서버에 업로드하여 처리합니다.
 * @param {Array} products - 상품 목록 배열
 * @returns {Promise} API 응답
 */
export const uploadProducts = async (products) => {
  try {
    const response = await httpClient.post(`${SOURCING_ENDPOINT}/upload`, products);
    return response.data;
  } catch (error) {
    console.error('상품 업로드 중 오류 발생:', error);
    throw error;
  }
};

/**
 * 상품 상세 정보 파싱을 큐에 등록합니다.
 * @param {Array} products - 상품 정보 배열 (productId, productName 포함)
 * @param {number} commitCode - 그룹 코드 (기본값: 0)
 * @returns {Promise} API 응답
 */
export const requestDetailParsing = async (products, commitCode = 0, sameCategory = false) => {
  try {
    const response = await httpClient.post(`${SOURCING_ENDPOINT}/detailparselist`, {
      products,
      commitCode: Number(commitCode),
      sameCategory: Boolean(sameCategory)
    });
    return response.data;
  } catch (error) {
    console.error('상세 정보 파싱 요청 중 오류 발생:', error);
    throw error;
  }
};

/**
 * 소싱 상태 정보를 조회합니다.
 * @param {number} commitCode - 그룹 코드 (선택사항)
 * @returns {Promise} 소싱 상태 정보
 */
export const getSourcingStatus = async (commitCode = null) => {
  try {
    const url = commitCode !== null 
      ? `${SOURCING_ENDPOINT}/getstatus/setupinfo?commitCode=${commitCode}`
      : `${SOURCING_ENDPOINT}/getstatus/setupinfo`;
    
    const response = await httpClient.get(url);
    return response.data;
  } catch (error) {
    console.error('소싱 상태 정보 조회 중 오류 발생:', error);
    throw error;
  }
};

/**
 * 소싱된 상품 목록을 조회합니다.
 * @returns {Promise} 소싱된 상품 목록 데이터
 */
export const getProductList = async () => {
  try {
    const response = await httpClient.get(`${SOURCING_ENDPOINT}/listcheck`);
    return response.data;
  } catch (error) {
    console.error('상품 목록 조회 중 오류 발생:', error);
    throw error;
  }
};

/**
 * 상품의 금지 상태를 업데이트합니다.
 * @param {Array} updatedData - 업데이트할 상품 데이터 배열
 * @returns {Promise} API 응답
 */
export const updateBanStatus = async (updatedData) => {
  try {
    const response = await httpClient.post(`${SOURCING_ENDPOINT}/updateban`, { updatedData });
    return response.data;
  } catch (error) {
    console.error('금지 상태 업데이트 중 오류 발생:', error);
    throw error;
  }
};

/**
 * 상품의 상태 코드를 업데이트합니다.
 * @param {number} commitcode - 상태 코드 (1: 커밋)
 * @param {Array} productIds - 상품 ID 배열
 * @returns {Promise} API 응답
 */
export const updateProductStatus = async (commitcode, productIds) => {
  try {
    // 모든 productIds를 문자열로 변환
    const stringProductIds = productIds.map(id => String(id));
    
    console.log('API 요청 데이터:', { commitcode: Number(commitcode), productIds: stringProductIds });
    
    const response = await httpClient.post(`${SOURCING_ENDPOINT}/updatestatus`, {
      commitcode: Number(commitcode),
      productIds: stringProductIds
    });
    return response.data;
  } catch (error) {
    console.error('상태 코드 업데이트 중 오류 발생:', error);
    throw error;
  }
};

