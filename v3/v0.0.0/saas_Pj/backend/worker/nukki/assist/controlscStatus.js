import { promisePool } from '../../../common/utils/connectDB.js';
import { updatePreprocessingCompletedStatus } from '../../../common/utils/assistDb/GlobalStatus.js';

/**
 * 작업 개수 감소 및 상태 업데이트 함수
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @returns {Promise<boolean>} 업데이트 성공 여부
 */
export async function decreaseTaskCount(userid, productid) {
    const connection = await promisePool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 원자적 연산으로 overall_tasks_count 감소 (음수 방지)
      const [updateResult] = await connection.execute(
        `UPDATE processing_status 
         SET overall_tasks_count = GREATEST(0, overall_tasks_count - 1)
         WHERE userid = ? AND productid = ? AND overall_tasks_count > 0`,
        [userid, productid]
      );
      
      // 업데이트가 실행되지 않았으면 (이미 0이거나 레코드가 없음)
      if (updateResult.affectedRows === 0) {
        await connection.rollback();
        console.warn(`상품 ID ${productid}: overall_tasks_count 감소 실패 (이미 0이거나 레코드 없음)`);
        return false;
      }
      
      // 업데이트 후 현재 상태 조회
      const [rows] = await connection.execute(
        `SELECT overall_tasks_count, img_tasks_count, option_tasks_count, status
         FROM processing_status 
         WHERE userid = ? AND productid = ?`,
        [userid, productid]
      );
      
      if (rows.length === 0) {
        await connection.rollback();
        return false;
      }
      
      const status = rows[0];
      let isCompleted = false;
      
      // 모든 작업이 완료되었는지 확인
      if (status.overall_tasks_count === 0 && status.img_tasks_count === 0 && status.option_tasks_count === 0) {
        // 상태를 success로 업데이트
        await connection.execute(
          `UPDATE processing_status 
           SET status = 'success' 
           WHERE userid = ? AND productid = ? AND (status = 'processing' OR status = 'notbanned')`,
          [userid, productid]
        );
        isCompleted = true;
      }
      
      await connection.commit();
      
      // 모든 작업이 완료되었을 경우 preprocessing_completed 상태 업데이트
      if (isCompleted) {
        await updatePreprocessingCompletedStatus(userid, productid);
        console.log(`상품 ID ${productid}: 모든 작업 완료 - 상태를 success로 업데이트`);
      }
      
      console.log(`상품 ID ${productid}: overall_tasks_count 감소 완료 (현재: ${status.overall_tasks_count})`);
      return true;
    } catch (error) {
      await connection.rollback();
      console.error(`상품 ID ${productid} 작업 개수 감소 중 오류:`, error);
      throw error;
    } finally {
      connection.release();
    }
  }
  