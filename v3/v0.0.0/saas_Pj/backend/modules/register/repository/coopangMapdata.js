import { promisePool } from '../../../common/utils/connectDB.js';

/**
 * 옵션 매핑이 필요한 상품 목록 조회 (최대 50개)
 * @param {number} userid - 사용자 ID
 * @returns {Promise<Array>} 상품 목록
 */
export const getOptionMappingRequiredProducts = async (userid) => {
  try {
    const query = `
      SELECT 
        nrm.productid,
        pd.title_optimized as title,
        pmi.imageurl
      FROM coopang_register_management nrm
      LEFT JOIN products_detail pd ON nrm.userid = pd.userid AND nrm.productid = pd.productid
      LEFT JOIN private_main_image pmi ON nrm.userid = pmi.userid AND nrm.productid = pmi.productid AND pmi.imageorder = 1
      WHERE nrm.userid = ? AND nrm.status = 'optionMapRequired'
      ORDER BY nrm.updated_at DESC
      LIMIT 50
    `;
    
    const [rows] = await promisePool.execute(query, [userid]);
    
    return rows.map(row => ({
      productid: row.productid.toString(),
      title: row.title || '제목 없음',
      imageurl: row.imageurl || null
    }));
  } catch (error) {
    console.error('옵션 매핑 필요 상품 목록 조회 오류:', error);
    throw new Error('상품 목록 조회 중 오류가 발생했습니다.');
  }
};

/**
 * 특정 상품의 pre_register 데이터 조회
 * @param {number} userid - 사용자 ID
 * @param {string} productid - 상품 ID
 * @returns {Promise<Object|null>} 상품 정보
 */
export const getProductPreRegisterData = async (userid, productid) => {
  try {
    const query = `
      SELECT 
        productid,
        product_group_code,
        product_group_memo,
        json_data
      FROM pre_register 
      WHERE userid = ? AND productid = ?
    `;
    
    const [rows] = await promisePool.execute(query, [userid, productid]);
    
    if (rows.length === 0) {
      return null;
    }
    
    const product = rows[0];
    return {
      productid: product.productid.toString(),
      title: product.product_group_memo || '제목 없음',
      json_data: product.json_data
    };
  } catch (error) {
    console.error('상품 pre_register 데이터 조회 오류:', error);
    throw new Error('상품 데이터 조회 중 오류가 발생했습니다.');
  }
};

/**
 * 상품의 쿠팡 카테고리 ID 조회
 * @param {number} userid - 사용자 ID
 * @param {string} productid - 상품 ID
 * @returns {Promise<number|null>} 쿠팡 카테고리 ID
 */
export const getProductCoupangCategoryId = async (userid, productid) => {
  try {
    // 1단계: products_detail에서 catid 조회
    const productQuery = `
      SELECT catid 
      FROM products_detail 
      WHERE userid = ? AND productid = ?
    `;
    
    const [productRows] = await promisePool.execute(productQuery, [userid, productid]);
    
    if (productRows.length === 0) {
      return null;
    }
    
    const catid = productRows[0].catid;
    
    // 2단계: categorymapping에서 coopang_cat_id 조회
    const categoryQuery = `
      SELECT coopang_cat_id 
      FROM categorymapping 
      WHERE catid = ?
    `;
    
    const [categoryRows] = await promisePool.execute(categoryQuery, [catid]);
    
    if (categoryRows.length === 0 || !categoryRows[0].coopang_cat_id) {
      return null;
    }
    
    return categoryRows[0].coopang_cat_id;
  } catch (error) {
    console.error('쿠팡 카테고리 ID 조회 오류:', error);
    throw new Error('카테고리 ID 조회 중 오류가 발생했습니다.');
  }
};

/**
 * 사용자의 쿠팡 설정에서 최대 옵션 개수 조회
 * @param {number} userid - 사용자 ID
 * @returns {Promise<number>} 최대 옵션 개수 (기본값: 10)
 */
export const getUserMaxOptionCount = async (userid) => {
  try {
    const query = `
      SELECT max_option_count 
      FROM coopang_setting 
      WHERE userid = ?
    `;
    
    const [rows] = await promisePool.execute(query, [userid]);
    
    if (rows.length === 0) {
      return 10; // 기본값
    }
    
    return rows[0].max_option_count || 10;
  } catch (error) {
    console.error('최대 옵션 개수 조회 오류:', error);
    return 10; // 오류 시 기본값 반환
  }
};
