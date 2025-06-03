import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

/**
 * 상점에서 상품 목록을 가져오는 함수
 * @param {string} shopId - 상점 ID
 * @param {number} page - 페이지 번호
 * @param {string|null} categoryId - 카테고리 ID (선택적)
 * @returns {Promise<Object>} - 상점 상품 데이터
 */
export const getShopItems = async (shopId, page, categoryId = null) => {
  const shopItemsOptions = {
    method: 'GET',
    url: 'https://taobao-advanced.p.rapidapi.com/api',
    params: {
      api: 'shop_item',
      shop_id: shopId,
      sort: 'default',
      page: page.toString(),
      cat: null
    },
    headers: {
      'x-rapidapi-key': process.env.RAPID_API_KEY,
      'x-rapidapi-host': 'taobao-advanced.p.rapidapi.com'
    }
  };
  
  // 카테고리 ID가 제공된 경우 cat 파라미터 설정
  if (categoryId) {
    shopItemsOptions.params.cat = categoryId;
  }
  
  console.log(shopItemsOptions.params);
  const response = await axios.request(shopItemsOptions);
  return response.data;
};

