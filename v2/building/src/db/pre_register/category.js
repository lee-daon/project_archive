/**
 * @fileoverview 카테고리 매핑 관련 데이터베이스 작업
 * @module db/pre_register/category
 * @description 카테고리 매핑 및 관련 상품 정보를 조회하고 업데이트하는 함수 모음
 */

import { promisePool } from '../connectDB.js';

/**
 * 매핑이 필요한 카테고리 정보 조회 (NULL 값이 있는 항목)
 * @async
 * @function getCategoriesWithNullMapping
 * @param {number} limit - 조회할 최대 항목 수
 * @param {number} offset - 조회 시작 오프셋
 * @returns {Promise<Array>} 카테고리 정보와 MySQL 결과 객체를 포함하는 배열 [rows, fields]
 */
export async function getCategoriesWithNullMapping(limit, offset) {
  const query = `
    SELECT cm.catid, cm.catname, cm.coopang_cat_id, cm.naver_cat_id, 
           cm.naver_cat_name, cm.coopang_cat_name
    FROM categorymapping cm
    WHERE cm.coopang_cat_id IS NULL OR cm.naver_cat_id IS NULL
    LIMIT ? OFFSET ?
  `;
  
  return await promisePool.query(query, [limit, offset]);
}

/**
 * 매핑이 필요한 카테고리의 총 개수 조회
 * @async
 * @function getTotalCategoriesWithNullMapping
 * @returns {Promise<Array>} 카테고리 총 개수와 MySQL 결과 객체를 포함하는 배열 [rows, fields]
 */
export async function getTotalCategoriesWithNullMapping() {
  return await promisePool.query(`
    SELECT COUNT(*) as total
    FROM categorymapping
    WHERE coopang_cat_id IS NULL OR naver_cat_id IS NULL
  `);
}

/**
 * 특정 카테고리에 속한 상품 정보 조회
 * @async
 * @function getProductsByCategory
 * @param {number|string} catid - 카테고리 ID
 * @param {number} [limit=2] - 조회할 최대 상품 수
 * @returns {Promise<Array>} 상품 정보와 MySQL 결과 객체를 포함하는 배열 [rows, fields]
 */
export async function getProductsByCategory(catid, limit = 2) {
  const query = `
    SELECT pd.productid, 
           CASE 
             WHEN pd.title_translated IS NOT NULL AND pd.title_translated != '' THEN pd.title_translated
             WHEN pd.title_optimized IS NOT NULL AND pd.title_optimized != '' THEN pd.title_optimized
             ELSE pd.title_raw
           END AS title
    FROM products_detail pd
    WHERE pd.catid = ?
    LIMIT ?
  `;
  
  return await promisePool.query(query, [catid, limit]);
}

/**
 * 특정 상품의 이미지 URL 조회
 * @async
 * @function getProductImage
 * @param {number|string} productid - 상품 ID
 * @returns {Promise<Array>} 이미지 URL 정보와 MySQL 결과 객체를 포함하는 배열 [rows, fields]
 */
export async function getProductImage(productid) {
  const query = `
    SELECT imageurl
    FROM item_images_raw
    WHERE productid = ?
    ORDER BY imageorder
    LIMIT 1
  `;
  
  return await promisePool.query(query, [productid]);
}

/**
 * 카테고리 매핑 정보 업데이트
 * @async
 * @function updateCategoryMapping
 * @param {number|string} catid - 카테고리 ID
 * @param {string|null} naver_cat_id - 네이버 카테고리 ID
 * @param {string|null} coopang_cat_id - 쿠팡 카테고리 ID
 * @param {string|null} naver_cat_name - 네이버 카테고리명
 * @param {string|null} coopang_cat_name - 쿠팡 카테고리명
 * @returns {Promise<Array>} MySQL 업데이트 결과 객체를 포함하는 배열 [result, fields]
 */
export async function updateCategoryMapping(catid, naver_cat_id, coopang_cat_id, naver_cat_name, coopang_cat_name) {
  const updateQuery = `
    UPDATE categorymapping
    SET 
      naver_cat_id = ?,
      coopang_cat_id = ?,
      naver_cat_name = ?,
      coopang_cat_name = ?
    WHERE catid = ?
  `;

  return await promisePool.query(updateQuery, [
    naver_cat_id || null,
    coopang_cat_id || null,
    naver_cat_name || null,
    coopang_cat_name || null,
    catid
  ]);
}

/**
 * 특정 카테고리에 속한 모든 상품 ID 조회
 * @async
 * @function getAllProductIdsByCategory
 * @param {number|string} catid - 카테고리 ID
 * @returns {Promise<Array>} 상품 ID 목록과 MySQL 결과 객체를 포함하는 배열 [rows, fields]
 */
export async function getAllProductIdsByCategory(catid) {
  const query = `
    SELECT productid
    FROM products_detail
    WHERE catid = ?
  `;
  
  return await promisePool.query(query, [catid]);
}

/**
 * status 및 pre_register 테이블에서 특정 상품들의 category_mapping_required와 is_registrable 값 업데이트 (트랜잭션 사용)
 * @async
 * @function updateProductsStatusAfterCategoryMapping
 * @param {Array<string>} productIds - 업데이트할 상품 ID 배열
 * @returns {Promise<boolean>} 성공 시 true, 실패 시 false 또는 오류 발생
 */
export async function updateProductsStatusAfterCategoryMapping(productIds) {
  if (!productIds || productIds.length === 0) {
    console.log('업데이트할 상품 ID가 없습니다.');
    return true; // 작업할 내용 없으므로 성공 처리
  }

  let connection;
  try {
    connection = await promisePool.getConnection();
    await connection.beginTransaction();

    const placeholders = productIds.map(() => '?').join(',');

    // 1. status 테이블 업데이트
    const updateStatusQuery = `
      UPDATE status
      SET 
        category_mapping_required = FALSE,
        is_registrable = TRUE
      WHERE productid IN (${placeholders})
      AND category_mapping_required = TRUE 
    `;
    const [statusResult] = await connection.query(updateStatusQuery, productIds);
    console.log(`Status 테이블 업데이트 결과 (${statusResult.affectedRows}개 영향)`);

    // 2. pre_register 테이블 업데이트
    const updatePreRegisterQuery = `
      UPDATE pre_register
      SET 
        category_mapping_required = FALSE
      WHERE product_id IN (${placeholders})
      AND category_mapping_required = TRUE
    `;
    const [preRegisterResult] = await connection.query(updatePreRegisterQuery, productIds);
    console.log(`Pre_register 테이블 업데이트 결과 (${preRegisterResult.affectedRows}개 영향)`);

    await connection.commit();
    connection.release();
    console.log(`상품 상태 업데이트 완료 (Product IDs: ${productIds.join(', ')})`);
    return true;

  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error('상품 상태 업데이트 중 오류 발생:', error);
    throw error; // 오류를 다시 던져 호출 측에서 인지하도록 함
  }
}

/**
 * 특정 카테고리 ID에 대한 매핑 정보 조회
 * @async
 * @function getCategoryMappingById
 * @param {number|string} catid - 카테고리 ID
 * @returns {Promise<Array>} 매핑 정보(naver_cat_id, coopang_cat_id)와 MySQL 결과 객체를 포함하는 배열 [rows, fields]
 */
export async function getCategoryMappingById(catid) {
  const query = `
    SELECT naver_cat_id, coopang_cat_id 
    FROM categorymapping 
    WHERE catid = ?
  `;
  return await promisePool.query(query, [catid]);
}
