/**
 * URL 목록에서 상품 ID를 추출합니다.
 * @param {string} urlText - 줄바꿈으로 구분된 URL 목록
 * @returns {Array} 추출된 상품 ID 배열
 */
export const parseProductIds = (urlText) => {
  if (!urlText || typeof urlText !== 'string') {
    return [];
  }

  // 줄바꿈으로 URL 분리
  const urls = urlText.split('\n').filter(url => url.trim() !== '');
  
  // 각 URL에서 ID 추출
  const productIds = [];
  
  urls.forEach(url => {
    const productIdMatch = url.match(/id=(\d+)/);
    if (productIdMatch && productIdMatch[1]) {
      productIds.push(productIdMatch[1]);
    }
  });
  
  // 중복 제거 및 정렬
  return [...new Set(productIds)].sort();
};

/**
 * URL이 상점 URL인지 상품 URL인지 판별합니다.
 * @param {string} url - 분석할 URL
 * @returns {boolean} 상점 URL이면 true, 상품 URL이면 false
 */
export const isShopUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  // 상점 URL 패턴 확인 (taobao, tmall, aliexpress)
  return /shop\d+\.taobao\.com/.test(url) || 
         /shop\d+\.world\.taobao\.com/.test(url) || 
         /item\.taobao\.com\/shop/.test(url) ||
         /shop\d+\.tmall\.com/.test(url) ||
         /\w+\.aliexpress\.com\/store\/\d+/.test(url);
};

/**
 * 상점 URL에서 상점 ID를 추출합니다.
 * @param {string} url - 상점 URL
 * @returns {string|null} 상점 ID 또는 추출 실패시 null
 */
export const parseShopId = (url) => {
  if (!url || typeof url !== 'string') {
    return null;
  }
  
  // 타오바오 상점 ID 추출
  const taobaoShopMatch = url.match(/shop(\d+)\.(?:world\.)?taobao\.com/);
  if (taobaoShopMatch && taobaoShopMatch[1]) {
    return taobaoShopMatch[1];
  }
  
  // 티몰 상점 ID 추출
  const tmallShopMatch = url.match(/shop(\d+)\.tmall\.com/);
  if (tmallShopMatch && tmallShopMatch[1]) {
    return tmallShopMatch[1];
  }
  
  // 알리익스프레스 상점 ID 추출
  const aliexpressStoreMatch = url.match(/aliexpress\.com\/store\/(\d+)/);
  if (aliexpressStoreMatch && aliexpressStoreMatch[1]) {
    return aliexpressStoreMatch[1];
  }
  
  return null;
};
