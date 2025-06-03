import { promisePool } from '../connectDB.js';

/**
 * 판매자 금지 여부 확인 함수
 * @param {string} sellerId - 판매자 ID
 * @returns {Promise<Object|null>} 판매자 금지 정보 (존재하지 않으면 null)
 */
export const checkSellerBan = async (sellerId) => {
  try {
    const [results] = await promisePool.execute(
      'SELECT ban, updated_at FROM ban_seller WHERE sellerid = ?',
      [sellerId]
    );
    
    if (results.length === 0) {
      return null;
    }
    
    const daysDiff = Math.floor((new Date() - new Date(results[0].updated_at)) / (1000 * 60 * 60 * 24));
    
    return {
      ban: results[0].ban === 1,
      daysSinceUpdate: daysDiff
    };
  } catch (error) {
    console.error('판매자 금지 여부 확인 중 오류:', error);
    throw error;
  }
};

/**
 * 상점 금지 여부 확인 함수
 * @param {string} shopId - 상점 ID
 * @returns {Promise<Object|null>} 상점 금지 정보 (존재하지 않으면 null)
 */
export const checkShopBan = async (shopId) => {
  try {
    const [results] = await promisePool.execute(
      'SELECT ban, updated_at FROM ban_shop WHERE shopid = ?',
      [shopId]
    );
    
    if (results.length === 0) {
      return null;
    }
    
    const daysDiff = Math.floor((new Date() - new Date(results[0].updated_at)) / (1000 * 60 * 60 * 24));
    
    return {
      ban: results[0].ban === 1,
      daysSinceUpdate: daysDiff
    };
  } catch (error) {
    console.error('상점 금지 여부 확인 중 오류:', error);
    throw error;
  }
};

/**
 * 판매자 또는 상점이 금지되었는지 확인하는 통합 함수
 * @param {string} sellerId - 판매자 ID
 * @param {string} shopId - 상점 ID
 * @returns {Promise<Object>} 금지 정보와 경고 메시지
 */
export const checkBanStatus = async (sellerId, shopId) => {
  try {
    const sellerBanInfo = await checkSellerBan(sellerId);
    const shopBanInfo = await checkShopBan(shopId);
    
    let warning = null;
    let isBanned = false;
    
    // 판매자 금지 확인
    if (sellerBanInfo) {
      if (sellerBanInfo.ban) {
        isBanned = true;
        warning = {
          type: 'seller',
          message: '금지된 판매자입니다. 이 판매자의 상품은 수집할 수 없습니다.',
          banned: true
        };
      } else {
        warning = {
          type: 'seller',
          message: `${sellerBanInfo.daysSinceUpdate}일 전에 소싱한 적이 있는 판매자입니다. 계속 진행하시겠습니까?`,
          banned: false
        };
      }
    }
    
    // 상점 금지 확인 (판매자가 금지되지 않은 경우에만)
    if (!warning && shopBanInfo) {
      if (shopBanInfo.ban) {
        isBanned = true;
        warning = {
          type: 'shop',
          message: '금지된 상점입니다. 이 상점의 상품은 수집할 수 없습니다.',
          banned: true
        };
      } else {
        warning = {
          type: 'shop',
          message: `${shopBanInfo.daysSinceUpdate}일 전에 소싱한 적이 있는 상점입니다. 계속 진행하시겠습니까?`,
          banned: false
        };
      }
    }
    
    return {
      warning,
      isBanned,
      needsConfirmation: warning && !warning.banned
    };
  } catch (error) {
    console.error('금지 상태 확인 중 오류:', error);
    throw error;
  }
}; 