import { promisePool } from '../../../common/utils/connectDB.js';

/**
 * 소싱 상태를 업데이트합니다
 * @param {number} userid - 사용자 ID
 * @param {number|string} productid - 상품 ID
 * @param {string} status - 소싱 상태 (pending, banshop, banseller, failsave, failapi, uncommit, commit)
 * @returns {Promise<boolean>} - 성공 여부
 */
export const updateSourcingStatus = async (userid, productid, status) => {
  try {
    const connection = await promisePool.getConnection();
    
    try {
      // 상태 유효성 검사
      const validStatuses = ['pending', 'banshop', 'banseller', 'failsave', 'failapi', 'uncommit', 'commit'];
      
      if (!validStatuses.includes(status)) {
        console.error(`유효하지 않은 소싱 상태: ${status}`);
        return false;
      }
      
      // 기존 레코드 확인
      const [rows] = await connection.execute(
        'SELECT * FROM sourcing_status WHERE userid = ? AND productid = ?',
        [userid, productid]
      );
      
      if (rows.length > 0) {
        // 기존 레코드 업데이트
        await connection.execute(
          'UPDATE sourcing_status SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE userid = ? AND productid = ?',
          [status, userid, productid]
        );
      } else {
        // 새 레코드 생성
        await connection.execute(
          'INSERT INTO sourcing_status (userid, productid, status) VALUES (?, ?, ?)',
          [userid, productid, status]
        );
      }
      
      return true;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(`소싱 상태 업데이트 중 오류 [userid: ${userid}, productid: ${productid}, status: ${status}]:`, error);
    return false;
  }
};

/**
 * 금지된 판매자로 상태를 업데이트합니다
 * @param {number} userid - 사용자 ID
 * @param {number|string} productid - 상품 ID
 * @returns {Promise<boolean>} - 성공 여부
 */
export const updateToSellerBanned = async (userid, productid) => {
  return updateSourcingStatus(userid, productid, 'banseller');
};

/**
 * 금지된 쇼핑몰로 상태를 업데이트합니다
 * @param {number} userid - 사용자 ID
 * @param {number|string} productid - 상품 ID
 * @returns {Promise<boolean>} - 성공 여부
 */
export const updateToShopBanned = async (userid, productid) => {
  return updateSourcingStatus(userid, productid, 'banshop');
};

/**
 * API 오류로 상태를 업데이트합니다
 * @param {number} userid - 사용자 ID
 * @param {number|string} productid - 상품 ID
 * @returns {Promise<boolean>} - 성공 여부
 */
export const updateToApiFailure = async (userid, productid) => {
  return updateSourcingStatus(userid, productid, 'failapi');
};

/**
 * 저장 실패로 상태를 업데이트합니다
 * @param {number} userid - 사용자 ID
 * @param {number|string} productid - 상품 ID
 * @returns {Promise<boolean>} - 성공 여부
 */
export const updateToSaveFailure = async (userid, productid) => {
  return updateSourcingStatus(userid, productid, 'failsave');
};

/**
 * 성공으로 상태를 업데이트합니다 (승인 전)
 * @param {number} userid - 사용자 ID
 * @param {number|string} productid - 상품 ID
 * @returns {Promise<boolean>} - 성공 여부
 */
export const updateToSuccess = async (userid, productid) => {
  return updateSourcingStatus(userid, productid, 'uncommit');
};

/**
 * 현재 소싱 상태를 조회합니다
 * @param {number} userid - 사용자 ID
 * @param {number|string} productid - 상품 ID
 * @returns {Promise<string|null>} - 소싱 상태 또는 null
 */
export const getSourcingStatus = async (userid, productid) => {
  try {
    const [rows] = await promisePool.execute(
      'SELECT status FROM sourcing_status WHERE userid = ? AND productid = ?',
      [userid, productid]
    );
    
    if (rows.length > 0) {
      return rows[0].status;
    } else {
      return null;
    }
  } catch (error) {
    console.error(`소싱 상태 조회 중 오류 [userid: ${userid}, productid: ${productid}]:`, error);
    return null;
  }
};
