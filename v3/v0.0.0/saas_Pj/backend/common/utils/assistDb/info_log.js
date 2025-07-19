import { promisePool } from '../connectDB.js';

/**
 * 정보 로그를 데이터베이스에 저장합니다.
 * @param {string} infoMessage - 저장할 로그 메시지
 * @returns {Promise<boolean>} 저장 성공 여부
 */
export async function saveInfoLog(infoMessage) {
  try {
    const [result] = await promisePool.query(
      'INSERT INTO info_log (info_message) VALUES (?)',
      [infoMessage],
    );
    return result.affectedRows > 0;
  } catch (error) {
    // 로거를 사용하면 순환 종속성이 발생하므로 콘솔에 직접 오류를 기록합니다.
    console.error('Info 로그 저장 중 DB 오류 발생:', error);
    return false;
  }
} 