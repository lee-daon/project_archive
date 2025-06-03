import { promisePool } from "../connectDB.js";

/**
 * 가공 상태 통계를 조회하는 함수
 * @returns {Promise<Object>} 가공 대상, 완료, 밴 상품 수 통계
 */
export async function getProcessingStats() {
    // 가공 대상 수
    const [targetCount] = await promisePool.query(`
      SELECT COUNT(*) as count
      FROM status 
      WHERE sourcing_completed = true 
      AND preprocessing_completed = false
    `);
    
    // 가공 완료 수
    const [completedCount] = await promisePool.query(`
      SELECT COUNT(*) as count
      FROM status 
      WHERE preprocessing_completed = true
    `);
    
    // 밴 상품 수
    const [bannedCount] = await promisePool.query(`
      SELECT COUNT(*) as count
      FROM status 
      WHERE brand_banned = true 
      OR shop_banned = true 
      OR seller_banned = true
    `);
    
    return {
      target: targetCount[0].count,
      completed: completedCount[0].count,
      banned: bannedCount[0].count
    };
  } 