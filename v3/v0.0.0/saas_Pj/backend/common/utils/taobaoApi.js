import axios from 'axios';
import dotenv from 'dotenv';
import { taobaoApiLimiter } from './Globalratelimiter.js';
import logger from './logger.js';
dotenv.config();

/**
 * 타오바오 API를 통해 상품의 상세 정보를 가져옵니다.
 * 외부 API rate limiting이 적용되어 있습니다.
 *
 * @param {string|number} productId - 조회할 상품의 고유 ID
 * @param {number} retryCount - 재시도 횟수 (기본값: 2)
 * @returns {Promise<Object>} 상품의 상세 정보를 담은 객체를 반환하는 프로미스
 * @throws {Error} API 요청이 실패할 경우 에러를 던집니다.
 */
export async function getProductDetail(productId, retryCount = 2) {
  // 외부 API rate limiting 적용
  await taobaoApiLimiter.acquire();
  
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
    
    // API 응답에서 예측 가능한 에러 체크
    if (response.data.result && response.data.result.status) {
      const status = response.data.result.status;
      
      // 상품 정보가 존재하지 않는 경우
      if (status.sub_code === 'data-output::no.results.found') {
        throw new Error(`상품정보가 존재하지 않습니다 (상품ID: ${productId})`);
      }
      
      // 기타 에러 상태 체크
      if (status.msg === 'error' && status.code !== 200) {
        throw new Error(`API 에러 (상품ID: ${productId}): ${status.sub_code || status.msg}`);
      }
    }
    
    return response.data;
  } catch (err) {
    // 429 에러(Too Many Requests) 처리
    if (err.response && err.response.status === 429 && retryCount > 0) {
      logger.error(`429 에러 발생 (상품ID: ${productId}): 3초 후 재시도합니다. 남은 재시도 횟수: ${retryCount - 1}`);
      
      // 3초 대기
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // 재귀적으로 함수 호출하여 재시도
      return getProductDetail(productId, retryCount - 1);
    }
    
    // 이미 처리된 에러는 그대로 throw
    if (err.message.includes('상품정보가 존재하지 않습니다') || 
        err.message.includes('API 에러')) {
      throw err;
    }
    
    throw new Error(`API 요청 실패 (상품ID: ${productId}): ${err.message}`);
  }
}

/**
 * 상점에서 상품 목록을 가져오는 함수
 * 외부 API rate limiting이 적용되어 있습니다.
 *
 * @param {string} shopId - 상점 ID
 * @param {number} page - 페이지 번호
 * @param {number} retryCount - 재시도 횟수 (기본값: 2)
 * @returns {Promise<Object>} - 상점 상품 데이터
 * @throws {Error} API 요청이 실패할 경우 에러를 던집니다.
 */
export async function getShopItems(shopId, page, retryCount = 2) {
  // 외부 API rate limiting 적용
  await taobaoApiLimiter.acquire();
  
  const options = {
    method: 'GET',
    url: 'https://taobao-advanced.p.rapidapi.com/api',
    params: {
      api: 'shop_item',
      shop_id: shopId,
      sort: 'default',
      page: page.toString()
    },
    headers: {
      'x-rapidapi-key': process.env.RAPID_API_KEY,
      'x-rapidapi-host': 'taobao-advanced.p.rapidapi.com'
    }
  };
  
  try {
    const response = await axios.request(options);
    
    // API 응답에서 예측 가능한 에러 체크
    if (response.data.result && response.data.result.status) {
      const status = response.data.result.status;
      
      // 상점 정보가 존재하지 않는 경우
      if (status.sub_code === 'data-output::no.results.found') {
        throw new Error(`상점정보가 존재하지 않습니다 (상점ID: ${shopId})`);
      }
      
      // 기타 에러 상태 체크
      if (status.msg === 'error' && status.code !== 200) {
        throw new Error(`API 에러 (상점ID: ${shopId}): ${status.sub_code || status.msg}`);
      }
    }
    
    return response.data;
  } catch (err) {
    // 429 에러(Too Many Requests) 처리
    if (err.response && err.response.status === 429 && retryCount > 0) {
      logger.error(`429 에러 발생 (상점ID: ${shopId}, 페이지: ${page}): 3초 후 재시도합니다. 남은 재시도 횟수: ${retryCount - 1}`);
      
      // 3초 대기
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // 재귀적으로 함수 호출하여 재시도
      return getShopItems(shopId, page, retryCount - 1);
    }
    
    // 이미 처리된 에러는 그대로 throw
    if (err.message.includes('상점정보가 존재하지 않습니다') || 
        err.message.includes('API 에러')) {
      throw err;
    }
    
    throw new Error(`상점 상품 목록 API 요청 실패 (상점ID: ${shopId}, 페이지: ${page}): ${err.message}`);
  }
}

/**
 * 타오바오 V2 API를 통해 상품의 상세 정보를 가져옵니다.
 * 외부 API rate limiting이 적용되어 있습니다.
 *
 * @param {string|number} itemId - 조회할 상품의 고유 ID
 * @param {number} retryCount - 재시도 횟수 (기본값: 2)
 * @returns {Promise<Object>} 상품의 상세 정보를 담은 객체를 반환하는 프로미스
 * @throws {Error} API 요청이 실패할 경우 에러를 던집니다.
 */
export async function getProductDetail_V2(itemId, retryCount = 1) {
  // 외부 API rate limiting 적용
  await taobaoApiLimiter.acquire();
  
  const options = {
    method: 'GET',
    url: 'https://taobao-1688-api1.p.rapidapi.com/v23/detail',
    params: {
      itemId: itemId,
      site: 'taobao'
    },
    headers: {
      'x-rapidapi-key': process.env.RAPID_API_KEY,
      'x-rapidapi-host': 'taobao-1688-api1.p.rapidapi.com'
    }
  };

  try {
    const response = await axios.request(options);
    
    // API 응답에서 성공 여부 체크
    if (!response.data.success) {
      throw new Error(`상품정보가 존재하지 않습니다 (상품ID: ${itemId})`);
    }
    
    // 데이터가 없는 경우 체크
    if (!response.data.data) {
      throw new Error(`상품 데이터가 없습니다 (상품ID: ${itemId})`);
    }
    
    return response.data;
  } catch (err) {
    // 재시도하지 않을 특정 에러 처리
    if (err.message.includes('상품정보가 존재하지 않습니다') || 
        err.message.includes('상품 데이터가 없습니다')) {
      throw err;
    }
    
    // 재시도 횟수가 남아있는 경우
    if (retryCount > 0) {
      let waitTime = 1000; // 일반 에러 대기 시간: 1초
      let errorMessage = `일반 에러 발생 (상품ID: ${itemId})`;

      if (err.response && err.response.status === 429) {
        waitTime = 3000; // 429 에러 대기 시간: 3초
        errorMessage = `429 에러 발생 (상품ID: ${itemId})`;
      }
      
      logger.warn(`${errorMessage}: ${waitTime / 1000}초 후 재시도합니다. 남은 재시도 횟수: ${retryCount - 1}`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      // 재귀적으로 함수 호출하여 재시도
      return getProductDetail_V2(itemId, retryCount - 1);
    }
    
    throw new Error(`V2 API 요청 실패 (상품ID: ${itemId}): ${err.message}`);
  }
}

/**
 * 타오바오 V2 API를 통해 상점의 상품 목록을 가져옵니다.
 * 외부 API rate limiting이 적용되어 있습니다.
 *
 * @param {string} shopId - 상점 ID
 * @param {number} page - 페이지 번호 (기본값: 1)
 * @param {number} retryCount - 재시도 횟수 (기본값: 1)
 * @returns {Promise<Object>} 상점의 상품 목록을 담은 객체를 반환하는 프로미스
 * @throws {Error} API 요청이 실패할 경우 에러를 던집니다.
 */
export async function getShopItems_V2(shopId, page = 1, retryCount = 1) {
  // 외부 API rate limiting 적용
  await taobaoApiLimiter.acquire();
  
  const options = {
    method: 'GET',
    url: 'https://taobao-1688-api1.p.rapidapi.com/v9/shop',
    params: {
      shopId: shopId,
      site: 'taobao',
      page: page.toString()
    },
    headers: {
      'x-rapidapi-key': process.env.RAPID_API_KEY,
      'x-rapidapi-host': 'taobao-1688-api1.p.rapidapi.com'
    }
  };

  try {
    const response = await axios.request(options);
    
    // API 응답에서 성공 여부 체크
    if (!response.data.success) {
      throw new Error(`상점정보가 존재하지 않습니다 (상점ID: ${shopId})`);
    }
    
    // 데이터가 없는 경우 체크
    if (!response.data.data) {
      throw new Error(`상점 데이터가 없습니다 (상점ID: ${shopId})`);
    }
    
    return response.data;
  } catch (err) {
    // 재시도하지 않을 특정 에러 처리
    if (err.message.includes('상점정보가 존재하지 않습니다') || 
        err.message.includes('상점 데이터가 없습니다')) {
      throw err;
    }
    
    // 재시도 횟수가 남아있는 경우
    if (retryCount > 0) {
      let waitTime = 1000; // 일반 에러 대기 시간: 1초
      let errorMessage = `일반 에러 발생 (상점ID: ${shopId}, 페이지: ${page})`;

      if (err.response && err.response.status === 429) {
        waitTime = 3000; // 429 에러 대기 시간: 3초
        errorMessage = `429 에러 발생 (상점ID: ${shopId}, 페이지: ${page})`;
      }
      
      logger.warn(`${errorMessage}: ${waitTime / 1000}초 후 재시도합니다. 남은 재시도 횟수: ${retryCount - 1}`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      // 재귀적으로 함수 호출하여 재시도
      return getShopItems_V2(shopId, page, retryCount - 1);
    }
    
    throw new Error(`V2 상점 상품 목록 API 요청 실패 (상점ID: ${shopId}, 페이지: ${page}): ${err.message}`);
  }
}
