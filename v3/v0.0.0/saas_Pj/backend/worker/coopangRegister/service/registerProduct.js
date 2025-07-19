import { createCoupangAuthHeaders } from '../../../common/utils/coopang_auth.js';
import { proxyPost } from '../../../common/utils/proxy.js';

/**
 * 쿠팡에 상품을 등록하는 함수
 * @param {Object} coupangData - 쿠팡 등록용 데이터 (mapping.js에서 변환된 데이터)
 * @param {string} accessKey - 쿠팡 액세스 키
 * @param {string} secretKey - 쿠팡 시크릿 키
 * @returns {Promise<Object>} 등록 결과
 */
export async function registerProductToCoupang(coupangData, accessKey, secretKey) {
    try {

        
        // 입력값 검증
        if (!coupangData) {
            throw new Error('등록할 상품 데이터가 없습니다.');
        }
        
        if (!accessKey || !secretKey) {
            throw new Error('쿠팡 API 인증 정보가 없습니다.');
        }
        
        if (!coupangData.items || !Array.isArray(coupangData.items) || coupangData.items.length === 0) {
            throw new Error('등록할 상품 아이템이 없습니다.');
        }
        
        // API 요청 설정
        const method = 'POST';
        const path = '/v2/providers/seller_api/apis/api/v1/marketplace/seller-products';
        const query = '';
        
        // 쿠팡 인증 헤더 생성
        const headers = createCoupangAuthHeaders(accessKey, secretKey, method, path, query);
        
        // 프록시를 통한 쿠팡 API 요청
        const url = `api-gateway.coupang.com${path}`;
        
        
        
        // API 호출
        const response = await proxyPost(url, coupangData, headers);
        
        
        // 쿠팡 API 응답 분석 (data.code로 성공/실패 판단)
        if (response.data && response.data.code === 'SUCCESS') {
            // 등록 성공
            return {
                success: true,
                data: response.data,
                message: `쿠팡 상품 등록 성공 - ${coupangData.items.length}개 아이템`,
                registeredItems: coupangData.items.length,
                productName: coupangData.sellerProductName,
                registeredProductNumber: response.data.data // 쿠팡에서 받은 상품 번호
            };
        } else {
            // 등록 실패 (data.code가 ERROR이거나 다른 값)
            const errorMessage = response.data?.message || '알 수 없는 오류';
            console.error('쿠팡 상품 등록 실패 - API 에러:', errorMessage);
            
            return {
                success: false,
                data: response.data,
                error: errorMessage,
                message: `쿠팡 상품 등록 실패: ${errorMessage}`,
                registeredItems: 0,
                productName: coupangData.sellerProductName
            };
        }
        
    } catch (error) {
        console.error('쿠팡 상품 등록 실패:', error);
        
        // 에러 응답 처리
        let errorMessage = error.message;
        let errorData = null;
        
        if (error.response) {
            // API 에러 응답이 있는 경우
            errorMessage = error.response.data?.message || error.response.statusText || error.message;
            errorData = error.response.data;
            
            console.error('쿠팡 API 에러 응답:', {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data
            });
        }
        
        return {
            success: false,
            error: errorMessage,
            errorData: errorData,
            message: `쿠팡 상품 등록 실패: ${errorMessage}`,
            registeredItems: 0
        };
    }
}