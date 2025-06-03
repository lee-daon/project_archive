/**
 * getFronPreregister.js
 * pre_register 테이블에서 데이터를 조회하는 모듈
 */

import { promisePool } from '../connectDB.js';

/**
 * pre_register 테이블에서 상품 정보 JSON 데이터를 조회
 * @param {string} productId - 상품 ID
 * @returns {Promise<Object>} 상품 정보 객체
 */
async function getProductInfoFromPreregister(productId) {
  try {
    // pre_register 테이블에서 json_data 가져오기
    const [rows] = await promisePool.execute(
      'SELECT json_data FROM pre_register WHERE product_id = ?',
      [productId]
    );
    
    if (rows.length === 0) {
      throw new Error(`productId ${productId}에 해당하는 데이터가 pre_register 테이블에 없습니다.`);
    }
    
    if (!rows[0].json_data) {
      throw new Error(`productId ${productId}의 json_data가 비어있습니다.`);
    }
    
    // JSON 데이터 처리 - 타입에 따라 적절히 파싱
    let productInfo;
    
    // 데이터 타입 확인 및 처리
    if (typeof rows[0].json_data === 'string') {
      // 문자열인 경우 JSON 파싱 시도
      try {
        productInfo = JSON.parse(rows[0].json_data);
      } catch (parseError) {
        throw new Error(`json_data 파싱 오류: ${parseError.message}`);
      }
    } else if (typeof rows[0].json_data === 'object') {
      // 이미 객체인 경우 직접 사용
      productInfo = rows[0].json_data;
    } else {
      throw new Error(`json_data의 타입이 예상과 다릅니다: ${typeof rows[0].json_data}`);
    }
    
    // 파싱된 데이터 확인
    console.log('처리된 productInfo 데이터 타입:', typeof productInfo);
    
    return productInfo;
  } catch (error) {
    console.error('pre_register 데이터 조회 오류:', error);
    throw error;
  }
}

export { getProductInfoFromPreregister };
