/**
 * 네이버 상품 가격 변경 모듈
 * @module changePrice
 */
import { generateSignature, getAuthToken } from '../../../common/utils/naver_auth.js';
import { proxyPut } from '../../../common/utils/proxy.js';

/**
 * 네이버 상품 가격 벌크 업데이트
 * @param {number[]} productIds - 원상품번호 배열
 * @param {number} discountRate - 할인률 (예: 10 = 10% 할인)
 * @param {string} clientId - 네이버 API 클라이언트 ID
 * @param {string} clientSecret - 네이버 API 클라이언트 시크릿
 * @returns {Promise<Object>} API 응답 결과
 */
async function changeNaverPrice(productIds, discountRate, clientId, clientSecret) {
    try {
        console.log(`네이버 상품 가격 변경 시작 - 상품 수: ${productIds.length}, 할인률: ${discountRate}%`);

        // 입력값 검증
        if (!Array.isArray(productIds) || productIds.length === 0) {
            throw new Error('상품 ID 배열이 비어있습니다.');
        }

        if (typeof discountRate !== 'number' || discountRate < 0 || discountRate > 100) {
            throw new Error('할인률은 0~100 사이의 숫자여야 합니다.');
        }

        if (!clientId || !clientSecret) {
            throw new Error('네이버 API 클라이언트 ID와 시크릿이 필요합니다.');
        }

        // 네이버 API 인증 토큰 획득
        const timestamp = Date.now();
        const signature = generateSignature(clientId, clientSecret, timestamp);
        const tokenData = await getAuthToken(clientId, signature, 'SELF', '', timestamp);

        // 벌크 업데이트 요청 데이터 구성
        const requestData = {
            originProductNos: productIds,
            productBulkUpdateType: 'SALE_PRICE',
            productSalePrice: {
                value: discountRate,
                productSalePriceChangerType: 'DOWN',
                productSalePriceChangerUnitType: 'PERCENT'
            }
        };

        // 프록시를 통한 API 호출
        const apiUrl = 'api.commerce.naver.com/external/v1/products/origin-products/bulk-update';
        const headers = {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json;charset=UTF-8'
        };

        console.log('네이버 API 벌크 업데이트 요청 전송 중...');
        const response = await proxyPut(apiUrl, requestData, headers);

        console.log('네이버 상품 가격 변경 성공:', response.data);
        
        return {
            success: true,
            message: `${productIds.length}개 상품 가격 변경 완료`,
            data: response.data,
            updatedProductCount: productIds.length,
            discountRate: discountRate
        };

    } catch (error) {
        console.error('네이버 상품 가격 변경 오류:', error);
        
        // 상세 오류 정보 출력
        if (error.response && error.response.data) {
            console.error('API 오류 상세:', JSON.stringify(error.response.data, null, 2));
        }

        return {
            success: false,
            message: error.message,
            error: error.response ? error.response.data : error.message
        };
    }
}


export { changeNaverPrice };
