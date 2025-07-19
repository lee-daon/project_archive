/**
 * 11번가 상품 등록 서비스
 * 실제 11번가 API에 상품을 등록합니다.
 */
import iconv from 'iconv-lite';

/**
 * 11번가에 상품 등록
 * @param {string} xmlString - 등록할 XML 문자열
 * @param {string} apiKey - 11번가 API 키
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @returns {Promise<{ success: boolean, registeredProductNumber: string|null, message: string, rawResponse?: string }>}
 */
export async function registerToElevenstore(xmlString, apiKey, userid, productid) {
    try {
        console.log(`11번가 등록 API 호출 시작 - userid: ${userid}, productid: ${productid}`);

        // API 요청 설정 (11번가 공식 샘플 형식 따름)
        const url = 'http://api.11st.co.kr/rest/prodservices/product';
        const headers = {
            'Content-type': 'text/xml;charset=EUC-KR',  // 공식 샘플과 동일
            'openapikey': apiKey  // 공식 샘플과 동일
        };

        // XML을 euc-kr로 인코딩
        const encodedXml = iconv.encode(xmlString, 'euc-kr');
        console.log('euc-kr 인코딩된 XML 크기:', encodedXml.length, 'bytes');

        // fetch API 사용 (성공한 elevenStoreAddress.js와 동일한 방식)
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: encodedXml
        });

        console.log('11번가 API 응답 수신 - 상태코드:', response.status);

        // fetch API 방식으로 응답 처리 (elevenStoreAddress.js와 동일)
        const buffer = await response.arrayBuffer();
        const decodedXml = iconv.decode(Buffer.from(buffer), 'euc-kr');

        // 응답 처리 - XML 파싱 내부 함수들
        const extractProductNumber = (xml) => {
            try {
                if (!xml || typeof xml !== 'string') return null;
                const productNoPattern = /<productNo[^>]*>([^<]+)<\/productNo>/i;
                const match = xml.match(productNoPattern);
                if (match && match[1]) return match[1].trim();
                console.warn('상품번호를 찾을 수 없습니다. 응답 내용:', xml.substring(0, 500));
                return null;
            } catch (error) {
                console.error('상품번호 추출 오류:', error);
                return null;
            }
        };

        const extractResultCode = (xml) => {
            try {
                if (!xml || typeof xml !== 'string') return null;
                const resultCodePattern = /<resultCode[^>]*>([^<]+)<\/resultCode>/i;
                const match = xml.match(resultCodePattern);
                return match && match[1] ? match[1].trim() : null;
            } catch (error) {
                console.error('결과 코드 추출 오류:', error);
                return null;
            }
        };

        const extractMessage = (xml) => {
            try {
                if (!xml || typeof xml !== 'string') return null;
                const messagePattern = /<message[^>]*>([^<]+)<\/message>/i;
                const match = xml.match(messagePattern);
                return match && match[1] ? match[1].trim() : null;
            } catch (error) {
                console.error('메시지 추출 오류:', error);
                return null;
            }
        };

        const extractErrorMessage = (xml) => {
            try {
                if (!xml || typeof xml !== 'string') return '알 수 없는 오류';
                
                const errorPatterns = [
                    /<message[^>]*>([^<]+)<\/message>/i,
                    /<errorMessage[^>]*>([^<]+)<\/errorMessage>/i,
                    /<error[^>]*>([^<]+)<\/error>/i,
                    /<description[^>]*>([^<]+)<\/description>/i
                ];

                for (const pattern of errorPatterns) {
                    const match = xml.match(pattern);
                    if (match && match[1]) return match[1].trim();
                }

                return xml.length > 200 ? xml.substring(0, 200) + '...' : xml;
            } catch (error) {
                console.error('오류 메시지 추출 오류:', error);
                return '오류 메시지 추출 실패';
            }
        };

        // 응답 파싱 및 결과 처리
        let result;
        if (response.status >= 200 && response.status < 300) {
            // 성공 응답 처리
            const registeredProductNumber = extractProductNumber(decodedXml);
            const resultCode = extractResultCode(decodedXml);
            const message = extractMessage(decodedXml);
            
            // 11번가 응답에서 성공 여부 판단
            if (registeredProductNumber && resultCode && (resultCode.includes('200') || resultCode.includes('210'))) {
                result = {
                    success: true,
                    registeredProductNumber,
                    message: message || '11번가 등록 성공',
                    rawResponse: decodedXml
                };
            } else {
                // 상품번호나 결과코드가 없는 경우
                result = {
                    success: false,
                    registeredProductNumber: null,
                    message: message || '등록 응답에서 상품번호 또는 성공 코드를 찾을 수 없습니다',
                    rawResponse: decodedXml
                };
            }
        } else {
            // HTTP 오류 응답 처리
            const errorMessage = extractErrorMessage(decodedXml);
            result = {
                success: false,
                registeredProductNumber: null,
                message: `11번가 API 오류 (${response.status}): ${errorMessage}`,
                rawResponse: decodedXml
            };
        }
        
        if (result.success) {
            console.log('11번가 등록 성공 - 상품번호:', result.registeredProductNumber);
        } else {
            console.error('11번가 등록 실패:', result.message);
        }

        return result;

    } catch (error) {
        console.error('11번가 등록 API 호출 오류:', error);
        
        // 네트워크 오류 또는 기타 예외 처리
        return {
            success: false,
            registeredProductNumber: null,
            message: `API 호출 오류: ${error.message}`,
            rawResponse: null
        };
    }
}

