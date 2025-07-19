import { promisePool } from '../../../common/utils/connectDB.js';

/**
 * 마켓번호 목록 조회
 * @param {number} userid - 사용자 ID
 * @param {string} market - 마켓 종류 (naver, coupang, 11st, esm)
 * @returns {Array} 마켓번호 목록
 */
export async function getMarketNumbers(userid, market) {
  let query;
  let numberColumn;
  let memoColumn;

  switch (market) {
    case 'naver':
      query = 'SELECT naver_market_number, naver_market_memo FROM naver_account_info WHERE userid = ?';
      numberColumn = 'naver_market_number';
      memoColumn = 'naver_market_memo';
      break;
    case 'coupang':
      query = 'SELECT coopang_market_number, coopang_market_memo FROM coopang_account_info WHERE userid = ?';
      numberColumn = 'coopang_market_number';
      memoColumn = 'coopang_market_memo';
      break;
    case '11st':
      query = 'SELECT elevenstore_market_number, elevenstore_market_memo FROM elevenstore_account_info WHERE userid = ?';
      numberColumn = 'elevenstore_market_number';
      memoColumn = 'elevenstore_market_memo';
      break;
    case 'esm':
      query = 'SELECT esm_market_number, esm_market_memo FROM esm_account_info WHERE userid = ?';
      numberColumn = 'esm_market_number';
      memoColumn = 'esm_market_memo';
      break;
    default:
      throw new Error('지원하지 않는 마켓입니다.');
  }

  try {
    const [rows] = await promisePool.query(query, [userid]);
    
    return rows.map(row => ({
      number: row[numberColumn],
      name: row[memoColumn] || `${market} ${row[numberColumn]}호점`
    }));
  } catch (error) {
    console.error('마켓번호 목록 조회 오류:', error);
    throw error;
  }
}

/**
 * 상품개수 조회
 * @param {number} userid - 사용자 ID
 * @param {string} market - 마켓 종류 (naver, coupang, 11st, esm)
 * @param {number} marketNumber - 마켓번호
 * @returns {Object|null} 상품개수 정보
 */
export async function getProductCount(userid, market, marketNumber) {
  let query;
  let marketNumberColumn;

  switch (market) {
    case 'naver':
      query = 'SELECT registered_sku_count, updated_at FROM naver_account_info WHERE userid = ? AND naver_market_number = ?';
      marketNumberColumn = 'naver_market_number';
      break;
    case 'coupang':
      query = 'SELECT registered_sku_count, updated_at FROM coopang_account_info WHERE userid = ? AND coopang_market_number = ?';
      marketNumberColumn = 'coopang_market_number';
      break;
    case '11st':
      query = 'SELECT registered_sku_count, updated_at FROM elevenstore_account_info WHERE userid = ? AND elevenstore_market_number = ?';
      marketNumberColumn = 'elevenstore_market_number';
      break;
    case 'esm':
      query = 'SELECT registered_sku_count, updated_at FROM esm_account_info WHERE userid = ? AND esm_market_number = ?';
      marketNumberColumn = 'esm_market_number';
      break;
    default:
      throw new Error('지원하지 않는 마켓입니다.');
  }

  try {
    const [rows] = await promisePool.query(query, [userid, marketNumber]);
    
    if (rows.length === 0) {
      return null;
    }

    return {
      count: rows[0].registered_sku_count,
      market: market,
      market_number: marketNumber,
      last_updated: rows[0].updated_at
    };
  } catch (error) {
    console.error('상품개수 조회 오류:', error);
    throw error;
  }
}

/**
 * 상품개수 수정
 * @param {number} userid - 사용자 ID
 * @param {string} market - 마켓 종류 (naver, coupang, 11st, esm)
 * @param {number} marketNumber - 마켓번호
 * @param {number} count - 수정할 상품개수
 * @returns {Object} 수정된 정보
 */
export async function updateProductCount(userid, market, marketNumber, count) {
  let query;
  let marketNumberColumn;

  switch (market) {
    case 'naver':
      query = 'UPDATE naver_account_info SET registered_sku_count = ?, updated_at = NOW() WHERE userid = ? AND naver_market_number = ?';
      marketNumberColumn = 'naver_market_number';
      break;
    case 'coupang':
      query = 'UPDATE coopang_account_info SET registered_sku_count = ?, updated_at = NOW() WHERE userid = ? AND coopang_market_number = ?';
      marketNumberColumn = 'coopang_market_number';
      break;
    case '11st':
      query = 'UPDATE elevenstore_account_info SET registered_sku_count = ?, updated_at = NOW() WHERE userid = ? AND elevenstore_market_number = ?';
      marketNumberColumn = 'elevenstore_market_number';
      break;
    case 'esm':
      query = 'UPDATE esm_account_info SET registered_sku_count = ?, updated_at = NOW() WHERE userid = ? AND esm_market_number = ?';
      marketNumberColumn = 'esm_market_number';
      break;
    default:
      throw new Error('지원하지 않는 마켓입니다.');
  }

  try {
    const [result] = await promisePool.query(query, [count, userid, marketNumber]);
    
    if (result.affectedRows === 0) {
      throw new Error('해당 마켓번호를 찾을 수 없습니다.');
    }

    return {
      count: count,
      market: market,
      market_number: marketNumber,
      updated_at: new Date()
    };
  } catch (error) {
    console.error('상품개수 수정 오류:', error);
    throw error;
  }
}
