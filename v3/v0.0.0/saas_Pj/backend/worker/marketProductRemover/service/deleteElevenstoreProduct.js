/**
 * 11번가 상품 전시중지 모듈
 * @module deleteProduct
 */
import iconv from 'iconv-lite';

/**
 * 11번가 상품 전시중지
 * @param {string} productNumber - 상품번호
 * @param {string} apiKey - 11번가 API 키
 * @returns {Promise<Object>} API 응답 결과
 */
async function deleteElevenstoreProduct(productNumber, apiKey) {
    try {
        if (!productNumber || !apiKey) {
            throw new Error('상품번호와 API 키가 모두 필요합니다.');
        }

        const url = `http://api.11st.co.kr/rest/prodstatservice/stat/stopdisplay/${productNumber}`;
        
        console.log(`11번가 상품 전시중지 요청 - 상품번호: ${productNumber}`);

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'openapikey': apiKey
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // EUC-KR 인코딩 처리
        const buffer = await response.arrayBuffer();
        const xmlData = iconv.decode(Buffer.from(buffer), 'euc-kr');

        console.log(`11번가 상품 전시중지 성공 - 상품번호: ${productNumber}`);
        
        return {
            success: true,
            message: '상품 전시중지 성공',
            data: xmlData,
            productNumber: productNumber
        };

    } catch (error) {
        console.error(`11번가 상품 전시중지 오류 - 상품번호: ${productNumber}`, error);
        
        return {
            success: false,
            message: error.message,
            error: error.message,
            productNumber: productNumber
        };
    }
}

export { deleteElevenstoreProduct };
