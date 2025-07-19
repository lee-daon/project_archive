import { promisePool } from '../../../common/utils/connectDB.js';

/**
 * 브랜드명 조회 및 DB 작업을 위한 리포지토리 함수
 */

/**
 * 특정 사용자의 상품들에 대한 브랜드명 정보를 조회하는 함수
 * @param {number} userId - 사용자 ID
 * @param {Array<number>} productIds - 상품 ID 배열
 * @returns {Promise<Array>} - 브랜드명 관련 정보 (title_raw 포함)
 */
export async function getBrandNames(userId, productIds) {
  const sql = `
    SELECT productid, brand_name, brand_name_translated, title_raw, detail_url
    FROM products_detail
    WHERE userid = ? AND productid IN (?)
  `;
  const [results] = await promisePool.query(sql, [userId, productIds]);
  return results;
}

/**
 * 식별된 브랜드명을 데이터베이스에 일괄 업데이트하는 함수
 * @param {number} userId - 사용자 ID
 * @param {Array<{productId: number, identifiedBrand: string}>} brandUpdates - 업데이트할 브랜드 정보 배열
 * @returns {Promise<void>}
 */
export async function updateBrandNamesTranslatedBulk(userId, brandUpdates) {
  if (!brandUpdates || brandUpdates.length === 0) {
    return;
  }

  const productIds = brandUpdates.map(update => update.productId);
  let sql = 'UPDATE products_detail SET brand_name_translated = CASE productid ';
  const params = [];

  brandUpdates.forEach(update => {
    sql += 'WHEN ? THEN ? ';
    params.push(update.productId, update.identifiedBrand);
  });

  sql += 'END WHERE userid = ? AND productid IN (?)';
  params.push(userId, productIds);

  try {
    const [result] = await promisePool.query(sql, params);
    console.log(`${brandUpdates.length}개 상품의 브랜드명 일괄 업데이트 완료: ${userId}`);
    return result;
  } catch (error) {
    console.error(`브랜드명 일괄 업데이트 중 오류 발생: ${userId}`, error);
    throw error;
  }
}

/**
 * 식별된 브랜드명을 데이터베이스에 업데이트하는 함수
 * @param {number} userId - 사용자 ID
 * @param {number} productId - 상품 ID
 * @param {string} identifiedBrand - 식별된 브랜드명 ("한글브랜드명/영어브랜드명" 형태)
 * @returns {Promise<void>}
 */
export async function updateBrandNameTranslated(userId, productId, identifiedBrand) {
  const updateSql = 'UPDATE products_detail SET brand_name_translated = ? WHERE userid = ? AND productid = ?';
  try {
    await promisePool.query(updateSql, [identifiedBrand, userId, productId]);
    console.log(`브랜드명 업데이트 완료: ${userId}, ${productId} - ${identifiedBrand}`);
  } catch (updateError) {
    console.error(`브랜드명 업데이트 중 오류 발생: ${userId}, ${productId}`, updateError);
    // 기존 로직에서는 오류가 발생해도 resolve()를 호출하여 오류를 무시했습니다.
    // 따라서 catch 블록에서 오류를 다시 던지지 않고 동일한 동작을 유지합니다.
  }
}

/**
 * 브랜드 필터링 상태 업데이트 함수 (processing_status 테이블)
 * 금지어가 포함된 상품의 status만 'brandbanCheck'로 변경
 * @param {number} userId - 사용자 ID
 * @param {Array<number>} productIds - 필터링된 상품 ID 배열
 * @returns {Promise<void>}
 */
export async function updateBrandFilterStatus(userId, productIds) {
  if (!productIds || productIds.length === 0) return;
  
  const updateSql = `
    UPDATE processing_status 
    SET status = 'brandbanCheck'
    WHERE userid = ? AND productid IN (?)
  `;
  
  try {
    const [result] = await promisePool.query(updateSql, [userId, productIds]);
    console.log(`${productIds.length}개 상품의 브랜드 필터링 상태를 'brandbanCheck'로 업데이트 완료`);
    return result;
  } catch (error) {
    console.error(`브랜드 필터링 상태 업데이트 중 오류 발생:`, error);
    throw error;
  }
}

/**
 * 브랜드밴 체크 상태에 있는 상품들의 정보를 조회하는 함수
 * @param {number} userId - 사용자 ID
 * @returns {Promise<Array>} - 브랜드밴 체크 상태인 상품들의 정보
 */
export async function getBrandBanCheckProducts(userId) {
  const sql = `
    SELECT p.productid, COALESCE(p.brand_name_translated, p.brand_name) as brand_name, p.detail_url, p.title_translated 
    FROM products_detail p
    JOIN processing_status ps ON p.userid = ps.userid AND p.productid = ps.productid
    WHERE ps.status = 'brandbanCheck' AND p.userid = ?
  `;
  
  try {
    const [results] = await promisePool.query(sql, [userId]);
    return results;
  } catch (error) {
    console.error('브랜드밴 체크 상품 조회 중 오류 발생:', error);
    throw error;
  }
}
