/**
 * 네이버 상품 삭제 모듈
 * @module deleteProduct
 */
import { generateSignature, getAuthToken } from '../../../common/utils/naver_auth.js';
import { proxyDelete } from '../../../common/utils/proxy.js';

/**
 * 네이버 단일 상품 삭제
 * @param {number} originProductNo - 원상품번호
 * @param {string} clientId - 네이버 API 클라이언트 ID
 * @param {string} clientSecret - 네이버 API 클라이언트 시크릿
 * @returns {Promise<Object>} API 응답 결과
 */
async function deleteNaverProduct(originProductNo, clientId, clientSecret) {
    try {
        console.log(`네이버 상품 삭제 시작 - 원상품번호: ${originProductNo}`);

        // 입력값 검증
        if (!originProductNo || typeof originProductNo !== 'number') {
            throw new Error('유효한 원상품번호가 필요합니다.');
        }

        if (!clientId || !clientSecret) {
            throw new Error('네이버 API 클라이언트 ID와 시크릿이 필요합니다.');
        }

        // 네이버 API 인증 토큰 획득
        const timestamp = Date.now();
        const signature = generateSignature(clientId, clientSecret, timestamp);
        const tokenData = await getAuthToken(clientId, signature, 'SELF', '', timestamp);

        // 프록시를 통한 API 호출
        const apiUrl = `api.commerce.naver.com/external/v2/products/origin-products/${originProductNo}`;
        const headers = {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Accept': 'application/json;charset=UTF-8'
        };

        console.log('네이버 API 상품 삭제 요청 전송 중...');
        const response = await proxyDelete(apiUrl, headers);

        console.log('네이버 상품 삭제 성공:', response.data);
        
        return {
            success: true,
            message: `상품 삭제 완료 - 원상품번호: ${originProductNo}`,
            data: response.data,
            originProductNo: originProductNo
        };

    } catch (error) {
        console.error('네이버 상품 삭제 오류:', error);
        
        // 상세 오류 정보 출력
        if (error.response && error.response.data) {
            console.error('API 오류 상세:', JSON.stringify(error.response.data, null, 2));
        }

        return {
            success: false,
            message: error.message,
            error: error.response ? error.response.data : error.message,
            originProductNo: originProductNo
        };
    }
}


export { deleteNaverProduct}; 