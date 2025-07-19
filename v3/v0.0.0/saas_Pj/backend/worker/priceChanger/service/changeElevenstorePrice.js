/**
 * 11번가 상품 가격 변경 모듈
 * @module changePrice
 */
import iconv from 'iconv-lite';

/**
 * 할인율 유효성 검사
 * @param {number} discountRate - 할인율
 * @returns {boolean} 유효 여부
 */
function isValidDiscountRate(discountRate) {
    const rate = Number(discountRate);
    return !isNaN(rate) && rate >= 0 && rate <= 100;
} 

/**
 * 두 할인율을 합성하여 최종 할인율을 계산 (정수 반환)
 * @param {number} currentDiscountRate - 현재 할인율 (%)
 * @param {number} additionalDiscountRate - 추가 할인율 (%)
 * @returns {number} 최종 할인율 (정수 %)
 */
function calculateFinalDiscountRate(currentDiscountRate, additionalDiscountRate) {
    const curDisc = Number(currentDiscountRate) || 0;
    const addDisc = Number(additionalDiscountRate) || 0;
    
    // 할인율 합성 공식: d0 + dAdd - d0*dAdd/100
    const finalDiscountRate = curDisc + addDisc - (curDisc * addDisc) / 100;
    
    return Math.round(finalDiscountRate);
}
/**
 * 입력 파라미터 유효성 검사
 * @param {string} productNumber - 상품번호
 * @param {number} currentPrice - 현재 판매가격
 * @param {number} currentDiscountRate - 현재 할인율 (%)
 * @param {number} additionalDiscountRate - 추가 할인율 (%)
 * @param {string} apiKey - 11번가 API 키
 * @throws {Error} 유효성 검사 실패 시
 */
function validateInputs(productNumber, currentPrice, currentDiscountRate, additionalDiscountRate, apiKey) {
    if (!productNumber || !currentPrice || !apiKey) {
        throw new Error('상품번호, 현재가격, API 키가 모두 필요합니다.');
    }

    if (typeof currentPrice !== 'number' || currentPrice <= 0) {
        throw new Error('현재가격은 0보다 큰 숫자여야 합니다.');
    }

    if (!isValidDiscountRate(currentDiscountRate)) {
        throw new Error('현재할인율은 0~100 사이의 숫자여야 합니다.');
    }

    if (!isValidDiscountRate(additionalDiscountRate)) {
        throw new Error('추가할인율은 0~100 사이의 숫자여야 합니다.');
    }
}

/**
 * 11번가 API 요청 XML 생성
 * @param {number} currentPrice - 현재 판매가격
 * @param {number} finalDiscountRate - 최종 할인율
 * @returns {string} XML 데이터
 */
function createRequestXml(currentPrice, finalDiscountRate) {
    return `<?xml version="1.0" encoding="euc-kr" standalone="yes"?>
<Product>
  <selPrc>${currentPrice}</selPrc>
  <cuponcheck>Y</cuponcheck>
  <dscAmtPercnt>${finalDiscountRate}</dscAmtPercnt>
  <cupnDscMthdCd>02</cupnDscMthdCd>
  <cupnUseLmtDyYn>N</cupnUseLmtDyYn>
</Product>`;
}

/**
 * 11번가 단일 상품 가격/쿠폰 변경
 * @param {string} productNumber - 상품번호
 * @param {number} currentPrice - 현재 판매가격
 * @param {number} currentDiscountRate - 현재 할인율 (%)
 * @param {number} additionalDiscountRate - 추가 할인율 (%)
 * @param {string} apiKey - 11번가 API 키
 * @returns {Promise<Object>} API 응답 결과
 */
async function changeElevenstorePrice(productNumber, currentPrice, currentDiscountRate, additionalDiscountRate, apiKey) {
    try {
        // 입력값 유효성 검사
        validateInputs(productNumber, currentPrice, currentDiscountRate, additionalDiscountRate, apiKey);

        // 최종 할인율 계산 (정수)
        const finalDiscountRate = calculateFinalDiscountRate(currentDiscountRate, additionalDiscountRate);
        
        if (finalDiscountRate > 100) {
            throw new Error(`최종 할인율(${finalDiscountRate}%)이 100%를 초과할 수 없습니다.`);
        }

        // API 요청 준비
        const url = `http://api.11st.co.kr/rest/prodservices/product/priceCoupon/${productNumber}`;
        const xmlData = createRequestXml(currentPrice, finalDiscountRate);

        // API 호출
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'openapikey': apiKey,
                'Content-Type': 'text/xml; charset=euc-kr'
            },
            body: iconv.encode(xmlData, 'euc-kr')
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // 응답 처리 (EUC-KR 디코딩)
        const buffer = await response.arrayBuffer();
        const responseXml = iconv.decode(Buffer.from(buffer), 'euc-kr');
        
        return {
            success: true,
            message: '가격/쿠폰 변경 성공',
            data: responseXml,
            productNumber: productNumber,
            currentPrice: currentPrice,
            finalDiscountRate: finalDiscountRate
        };

    } catch (error) {
        console.error(`11번가 상품 가격/쿠폰 변경 오류 - 상품번호: ${productNumber}`, error);
        
        return {
            success: false,
            message: error.message,
            error: error.message,
            productNumber: productNumber
        };
    }
}

export { changeElevenstorePrice };