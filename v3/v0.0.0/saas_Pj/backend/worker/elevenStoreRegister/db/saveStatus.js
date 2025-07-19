import { promisePool } from '../../../common/utils/connectDB.js';

/**
 * 11번가 등록 성공 시 상태 저장
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @param {string} originProductNo - 11번가 원상품 번호
 * @param {string} finalXml - 최종 XML 데이터
 * @param {number} finalMainPrice - 최종 대표 가격
 * @param {number} discountRate - 할인율
 * @returns {Promise<boolean>} 저장 성공 여부
 */
export async function saveSuccessStatus(userid, productid, originProductNo, finalXml, finalMainPrice, discountRate) {
    const connection = await promisePool.getConnection();
    
    try {
        // 트랜잭션 시작
        await connection.beginTransaction();
        
        // 1. elevenstore_register_management 테이블 업데이트
        const updateManagementQuery = `
            UPDATE elevenstore_register_management 
            SET 
                status = 'success',
                final_main_price = ?,
                discount_rate = ?,
                originProductNo = ?,
                final_xml = ?
            WHERE userid = ? AND productid = ?
        `;
        
        await connection.execute(updateManagementQuery, [
            finalMainPrice,
            discountRate,
            originProductNo,
            finalXml,
            userid,
            productid
        ]);
        
        // 2. status 테이블의 elevenstore_registered를 true로 업데이트
        const updateStatusQuery = `
            UPDATE status 
            SET 
                elevenstore_registered = TRUE,
                elevenstore_register_failed = FALSE
            WHERE userid = ? AND productid = ?
        `;
        
        await connection.execute(updateStatusQuery, [userid, productid]);

        // 3. elevenstore_register_management에서 market_number 조회
        const [rows] = await connection.execute(
            'SELECT market_number FROM elevenstore_register_management WHERE userid = ? AND productid = ?',
            [userid, productid]
        );

        if (rows.length > 0 && rows[0].market_number !== null) {
            const marketNumber = rows[0].market_number;

            // 4. elevenstore_account_info 테이블의 registered_sku_count 업데이트
            const updateAccountInfoQuery = `
                UPDATE elevenstore_account_info
                SET registered_sku_count = registered_sku_count + 1
                WHERE userid = ? AND elevenstore_market_number = ?
            `;
            await connection.execute(updateAccountInfoQuery, [userid, marketNumber]);
            console.log(`elevenstore_account_info 업데이트 완료: 사용자 ${userid}, 마켓번호 ${marketNumber}`);
        } else {
            console.warn(`market_number를 찾을 수 없거나 NULL입니다. 사용자: ${userid}, 상품: ${productid}. elevenstore_account_info 업데이트를 건너뜁니다.`);
        }
        
        // 트랜잭션 커밋
        await connection.commit();
        
        console.log(`11번가 등록 성공 상태 저장 완료: 사용자 ${userid}, 상품 ${productid}`);
        console.log(`- originProductNo: ${originProductNo}`);
        console.log(`- finalMainPrice: ${finalMainPrice}`);
        console.log(`- discountRate: ${discountRate}`);
        console.log(`- XML 데이터 크기: ${finalXml?.length || 0} 문자`);
        
        return true;
        
    } catch (error) {
        // 트랜잭션 롤백
        if (connection) {
            await connection.rollback();
        }
        
        console.error('11번가 등록 성공 상태 저장 중 오류:', error);
        throw error;
        
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

/**
 * 11번가 등록 실패 시 상태 저장
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
        
        // 1. elevenstore_register_management 테이블 업데이트
        const updateManagementQuery = `
            UPDATE elevenstore_register_management 
            SET 
                status = 'fail'
            WHERE userid = ? AND productid = ?
        `;
        
        await connection.execute(updateManagementQuery, [userid, productid]);
        
        // 2. status 테이블의 elevenstore_register_failed를 true로 업데이트
        const updateStatusQuery = `
            UPDATE status 
            SET 
                elevenstore_register_failed = TRUE,
                elevenstore_registered = FALSE
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
        
        console.log(`11번가 등록 실패 상태 저장 완료: 사용자 ${userid}, 상품 ${productid}`);
        console.log(`- 오류 메시지: ${errorMessage}`);
        
        return true;
        
    } catch (error) {
        // 트랜잭션 롤백
        if (connection) {
            await connection.rollback();
        }
        
        console.error('11번가 등록 실패 상태 저장 중 오류:', error);
        throw error;
        
    } finally {
        if (connection) {
            connection.release();
        }
    }
}
