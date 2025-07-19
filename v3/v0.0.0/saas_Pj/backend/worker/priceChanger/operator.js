import { changeCoupangPrice } from './service/changeCoupangPrice.js';
import { changeNaverPrice } from './service/changeNaverPrice.js';
import { changeElevenstorePrice } from './service/changeElevenstorePrice.js';
import { delay, API_RATE_LIMITS } from '../../common/config/detailsetting.js';

/**
 * 마켓 API를 호출하여 가격을 변경하는 작업만 수행 (DB 접근 없음)
 * @param {object} task - 큐에서 받은 작업 데이터
 * @returns {Promise<object>} API 호출 결과 { success: boolean, error?: string }
 */
export async function processPriceChange(task) {
    const { platform, apiKeys, priceChangeRequests } = task;

    try {
        console.log(`가격 변경 API 호출 시작:`, { platform, requestCount: priceChangeRequests.length });

        if (platform === 'coopang') {
            for (const request of priceChangeRequests) {
                await changeCoupangPrice(apiKeys.access_key, apiKeys.secret_key, request.productNumber, request.actualDiscount);
                await delay(API_RATE_LIMITS.COUPANG.PRICE_CHANGE_DELAY);
            }
        } else if (platform === 'naver') {
            // 네이버는 할인율별로 그룹화하여 벌크 처리
            const discountGroups = {};
            priceChangeRequests.forEach(req => {
                if (!discountGroups[req.actualDiscount]) discountGroups[req.actualDiscount] = [];
                discountGroups[req.actualDiscount].push(parseInt(req.productNumber));
            });

            for (const [discount, productNumbers] of Object.entries(discountGroups)) {
                await changeNaverPrice(productNumbers, parseFloat(discount), apiKeys.naver_client_id, apiKeys.naver_client_secret);
            }
        } else if (platform === 'elevenstore') {
            for (const request of priceChangeRequests) {
                await changeElevenstorePrice(request.productNumber, request.currentPrice, request.currentDiscountRate, request.additionalDiscountRate, apiKeys.api_key);
                await delay(API_RATE_LIMITS.ELEVENSTORE.PRICE_CHANGE_DELAY);
            }
        }
        return { success: true };
    } catch (error) {
        console.error(`가격 변경 API 처리 중 오류:`, { platform, error: error.message });
        return { success: false, error: error.message };
    }
} 