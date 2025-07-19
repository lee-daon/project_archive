import { promisePool } from '../../../common/utils/connectDB.js';

/**
 * 상품을 다시 등록 가능한 상태로 변경
 * @param {number} userid - 사용자 ID
 * @param {string} productid - 상품 ID
 * @param {string} platform - 플랫폼 (coopang, naver, elevenstore, esm)
 * @returns {Promise<Object>} 변경 결과
 */
async function makeRegisterable(userid, productid, platform) {
    const connection = await promisePool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        // 플랫폼별 설정
        let registerTable;
        let accountTable;
        let statusColumns;
        let productNumberColumns;
        
        switch (platform.toLowerCase()) {
            case 'coopang':
                registerTable = 'coopang_register_management';
                accountTable = 'coopang_account_info';
                statusColumns = {
                    registered: 'coopang_registered',
                    failed: 'coopang_register_failed'
                };
                productNumberColumns = ['registered_product_number'];
                break;
            case 'naver':
                registerTable = 'naver_register_management';
                accountTable = 'naver_account_info';
                statusColumns = {
                    registered: 'naver_registered',
                    failed: 'naver_register_failed'
                };
                productNumberColumns = ['originProductNo', 'smartstoreChannelProductNo'];
                break;
            case 'elevenstore':
                registerTable = 'elevenstore_register_management';
                accountTable = 'elevenstore_account_info';
                statusColumns = {
                    registered: 'elevenstore_registered',
                    failed: 'elevenstore_register_failed'
                };
                productNumberColumns = ['originProductNo'];
                break;
            case 'esm':
                registerTable = 'esm_register_management';
                accountTable = 'esm_account_info';
                statusColumns = {
                    registered: 'esm_registered',
                    failed: 'esm_register_failed'
                };
                productNumberColumns = ['originProductNo'];
                break;
            default:
                throw new Error(`지원하지 않는 플랫폼입니다: ${platform}`);
        }
        
        // 0. 먼저 market_number를 조회
        const getMarketNumberQuery = `
            SELECT market_number 
            FROM ${registerTable} 
            WHERE userid = ? AND productid = ?
        `;
        
        const [marketResult] = await connection.execute(getMarketNumberQuery, [userid, productid]);
        
        if (marketResult.length === 0) {
            throw new Error(`해당 상품을 찾을 수 없습니다. userid: ${userid}, productid: ${productid}, platform: ${platform}`);
        }
        
        const marketNumber = marketResult[0].market_number;
        
        // 1. account_info 테이블에서 registered_sku_count 감소 (0보다 클 때만)
        if (marketNumber) {
            const updateAccountQuery = `
                UPDATE ${accountTable}
                SET registered_sku_count = GREATEST(registered_sku_count - 1, 0),
                    updated_at = NOW()
                WHERE userid = ? AND ${platform.toLowerCase()}_market_number = ?
            `;
            
            await connection.execute(updateAccountQuery, [userid, marketNumber]);
        }
        
        // 2. 해당 플랫폼의 register_management 테이블 상태를 reuse로 변경하고 상품번호들을 NULL로 설정
        const productNumberSetClauses = productNumberColumns.map(col => `${col} = NULL`).join(', ');
        const updateRegisterQuery = `
            UPDATE ${registerTable}
            SET status = 'reuse',
                current_margin = NULL,
                ${productNumberSetClauses},
                updated_at = NOW()
            WHERE userid = ? AND productid = ?
        `;
        
        const [registerResult] = await connection.execute(updateRegisterQuery, [userid, productid]);
        
        if (registerResult.affectedRows === 0) {
            throw new Error(`상품 상태 업데이트에 실패했습니다. userid: ${userid}, productid: ${productid}, platform: ${platform}`);
        }
        
        // 3. status 테이블에서 해당 플랫폼의 registered, register_failed를 false로 변경
        const updateStatusQuery = `
            UPDATE status
            SET ${statusColumns.registered} = FALSE,
                ${statusColumns.failed} = FALSE,
                updated_at = NOW()
            WHERE userid = ? AND productid = ?
        `;
        
        await connection.execute(updateStatusQuery, [userid, productid]);
        
        await connection.commit();
        
        return {
            success: true,
            message: `${platform} 플랫폼 상품이 다시 등록 가능한 상태로 변경되었습니다.`,
            userid: userid,
            productid: productid,
            platform: platform,
            marketNumber: marketNumber
        };
        
    } catch (error) {
        await connection.rollback();
        console.error('makeRegisterable 오류:', error.message);
        
        return {
            success: false,
            error: error.message,
            userid: userid,
            productid: productid,
            platform: platform
        };
        
    } finally {
        connection.release();
    }
}

export { makeRegisterable };
