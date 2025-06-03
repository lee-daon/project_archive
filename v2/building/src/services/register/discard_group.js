/**
 * @fileoverview 상품 그룹 폐기 관련 서비스 로직을 담당하는 모듈
 * @module register/discard_group
 */

import { getProductIdsByGroup } from '../../db/register/getBannedProductsByGroup.js';
import { discardProducts } from '../../db/pre_register/preRegisterDb.js';
import { deleteProductsFromRegisterManagement } from '../../db/register/deleteRegisterRow.js';

/**
 * 상품 그룹 단위 폐기 처리 서비스
 * 지정된 그룹에 속하는 모든 상품을 폐기 처리합니다.
 * 
 * @async
 * @param {string} groupCode - 폐기할 상품 그룹 코드
 * @param {string} groupMemo - 폐기할 상품 그룹 메모
 * @param {string} tabType - 탭 타입 (common, coopang, naver)
 * @returns {Promise<Object>} 폐기 처리 결과 객체
 * @property {boolean} success - 성공 여부
 * @property {number} count - 폐기된 상품 개수
 * @property {string} message - 결과 메시지
 * @throws {Error} 폐기 처리 중 오류 발생 시
 */
export async function discardProductsGroupService(groupCode, groupMemo, tabType) {
  try {
    // 그룹 내 폐기할 상품 ID 목록 가져오기
    const productIds = await getProductIdsByGroup(groupCode, groupMemo, tabType);
    
    // 상품이 없는 경우 오류 처리
    if (!productIds || productIds.length === 0) {
      throw new Error('폐기할 상품이 없습니다.');
    }
    
    // 상품 폐기 처리
    const result = await discardProducts(productIds);
    
    // coopang_register_management와 naver_register_management 테이블에서 삭제
    const deleteResult = await deleteProductsFromRegisterManagement(productIds);
    
    return {
      success: true,
      count: result.updatedCount,
      coopangDeleted: deleteResult.coopangDeleted,
      naverDeleted: deleteResult.naverDeleted,
      message: '상품 폐기가 성공적으로 처리되었습니다.'
    };
    
  } catch (error) {
    // 오류 로깅 후 상위로 전파
    console.error('상품 그룹 폐기 서비스 오류:', error);
    throw error;
  }
}
