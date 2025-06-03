import { promisePool } from '../connectDB.js';

/**
 * 그룹 코드와 그룹 메모, 탭 타입에 따라 폐기할 상품 ID 목록을 조회합니다.
 * 
 * @param {string} groupCode - 폐기할 상품 그룹 코드
 * @param {string} groupMemo - 폐기할 상품 그룹 메모
 * @param {string} tabType - 탭 타입 (common, coopang, naver)
 * @returns {Promise<Array<string>>} 폐기할 상품 ID 배열
 * @throws {Error} 조회 중 오류 발생 시
 */
export async function getProductIdsByGroup(groupCode, groupMemo, tabType) {
  // 탭 타입에 따른 조건 설정
  let statusCondition = '';
  
  if (tabType === 'common') {
    statusCondition = 'status.is_registrable = true AND status.registered = false';
  } else if (tabType === 'coopang') {
    statusCondition = 'status.is_registrable = true AND status.coopang_registered = false AND status.registered = false';
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
  
  try {
    // 폐기할 상품 ID 목록 조회
    const query = `
      SELECT pre.product_id
      FROM pre_register pre
      JOIN status ON pre.product_id = status.productid
      WHERE pre.product_group_code = ? ${memoCondition} AND ${statusCondition}
    `;
    
    const [products] = await promisePool.query(query, params);
    
    if (products.length === 0) {
      throw new Error('폐기할 상품이 없습니다.');
    }
    
    // 상품 ID 배열 반환
    return products.map(product => product.product_id);
    
  } catch (error) {
    throw error;
  }
}
