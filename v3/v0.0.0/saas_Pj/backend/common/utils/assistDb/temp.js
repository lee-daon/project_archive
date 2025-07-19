import { promisePool } from '../connectDB.js';
import logger from '../logger.js';

/**
 * temp 테이블에 JSON 데이터 저장
 * @param {number} userid - 사용자 ID
 * @param {number} type_number - 데이터 타입 번호
 * @param {object} data - 저장할 JSON 데이터
 * @returns {Promise<object>} - 결과 객체
 */
export const saveToTempTable = async (userid, type_number, data) => {
  try {
    const connection = await promisePool.getConnection();
    
    try {
      // 기존 데이터가 있는지 확인
      const [rows] = await connection.query(
        'SELECT * FROM temp WHERE userid = ? AND type_number = ?',
        [userid, type_number]
      );
      
      let result;
      
      if (rows.length > 0) {
        // 기존 데이터가 있으면 업데이트
        [result] = await connection.query(
          'UPDATE temp SET data = ? WHERE userid = ? AND type_number = ?',
          [JSON.stringify(data), userid, type_number]
        );
      } else {
        // 새 데이터 삽입
        [result] = await connection.query(
          'INSERT INTO temp (userid, type_number, data) VALUES (?, ?, ?)',
          [userid, type_number, JSON.stringify(data)]
        );
      }
      
      return { success: true, result };
    } finally {
      connection.release();
    }
  } catch (error) {
    logger.error(error, { userid});
    return { success: false, error: error.message };
  }
};

/**
 * temp 테이블에서 데이터 조회
 * @param {number} userid - 사용자 ID
 * @param {number} type_number - 데이터 타입 번호
 * @returns {Promise<object>} - 조회된 데이터 또는 null
 */
export const getFromTempTable = async (userid, type_number) => {
  try {
    const connection = await promisePool.getConnection();
    
    try {
      const [rows] = await connection.query(
        'SELECT data FROM temp WHERE userid = ? AND type_number = ?',
        [userid, type_number]
      );
      
      if (rows.length > 0) {
        // MySQL JSON 타입은 문자열로 반환될 수 있으므로 파싱 필요
        try {
          const data = typeof rows[0].data === 'string' 
            ? JSON.parse(rows[0].data) 
            : rows[0].data;
          return { success: true, data };
        } catch (parseError) {
          logger.error(parseError, { userid });
          return { success: false, error: 'JSON 파싱 오류: ' + parseError.message };
        }
      } else {
        return { success: false, message: '데이터를 찾을 수 없습니다.' };
      }
    } finally {
      connection.release();
    }
  } catch (error) {
    logger.error(error, { userid });
    return { success: false, error: error.message };
  }
};

/**
 * temp 테이블에서 데이터 삭제
 * @param {number} userid - 사용자 ID
 * @param {number} type_number - 데이터 타입 번호
 * @returns {Promise<object>} - 결과 객체
 */
export const deleteFromTempTable = async (userid, type_number) => {
  try {
    const connection = await promisePool.getConnection();
    
    try {
      const [result] = await connection.query(
        'DELETE FROM temp WHERE userid = ? AND type_number = ?',
        [userid, type_number]
      );
      
      return { success: true, result };
    } finally {
      connection.release();
    }
  } catch (error) {
    logger.error(error, { userid });
    return { success: false, error: error.message };
  }
};
