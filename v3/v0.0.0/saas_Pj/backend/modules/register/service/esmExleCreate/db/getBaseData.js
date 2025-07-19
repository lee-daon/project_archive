import { promisePool } from '../../../../../common/utils/connectDB.js';

/**
 * ESM 등록을 위한 기본 데이터를 가져오는 함수 (여러 상품 일괄 처리)
 * @param {number} userid - 사용자 ID
 * @param {Array<number>} productIds - 상품 ID 배열
 * @returns {Array<Object>} 기본 데이터 배열 (각 상품의 JSON 데이터, ESM 카테고리 ID 등)
 */
export async function getBaseData(userid, productIds) {
    try {
        if (!Array.isArray(productIds) || productIds.length === 0) {
            throw new Error('productIds는 비어있지 않은 배열이어야 합니다.');
        }

        // productIds를 쿼리에서 사용할 수 있도록 변환
        const placeholders = productIds.map(() => '?').join(',');

        // 1. pre_register에서 json_data와 product_group_code 가져오기
        const [preRegisterRows] = await promisePool.execute(
            `SELECT productid, json_data, product_group_code
             FROM pre_register 
             WHERE userid = ? AND productid IN (${placeholders})`,
            [userid, ...productIds]
        );

        // 2. products_detail에서 catid 가져오기
        const [productDetailRows] = await promisePool.execute(
            `SELECT productid, catid
             FROM products_detail 
             WHERE userid = ? AND productid IN (${placeholders})`,
            [userid, ...productIds]
        );

        // 데이터 검증
        if (preRegisterRows.length === 0) {
            throw new Error(`pre_register 데이터를 찾을 수 없습니다. userid: ${userid}, productIds: ${productIds.join(',')}`);
        }
        if (productDetailRows.length === 0) {
            throw new Error(`products_detail 데이터를 찾을 수 없습니다. userid: ${userid}, productIds: ${productIds.join(',')}`);
        }

        // productDetail을 productid로 매핑
        const productDetailMap = {};
        productDetailRows.forEach(row => {
            productDetailMap[row.productid] = row;
        });

        // 모든 고유한 catid 수집
        const catIds = [...new Set(productDetailRows.map(row => row.catid))];
        
        // 3. categorymapping에서 ESM 관련 카테고리 ID 가져오기
        const catIdPlaceholders = catIds.map(() => '?').join(',');
        const [categoryMappingRows] = await promisePool.execute(
            `SELECT catid, esm_cat_id, gmarket_cat_id, auction_cat_id
             FROM categorymapping 
             WHERE catid IN (${catIdPlaceholders})`,
            catIds
        );

        // categorymapping을 catid로 매핑
        const categoryMap = {};
        categoryMappingRows.forEach(row => {
            categoryMap[row.catid] = row;
        });

        // 4. 각 상품에 대한 데이터 구성
        const results = [];
        
        for (const preRegisterRow of preRegisterRows) {
            const productid = preRegisterRow.productid;
            const productDetail = productDetailMap[productid];
            
            if (!productDetail) {
                console.warn(`products_detail 데이터를 찾을 수 없습니다. productid: ${productid}`);
                continue;
            }

            const catid = productDetail.catid;
            const categoryMapping = categoryMap[catid];
            
            if (!categoryMapping) {
                console.warn(`카테고리 매핑을 찾을 수 없습니다. catid: ${catid}, productid: ${productid}`);
                continue;
            }

            const esmCatId = categoryMapping.esm_cat_id;
            if (!esmCatId) {
                console.warn(`ESM 카테고리 ID가 매핑되지 않았습니다. catid: ${catid}, productid: ${productid}`);
                continue;
            }

            // JSON 데이터 파싱
            let jsonData;
            try {
                jsonData = typeof preRegisterRow.json_data === 'string' 
                    ? JSON.parse(preRegisterRow.json_data) 
                    : preRegisterRow.json_data;
            } catch (parseError) {
                console.error(`JSON 데이터 파싱 실패. productid: ${productid}, error: ${parseError.message}`);
                continue;
            }

            // 데이터 구성
            results.push({
                productid: productid,
                jsonData: jsonData,
                esmCatId: esmCatId,
                gmarketCatId: categoryMapping.gmarket_cat_id,
                auctionCatId: categoryMapping.auction_cat_id,
                productGroupCode: preRegisterRow.product_group_code
            });
        }

        if (results.length === 0) {
            throw new Error('처리 가능한 상품 데이터가 없습니다.');
        }

        console.log(`ESM 기본 데이터 조회 완료: ${results.length}개 상품`);
        return results;

    } catch (error) {
        console.error('getBaseData 함수에서 오류 발생:', error);
        throw error;
    }
}
