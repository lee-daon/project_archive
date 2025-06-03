import { promisePool } from '../connectDB.js';

/**
 * 네이버에 등록할 상품 ID 목록을 조회합니다
 * @param {string} groupCode - 상품 그룹 코드
 * @param {string|null} groupMemo - 상품 그룹 메모
 * @param {string} tabType - 등록 탭 타입 (common 또는 naver)
 * @returns {Promise<Array>} - 상품 ID 배열
 */
export const findNaverRegistTargets = async (groupCode, groupMemo, tabType) => {
  try {
    // 상태 조건 설정
    let statusCondition = '';
    if (tabType === 'common') {
      statusCondition = 'status.is_registrable = true AND status.registered = false';
    } else if (tabType === 'naver') {
      statusCondition = 'status.is_registrable = true AND status.naver_registered = false AND status.registered = false';
    } else {
      throw new Error('잘못된 등록 타입입니다.');
    }
    
    // 메모 조건 설정
    let memoCondition = '';
    let params = [groupCode];
    
    if (groupMemo === null || groupMemo === 'null' || groupMemo === '') {
      memoCondition = 'AND (pre.product_group_memo IS NULL OR pre.product_group_memo = "")';
    } else {
      memoCondition = 'AND pre.product_group_memo = ?';
      params.push(groupMemo);
    }
    
    const query = `
      SELECT pre.product_id
      FROM pre_register pre
      JOIN status ON pre.product_id = status.productid
      WHERE pre.product_group_code = ? ${memoCondition} AND ${statusCondition}
    `;
    
    const [products] = await promisePool.query(query, params);
    return products.map(product => product.product_id);
  } catch (error) {
    console.error('등록 대상 상품 조회 중 오류:', error);
    throw error;
  }
}; 