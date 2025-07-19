import { promisePool } from '../../../common/utils/connectDB.js';

/**
 * 네이버 등록을 위한 기본 데이터를 가져오는 함수
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @returns {Object} 기본 데이터 (JSON 데이터, 네이버 카테고리 ID)
 */
export async function getBaseData(userid, productid) {
    try {
        // 1. pre_register에서 json_data와 product_group_code 가져오기
        const [preRegisterRows] = await promisePool.execute(
            `SELECT json_data, product_group_code
             FROM pre_register 
             WHERE userid = ? AND productid = ?`,
            [userid, productid]
        );

        // 2. products_detail에서 catid 가져오기
        const [productDetailRows] = await promisePool.execute(
            `SELECT catid
             FROM products_detail 
             WHERE userid = ? AND productid = ?`,
            [userid, productid]
        );

        // 데이터 검증
        if (preRegisterRows.length === 0) {
            throw new Error(`pre_register 데이터를 찾을 수 없습니다. userid: ${userid}, productid: ${productid}`);
        }
        if (productDetailRows.length === 0) {
            throw new Error(`products_detail 데이터를 찾을 수 없습니다. userid: ${userid}, productid: ${productid}`);
        }

        const catid = productDetailRows[0].catid;
        if (!catid) {
            throw new Error(`카테고리 ID가 없습니다. userid: ${userid}, productid: ${productid}`);
        }

        // 3. categorymapping에서 naver_cat_id 가져오기
        const [categoryMappingRows] = await promisePool.execute(
            `SELECT naver_cat_id
             FROM categorymapping 
             WHERE catid = ?`,
            [catid]
        );

        if (categoryMappingRows.length === 0) {
            throw new Error(`카테고리 매핑을 찾을 수 없습니다. catid: ${catid}`);
        }

        const naverCatId = categoryMappingRows[0].naver_cat_id;
        if (!naverCatId) {
            throw new Error(`네이버 카테고리 ID가 매핑되지 않았습니다. catid: ${catid}`);
        }

        // JSON 데이터 파싱
        let jsonData;
        try {
            jsonData = typeof preRegisterRows[0].json_data === 'string' 
                ? JSON.parse(preRegisterRows[0].json_data) 
                : preRegisterRows[0].json_data;
        } catch (parseError) {
            throw new Error(`JSON 데이터 파싱 실패: ${parseError.message}`);
        }

        // 단순화된 구조로 데이터 반환
        return {
            jsonData: jsonData, // JSON 형태의 상품 데이터
            naverCatId: naverCatId, // 네이버 카테고리 ID
            productGroupCode: preRegisterRows[0].product_group_code // 상품 그룹 코드
        };

    } catch (error) {
        console.error('getBaseData 함수에서 오류 발생:', error);
        throw error;
    }
}
