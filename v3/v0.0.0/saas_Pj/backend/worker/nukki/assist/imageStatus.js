import { promisePool } from '../../../common/utils/connectDB.js';

/**
 * 누끼 이미지 생성 상태 업데이트
 * @param {number} userId - 사용자 ID
 * @param {number} productId - 상품 ID
 * @returns {Promise<boolean>} 업데이트 성공 여부
 */
export async function updateNukkiImageStatus(userId, productId) {
  try {
    // 상품 가공 상태 업데이트
    const [updateStatus] = await promisePool.execute(
      `UPDATE processing_status 
       SET nukki_created = TRUE
       WHERE userid = ? AND productid = ?`,
      [userId, productId]
    );
    
    return updateStatus.affectedRows > 0;
  } catch (error) {
    console.error(`누끼 이미지 상태 업데이트 중 오류(${userId}, ${productId}):`, error);
    throw error;
  }
} 