//import { getProductDetail, getShopItems } from '../../../common/utils/taobaoApi.js';
import { getProductDetail_V2, getShopItems_V2 } from '../../../common/utils/taobaoApi.js';

/**
 * URL에서 상점 ID를 추출하는 함수
 * @param {string} url - 상점 또는 상품 URL
 * @param {boolean} isShopUrl - 상점 URL 여부
 * @returns {Promise<Object>} - 상점 ID와 판매자 ID를 포함한 객체
 */
/*
export const extractShopInfo = async (url, isShopUrl) => {
  let shopId;
  let sellerId;
  
  if (isShopUrl) {
    // 샵 URL에서 shopId 추출 (숫자만 추출)
    const shopIdMatch = url.match(/shop(\d+)/);
    if (!shopIdMatch) {
      throw new Error('올바른 샵 URL이 아닙니다. 샵 ID를 찾을 수 없습니다.');
    }
    
    shopId = shopIdMatch[1];
    // sellerId는 생략
  } else {
    // 상품 URL에서 상품 ID 추출
    const productIdMatch = url.match(/id=(\d+)/);
    if (!productIdMatch) {
      throw new Error('올바른 상품 URL이 아닙니다. 상품 ID를 찾을 수 없습니다.');
    }
    
    const productId = productIdMatch[1];
    
    // 상품 상세 정보를 가져오는 함수 호출
    const productDetail = await getProductDetail(productId);
    
    // shop_id와 seller_id 추출
    shopId = productDetail.result.seller.shop_id;
    sellerId = productDetail.result.seller.seller_id;
  }
  
  return { shopId, sellerId };
};
*/

/**
 * V2 API를 사용하여 URL에서 상점 ID를 추출하는 함수
 * @param {string} url - 상점 또는 상품 URL
 * @param {boolean} isShopUrl - 상점 URL 여부
 * @returns {Promise<Object>} - 상점 ID와 판매자 ID를 포함한 객체
 */
export const extractShopInfo_V2 = async (url, isShopUrl) => {
  let shopId;
  let sellerId;
  
  if (isShopUrl) {
    // 샵 URL에서 shopId 추출 (숫자만 추출)
    const shopIdMatch = url.match(/shop(\d+)/);
    if (!shopIdMatch) {
      throw new Error('올바른 샵 URL이 아닙니다. 샵 ID를 찾을 수 없습니다.');
    }
    
    shopId = shopIdMatch[1];
    // sellerId는 생략
  } else {
    // 상품 URL에서 상품 ID 추출
    const productIdMatch = url.match(/id=(\d+)/);
    if (!productIdMatch) {
      throw new Error('올바른 상품 URL이 아닙니다. 상품 ID를 찾을 수 없습니다.');
    }
    
    const productId = productIdMatch[1];
    
    // V2 API로 상품 상세 정보를 가져오는 함수 호출
    const productDetail = await getProductDetail_V2(productId);
    
    // shopUrl에서 shop ID 추출 (https://shop313393430.taobao.com -> 313393430)
    const shopUrl = productDetail.data.shopUrl;
    const shopIdMatch = shopUrl.match(/shop(\d+)/);
    if (!shopIdMatch) {
      throw new Error('상품 정보에서 상점 ID를 찾을 수 없습니다.');
    }
    
    shopId = shopIdMatch[1];
    sellerId = productDetail.data.sellerId;
  }
  
  return { shopId, sellerId };
};

/**
 * 상점에서 지정된 개수만큼 상품을 수집하는 함수
 * @param {string} shopId - 상점 ID
 * @param {number} count - 수집할 상품 개수
 * @returns {Promise<Array>} - 수집된 상품 목록
 */
/*
export const collectItemsFromShop = async (shopId, count) => {
  const items = [];
  let currentPage = 1;
  let continueCollecting = true;
  
  // 요청한 갯수만큼 아이템 수집
  while (continueCollecting && items.length < count) {
    const shopData = await getShopItems(shopId, currentPage);
    
    // 응답받은 상품들이 없으면 종료
    if (!shopData.result.item || shopData.result.item.length === 0) {
      continueCollecting = false;
      break;
    }
    
    // 데이터 추출 및 items 배열에 추가
    for (const item of shopData.result.item) {
      items.push({
        productId: item.num_iid,
        productName: item.title,
        pic: item.pic,
        price: item.price,
        sales: item.sales,
        detail_url: item.detail_url || `https://item.taobao.com/item.htm?id=${item.num_iid}`
      });
      
      if (items.length >= count) {
        continueCollecting = false;
        break;
      }
    }
    
    console.log(shopData.result.status.msg);
    // 더 이상 페이지가 없으면 종료
    if (shopData.result.total_page && currentPage >= shopData.result.total_page) {
      continueCollecting = false;
    }
    
    currentPage++;
  }
  
  return items;
};
*/

/**
 * V2 API를 사용하여 상점에서 지정된 개수만큼 상품을 수집하는 함수
 * @param {string} shopId - 상점 ID
 * @param {number} count - 수집할 상품 개수
 * @returns {Promise<Array>} - 수집된 상품 목록
 */
export const collectItemsFromShop_V2 = async (shopId, count) => {
  const items = [];
  let currentPage = 1;
  let continueCollecting = true;
  
  // 요청한 갯수만큼 아이템 수집
  while (continueCollecting && items.length < count) {
    const shopData = await getShopItems_V2(shopId, currentPage);
    
    // 응답받은 상품들이 없으면 종료
    if (!shopData.data.goodList.goods || shopData.data.goodList.goods.length === 0) {
      continueCollecting = false;
      break;
    }
    
    // 데이터 추출 및 items 배열에 추가
    for (const item of shopData.data.goodList.goods) {
      items.push({
        productId: item.productID,
        productName: item.productName,
        pic: item.imageUrl,
        price: item.price,
        sales: item.sales,
        detail_url: `https://item.taobao.com/item.htm?id=${item.productID}`
      });
      
      if (items.length >= count) {
        continueCollecting = false;
        break;
      }
    }
    
    console.log(`페이지 ${currentPage} 수집 완료`);
    
    currentPage++;
  }
  
  return items;
};
