// apiRequest.js
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

/**
 * 타오바오 API를 통해 상품의 상세 정보를 가져옵니다.
 *
 * @param {string|number} productId - 조회할 상품의 고유 ID
 * @param {number} retryCount - 재시도 횟수 (기본값: 2)
 * @returns {Promise<Object>} 상품의 상세 정보를 담은 객체를 반환하는 프로미스
 * @throws {Error} API 요청이 실패할 경우 에러를 던집니다.
 */
export async function getProductDetail(productId, retryCount = 2) {
  const options = {
    method: 'GET',
    url: 'https://taobao-advanced.p.rapidapi.com/api',
    params: {
      num_iid: productId,
      api: 'item_detail_new'
    },
    headers: {
      'x-rapidapi-key': process.env.RAPID_API_KEY,
      'x-rapidapi-host': 'taobao-advanced.p.rapidapi.com'
    }
  };

  try {
    const response = await axios.request(options);
    return response.data;
  } catch (err) {
    // 429 에러(Too Many Requests) 처리
    if (err.response && err.response.status === 429 && retryCount > 0) {
      console.log(`429 에러 발생 (상품ID: ${productId}): 3초 후 재시도합니다. 남은 재시도 횟수: ${retryCount - 1}`);
      
      // 3초 대기
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // 재귀적으로 함수 호출하여 재시도
      return getProductDetail(productId, retryCount - 1);
    }
    
    throw new Error(`API 요청 실패 (상품ID: ${productId}): ${err.message}`);
  }
}
