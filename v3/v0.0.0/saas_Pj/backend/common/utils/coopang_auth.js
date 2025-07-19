import crypto from 'crypto';
import { proxyGet } from './proxy.js';
import logger from './logger.js';

/**
 * 쿠팡 인증 헤더 생성
 * @param {string} accessKey - 쿠팡 액세스 키
 * @param {string} secretKey - 쿠팡 시크릿 키
 * @param {string} method - HTTP 메서드
 * @param {string} path - API 경로
 * @param {string} query - 쿼리 스트링
 * @returns {object} 인증 헤더 객체
 */
export const createCoupangAuthHeaders = (accessKey, secretKey, method, path, query = '') => {
  try {
    // 쿠팡 datetime 형식: YYMMDDTHHMMSSZ
    const datetime = new Date().toISOString().substr(2, 17).replace(/:/gi, '').replace(/-/gi, '') + "Z";
    
    // 서명 메시지 생성
    const message = datetime + method + path + query;
    
    // HMAC SHA256 서명 생성
    const algorithm = 'sha256';
    const signature = crypto.createHmac(algorithm, secretKey)
                           .update(message)
                           .digest('hex');
    
    // Authorization 헤더 생성
    const authorization = `CEA algorithm=HmacSHA256, access-key=${accessKey}, signed-date=${datetime}, signature=${signature}`;
    
    return {
      'Content-Type': 'application/json;charset=UTF-8',
      'Authorization': authorization,
      'X-EXTENDED-TIMEOUT': 90000
    };
  } catch (error) {
    throw new Error(`쿠팡 인증 헤더 생성 실패: ${error.message}`);
  }
};

/**
 * 쿠팡 카테고리 정보 조회
 * @param {string} accessKey - 쿠팡 액세스 키
 * @param {string} secretKey - 쿠팡 시크릿 키
 * @returns {Promise<object>} 카테고리 정보 응답
 */
export const getCoupangCategories = async (accessKey, secretKey) => {
  try {
    // 입력값 검증
    if (!accessKey || typeof accessKey !== 'string') {
      throw new Error('유효한 액세스 키가 필요합니다.');
    }

    if (!secretKey || typeof secretKey !== 'string') {
      throw new Error('유효한 시크릿 키가 필요합니다.');
    }

    const method = 'GET';
    const path = '/v2/providers/seller_api/apis/api/v1/marketplace/meta/display-categories';
    const query = ''; // 쿼리 파라미터 없음
    
    // 인증 헤더 생성
    const headers = createCoupangAuthHeaders(accessKey, secretKey, method, path, query);
    
    // 프록시를 통한 요청
    const url = `api-gateway.coupang.com${path}`;
    const response = await proxyGet(url, {}, headers);
    
    return {
      success: true,
      data: response.data,
      message: '카테고리 조회 성공'
    };
  } catch (error) {
    logger.error(error);
    return {
      success: false,
      error: error.message,
      data: null,
      message: '카테고리 조회 실패'
    };
  }
};
