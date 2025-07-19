import { promisePool } from '../../../common/utils/connectDB.js';

/**
 * 쿠팡 등록 성공 시 데이터베이스 업데이트
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @param {Object} mappingData - 매핑된 쿠팡 데이터
 * @param {number} discountRate - 할인률
 * @param {number} registeredProductNumber - 쿠팡에서 받은 상품 번호
 * @param {number} marketNumber - 마켓 번호
 * @returns {Promise<Object>} 업데이트 결과
 */
export async function saveSuccessStatus(userid, productid, mappingData, discountRate, registeredProductNumber, marketNumber) {
    const connection = await promisePool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        // 1. coopang_register_management 테이블 업데이트
        await connection.execute(`
            UPDATE coopang_register_management 
            SET status = 'success',
                final_json = ?,
                discount_rate = ?,
                registered_product_number = ?
            WHERE userid = ? AND productid = ?
        `, [
            JSON.stringify(mappingData),
            discountRate,
            registeredProductNumber,
            userid,
            productid
        ]);
        
        // 2. coopang_account_info의 registered_sku_count 증가
        await connection.execute(`
            UPDATE coopang_account_info 
            SET registered_sku_count = registered_sku_count + 1
            WHERE userid = ? AND coopang_market_number = ?
        `, [userid, marketNumber]);
        
        // 3. status 테이블의 coopang_registered를 true로 설정
        await connection.execute(`
            UPDATE status 
            SET coopang_registered = TRUE
            WHERE userid = ? AND productid = ?
        `, [userid, productid]);
        
        await connection.commit();
        

        
        return {
            success: true,
            message: '쿠팡 등록 성공 상태 저장 완료'
        };
        
    } catch (error) {
        await connection.rollback();
        console.error(`❌ [${productid}] 쿠팡 등록 성공 상태 저장 실패:`, error);
        
        return {
            success: false,
            message: `쿠팡 등록 성공 상태 저장 실패: ${error.message}`
        };
    } finally {
        connection.release();
    }
}

/**
 * 쿠팡 등록 실패 시 옵션 매핑이 필요한 경우 데이터베이스 업데이트
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @param {Object} mappingData - 매핑된 쿠팡 데이터
 * @param {string} errorMessage - 오류 메시지
 * @returns {Promise<Object>} 업데이트 결과
 */
export async function saveOptionMapRequiredStatus(userid, productid, mappingData, errorMessage) {
    const connection = await promisePool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        // 1. coopang_register_management 테이블의 status를 optionMapRequired로 설정
        await connection.execute(`
            UPDATE coopang_register_management 
            SET status = 'optionMapRequired'
            WHERE userid = ? AND productid = ?
        `, [userid, productid]);
        
        // 2. error_log 테이블에 매핑된 JSON과 오류 메시지 저장
        await connection.execute(`
            INSERT INTO error_log (userid, productid, error_message, created_at)
            VALUES (?, ?, ?, NOW())
        `, [
            userid,
            productid,
            JSON.stringify({
                mappingData: mappingData,
                errorMessage: errorMessage,
                errorType: 'coopang_option_mapping_required'
            })
        ]);
        
        await connection.commit();
        
        console.log(`⚠️ [${productid}] 쿠팡 옵션 매핑 필요 상태 저장 완료`);
        
        return {
            success: true,
            message: '쿠팡 옵션 매핑 필요 상태 저장 완료'
        };
        
    } catch (error) {
        await connection.rollback();
        console.error(`❌ [${productid}] 쿠팡 옵션 매핑 필요 상태 저장 실패:`, error);
        
        return {
            success: false,
            message: `쿠팡 옵션 매핑 필요 상태 저장 실패: ${error.message}`
        };
    } finally {
        connection.release();
    }
}

/**
 * 쿠팡 등록 실패 시 데이터베이스 업데이트
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @param {Object} mappingData - 매핑된 쿠팡 데이터
 * @param {string} errorMessage - 오류 메시지
 * @returns {Promise<Object>} 업데이트 결과
 */
export async function saveFailStatus(userid, productid, mappingData, errorMessage) {
    const connection = await promisePool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        // 1. coopang_register_management 테이블의 status를 fail로 설정
        await connection.execute(`
            UPDATE coopang_register_management 
            SET status = 'fail'
            WHERE userid = ? AND productid = ?
        `, [userid, productid]);
        
        // 2. status 테이블의 coopang_register_failed를 true로 설정
        await connection.execute(`
            UPDATE status 
            SET coopang_register_failed = TRUE
            WHERE userid = ? AND productid = ?
        `, [userid, productid]);
        
        // 3. error_log 테이블에 매핑된 JSON과 오류 메시지 저장
        await connection.execute(`
            INSERT INTO error_log (userid, productid, error_message, created_at)
            VALUES (?, ?, ?, NOW())
        `, [
            userid,
            productid,
            JSON.stringify({
                mappingData: mappingData,
                errorMessage: errorMessage,
                errorType: 'coopang_register_failed'
            })
        ]);
        
        await connection.commit();
        
        console.log(`❌ [${productid}] 쿠팡 등록 실패 상태 저장 완료`);
        
        return {
            success: true,
            message: '쿠팡 등록 실패 상태 저장 완료'
        };
        
    } catch (error) {
        await connection.rollback();
        console.error(`❌ [${productid}] 쿠팡 등록 실패 상태 저장 실패:`, error);
        
        return {
            success: false,
            message: `쿠팡 등록 실패 상태 저장 실패: ${error.message}`
        };
    } finally {
        connection.release();
    }
}
