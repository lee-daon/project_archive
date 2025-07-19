import { deleteCoopangProduct } from './service/deleteCoopangProduct.js';
import { deleteNaverProduct } from './service/deleteNaverProduct.js';
import { deleteElevenstoreProduct } from './service/deleteElevenstoreProduct.js';

/**
 * 마켓에서 상품을 내리는 API 호출만 수행 (DB 접근 없음)
 * @param {object} task - 큐에서 받은 작업 데이터
 * @returns {Promise<object>} 작업 결과
 */
export async function removeProductFromMarket(task) {
    const { platform, productNumber, apiKeys } = task;

    try {
        console.log(`마켓 상품 내리기 API 호출 시작:`, { platform, productNumber });

        if (!productNumber || !apiKeys) {
            // 필수 정보가 없으면 처리 불가
            return { success: true, message: '상품번호 또는 API 키 정보가 없어 API 호출을 건너뜁니다.' };
        }

        let marketResult;
        
        switch (platform.toLowerCase()) {
            case 'coopang':
                marketResult = await deleteCoopangProduct(apiKeys.access_key, apiKeys.secret_key, parseInt(productNumber, 10));
                break;
            case 'naver':
                marketResult = await deleteNaverProduct(parseInt(productNumber, 10), apiKeys.naver_client_id, apiKeys.naver_client_secret);
                break;
            case 'elevenstore':
                marketResult = await deleteElevenstoreProduct(productNumber, apiKeys.api_key);
                break;
            default:
                marketResult = { success: false, error: '지원하지 않는 플랫폼입니다.' };
        }

        if (!marketResult.success) {
            console.error(`마켓 상품 내리기 API 실패:`, { platform, productNumber, error: marketResult.error });
        }
        
        return {
            success: marketResult.success,
            message: marketResult.message || marketResult.error,
        };

    } catch (error) {
        console.error(`마켓 상품 내리기 API 처리 중 오류:`, { platform, productNumber, error: error.message });
        return {
            success: false,
            error: error.message,
        };
    }
} 