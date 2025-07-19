import { promisePool } from '../../../common/utils/connectDB.js';

/**
 * 상품을 폐기 상태로 변경하는 함수
 * processing_status 테이블의 status를 'discard'로 변경하고
 * status 테이블의 discarded를 true로 변경
 * 
 * @param {number} userid - 사용자 ID
 * @param {Array<number>} productids - 상품 ID 배열
 * @returns {Promise<Object>} - 처리 결과 객체
 */
export const updateDiscardStatus = async (userid, productids) => {
  if (!Array.isArray(productids) || productids.length === 0) {
    return {
      success: false,
      message: '폐기할 상품 ID가 제공되지 않았습니다.'
    };
  }

  const connection = await promisePool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // 1. processing_status 테이블 상태 업데이트
    const placeholders = productids.map(() => '?').join(',');
    const params = [...productids.map(id => [userid, id]).flat()];
    
    const [processingResult] = await connection.query(
      `UPDATE processing_status 
       SET status = 'discard' 
       WHERE (userid = ? AND productid IN (${placeholders}))`,
      [userid, ...productids]
    );
    
    // 2. status 테이블 discarded 필드 업데이트
    const [statusResult] = await connection.query(
      `UPDATE status 
       SET discarded = TRUE 
       WHERE (userid = ? AND productid IN (${placeholders}))`,
      [userid, ...productids]
    );
    
    await connection.commit();
    
    return {
      success: true,
      message: `${productids.length}개 상품이 폐기 처리되었습니다.`,
      processingUpdated: processingResult.affectedRows,
      statusUpdated: statusResult.affectedRows
    };
  } catch (error) {
    await connection.rollback();
    console.error('상품 폐기 처리 중 오류 발생:', error);
    return {
      success: false,
      message: '상품 폐기 처리 중 오류가 발생했습니다.',
      error: error.message
    };
  } finally {
    connection.release();
  }
};
