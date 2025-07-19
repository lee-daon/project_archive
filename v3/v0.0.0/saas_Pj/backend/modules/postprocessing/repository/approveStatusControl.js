import { promisePool } from '../../../common/utils/connectDB.js';

/**
 * 상품의 가공 상태를 'commit'으로 변경하는 함수
 * 
 * @param {number} userid - 사용자 ID
 * @param {Array<number>} productids - 상품 ID 배열
 * @returns {Promise<Object>} - 처리 결과 객체
 */
export const updateApproveStatus = async (userid, productids) => {
  if (!Array.isArray(productids) || productids.length === 0) {
    return {
      success: false,
      message: '승인할 상품 ID가 제공되지 않았습니다.'
    };
  }

  const connection = await promisePool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // processing_status 테이블 상태 업데이트
    const placeholders = productids.map(() => '?').join(',');
    
    const [processingResult] = await connection.query(
      `UPDATE processing_status 
       SET status = 'commit' 
       WHERE (userid = ? AND productid IN (${placeholders}))`,
      [userid, ...productids]
    );
    
    await connection.commit();
    
    return {
      success: true,
      message: `${productids.length}개 상품이 승인 처리되었습니다.`,
      processingUpdated: processingResult.affectedRows
    };
  } catch (error) {
    await connection.rollback();
    console.error('상품 승인 처리 중 오류 발생:', error);
    return {
      success: false,
      message: '상품 승인 처리 중 오류가 발생했습니다.',
      error: error.message
    };
  } finally {
    connection.release();
  }
};
