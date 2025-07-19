import { findAccountInfo } from '../repository/findaccountInfo.js';
import { getMultipleMarginInfo, updateCurrentMargin, updateElevenstoreDiscountRate } from '../repository/updatePriceStatus.js';
import { calculateNewMargin, calculateDiscountFromMargin, calculateFinalDiscountRate } from './utils/discountUtils.js';
import { addToQueue } from '../../../common/utils/redisClient.js';
import { QUEUE_NAMES } from '../../../common/config/settings.js';

/**
 * 각 상품별 할인율 계산 및 검증 (내부 헬퍼 함수)
 */
function processDiscountRequests(marginInfos, productIds, requestedDiscountPercent) {
    const validRequests = [];
    const failedItems = [];

    for (const productId of productIds) {
        const marginInfo = marginInfos.find(m => m.productid === productId);
        
        if (!marginInfo) {
            failedItems.push({ productId, success: false, error: `등록 정보를 찾을 수 없습니다.` });
            continue;
        }

        if (!marginInfo.productNumber) {
            validRequests.push({ productId, productNumber: null, skipApiCall: true, newMargin: marginInfo.currentMargin });
            continue;
        }

        const { currentMargin, minimumMargin, currentPrice, currentDiscountRate } = marginInfo;
        let actualDiscount = Math.round(requestedDiscountPercent);
        let resultMargin = calculateNewMargin(currentMargin, actualDiscount);

        if (resultMargin < minimumMargin) {
            if (currentMargin <= minimumMargin) {
                failedItems.push({ productId, success: false, error: `현재 마진(${currentMargin}%)이 최소 마진(${minimumMargin}%)과 같거나 낮아 할인할 수 없습니다.` });
                continue;
            }
            actualDiscount = calculateDiscountFromMargin(currentMargin, minimumMargin);
            resultMargin = minimumMargin;
        }
        
        const finalDiscountRate = calculateFinalDiscountRate(currentDiscountRate || 0, actualDiscount);

        validRequests.push({
            productId,
            productNumber: marginInfo.productNumber,
            actualDiscount,
            newMargin: resultMargin,
            isLimited: resultMargin === minimumMargin,
            skipApiCall: false,
            // 11번가용 추가 정보
            currentPrice,
            currentDiscountRate: currentDiscountRate || 0,
            additionalDiscountRate: actualDiscount,
            finalDiscountRate,
        });
    }
    return { validRequests, failedItems };
}

/**
 * 가격 변경 사전 작업을 처리하고 큐에 등록하는 서비스
 * @param {number} userid - 사용자 ID
 * @param {string[]} productIds - 상품 ID 배열
 * @param {string} platform - 플랫폼
 * @param {number} discountPercent - 할인율
 * @returns {Promise<object>} 처리 결과 객체
 */
export async function prepareAndQueuePriceChange(userid, productIds, platform, discountPercent) {
    try {
        // 1. 마진 정보 조회
        const marginResult = await getMultipleMarginInfo(userid, productIds, platform);
        if (!marginResult.success) {
            return { success: false, message: marginResult.message, statusCode: 500 };
        }

        // 2. 할인율 계산 및 검증
        const { validRequests, failedItems } = processDiscountRequests(marginResult.data, productIds, discountPercent);
        const apiRequests = validRequests.filter(req => !req.skipApiCall);

        // 3. DB 선-업데이트 (Optimistic Update)
        for (const req of apiRequests) {
            await updateCurrentMargin(userid, req.productId, platform, req.newMargin);
            if (platform === 'elevenstore') {
                await updateElevenstoreDiscountRate(userid, req.productId, req.finalDiscountRate);
            }
        }
        
        // 4. API 호출을 위한 계정 정보 조회
        const accountResult = apiRequests.length > 0 ? await findAccountInfo(userid, apiRequests[0].productId, platform) : null;
        
        let processedCount = 0;
        // 5. 큐에 API 호출 작업 추가
        if (accountResult && accountResult.success) {
            const task = {
                userid, // 워커가 사용자별 처리를 위해 필수적으로 사용합니다.
                platform,
                apiKeys: accountResult.data,
                priceChangeRequests: apiRequests // API 호출에 필요한 모든 정보 포함
            };
            await addToQueue(QUEUE_NAMES.PRICE_CHANGE_QUEUE, task);
            processedCount=apiRequests.length;
        }
        
        return {
            success: true,
            message: `가격 변경 요청이 등록되었습니다. ${productIds.length}개 중 ${processedCount}개가 처리 대상입니다.`,
            statusCode: 202,
            data: {
                totalCount: productIds.length,
                processedCount,
                failedCount: failedItems.length,
                failedItems,
            }
        };

    } catch (error) {
        console.error('가격 변경 준비 및 큐 등록 오류:', error);
        return { 
            success: false, 
            message: '가격 변경 처리 중 서버 오류가 발생했습니다.', 
            statusCode: 500,
            error: error.message 
        };
    }
}
