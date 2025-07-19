import { promisePool } from '../../../common/utils/connectDB.js';

/**
 * 사용자의 마켓별 등록 가능 개수를 확인합니다.
 * @param {number} userid - 사용자 ID
 * @param {string} marketType - 마켓 타입 ('naver', 'coopang' 또는 'elevenstore')
 * @param {number} marketNumber - 마켓 번호
 * @param {number} requestCount - 등록 요청 개수
 * @returns {Promise<{canRegister: boolean, availableCount: number, message: string}>}
 */
export const checkRegistrationLimit = async (userid, marketType, marketNumber, requestCount) => {
  try {
    let query, tableName;
    
    if (marketType === 'naver') {
      tableName = 'naver_account_info';
      query = `
        SELECT naver_maximun_sku_count, registered_sku_count 
        FROM ${tableName} 
        WHERE userid = ? AND naver_market_number = ?
      `;
    } else if (marketType === 'coopang') {
      tableName = 'coopang_account_info';
      query = `
        SELECT coopang_maximun_sku_count as naver_maximun_sku_count, registered_sku_count 
        FROM ${tableName} 
        WHERE userid = ? AND coopang_market_number = ?
      `;
    } else if (marketType === 'elevenstore') {
      tableName = 'elevenstore_account_info';
      query = `
        SELECT elevenstore_maximun_sku_count as naver_maximun_sku_count, registered_sku_count 
        FROM ${tableName} 
        WHERE userid = ? AND elevenstore_market_number = ?
      `;
    } else if (marketType === 'esm') {
      tableName = 'esm_account_info';
      query = `
        SELECT esm_maximun_sku_count as naver_maximun_sku_count, registered_sku_count 
        FROM ${tableName} 
        WHERE userid = ? AND esm_market_number = ?
      `;
    } else {
      return {
        canRegister: false,
        availableCount: 0,
        message: '지원하지 않는 마켓 타입입니다.'
      };
    }

    const [rows] = await promisePool.execute(query, [userid, marketNumber]);
    
    if (rows.length === 0) {
      return {
        canRegister: false,
        availableCount: 0,
        message: '해당 마켓 정보를 찾을 수 없습니다.'
      };
    }

    const { naver_maximun_sku_count: maxCount, registered_sku_count: currentCount } = rows[0];
    const availableCount = maxCount - currentCount;

    if (availableCount < requestCount) {
      return {
        canRegister: false,
        availableCount,
        message: `등록 가능한 상품 수를 초과했습니다. (요청: ${requestCount}개, 가능: ${availableCount}개)`
      };
    }

    return {
      canRegister: true,
      availableCount,
      message: '등록 가능합니다.'
    };

  } catch (error) {
    console.error('등록 제한 확인 중 오류:', error);
    throw error;
  }
};
