import { 
  batchUpdateStatusToCommit, 
  deleteBatchProductStatus,
  getProductIdsWithStatus
} from '../repository/controlScrStatus.js';
import { DELETE_TARGET_STATUSES } from '../../../common/config/settings.js';

/**
 * 상품 ID 배열을 받아 상태를 처리하는 함수
 * - uncommit 상태인 것은 commit으로 변경 (commitcode는 기존 값 유지)
 * - banshop, banseller, failsave, failapi 상태인 것은 로우 삭제
 * 
 * @param {number} userid - 사용자 ID
 * @param {Array<string>} productIds - 상품 ID 배열
 * @returns {Promise<Object>} - 처리 결과 객체
 */
export const processProductsStatus = async (userid, productIds) => {
  try {
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return {
        success: false,
        message: '처리할 상품이 없습니다.',
        committedCount: 0,
        deletedCount: 0
      };
    }

    // 1. 먼저 uncommit 상태인 상품 ID 목록을 가져옴
    const uncommitProductIds = await getProductIdsWithStatus(userid, productIds, 'uncommit');
    
    // 2. uncommit 상태인 상품들을 commit 상태로 변경 (commitcode는 기존 값 유지)
    let committedCount = 0;
    if (uncommitProductIds.length > 0) {
      committedCount = await batchUpdateStatusToCommit(userid, uncommitProductIds);
    }
    
    // 3. 삭제 대상 상태(banshop, banseller, failsave, failapi)인 상품 ID 목록 조회
    const deleteTargets = [];
    
    for (const status of DELETE_TARGET_STATUSES) {
      const statusProductIds = await getProductIdsWithStatus(userid, productIds, status);
      deleteTargets.push(...statusProductIds);
    }
    
    // 4. 삭제 대상 상품들의 상태 레코드 삭제
    let deletedCount = 0;
    if (deleteTargets.length > 0) {
      deletedCount = await deleteBatchProductStatus(userid, deleteTargets);
    }
    
    return {
      success: true,
      message: `처리 완료: ${committedCount}개 상품 commit 처리, ${deletedCount}개 상품 삭제 처리`,
      committedCount,
      deletedCount
    };
  } catch (error) {
    console.error('상품 상태 처리 중 오류:', error);
    return {
      success: false,
      message: `상품 상태 처리 중 오류가 발생했습니다: ${error.message}`,
      committedCount: 0,
      deletedCount: 0,
      error
    };
  }
};
