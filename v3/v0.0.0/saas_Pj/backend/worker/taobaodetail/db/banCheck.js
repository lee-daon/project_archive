import { promisePool } from '../../../common/utils/connectDB.js';

/**
 * 판매자의 금지 여부를 확인합니다
 * @param {number} userid - 사용자 ID
 * @param {string} sellerid - 판매자 ID
 * @returns {Promise<boolean>} - 금지 여부 (true: 금지, false: 허용)
 */
export const isSellerBanned = async (userid, sellerid) => {
  try {
    const [rows] = await promisePool.execute(
      'SELECT ban FROM ban_seller WHERE userid = ? AND sellerid = ?',
      [userid, sellerid]
    );
    
    // 데이터가 없으면 금지되지 않음
    if (rows.length === 0) {
      return false;
    }
    
    // ban 값에 따라 금지 여부 반환
    return rows[0].ban === 1 || rows[0].ban === true;
  } catch (error) {
    console.error(`판매자 금지 여부 확인 중 오류 [userid: ${userid}, sellerid: ${sellerid}]:`, error);
    // 오류 발생 시 기본값으로 금지되지 않음 반환
    return false;
  }
};

/**
 * 쇼핑몰의 금지 여부를 확인합니다
 * @param {number} userid - 사용자 ID
 * @param {string} shopid - 쇼핑몰 ID
 * @returns {Promise<boolean>} - 금지 여부 (true: 금지, false: 허용)
 */
export const isShopBanned = async (userid, shopid) => {
  try {
    const [rows] = await promisePool.execute(
      'SELECT ban FROM ban_shop WHERE userid = ? AND shopid = ?',
      [userid, shopid]
    );
    
    // 데이터가 없으면 금지되지 않음
    if (rows.length === 0) {
      return false;
    }
    
    // ban 값에 따라 금지 여부 반환
    return rows[0].ban === 1 || rows[0].ban === true;
  } catch (error) {
    console.error(`쇼핑몰 금지 여부 확인 중 오류 [userid: ${userid}, shopid: ${shopid}]:`, error);
    // 오류 발생 시 기본값으로 금지되지 않음 반환
    return false;
  }
};

/**
 * 판매자와 쇼핑몰의 금지 여부를 모두 확인합니다
 * @param {number} userid - 사용자 ID
 * @param {string} sellerid - 판매자 ID
 * @param {string} shopid - 쇼핑몰 ID
 * @returns {Promise<{isBanned: boolean, reason: string|null}>} - 금지 여부와 사유
 */
export const checkBanStatus = async (userid, sellerid, shopid) => {
  try {
    // 판매자 금지 여부 확인
    const isSellerBannedResult = await isSellerBanned(userid, sellerid);
    
    if (isSellerBannedResult) {
      return {
        isBanned: true,
        reason: 'banseller',
        message: `판매자(${sellerid})가 금지 목록에 포함되어 있습니다.`
      };
    }
    
    // 쇼핑몰 금지 여부 확인
    const isShopBannedResult = await isShopBanned(userid, shopid);
    
    if (isShopBannedResult) {
      return {
        isBanned: true,
        reason: 'banshop',
        message: `쇼핑몰(${shopid})이 금지 목록에 포함되어 있습니다.`
      };
    }
    
    // 모두 금지되지 않음
    return {
      isBanned: false,
      reason: null,
      message: null
    };
  } catch (error) {
    console.error(`금지 상태 확인 중 오류 [userid: ${userid}, sellerid: ${sellerid}, shopid: ${shopid}]:`, error);
    // 오류 발생 시 금지되지 않음으로 처리
    return {
      isBanned: false,
      reason: null,
      message: `금지 상태 확인 중 오류가 발생했습니다: ${error.message}`
    };
  }
};
