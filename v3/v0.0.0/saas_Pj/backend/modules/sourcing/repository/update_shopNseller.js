import { promisePool } from '../../../common/utils/connectDB.js';

/**
 * 판매자 정보 저장 함수 (없는 경우에만 저장)
 * @param {number} userid - 사용자 ID
 * @param {string} sellerId - 판매자 ID
 * @returns {Promise<boolean>} 저장 성공 여부
 */
export const saveSellerInfo = async (userid, sellerId) => {
  if (!sellerId) return false;
  
  try {
    // 판매자 정보가 이미 존재하는지 확인
    const [existingRows] = await promisePool.execute(
      'SELECT * FROM ban_seller WHERE userid = ? AND sellerid = ?',
      [userid, sellerId]
    );
    
    // 기존 데이터가 없으면 새로 삽입 (ban=false로 초기화)
    if (existingRows.length === 0) {
      await promisePool.execute(
        'INSERT INTO ban_seller (userid, sellerid, ban) VALUES (?, ?, ?)',
        [userid, sellerId, false]
      );
    }
    
    return true;
  } catch (error) {
    console.error('판매자 정보 저장 중 오류:', error);
    return false;
  }
};

/**
 * 상점 정보 저장 함수 (없는 경우에만 저장)
 * @param {number} userid - 사용자 ID
 * @param {string} shopId - 상점 ID
 * @returns {Promise<boolean>} 저장 성공 여부
 */
export const saveShopInfo = async (userid, shopId) => {
  if (!shopId) return false;
  
  try {
    // 상점 정보가 이미 존재하는지 확인
    const [existingRows] = await promisePool.execute(
      'SELECT * FROM ban_shop WHERE userid = ? AND shopid = ?',
      [userid, shopId]
    );
    
    // 기존 데이터가 없으면 새로 삽입 (ban=false로 초기화)
    if (existingRows.length === 0) {
      await promisePool.execute(
        'INSERT INTO ban_shop (userid, shopid, ban) VALUES (?, ?, ?)',
        [userid, shopId, false]
      );
    }
    
    return true;
  } catch (error) {
    console.error('상점 정보 저장 중 오류:', error);
    return false;
  }
};
