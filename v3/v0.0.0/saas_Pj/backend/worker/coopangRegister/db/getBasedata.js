import { promisePool } from '../../../common/utils/connectDB.js';

/**
 * 쿠팡 등록을 위한 기본 데이터를 가져오는 함수
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @returns {Object} 기본 데이터 (JSON 데이터, 쿠팡 카테고리 ID)
 */
export async function getBaseData(userid, productid) {
    try {
        // 1. coopang_register_management에서 use_mapped_json 확인
        const [registerManagementRows] = await promisePool.execute(
            `SELECT use_mapped_json, mapped_json
             FROM coopang_register_management 
             WHERE userid = ? AND productid = ?`,
            [userid, productid]
        );

        // 데이터 검증
        if (registerManagementRows.length === 0) {
            throw new Error(`coopang_register_management 데이터를 찾을 수 없습니다. userid: ${userid}, productid: ${productid}`);
        }

        const useMappedJson = registerManagementRows[0].use_mapped_json;
        let jsonData;
        let productGroupCode;

        if (useMappedJson && registerManagementRows[0].mapped_json) {
            // mapped_json 사용
            try {
                jsonData = typeof registerManagementRows[0].mapped_json === 'string' 
                    ? JSON.parse(registerManagementRows[0].mapped_json) 
                    : registerManagementRows[0].mapped_json;
            } catch (parseError) {
                throw new Error(`mapped_json 파싱 실패: ${parseError.message}`);
            }
            
            // mapped_json 사용 시에도 product_group_code는 pre_register에서 가져와야 함
            const [groupCodeRows] = await promisePool.execute(
                `SELECT product_group_code
                 FROM pre_register 
                 WHERE userid = ? AND productid = ?`,
                [userid, productid]
            );
            
            if (groupCodeRows.length === 0) {
                throw new Error(`product_group_code를 찾을 수 없습니다. userid: ${userid}, productid: ${productid}`);
            }
            
            productGroupCode = groupCodeRows[0].product_group_code;
        } else {
            // 2. pre_register에서 json_data와 product_group_code 가져오기
            const [preRegisterRows] = await promisePool.execute(
                `SELECT json_data, product_group_code
                 FROM pre_register 
                 WHERE userid = ? AND productid = ?`,
                [userid, productid]
            );

            if (preRegisterRows.length === 0) {
                throw new Error(`pre_register 데이터를 찾을 수 없습니다. userid: ${userid}, productid: ${productid}`);
            }

            // JSON 데이터 파싱
            try {
                jsonData = typeof preRegisterRows[0].json_data === 'string' 
                    ? JSON.parse(preRegisterRows[0].json_data) 
                    : preRegisterRows[0].json_data;
            } catch (parseError) {
                throw new Error(`JSON 데이터 파싱 실패: ${parseError.message}`);
            }
            
            productGroupCode = preRegisterRows[0].product_group_code;
        }

        // 3. products_detail에서 catid 가져오기
        const [productDetailRows] = await promisePool.execute(
            `SELECT catid
             FROM products_detail 
             WHERE userid = ? AND productid = ?`,
            [userid, productid]
        );

        // 데이터 검증
        if (productDetailRows.length === 0) {
            throw new Error(`products_detail 데이터를 찾을 수 없습니다. userid: ${userid}, productid: ${productid}`);
        }

        const catid = productDetailRows[0].catid;
        if (!catid) {
            throw new Error(`카테고리 ID가 없습니다. userid: ${userid}, productid: ${productid}`);
        }

        // 4. categorymapping에서 coopang_cat_id 가져오기
        const [categoryMappingRows] = await promisePool.execute(
            `SELECT coopang_cat_id
             FROM categorymapping 
             WHERE catid = ?`,
            [catid]
        );

        if (categoryMappingRows.length === 0) {
            throw new Error(`카테고리 매핑을 찾을 수 없습니다. catid: ${catid}`);
        }

        const coopangCatId = categoryMappingRows[0].coopang_cat_id;
        if (!coopangCatId) {
            throw new Error(`쿠팡 카테고리 ID가 매핑되지 않았습니다. catid: ${catid}`);
        }

        // 단순화된 구조로 데이터 반환
        return {
            jsonData: jsonData, // JSON 형태의 상품 데이터
            coopangCatId: coopangCatId, // 쿠팡 카테고리 ID
            productGroupCode: productGroupCode // 상품 그룹 코드
        };

    } catch (error) {
        console.error('getBaseData 함수에서 오류 발생:', error);
        throw error;
    }
}
