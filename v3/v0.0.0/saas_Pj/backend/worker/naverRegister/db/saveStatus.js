import { promisePool } from '../../../common/utils/connectDB.js';

/**
 * 네이버 등록 성공 시 상태 저장
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @param {string} originProductNo - 네이버 원상품 번호
 * @param {string} smartstoreChannelProductNo - 스마트스토어 채널 상품 번호
 * @param {number} finalMainPrice - 최종 대표 가격
 * @returns {Promise<boolean>} 저장 성공 여부
 */
export async function saveSuccessStatus(userid, productid, originProductNo, smartstoreChannelProductNo, finalMainPrice) {
    const connection = await promisePool.getConnection();
    
    try {
        // 트랜잭션 시작
        await connection.beginTransaction();
        
        // 1. naver_register_management 테이블 업데이트
        const updateManagementQuery = `
            UPDATE naver_register_management 
            SET 
                status = 'success',
                final_main_price = ?,
                originProductNo = ?,
                smartstoreChannelProductNo = ?
            WHERE userid = ? AND productid = ?
        `;
        
        await connection.execute(updateManagementQuery, [
            finalMainPrice,
            originProductNo,
            smartstoreChannelProductNo,
            userid,
            productid
        ]);
        
        // 2. status 테이블의 naver_registered를 true로 업데이트
        const updateStatusQuery = `
            UPDATE status 
            SET 
                naver_registered = TRUE,
                naver_register_failed = FALSE
            WHERE userid = ? AND productid = ?
        `;
        
        await connection.execute(updateStatusQuery, [userid, productid]);

        // 3. naver_register_management에서 market_number 조회
        const [rows] = await connection.execute(
            'SELECT market_number FROM naver_register_management WHERE userid = ? AND productid = ?',
            [userid, productid]
        );

        if (rows.length > 0 && rows[0].market_number !== null) {
            const marketNumber = rows[0].market_number;

            // 4. naver_account_info 테이블의 registered_sku_count 업데이트
            const updateAccountInfoQuery = `
                UPDATE naver_account_info
                SET registered_sku_count = registered_sku_count + 1
                WHERE userid = ? AND naver_market_number = ?
            `;
            await connection.execute(updateAccountInfoQuery, [userid, marketNumber]);
            console.log(`naver_account_info 업데이트 완료: 사용자 ${userid}, 마켓번호 ${marketNumber}`);
        } else {
            console.warn(`market_number를 찾을 수 없거나 NULL입니다. 사용자: ${userid}, 상품: ${productid}. naver_account_info 업데이트를 건너뜁니다.`);
        }
        
        // 트랜잭션 커밋
        await connection.commit();
        
        console.log(`네이버 등록 성공 상태 저장 완료: 사용자 ${userid}, 상품 ${productid}`);
        console.log(`- originProductNo: ${originProductNo}`);
        console.log(`- smartstoreChannelProductNo: ${smartstoreChannelProductNo}`);
        console.log(`- finalMainPrice: ${finalMainPrice}`);
        
        return true;
        
    } catch (error) {
        // 트랜잭션 롤백
        if (connection) {
            await connection.rollback();
        }
        
        console.error('네이버 등록 성공 상태 저장 중 오류:', error);
        throw error;
        
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

/**
 * 네이버 등록 실패 시 상태 저장
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @param {string} errorMessage - 오류 메시지
 * @returns {Promise<boolean>} 저장 성공 여부
 */
export async function saveFailureStatus(userid, productid, errorMessage) {
    const connection = await promisePool.getConnection();
    
    try {
        // 트랜잭션 시작
        await connection.beginTransaction();
        
        // 1. naver_register_management 테이블 업데이트
        const updateManagementQuery = `
            UPDATE naver_register_management 
            SET 
                status = 'fail'
            WHERE userid = ? AND productid = ?
        `;
        
        await connection.execute(updateManagementQuery, [userid, productid]);
        
        // 2. status 테이블의 naver_register_failed를 true로 업데이트
        const updateStatusQuery = `
            UPDATE status 
            SET 
                naver_register_failed = TRUE,
                naver_registered = FALSE
            WHERE userid = ? AND productid = ?
        `;
        
        await connection.execute(updateStatusQuery, [userid, productid]);
        
        // 3. error_log 테이블에 오류 기록
        const insertErrorQuery = `
            INSERT INTO error_log (userid, productid, error_message)
            VALUES (?, ?, ?)
        `;
        
        await connection.execute(insertErrorQuery, [userid, productid, errorMessage]);
        
        // 트랜잭션 커밋
        await connection.commit();
        
        console.log(`네이버 등록 실패 상태 저장 완료: 사용자 ${userid}, 상품 ${productid}`);
        console.log(`- 오류 메시지: ${errorMessage}`);
        
        return true;
        
    } catch (error) {
        // 트랜잭션 롤백
        if (connection) {
            await connection.rollback();
        }
        
        console.error('네이버 등록 실패 상태 저장 중 오류:', error);
        throw error;
        
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

/**
 * 네이버 등록 결과 저장 (성공/실패 자동 판단)
 * @param {Object} result - mainOperator 함수의 반환값
 * @returns {Promise<boolean>} 저장 성공 여부
 */
export async function saveNaverRegisterResult(result) {
    try {
        const { success, userid, productid } = result;
        
        if (success) {
            // 성공 시 처리
            const { naverRegisterResponse, optionChoiceResult } = result;
            const { originProductNo, smartstoreChannelProductNo } = naverRegisterResponse;
            const { representativePrice } = optionChoiceResult;
            
            return await saveSuccessStatus(
                userid,
                productid,
                originProductNo,
                smartstoreChannelProductNo,
                representativePrice
            );
        } else {
            // 실패 시 처리
            const errorMessage = result.message || '알 수 없는 오류';
            return await saveFailureStatus(userid, productid, errorMessage);
        }
        
    } catch (error) {
        console.error('네이버 등록 결과 저장 중 오류:', error);
        
        // 저장 실패 시에도 실패 상태로 기록
        try {
            await saveFailureStatus(
                result.userid,
                result.productid,
                `결과 저장 중 오류: ${error.message}`
            );
        } catch (saveError) {
            console.error('실패 상태 저장 중 추가 오류:', saveError);
        }
        
        throw error;
    }
}
