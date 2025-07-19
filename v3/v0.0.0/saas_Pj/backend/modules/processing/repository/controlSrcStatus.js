import { promisePool } from '../../../common/utils/connectDB.js';

/**
 * commit 상태인 상품의 개수를 조회하는 함수
 * @param {number} userid - 사용자 ID
 * @returns {Promise<number>} - commit 상태인 상품의 개수
 */
const getCommitCount = async (userid) => {
  try {
    const [rows] = await promisePool.query(
      'SELECT COUNT(*) as count FROM sourcing_status WHERE userid = ? AND status = "commit"',
      [userid]
    );
    return rows[0].count;
  } catch (error) {
    console.error('getCommitCount 오류:', error);
    throw error;
  }
};

/**
 * commit 상태인 상품의 commitcode별 id와 개수를 배열로 조회하는 함수
 * @param {number} userid - 사용자 ID
 * @returns {Promise<Array>} - commitcode별 id와 개수를 포함한 배열
 */
const getCommitCodeCounts = async (userid) => {
  try {
    const [rows] = await promisePool.query(
      `SELECT commitcode, COUNT(*) as count, JSON_ARRAYAGG(productid) as productids 
       FROM sourcing_status 
       WHERE userid = ? AND status = "commit" 
       GROUP BY commitcode`,
      [userid]
    );
    return rows;
  } catch (error) {
    console.error('getCommitCodeCounts 오류:', error);
    throw error;
  }
};

/**
 * 특정 사용자의 특정 상품 ID에 해당하는 sourcing_status 레코드를 삭제하는 함수
 * @param {number} userid - 사용자 ID
 * @param {Array<number>} productIds - 삭제할 상품 ID 배열
 * @returns {Promise<Object>} - 삭제 결과 객체
 */
const deleteSourceStatusByUserIdAndProductIds = async (userid, productIds) => {
  const connection = await promisePool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. sourcing_status에서 group_code 조회
    const [sourcingEntries] = await connection.query(
      'SELECT productid, commitcode AS group_code FROM sourcing_status WHERE userid = ? AND productid IN (?)',
      [userid, productIds]
    );

    // 2. processing_status에 group_code 업데이트
    // productIds 배열 순서에 맞춰 group_code를 업데이트하기 위해 Promise.all 사용
    if (sourcingEntries.length > 0) {
      const updatePromises = sourcingEntries.map(entry => {
        return connection.query(
          'UPDATE processing_status SET group_code = ? WHERE userid = ? AND productid = ?',
          [entry.group_code, userid, entry.productid]
        );
      });
      await Promise.all(updatePromises);
    }

    // 3. sourcing_status에서 해당 데이터 삭제
    const [deleteResult] = await connection.query(
      'DELETE FROM sourcing_status WHERE userid = ? AND productid IN (?)',
      [userid, productIds]
    );

    await connection.commit();
    
    return {
      success: true,
      affectedRows: deleteResult.affectedRows
    };
  } catch (error) {
    await connection.rollback();
    console.error('deleteSourceStatusByUserIdAndProductIds 오류:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

export {
  getCommitCount,
  getCommitCodeCounts,
  deleteSourceStatusByUserIdAndProductIds
};
