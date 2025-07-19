import { promisePool } from '../../../common/utils/connectDB.js';

/**
 * targets 정보에 따라 적절한 상품 ID 배열을 조회하는 함수
 * 
 * @param {number} userId - 사용자 ID
 * @param {object} targets - 대상 상품 조회 정보
 * @returns {Promise<Array<number>>} - 상품 ID 배열
 */
export async function getTargetIds(userId, targets) {
  // targets.productIds가 직접 제공된 경우 바로 반환
  if (targets.type === 'commit' && targets.productIds && targets.productIds.length > 0) {
    console.log(`[${targets.type}] 타입으로 직접 제공된 상품 수: ${targets.productIds.length}`);
    return Promise.resolve(targets.productIds);
  }

  let sql = '';
  let params = [];

  // targets 타입에 따라 쿼리 구성
  switch (targets.type) {
    case 'all': 
      // 모든 상품
      sql = `
        SELECT productid 
        FROM sourcing_status 
        WHERE userid = ? AND status = 'commit'
      `;
      params = [userId];
      break;

    case 'recent':
      // 최근 n개 상품
      sql = `
        SELECT productid 
        FROM sourcing_status 
        WHERE userid = ? AND status = 'commit'
        ORDER BY created_at DESC 
        LIMIT ?
      `;
      params = [userId, targets.count];
      break;

    case 'past':
      // 과거 n개 상품
      sql = `
        SELECT productid 
        FROM sourcing_status 
        WHERE userid = ? AND status = 'commit'
        ORDER BY created_at ASC 
        LIMIT ?
      `;
      params = [userId, targets.count];
      break;

    case 'commit':
      // 특정 commitCode를 가진 상품
      sql = `
        SELECT productid 
        FROM sourcing_status 
        WHERE userid = ? AND commitcode = ? AND status = 'commit'
      `;
      params = [userId, targets.commitCode];
      break;

    default:
      return Promise.reject(new Error('잘못된 targets 타입입니다.'));
  }

  try {
    const [results] = await promisePool.query(sql, params);
    
    // 상품 ID 배열 추출
    const productIds = results.map(row => row.productid);
    
    console.log(`[${targets.type}] 타입으로 조회된 상품 수: ${productIds.length}`);
    return productIds;
  } catch (error) {
    console.error('상품 ID 조회 중 오류 발생:', error);
    throw error;
  }
}
