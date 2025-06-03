/**
 * naver_register_management.js
 * 네이버 상품 등록 관련 DB 관리 모듈
 */

import { promisePool } from '../connectDB.js';

/**
 * 네이버 에러 메시지에 따른 에러 코드 매핑 (0-100 사이 값)
 * 100: 성공, 0: 기본 에러, 1-99: 다양한 에러 유형
 */
const ERROR_CODES = {
  // API 요청 형식 관련 오류
  'Bad Request': 40,
  'Invalid request': 40,
  'JSON parse error': 40,
  
  // 인증 관련 오류
  'Unauthorized': 41,
  'token expired': 41,
  'Invalid token': 41,
  'authentication failed': 41,
  
  // 권한 관련 오류
  'Forbidden': 43,
  'Permission denied': 43,
  
  // 리소스 관련 오류
  'Not Found': 44,
  'Resource not found': 44,
  
  // API 메소드 관련 오류
  'Method Not Allowed': 45,
  
  // 요청 한도 관련 오류
  'Too Many Requests': 49,
  'Rate limit exceeded': 49,
  
  // 데이터 준비 오류
  '상품 정보 준비': 50,
  
  // 카테고리 매핑 오류
  '카테고리': 51,
  'category': 51,
  
  // 이미지 오류
  '이미지': 52,
  'image': 52,
  
  // 옵션 오류
  '옵션': 53,
  'option': 53,
  
  // 인증 토큰 획득 실패
  '인증 토큰 획득': 60,
  'access token': 60,
  
  // 네이버 API 서버 오류
  'Internal Server Error': 70,
  'Service Unavailable': 70,
  
  // 네이버 상품 등록 거부
  '등록 거부': 80,
  'rejected': 80,
  
  // 네이버 응답 처리 실패
  'response': 90,
  '응답': 90,
  
  // 기본 오류 코드
  'default': 0
};

/**
 * 에러 메시지에 기반하여 적절한 에러 코드 판별
 * @param {string} errorMessage - 에러 메시지
 * @returns {number} 에러 코드 (0-100 사이 값)
 */
function determineErrorCode(errorMessage) {
  // 에러 메시지가 없는 경우 기본 에러 코드 반환
  if (!errorMessage) return ERROR_CODES.default;
  
  // 에러 메시지를 소문자로 변환
  const lowerCaseMessage = errorMessage.toLowerCase();
  
  // 각 키워드를 검사하여 일치하는 에러 코드 반환
  for (const [keyword, code] of Object.entries(ERROR_CODES)) {
    if (lowerCaseMessage.includes(keyword.toLowerCase())) {
      return code;
    }
  }
  
  // 일치하는 키워드가 없는 경우 기본 에러 코드 반환
  return ERROR_CODES.default;
}

/**
 * DB에 레코드가 있는지 확인하고, 없으면 새로 생성하는 함수
 * @param {string} productId - 상품 ID
 * @returns {Promise<boolean>} 레코드 존재 여부
 */
async function ensureNaverRegistInfoExists(productId) {
  try {
    // 레코드 존재 여부 확인
    const [rows] = await promisePool.execute(
      'SELECT productid FROM naver_regist_info WHERE productid = ?',
      [productId]
    );
    
    if (rows.length === 0) {
      console.log(`${productId}에 대한 naver_regist_info 레코드가 없습니다. 새 레코드를 생성합니다.`);
      
      // 새 레코드 생성
      await promisePool.execute(
        'INSERT INTO naver_regist_info (productid) VALUES (?)',
        [productId]
      );
      
      //console.log(`${productId}에 대한 naver_regist_info 레코드가 생성되었습니다.`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('레코드 확인/생성 중 오류:', error);
    
    // 외래 키 제약조건 때문에 오류가 발생할 수 있음
    if (error.message.includes('foreign key constraint fails')) {
      throw new Error(`${productId}는 products_detail 테이블에 존재하지 않습니다. products_detail 테이블에 먼저 추가해주세요.`);
    }
    
    throw error;
  }
}

/**
 * 상품 ID에 대한 마진 정보를 조회하는 함수
 * @param {string} productId - 상품 ID
 * @returns {Promise<Object>} 마진 정보 객체 (profit_margin, delivery_fee)
 */
async function getMarginInfo(productId) {
  try {
    const [rows] = await promisePool.execute(
      'SELECT profit_margin, delivery_fee FROM naver_register_management WHERE productid = ?',
      [productId]
    );
    
    if (rows.length === 0) {
      return null;
    }
    
    return {
      profitMargin: rows[0].profit_margin,
      deliveryFee: rows[0].delivery_fee
    };
  } catch (error) {
    console.error('마진 정보 조회 오류:', error);
    throw error;
  }
}

/**
 * 네이버 초기 JSON 데이터를 저장하는 함수
 * @param {string} productId - 상품 ID
 * @param {Object} initialJson - 저장할 JSON 데이터
 * @returns {Promise<boolean>} 저장 성공 여부
 */
async function saveInitialJson(productId, initialJson) {
  try {
    await promisePool.execute(
      'UPDATE naver_regist_info SET first_stage_json = ? WHERE productid = ?',
      [JSON.stringify(initialJson), productId]
    );
    
    return true;
  } catch (error) {
    console.error('JSON 데이터 저장 오류:', error);
    throw error;
  }
}

/**
 * 할인율을 설정하고 저장하는 함수
 * @param {string} productId - 상품 ID
 * @param {number} discountRate - 할인율
 * @returns {Promise<boolean>} 저장 성공 여부
 */
async function saveDiscountRate(productId, discountRate) {
  try {
    await promisePool.execute(
      'UPDATE naver_regist_info SET discount_rate = ? WHERE productid = ?',
      [discountRate, productId]
    );
    
    return true;
  } catch (error) {
    console.error('할인율 저장 오류:', error);
    throw error;
  }
}

/**
 * 기준 가격(representativePrice)을 final_main_price에 저장하는 함수
 * @param {string} productId - 상품 ID
 * @param {number} mainPrice - 저장할 기준 가격
 * @returns {Promise<boolean>} 저장 성공 여부
 */
async function saveFinalMainPrice(productId, mainPrice) {
  try {
    await promisePool.execute(
      'UPDATE naver_regist_info SET final_main_price = ? WHERE productid = ?',
      [mainPrice, productId]
    );
    
    return true;
  } catch (error) {
    console.error('기준 가격 저장 오류:', error);
    throw error;
  }
}

/**
 * 네이버 상품 등록 후 반환된 상품 번호를 저장하는 함수
 * @param {string} productId - 상품 ID
 * @param {string} originProductNo - 네이버 원상품 번호
 * @param {string} smartstoreChannelProductNo - 스마트스토어 채널 상품 번호
 * @returns {Promise<boolean>} 저장 성공 여부
 */
async function saveNaverProductNumbers(productId, originProductNo, smartstoreChannelProductNo) {
  try {
    await promisePool.execute(
      'UPDATE naver_register_management SET originProductNo = ?, smartstoreChannelProductNo = ?, status_code = 100 WHERE productid = ?',
      [originProductNo, smartstoreChannelProductNo, productId]
    );
    
    console.log(`네이버 상품 번호 저장 완료: ${productId} (원상품: ${originProductNo}, 채널상품: ${smartstoreChannelProductNo})`);
    return true;
  } catch (error) {
    console.error('네이버 상품 번호 저장 오류:', error);
    throw error;
  }
}

/**
 * 네이버 상품 등록 성공 시 status 테이블 업데이트
 * @param {string} productId - 상품 ID
 * @returns {Promise<boolean>} 업데이트 성공 여부
 */
async function updateStatusOnSuccess(productId) {
  try {
    await promisePool.execute(
      'UPDATE status SET registered = TRUE, naver_registered = TRUE WHERE productid = ?',
      [productId]
    );
    
    console.log(`상품 ${productId}의 등록 상태가 성공으로 업데이트되었습니다.`);
    return true;
  } catch (error) {
    console.error('상태 업데이트 오류:', error);
    throw error;
  }
}

/**
 * 네이버 상품 등록 실패 시 status 테이블과 naver_register_management 테이블 업데이트
 * @param {string} productId - 상품 ID
 * @param {string} errorMessage - 오류 메시지
 * @returns {Promise<boolean>} 업데이트 성공 여부
 */
async function updateStatusOnFailure(productId, errorMessage = '') {
  try {
    // 에러 메시지를 기반으로 에러 코드 결정 (0-100 사이 값)
    const errorCode = determineErrorCode(errorMessage);
    
    // status 테이블 업데이트 - discarded를 TRUE로 설정
    await promisePool.execute(
      'UPDATE status SET naver_register_failed = TRUE WHERE productid = ?',
      [productId]
    );
    
    // naver_register_management 테이블 업데이트 - status_code를 에러 코드로 설정
    await promisePool.execute(
      'UPDATE naver_register_management SET status_code = ? WHERE productid = ?',
      [errorCode, productId]
    );
    
    console.log(`상품 ${productId}의 등록 상태가 실패로 업데이트되었습니다. 에러 코드: ${errorCode}`);
    return true;
  } catch (error) {
    console.error('상태 업데이트 오류:', error);
    throw error;
  }
}

export { 
  ensureNaverRegistInfoExists,
  getMarginInfo,
  saveInitialJson,
  saveDiscountRate,
  saveFinalMainPrice,
  saveNaverProductNumbers,
  updateStatusOnSuccess,
  updateStatusOnFailure,
  determineErrorCode,
  ERROR_CODES
};
