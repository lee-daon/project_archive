import { promisePool } from '../connectDB.js';

/**
 * 여러 제품의 테스트 코드를 업데이트합니다.
 *
 * @param {string} testCode - 설정할 테스트 코드
 * @param {Array<number|string>} productIds - 업데이트할 제품 ID 배열
 * @returns {Promise<void>} - 작업 완료 시 프라미스를 반환합니다.
 * @throws {Error} - 쿼리 실행 중 오류가 발생하면 던집니다.
 */
export async function updateTestCode(testCode, productIds) {
  try {
    const connection = await promisePool.getConnection();
    
    // status 테이블의 testcode 값을 업데이트
    for (const productId of productIds) {
      await connection.query(
        'UPDATE status SET testcode = ? WHERE productid = ?',
        [testCode, productId]
      );
    }
    
    connection.release();
  } catch (error) {
    console.error('테스트 코드 업데이트 중 오류 발생:', error);
    throw error;
  }
} 