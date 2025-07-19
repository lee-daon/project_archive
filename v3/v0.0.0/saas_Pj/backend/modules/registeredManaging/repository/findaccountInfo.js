import { promisePool } from '../../../common/utils/connectDB.js';

/**
 * @typedef {object} SuccessResponse
 * @property {boolean} success - 항상 true
 * @property {object} data - 플랫폼별 API 키 정보
 * @property {number} marketNumber - 마켓 번호
 * @property {string | number} productNumber - 플랫폼에 등록된 상품 번호
 */

/**
 * @typedef {object} FailureResponse
 * @property {boolean} success - 항상 false
 * @property {string} message - 실패 사유
 * @property {string} [error] - (선택적) 기술적인 에러 메시지
 */

/**
 * 플랫폼별 계정 정보와 "플랫폼에 등록된 상품번호"를 함께 조회
 * @param {number} userid - 사용자 ID
 * @param {string} productid - 상품 ID
 * @param {string} platform - 플랫폼명 (coopang, naver, elevenstore)
 * @returns {Promise<SuccessResponse | FailureResponse>} 계정 정보 및 상품번호 또는 실패 정보
 */
async function findAccountInfo(userid, productid, platform) {
    try {
        let registerTable, accountTable, accountFields, productNumberColumn;

        switch (platform.toLowerCase()) {
            case 'coopang':
                registerTable = 'coopang_register_management';
                accountTable = 'coopang_account_info';
                accountFields = ['access_key', 'secret_key', 'vendor_id'];
                productNumberColumn = 'registered_product_number';
                break;
            case 'naver':
                registerTable = 'naver_register_management';
                accountTable = 'naver_account_info';
                accountFields = ['naver_client_id', 'naver_client_secret'];
                productNumberColumn = 'originProductNo';
                break;
            case 'elevenstore':
                registerTable = 'elevenstore_register_management';
                accountTable = 'elevenstore_account_info';
                accountFields = ['api_key'];
                productNumberColumn = 'originProductNo';
                break;
            default:
                return { success: false, message: '지원하지 않는 플랫폼입니다.' };
        }

        // 1단계: register_management 테이블에서 market_number와 "상품번호" 조회
        const findMarketNumberQuery = `
            SELECT market_number, ${productNumberColumn} AS productNumber
            FROM ${registerTable}
            WHERE userid = ? AND productid = ?
            LIMIT 1
        `;

        const [marketRows] = await promisePool.execute(findMarketNumberQuery, [userid, productid]);

        if (marketRows.length === 0) {
            return { success: false, message: `${platform} 등록 관리 테이블에 해당 상품이 없습니다.` };
        }

        const { market_number, productNumber } = marketRows[0];

        // "상품번호"가 없으면, 마켓에 등록된 상품이 아니므로 API 호출 대상이 아님
        if (!productNumber) {
            return { success: false, message: `${platform}에 등록된 상품이 아닙니다 (상품번호 없음).` };
        }
        
        if (!market_number) {
            return { success: false, message: `${platform} 마켓 번호가 설정되지 않았습니다.` };
        }

        // 2단계: account_info 테이블에서 계정 정보 조회
        const fieldsList = accountFields.join(', ');
        const marketNumberField = platform.toLowerCase() === 'coopang' ? 'coopang_market_number' : 
                                 platform.toLowerCase() === 'naver' ? 'naver_market_number' :
                                 'elevenstore_market_number';
        
        const findAccountQuery = `
            SELECT ${fieldsList}
            FROM ${accountTable}
            WHERE userid = ? AND ${marketNumberField} = ?
            LIMIT 1
        `;

        const [accountRows] = await promisePool.execute(findAccountQuery, [userid, market_number]);

        if (accountRows.length === 0) {
            return { success: false, message: `${platform} 계정 정보를 찾을 수 없습니다.` };
        }

        // 3단계: 필수 필드 확인
        const accountData = accountRows[0];
        for (const field of accountFields) {
            if (!accountData[field]) {
                return { success: false, message: `${platform} 계정 설정이 불완전합니다. ${field}이(가) 필요합니다.` };
            }
        }

        console.log(`계정 및 상품번호 조회 성공 - platform: ${platform}, market_number: ${market_number}, productNumber: ${productNumber}`);

        return {
            success: true,
            data: accountData,
            marketNumber: market_number,
            productNumber: productNumber, // 조회된 플랫폼별 상품번호 반환
        };

    } catch (error) {
        console.error('계정 정보 조회 오류:', error.message);
        return { success: false, message: '계정 정보 조회 중 오류가 발생했습니다.', error: error.message };
    }
}

export { findAccountInfo }; 