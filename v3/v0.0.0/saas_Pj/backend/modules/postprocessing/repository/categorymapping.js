import { promisePool } from '../../../common/utils/connectDB.js';

/**
 * userid를 기반으로 매핑이 필요한 카테고리들 조회 (논리적 무결성)
 * @param {number} userid - 사용자 ID
 * @param {number} limit - 페이지당 항목 수
 * @param {number} offset - 오프셋
 * @returns {Promise<Object>} 카테고리 매핑 정보와 전체 개수
 */
export const getRequiredCategoryIds = async (userid, limit = null, offset = null) => {
    try {
        // 전체 개수 조회
        const countQuery = `
            SELECT COUNT(*) as total
            FROM categorymapping 
            WHERE userid = ?
              AND (naver_cat_id IS NULL OR coopang_cat_id IS NULL OR elevenstore_cat_id IS NULL OR esm_cat_id IS NULL)
        `;
        
        const [countResult] = await promisePool.execute(countQuery, [userid]);
        const total = countResult[0].total;

        // 데이터 조회
        let dataQuery = `
            SELECT catid, catname, naver_cat_id, coopang_cat_id, elevenstore_cat_id, esm_cat_id, gmarket_cat_id, auction_cat_id,
                   naver_cat_name, coopang_cat_name, elevenstore_cat_name, esm_cat_name
            FROM categorymapping 
            WHERE userid = ?
              AND (naver_cat_id IS NULL OR coopang_cat_id IS NULL OR elevenstore_cat_id IS NULL OR esm_cat_id IS NULL)
            ORDER BY catid
        `;

        const params = [userid];

        // 페이지네이션이 요청된 경우
        if (limit !== null && offset !== null) {
            dataQuery += ` LIMIT ${limit} OFFSET ${offset}`;
        }
        
        const [rows] = await promisePool.execute(dataQuery, params);
        
        return {
            categories: rows,
            total: total
        };
    } catch (error) {
        throw new Error(`카테고리 ID 조회 중 오류 발생: ${error.message}`);
    }
};

/**
 * userid를 기반으로 매핑이 완료된 카테고리들 조회
 * 모든 플랫폼(네이버, 쿠팡, 11번가)에 매핑이 완료된 카테고리만 조회
 * @param {number} userid - 사용자 ID
 * @param {number} limit - 페이지당 항목 수
 * @param {number} offset - 오프셋
 * @returns {Promise<Object>} 매핑 완료된 카테고리 정보와 전체 개수
 */
export const getCompletedCategoryMappings = async (userid, limit = null, offset = null) => {
    try {
        // 전체 개수 조회
        const countQuery = `
            SELECT COUNT(*) as total
            FROM categorymapping 
            WHERE userid = ?
              AND naver_cat_id IS NOT NULL 
              AND coopang_cat_id IS NOT NULL 
              AND elevenstore_cat_id IS NOT NULL
              AND esm_cat_id IS NOT NULL
        `;
        
        const [countResult] = await promisePool.execute(countQuery, [userid]);
        const total = countResult[0].total;

        // 데이터 조회
        let dataQuery = `
            SELECT catid, catname, naver_cat_id, coopang_cat_id, elevenstore_cat_id, esm_cat_id, gmarket_cat_id, auction_cat_id,
                   naver_cat_name, coopang_cat_name, elevenstore_cat_name, esm_cat_name
            FROM categorymapping 
            WHERE userid = ?
              AND naver_cat_id IS NOT NULL 
              AND coopang_cat_id IS NOT NULL 
              AND elevenstore_cat_id IS NOT NULL
              AND esm_cat_id IS NOT NULL
            ORDER BY catid
        `;

        const params = [userid];

        // 페이지네이션이 요청된 경우
        if (limit !== null && offset !== null) {
            dataQuery += ` LIMIT ${limit} OFFSET ${offset}`;
        }
        
        const [rows] = await promisePool.execute(dataQuery, params);
        
        return {
            categories: rows,
            total: total
        };
    } catch (error) {
        throw new Error(`매핑 완료된 카테고리 조회 중 오류 발생: ${error.message}`);
    }
};



/**
 * 특정 카테고리에 속한 상품 샘플 조회
 * @param {number} userid - 사용자 ID
 * @param {string} catid - 카테고리 ID
 * @param {number} limit - 조회할 상품 수 (기본값: 3)
 * @returns {Promise<Object[]>} 상품 샘플 배열
 */
export const getCategoryProductSamples = async (userid, catid, limit = 3) => {
    try {
        // 파라미터 타입 안정성 보장
        const userIdNum = parseInt(userid);
        const limitNum = Math.max(1, Math.min(10, parseInt(limit) || 3));
        const catIdNum = parseInt(catid);
        
        console.log('getCategoryProductSamples 파라미터:', { userIdNum, catIdNum, limitNum });
        
        // title_optimized 우선, 없으면 title_translated 사용
        const productQuery = `
            SELECT 
                pd.productid,
                COALESCE(
                    NULLIF(pd.title_optimized, ''), 
                    pd.title_translated
                ) as title
            FROM products_detail pd
            WHERE pd.userid = ? 
              AND pd.catid = ?
            ORDER BY pd.created_at DESC
            LIMIT ${limitNum}
        `;
        
        const [products] = await promisePool.execute(productQuery, [userIdNum, catIdNum]);
        
        if (products.length === 0) {
            return [];
        }
        
        // 각 상품의 이미지 조회
        const result = [];
        for (const product of products) {
            const imageQuery = `
                SELECT imageurl 
                FROM item_images_raw 
                WHERE productid = ? 
                ORDER BY imageorder ASC 
                LIMIT 1
            `;
            
            const [images] = await promisePool.execute(imageQuery, [product.productid]);
            
            result.push({
                id: product.productid,
                name: product.title || '',
                imageurl: images.length > 0 ? images[0].imageurl : ''
            });
        }
        
        return result;
        
    } catch (error) {
        console.error('getCategoryProductSamples 상세 오류:', error);
        throw new Error(`카테고리 상품 샘플 조회 중 오류 발생: ${error.message}`);
    }
};

/**
 * 카테고리 매핑 정보 업데이트 (UPSERT)
 * @param {Object} mapping - 매핑 정보 객체
 * @param {number} userid - 사용자 ID
 * @returns {Promise<void>}
 */
export const upsertCategoryMapping = async (mapping, userid) => {
    try {
        // 제공된 필드만 업데이트하는 동적 쿼리 생성
        const updateFields = [];
        const insertValues = [userid, mapping.catid];
        const updateParams = [];
        
        // catname이 제공된 경우
        if (mapping.hasOwnProperty('catname')) {
            updateFields.push('catname = ?');
            insertValues.push(mapping.catname || null);
            updateParams.push(mapping.catname || null);
        } else {
            insertValues.push(null);
        }
        
        // naver_cat_id가 제공된 경우
        if (mapping.hasOwnProperty('naver_cat_id')) {
            updateFields.push('naver_cat_id = ?');
            insertValues.push(mapping.naver_cat_id || null);
            updateParams.push(mapping.naver_cat_id || null);
        } else {
            insertValues.push(null);
        }
        
        // naver_cat_name이 제공된 경우
        if (mapping.hasOwnProperty('naver_cat_name')) {
            updateFields.push('naver_cat_name = ?');
            insertValues.push(mapping.naver_cat_name || null);
            updateParams.push(mapping.naver_cat_name || null);
        } else {
            insertValues.push(null);
        }
        
        // coopang_cat_id가 제공된 경우
        if (mapping.hasOwnProperty('coopang_cat_id')) {
            updateFields.push('coopang_cat_id = ?');
            insertValues.push(mapping.coopang_cat_id || null);
            updateParams.push(mapping.coopang_cat_id || null);
        } else {
            insertValues.push(null);
        }
        
        // coopang_cat_name이 제공된 경우
        if (mapping.hasOwnProperty('coopang_cat_name')) {
            updateFields.push('coopang_cat_name = ?');
            insertValues.push(mapping.coopang_cat_name || null);
            updateParams.push(mapping.coopang_cat_name || null);
        } else {
            insertValues.push(null);
        }
        
        // elevenstore_cat_id가 제공된 경우
        if (mapping.hasOwnProperty('elevenstore_cat_id')) {
            updateFields.push('elevenstore_cat_id = ?');
            insertValues.push(mapping.elevenstore_cat_id || null);
            updateParams.push(mapping.elevenstore_cat_id || null);
        } else {
            insertValues.push(null);
        }
        
        // elevenstore_cat_name이 제공된 경우
        if (mapping.hasOwnProperty('elevenstore_cat_name')) {
            updateFields.push('elevenstore_cat_name = ?');
            insertValues.push(mapping.elevenstore_cat_name || null);
            updateParams.push(mapping.elevenstore_cat_name || null);
        } else {
            insertValues.push(null);
        }
        
        // esm_cat_id가 제공된 경우
        if (mapping.hasOwnProperty('esm_cat_id')) {
            updateFields.push('esm_cat_id = ?');
            insertValues.push(mapping.esm_cat_id || null);
            updateParams.push(mapping.esm_cat_id || null);
        } else {
            insertValues.push(null);
        }
        
        // esm_cat_name이 제공된 경우
        if (mapping.hasOwnProperty('esm_cat_name')) {
            updateFields.push('esm_cat_name = ?');
            insertValues.push(mapping.esm_cat_name || null);
            updateParams.push(mapping.esm_cat_name || null);
        } else {
            insertValues.push(null);
        }
        
        // gmarket_cat_id가 제공된 경우
        if (mapping.hasOwnProperty('gmarket_cat_id')) {
            updateFields.push('gmarket_cat_id = ?');
            insertValues.push(mapping.gmarket_cat_id || null);
            updateParams.push(mapping.gmarket_cat_id || null);
        } else {
            insertValues.push(null);
        }
        
        // auction_cat_id가 제공된 경우
        if (mapping.hasOwnProperty('auction_cat_id')) {
            updateFields.push('auction_cat_id = ?');
            insertValues.push(mapping.auction_cat_id || null);
            updateParams.push(mapping.auction_cat_id || null);
        } else {
            insertValues.push(null);
        }
        
        // 항상 updated_at 업데이트
        updateFields.push('updated_at = NOW()');
        
        const query = `
            INSERT INTO categorymapping 
            (userid, catid, catname, naver_cat_id, naver_cat_name, coopang_cat_id, coopang_cat_name, elevenstore_cat_id, elevenstore_cat_name, esm_cat_id, esm_cat_name, gmarket_cat_id, auction_cat_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                ${updateFields.join(', ')}
        `;
        
        const params = [...insertValues, ...updateParams];
        await promisePool.execute(query, params);
        
    } catch (error) {
        throw new Error(`카테고리 매핑 업데이트 중 오류 발생: ${error.message}`);
    }
};
