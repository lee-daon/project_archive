import { 
  getProductIdsByGroupCode,
  getRegistrableProductIdsByTab,
  getProductDetails,
  getCoopangAttempts,
  getNaverAttempts,
  getElevenstoreAttempts,
  getEsmAttempts
} from '../repository/search.js';

export const searchProducts = async (userid, tabInfo, groupCode = null) => {
  try {
    let filteredProductIds = null;
    
    // 1. 그룹 코드가 있는 경우 먼저 필터링
    if (groupCode) {
      filteredProductIds = await getProductIdsByGroupCode(userid, groupCode);
      
      if (filteredProductIds.length === 0) {
        // 그룹 코드로 필터링한 결과가 없으면 빈 배열 반환
        return {
          products: []
        };
      }
    }
    
    // 2. 탭 정보에 따른 등록 가능한 상품 ID 조회
    const productIds = await getRegistrableProductIdsByTab(userid, tabInfo, filteredProductIds);
    
    if (productIds.length === 0) {
      return {
        products: []
      };
    }
    
    // 3. 병렬로 상품 정보 조회
    const [
      productDetails,
      coopangAttempts,
      naverAttempts,
      elevenstoreAttempts,
      esmAttempts
    ] = await Promise.all([
      getProductDetails(userid, productIds),
      getCoopangAttempts(userid, productIds),
      getNaverAttempts(userid, productIds),
      getElevenstoreAttempts(userid, productIds),
      getEsmAttempts(userid, productIds)
    ]);
    
    // 4. 데이터 조합 - Map을 사용하여 효율적으로 매핑
    const coopangAttemptsMap = new Map(
      coopangAttempts.map(item => [item.productid, item.registration_attempt_time])
    );
    const naverAttemptsMap = new Map(
      naverAttempts.map(item => [item.productid, item.registration_attempt_time])
    );
    const elevenstoreAttemptsMap = new Map(
      elevenstoreAttempts.map(item => [item.productid, item.registration_attempt_time])
    );
    const esmAttemptsMap = new Map(
      esmAttempts.map(item => [item.productid, item.registration_attempt_time])
    );
    
    // 5. 최종 상품 목록 생성
    const products = productDetails.map(product => ({
      id: product.productid,
      name: product.name,
      url: product.url,
      naver_attempts: naverAttemptsMap.get(product.productid) || 0,
      coopang_attemts: coopangAttemptsMap.get(product.productid) || 0,
      elevenstore_attempts: elevenstoreAttemptsMap.get(product.productid) || 0,
      esm_attempts: esmAttemptsMap.get(product.productid) || 0
    }));
    
    return {
      products
    };
  } catch (error) {
    console.error('상품 검색 중 오류 발생:', error);
    throw new Error('상품 검색 중 오류가 발생했습니다.');
  }
};
