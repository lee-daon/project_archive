import { promisePool } from '../../../common/utils/connectDB.js';
import { updatePreprocessingCompletedStatus } from '../../../common/utils/assistDb/GlobalStatus.js';

/**
 * 이미지 작업 카운트를 지정된 개수만큼 감소시키는 함수
 * 
 * @param {number} userId - 사용자 ID
 * @param {number} productId - 상품 ID
 * @param {number} reduceCount - 감소시킬 작업 수
 * @returns {Promise<void>}
 */
export async function decreaseImageTaskCount(userId, productId, reduceCount) {
  const connection = await promisePool.getConnection();
  try {
    await connection.beginTransaction();
    
    // 원자적 연산으로 img_tasks_count 감소 (음수 방지)
    const [updateResult] = await connection.execute(
      `UPDATE processing_status 
       SET img_tasks_count = GREATEST(0, img_tasks_count - ?)
       WHERE userid = ? AND productid = ?`,
      [reduceCount, userId, productId]
    );
    
    if (updateResult.affectedRows === 0) {
      await connection.rollback();
      console.warn(`[${userId}-${productId}] 가공 상태 정보가 없습니다.`);
      return;
    }
    
    // 업데이트 후 상태 확인
    const [rows] = await connection.execute(
      `SELECT overall_tasks_count, img_tasks_count, option_tasks_count, status
       FROM processing_status 
       WHERE userid = ? AND productid = ?`,
      [userId, productId]
    );
    
    if (rows.length === 0) {
      await connection.rollback();
      console.warn(`[${userId}-${productId}] 가공 상태 정보 확인 실패.`);
      return;
    }
    
    const status = rows[0];
    let isCompleted = false;
    
    // 모든 작업이 완료되었는지 확인
    if (status.img_tasks_count === 0 && status.option_tasks_count === 0 && status.overall_tasks_count === 0) {
      // 상태를 success로 업데이트
      await connection.execute(
        `UPDATE processing_status 
         SET status = 'success' 
         WHERE userid = ? AND productid = ? AND (status = 'processing' OR status = 'notbanned')`,
        [userId, productId]
      );
      isCompleted = true;
    }
    
    console.log(`[${userId}-${productId}] 이미지 작업 카운트 감소 완료: ${reduceCount}개 감소, 현재 ${status.img_tasks_count}개`);
    
    await connection.commit();
    
    // 모든 작업이 완료되었으면 preprocessing_completed 상태 업데이트
    if (isCompleted) {
      await updatePreprocessingCompletedStatus(userId, productId);
      console.log(`[${userId}-${productId}] 모든 가공 작업이 완료되어 preprocessing_completed 상태를 true로 업데이트합니다.`);
    }
  } catch (error) {
    await connection.rollback();
    console.error(`[${userId}-${productId}] 이미지 작업 카운트 감소 중 오류:`, error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

