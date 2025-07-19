import { promisePool } from '../../../../../common/utils/connectDB.js';

/**
 * ESM 엑셀 생성 시 여러 상품 상태 일괄 업데이트
 * @param {number} userid - 사용자 ID
 * @param {Array<Object>} successProducts - 성공한 상품 정보 배열 [{productid, finalMainPrice, marketNumber}]
 * @param {Array<Object>} failedProducts - 실패한 상품 정보 배열 [{productid, errorMessage}]
 * @returns {Promise<boolean>} 저장 성공 여부
 */
export async function saveBulkStatus(userid, successProducts = [], failedProducts = []) {
    const connection = await promisePool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        // 1. 성공한 상품들 처리
        if (successProducts.length > 0) {
            const successProductIds = successProducts.map(p => p.productid);
            const successPlaceholders = successProductIds.map(() => '?').join(',');

            // final_main_price를 위한 CASE문 생성
            let priceCaseQuery = 'CASE productid ';
            const priceParams = [];
            successProducts.forEach(p => {
                priceCaseQuery += 'WHEN ? THEN ? ';
                priceParams.push(p.productid, p.finalMainPrice);
            });
            priceCaseQuery += 'END';

            // esm_register_management 일괄 업데이트 (status, final_main_price)
            const updateManagementQuery = `
                UPDATE esm_register_management 
                SET status = 'success', final_main_price = ${priceCaseQuery}
                WHERE userid = ? AND productid IN (${successPlaceholders})
            `;
            await connection.execute(updateManagementQuery, [...priceParams, userid, ...successProductIds]);
            
            // status 테이블 일괄 업데이트
            await connection.execute(
                `UPDATE status SET esm_registered = TRUE, esm_register_failed = FALSE WHERE userid = ? AND productid IN (${successPlaceholders})`,
                [userid, ...successProductIds]
            );

            // market_number별 SKU 카운트 업데이트
            const skuCountByMarket = successProducts.reduce((acc, product) => {
                if (product.marketNumber) {
                    acc[product.marketNumber] = (acc[product.marketNumber] || 0) + 1;
                }
                return acc;
            }, {});

            for (const marketNumber in skuCountByMarket) {
                const count = skuCountByMarket[marketNumber];
                await connection.execute(
                    `UPDATE esm_account_info SET registered_sku_count = registered_sku_count + ? WHERE userid = ? AND esm_market_number = ?`,
                    [count, userid, marketNumber]
                );
            }
        }
        
        // 2. 실패한 상품들 처리
        if (failedProducts.length > 0) {
            const failedProductIds = failedProducts.map(p => p.productid);
            const failedPlaceholders = failedProductIds.map(() => '?').join(',');

            // esm_register_management 상태 일괄 업데이트
            await connection.execute(
                `UPDATE esm_register_management SET status = 'fail' WHERE userid = ? AND productid IN (${failedPlaceholders})`,
                [userid, ...failedProductIds]
            );
            
            // status 테이블 일괄 업데이트
            await connection.execute(
                `UPDATE status SET esm_register_failed = TRUE, esm_registered = FALSE WHERE userid = ? AND productid IN (${failedPlaceholders})`,
                [userid, ...failedProductIds]
            );
            
            // error_log에 여러 오류 일괄 기록
            const errorLogValues = failedProducts.map(p => [userid, p.productid, p.errorMessage]);
            await connection.query(
                'INSERT INTO error_log (userid, productid, error_message) VALUES ?',
                [errorLogValues]
            );
        }
        
        await connection.commit();
        
        console.log(`ESM 일괄 상태 업데이트 완료: 성공 ${successProducts.length}개, 실패 ${failedProducts.length}개`);
        
        return true;
        
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        
        console.error('ESM 일괄 상태 업데이트 중 오류:', error);
        throw error;
        
    } finally {
        if (connection) {
            connection.release();
        }
    }
}
