import { promisePool } from '../../utils/connectDB.js';

/**
 * 사용자의 현재 사업자 수와 최대 사업자 수를 확인하는 함수 (4개 마켓 중 가장 많은 사업자 수)
 * @param {number} userid - 사용자 ID
 * @returns {Promise<{currentMarketCount: number, maxMarketCount: number, canCreate: boolean}>}
 */
export async function checkMarketLimit(userid) {
  // 사용자의 최대 사업자 수 조회
  const [userInfo] = await promisePool.execute(
    'SELECT maximum_market_count FROM user_info WHERE userid = ?',
    [userid]
  );
  
  if (!userInfo.length) {
    throw new Error('사용자 정보를 찾을 수 없습니다.');
  }
  
  const maxMarketCount = userInfo[0].maximum_market_count;
  
  // 현재 등록된 사업자 수 조회 (네이버, 쿠팡, 11번가, ESM 중 최대값)
  const [naverCount] = await promisePool.execute(
    'SELECT COUNT(*) as count FROM naver_account_info WHERE userid = ?',
    [userid]
  );
  
  const [coopangCount] = await promisePool.execute(
    'SELECT COUNT(*) as count FROM coopang_account_info WHERE userid = ?',
    [userid]
  );
  
  const [elevenstoreCount] = await promisePool.execute(
    'SELECT COUNT(*) as count FROM elevenstore_account_info WHERE userid = ?',
    [userid]
  );
  
  const [esmCount] = await promisePool.execute(
    'SELECT COUNT(*) as count FROM esm_account_info WHERE userid = ?',
    [userid]
  );
  
  const currentMarketCount = Math.max(naverCount[0].count, coopangCount[0].count, elevenstoreCount[0].count, esmCount[0].count);
  
  return {
    currentMarketCount,
    maxMarketCount,
    canCreate: currentMarketCount < maxMarketCount
  };
}

/**
 * 사업자 생성 가능 여부를 확인하는 함수
 * @param {number} userid - 사용자 ID
 * @throws {Error} 사업자 수 제한을 초과한 경우 에러를 던짐
 */
export async function validateMarketCreation(userid) {
  const limitInfo = await checkMarketLimit(userid);
  
  if (!limitInfo.canCreate) {
    throw new Error('등록가능 사업자수를 초과하였습니다');
  }
  
  return true;
}
