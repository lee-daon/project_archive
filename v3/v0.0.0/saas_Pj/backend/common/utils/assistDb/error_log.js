import { promisePool } from '../connectDB.js';

/**
 * 오류 로그를 저장하는 함수
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @param {string} errorMessage - 오류 메시지
 * @returns {Promise<boolean>} 저장 성공 여부
 */
export async function saveErrorLog(userid, productid, errorMessage) {
  try {
    const [result] = await promisePool.query(
      `INSERT IGNORE INTO error_log (userid, productid, error_message)
       VALUES (?, ?, ?)`,
      [userid, productid, errorMessage]
    );
    
    return result.affectedRows >= 0; // IGNORE 사용 시 중복이어도 성공으로 처리
  } catch (error) {
    console.error('오류 로그 저장 중 DB 오류 발생:', error);
    return false;
  }
}
