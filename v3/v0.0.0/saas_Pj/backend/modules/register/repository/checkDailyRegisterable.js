import { promisePool } from '../../../common/utils/connectDB.js';

/**
 * 일일 등록 가능 수량 체크 및 차감
 * @param {string} platform - 플랫폼 (naver, coopang, elevenstore, esm, common)
 * @param {number} productCount - 등록할 상품 개수 (ids.length)
 * @param {number} userid - 사용자 ID
 * @param {Object} marketSettings - 마켓 설정 (coopangMarket, elevenstoreMarket 등)
 * @returns {Promise<Object>} 체크 결과
 */
async function checkDailyRegisterable(platform, productCount, userid, marketSettings) {
    const connection = await promisePool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        let checkResults = [];
        
        // 11번가 체크 (elevenstore 또는 common)
        if ((platform === 'elevenstore' || platform === 'common') && marketSettings.elevenstoreMarket) {
            const elevenstoreResult = await checkElevenstoreLimit(connection, userid, marketSettings.elevenstoreMarket, productCount);
            if (!elevenstoreResult.success) {
                await connection.rollback();
                return elevenstoreResult;
            }
            checkResults.push(elevenstoreResult);
        }
        
        // 쿠팡 체크 (coopang 또는 common)
        if ((platform === 'coopang' || platform === 'coupang' || platform === 'common') && marketSettings.coopangMarket) {
            const coopangResult = await checkCoopangLimit(connection, userid, marketSettings.coopangMarket, productCount);
            if (!coopangResult.success) {
                await connection.rollback();
                return coopangResult;
            }
            checkResults.push(coopangResult);
        }
        
        await connection.commit();
        
        return {
            success: true,
            message: '일일 등록 가능 수량 체크 및 차감 완료',
            results: checkResults
        };
        
    } catch (error) {
        await connection.rollback();
        console.error('checkDailyRegisterable 오류:', error.message);
        
        return {
            success: false,
            error: error.message
        };
        
    } finally {
        connection.release();
    }
}

/**
 * 11번가 일일 등록 가능 수량 체크 및 차감
 */
async function checkElevenstoreLimit(connection, userid, marketNumber, productCount) {
    // 11번가 계정 정보 조회
    const [accountResult] = await connection.execute(
        `SELECT daily_registerable_left_count 
         FROM elevenstore_account_info 
         WHERE userid = ? AND elevenstore_market_number = ?`,
        [userid, marketNumber]
    );
    
    if (accountResult.length === 0) {
        return {
            success: false,
            error: `11번가 계정 정보를 찾을 수 없습니다. (마켓번호: ${marketNumber})`
        };
    }
    
    const currentLimit = accountResult[0].daily_registerable_left_count;
    
    // 일일 등록 가능 수량 체크
    if (currentLimit < productCount) {
        return {
            success: false,
            error: `11번가 일일 등록 가능 수량을 초과했습니다. (요청: ${productCount}개, 가능: ${currentLimit}개)`
        };
    }
    
    // 수량 차감
    await connection.execute(
        `UPDATE elevenstore_account_info 
         SET daily_registerable_left_count = daily_registerable_left_count - ?,
             updated_at = NOW()
         WHERE userid = ? AND elevenstore_market_number = ?`,
        [productCount, userid, marketNumber]
    );
    
    return {
        success: true,
        platform: 'elevenstore',
        deducted: productCount,
        remaining: currentLimit - productCount
    };
}

/**
 * 쿠팡 일일 등록 가능 수량 체크 및 차감
 */
async function checkCoopangLimit(connection, userid, marketNumber, productCount) {
    // 쿠팡 계정 정보 조회
    const [accountResult] = await connection.execute(
        `SELECT daily_registerable_left_count 
         FROM coopang_account_info 
         WHERE userid = ? AND coopang_market_number = ?`,
        [userid, marketNumber]
    );
    
    if (accountResult.length === 0) {
        return {
            success: false,
            error: `쿠팡 계정 정보를 찾을 수 없습니다. (마켓번호: ${marketNumber})`
        };
    }
    
    // 쿠팡 설정에서 max_option_count 조회
    const [settingResult] = await connection.execute(
        `SELECT max_option_count 
         FROM coopang_setting 
         WHERE userid = ?`,
        [userid]
    );
    
    const maxOptionCount = settingResult.length > 0 ? settingResult[0].max_option_count : 10; // 기본값 10
    const currentLimit = accountResult[0].daily_registerable_left_count;
    const requiredCount = maxOptionCount * productCount; // 상품당 최대 옵션 수 * 상품 개수
    
    // 일일 등록 가능 수량 체크
    if (currentLimit < requiredCount) {
        return {
            success: false,
            error: `쿠팡 일일 등록 가능 수량을 초과했습니다. (요청: ${requiredCount}개, 가능: ${currentLimit}개, 상품당 옵션: ${maxOptionCount}개)`
        };
    }
    
    // 수량 차감
    await connection.execute(
        `UPDATE coopang_account_info 
         SET daily_registerable_left_count = daily_registerable_left_count - ?,
             updated_at = NOW()
         WHERE userid = ? AND coopang_market_number = ?`,
        [requiredCount, userid, marketNumber]
    );
    
    return {
        success: true,
        platform: 'coopang',
        deducted: requiredCount,
        remaining: currentLimit - requiredCount,
        maxOptionCount: maxOptionCount
    };
}

export { checkDailyRegisterable };
