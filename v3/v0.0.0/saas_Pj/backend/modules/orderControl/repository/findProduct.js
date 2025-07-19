import { promisePool } from '../../../common/utils/connectDB.js';

/**
 * 상품 기본 정보를 조회하는 함수
 * @param {number} userid - 사용자 ID
 * @param {string} productId - 상품 ID
 * @returns {Promise<object>} 상품 정보
 */
export async function getProductById(userid, productId) {
    const [rows] = await promisePool.execute(
        `SELECT userid, productid, title_raw, detail_url, created_at, updated_at
         FROM products_detail 
         WHERE userid = ? AND productid = ?`,
        [userid, productId]
    );
    
    return rows[0] || null;
}

/**
 * 상품 이미지를 조회하는 함수
 * @param {string} productId - 상품 ID
 * @returns {Promise<string|null>} 이미지 URL
 */
export async function getProductImage(productId) {
    const [rows] = await promisePool.execute(
        `SELECT imageurl
         FROM item_images_raw 
         WHERE productid = ?
         ORDER BY imageorder ASC
         LIMIT 1`,
        [productId]
    );
    
    return rows.length > 0 ? rows[0].imageurl : null;
}

/**
 * 상품명으로 상품을 검색하는 함수 (정확히 일치)
 * @param {number} userid - 사용자 ID
 * @param {string} productName - 상품명
 * @returns {Promise<Array>} 상품 목록
 */
export async function searchProductsByName(userid, productName) {
    const [rows] = await promisePool.execute(
        `SELECT userid, productid, 
                COALESCE(title_optimized, title_translated, title_raw) as product_title,
                title_raw, detail_url, created_at, updated_at
         FROM products_detail 
         WHERE userid = ? 
         AND (
             title_optimized = ? OR 
             title_translated = ? OR 
             title_raw = ?
         )
         ORDER BY 
             CASE 
                 WHEN title_optimized = ? THEN 1
                 WHEN title_translated = ? THEN 2
                 WHEN title_raw = ? THEN 3
                 ELSE 4
             END
         LIMIT 10`,
        [
            userid, 
            productName, productName, productName,
            productName, productName, productName
        ]
    );
    
    return rows;
}

/**
 * 여러 상품의 이미지를 조회하는 함수
 * @param {string[]} productIds - 상품 ID 배열
 * @returns {Promise<object>} productId를 키로 하는 이미지 URL 객체
 */
export async function getProductImages(productIds) {
    if (!productIds || productIds.length === 0) {
        return {};
    }
    
    const placeholders = productIds.map(() => '?').join(',');
    const [rows] = await promisePool.execute(
        `SELECT productid, imageurl
         FROM item_images_raw 
         WHERE productid IN (${placeholders})
         AND imageorder = (
             SELECT MIN(imageorder) 
             FROM item_images_raw AS sub 
             WHERE sub.productid = item_images_raw.productid
         )`,
        productIds
    );
    
    const imageMap = {};
    rows.forEach(row => {
        imageMap[row.productid] = row.imageurl;
    });
    
    return imageMap;
}
