import { 
  getProductDetails,
  getCoopangAttempts,
  getNaverAttempts,
  getElevenstoreAttempts,
  getEsmAttempts,
  getGroupCodes, 
  getCoopangMarkets, 
  getNaverMarkets,
  getElevenstoreMarkets,
  getEsmMarkets,
  getDefaultSettings 
} from '../repository/initial.js';
import { getRegistrableProductIdsByTab } from '../repository/search.js';

export const getInitialData = async (userid) => {
  try {
    // 1. 등록 가능한 상품 ID 목록을 마켓별로 병렬 조회
    const [
      commonProductIds,
      naverProductIds,
      coupangProductIds,
      elevenstoreProductIds,
      esmProductIds
    ] = await Promise.all([
      getRegistrableProductIdsByTab(userid, 'common'),
      getRegistrableProductIdsByTab(userid, 'naver'),
      getRegistrableProductIdsByTab(userid, 'coupang'),
      getRegistrableProductIdsByTab(userid, 'elevenstore'),
      getRegistrableProductIdsByTab(userid, 'esm')
    ]);

    // 2. 나머지 데이터를 병렬로 조회
    const [
      productDetails,
      coopangAttempts,
      naverAttempts,
      elevenstoreAttempts,
      esmAttempts,
      groupCodes,
      naverGroupCodes,
      coopangGroupCodes,
      elevenstoreGroupCodes,
      esmGroupCodes,
      coopangMarkets,
      naverMarkets,
      elevenstoreMarkets,
      esmMarkets,
      defaultSettings
    ] = await Promise.all([
      getProductDetails(userid, commonProductIds),
      getCoopangAttempts(userid, commonProductIds),
      getNaverAttempts(userid, commonProductIds),
      getElevenstoreAttempts(userid, commonProductIds),
      getEsmAttempts(userid, commonProductIds),
      getGroupCodes(userid, commonProductIds),
      getGroupCodes(userid, naverProductIds),
      getGroupCodes(userid, coupangProductIds),
      getGroupCodes(userid, elevenstoreProductIds),
      getGroupCodes(userid, esmProductIds),
      getCoopangMarkets(userid),
      getNaverMarkets(userid),
      getElevenstoreMarkets(userid),
      getEsmMarkets(userid),
      getDefaultSettings(userid)
    ]);
    
    // 3. 데이터 조합 - Map을 사용하여 효율적으로 매핑
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
    
    // 4. 최종 상품 목록 생성 (공통 상품 기준)
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
      products,
      groupCodes,
      naverGroupCodes,
      coopangGroupCodes,
      elevenstoreGroupCodes,
      esmGroupCodes,
      coopang_markets: coopangMarkets,
      naver_markets: naverMarkets,
      elevenstore_markets: elevenstoreMarkets,
      esm_markets: esmMarkets,
      defaultSettings
    };
  } catch (error) {
    console.error('초기 데이터 조회 중 오류 발생:', error);
    throw new Error('초기 데이터를 불러오는 중 오류가 발생했습니다.');
  }
};
