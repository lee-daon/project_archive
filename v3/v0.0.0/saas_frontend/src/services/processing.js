import httpClient from './httpClient';

// 환경 변수에서 API URL 가져오기
const PROCESSING_ENDPOINT = `/prc`;

/**
 * 커밋 상태 상품 정보를 조회합니다
 * @returns {Promise} API 응답
 */
export const getCommitStatusProducts = async () => {
  try {
    const response = await httpClient.get(`${PROCESSING_ENDPOINT}/getstatus`);
    return response.data;
  } catch (error) {
    console.error('커밋 상태 상품 정보 조회 중 오류 발생:', error);
    throw error;
  }
};

/**
 * 가공 작업을 시작합니다
 * @param {Object} processingOptions - 가공 옵션 데이터
 * @param {Object} targets - 가공 대상 상품 정보
 * @returns {Promise} API 응답
 */
export const startProcessing = async (processingOptions, targets) => {
  try {
    // 가공 옵션과 대상 정보를 포함한 요청 데이터 생성
    const requestData = {
      options: processingOptions,
      targets: targets
    };
    
    const response = await httpClient.post(`${PROCESSING_ENDPOINT}/manager`, requestData);
    return response.data;
  } catch (error) {
    console.error('가공 작업 시작 중 오류 발생:', error);
    throw error;
  }
};

/**
 * 브랜드밴 체크 상품 목록을 조회합니다
 * @returns {Promise} API 응답
 */
export const getForbiddenBrandProducts = async () => {
  try {
    // 실제 서버 연동 시 사용할 코드
    const response = await httpClient.get(`${PROCESSING_ENDPOINT}/brandbancheck`);
    return response.data;
    
    
    
  } catch (error) {
    console.error('브랜드밴 체크 상품 조회 중 오류 발생:', error);
    throw error;
  }
};

/**
 * 브랜드 승인 상태를 일괄 업데이트합니다
 * @param {Array} products - [{productid: number, ban: boolean}, ...] 형태의 상품 배열
 * @returns {Promise} API 응답
 */
export const updateBrandApproval = async (products) => {
  try {
    // 실제 서버 연동 시 사용할 코드
    const response = await httpClient.post(`${PROCESSING_ENDPOINT}/brandfilter`, {
      products: products
    });
    return response.data;
    
    // 테스트용 코드
    // return Promise.resolve({
    //   success: true,
    //   message: '상품 브랜드 승인 상태가 업데이트되었습니다.'
    // });
  } catch (error) {
    console.error('브랜드 승인 상태 업데이트 중 오류 발생:', error);
    throw error;
  }
};

