import { promisePool } from '../../../common/utils/connectDB.js';

/**
 * 특정 테이블들만 삭제 (마켓 삭제 후 사용)
 * @param {number} userid - 사용자 ID
 * @param {string} productid - 상품 ID
 * @returns {Promise<Object>} 삭제 결과
 */
async function deleteSpecificTables(userid, productid) {
    const connection = await promisePool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        console.log(`특정 테이블 삭제 시작 - userid: ${userid}, productid: ${productid}`);
        
        let totalDeleted = 0;
        const deleteResults = {};
        
        // 1. 개인소유권 테이블들 (FOREIGN KEY 관계가 있는 것들 먼저)
        const personalTables = [
            'products_detail', // FOREIGN KEY to productlist
            'private_main_image',
            'private_description_image', 
            'private_nukki_image',
            'private_properties',
            'private_options'
        ];
        
        for (const table of personalTables) {
            const query = `DELETE FROM ${table} WHERE userid = ? AND productid = ?`;
            const [result] = await connection.execute(query, [userid, productid]);
            deleteResults[table] = result.affectedRows;
            totalDeleted += result.affectedRows;
            console.log(`${table}: ${result.affectedRows}개 삭제`);
        }
        
        // 2. 상태 관련 테이블들 (ESM 포함)
        const statusTables = [
            'processing_status', 
            'status',
            'pre_register',
            'coopang_register_management',
            'naver_register_management',
            'elevenstore_register_management',
            'esm_register_management'
        ];
        
        for (const table of statusTables) {
            const query = `DELETE FROM ${table} WHERE userid = ? AND productid = ?`;
            const [result] = await connection.execute(query, [userid, productid]);
            deleteResults[table] = result.affectedRows;
            totalDeleted += result.affectedRows;
            console.log(`${table}: ${result.affectedRows}개 삭제`);
        }
        
        await connection.commit();
        
        console.log(`특정 테이블 삭제 완료 - 총 ${totalDeleted}개 레코드 삭제`);
        
        return {
            success: true,
            message: `지정된 테이블에서 상품이 삭제되었습니다.`,
            userid: userid,
            productid: productid,
            totalDeleted: totalDeleted,
            deleteResults: deleteResults
        };
        
    } catch (error) {
        await connection.rollback();
        console.error('deleteSpecificTables 오류:', error.message);
        
        return {
            success: false,
            error: error.message,
            userid: userid,
            productid: productid
        };
        
    } finally {
        connection.release();
    }
}

export { deleteSpecificTables };
