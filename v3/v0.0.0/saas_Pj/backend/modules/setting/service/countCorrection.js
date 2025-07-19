import { getMarketNumbers, getProductCount, updateProductCount } from '../repository/countCorrect.js';

/**
 * 마켓 종류 검증
 * @param {string} market - 마켓 종류
 * @returns {boolean} 유효한 마켓인지 여부
 */
function isValidMarket(market) {
  return ['naver', 'coupang', '11st', 'esm'].includes(market);
}

/**
 * 마켓번호 목록 조회 서비스
 * @param {number} userid - 사용자 ID
 * @param {string} market - 마켓 종류
 * @returns {Array} 마켓번호 목록
 */
export async function getMarketNumbersService(userid, market) {
  if (!isValidMarket(market)) {
    throw new Error('지원하지 않는 마켓입니다.');
  }

  return await getMarketNumbers(userid, market);
}

/**
 * 상품개수 조회 서비스
 * @param {number} userid - 사용자 ID
 * @param {string} market - 마켓 종류
 * @param {number} marketNumber - 마켓번호
 * @returns {Object|null} 상품개수 정보
 */
export async function getProductCountService(userid, market, marketNumber) {
  if (!isValidMarket(market)) {
    throw new Error('지원하지 않는 마켓입니다.');
  }

  if (!Number.isInteger(marketNumber) || marketNumber <= 0) {
    throw new Error('유효하지 않은 마켓번호입니다.');
  }

  return await getProductCount(userid, market, marketNumber);
}

/**
 * 상품개수 수정 서비스
 * @param {number} userid - 사용자 ID
 * @param {string} market - 마켓 종류
 * @param {number} marketNumber - 마켓번호
 * @param {number} count - 수정할 상품개수
 * @returns {Object} 수정된 정보
 */
export async function updateProductCountService(userid, market, marketNumber, count) {
  if (!isValidMarket(market)) {
    throw new Error('지원하지 않는 마켓입니다.');
  }

  if (!Number.isInteger(marketNumber) || marketNumber <= 0) {
    throw new Error('유효하지 않은 마켓번호입니다.');
  }

  if (!Number.isInteger(count) || count < 0) {
    throw new Error('유효하지 않은 상품개수입니다.');
  }

  return await updateProductCount(userid, market, marketNumber, count);
}
