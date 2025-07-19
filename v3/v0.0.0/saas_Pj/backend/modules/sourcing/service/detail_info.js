import { addToQueue } from '../../../common/utils/redisClient.js';
import { setBatchSourcingPending } from '../repository/sourcing_async.js';
import { QUEUE_NAMES } from '../../../common/config/settings.js';

/**
 * 상품 상세 정보 처리를 위해 큐에 작업을 추가하고 상태를 업데이트합니다
 * @param {number} userid - 사용자 ID
 * @param {Array} products - 상품 정보 배열 [{productId, productName}]
 * @param {number} commitCode - 그룹 코드
 * @param {string|null} sameCategoryId - 동일 카테고리 ID
 * @returns {Promise<{success: boolean, message: string, queueCount: number, statusCount: number}>}
 */
export const enqueueDetailJobs = async (userid, products, commitCode, sameCategoryId = null) => {
  try {
    if (!Array.isArray(products) || products.length === 0) {
      return {
        success: false,
        message: '처리할 상품이 없습니다.',
        queueCount: 0,
        statusCount: 0
      };
    }

    if (commitCode === undefined || commitCode === null) {
      return {
        success: false,
        message: 'commitCode가 필요합니다.',
        queueCount: 0,
        statusCount: 0
      };
    }

    console.log(`사용자 ${userid}의 ${products.length}개 상품 처리 시작 (commitCode: ${commitCode})`);
    
    // 모든 상품 ID 추출
    const productIds = products.map(item => item.productId);
    
    // 1. sourcing_status 테이블에 상태 업데이트 (pending) - commitCode 포함
    const statusResult = await setBatchSourcingPending(userid, productIds, commitCode);
    
    if (!statusResult.success) {
      return {
        success: false,
        message: '상품 상태 업데이트 중 오류가 발생했습니다.',
        queueCount: 0,
        statusCount: 0
      };
    }
    
    // 2. 각 상품을 Redis 큐에 추가
    let queueCount = 0;
    
    for (const product of products) {
      try {
        // Redis 큐에 작업 추가
        const jobData = {
          userid,
          productId: product.productId,
          productName: product.productName,
          sameCategoryId, // 동일 카테고리 ID 추가
        };
        
        await addToQueue(QUEUE_NAMES.TAOBAO_DETAIL_QUEUE, jobData);
        queueCount++;
      } catch (error) {
        console.error(`상품 ID ${product.productId} 큐 추가 중 오류:`, error);
        // 개별 오류는 무시하고 계속 진행
      }
    }
    
    console.log(`사용자 ${userid}의 상품 처리 완료: ${queueCount}개 큐 추가, ${statusResult.count}개 상태 업데이트 (commitCode: ${commitCode})`);
    
    return {
      success: true,
      message: `${queueCount}개 상품이 처리 대기열에 추가되었습니다. (그룹코드: ${commitCode})`,
      queueCount,
      statusCount: statusResult.count
    };
  } catch (error) {
    console.error('상품 처리 중 오류:', error);
    return {
      success: false,
      message: `상품 처리 중 오류가 발생했습니다: ${error.message}`,
      queueCount: 0,
      statusCount: 0
    };
  }
};
