import { promisePool } from './connectDB.js';

/**
 * 제품 전처리 데이터를 저장합니다.
 *
 * @param {Object} params - 제품 관련 정보를 담은 객체.
 * @param {number|string} params.productId - 저장할 제품 ID.
 * @returns {Promise<void>} - 작업 완료 시 프라미스를 반환합니다.
 * @throws {Error} - 쿼리 실행 중 에러가 발생하면 던집니다.
 */
export async function savePreprocessing({ productId }) {
  const query = 'INSERT INTO preprocessing (productid) VALUES (?) ON DUPLICATE KEY UPDATE productid = productid';
  try {
    await promisePool.query(query, [productId]);
  } catch (error) {
    console.error(`Error saving preprocessing for product ${productId}:`, error);
    throw error;
  }
} 

/**
 * 여러 제품의 banned 상태를 업데이트합니다.
 *
 * @param {Array<number|string>} productIds - banned 상태를 업데이트할 제품 ID 목록.
 * @returns {Promise<void>} - 작업 완료 시 프라미스를 반환합니다.
 * @throws {Error} - 쿼리 실행 중 오류가 발생하면 던집니다.
 */
export async function updateBannedProducts(productIds) {
  const query = 'UPDATE preprocessing SET banned = TRUE WHERE productid = ?';
  try {
    // 각 productId에 대해 쿼리 실행
    for (const productId of productIds) {
      await promisePool.query(query, [productId]);
    }
    console.log(`${productIds.length}개 제품이 banned 처리되었습니다.`);
  } catch (error) {
    console.error('제품 banned 처리 중 오류 발생:', error);
    throw error;
  }
} 

/**
 * 여러 제품의 brand_checked 상태를 업데이트합니다.
 *
 * @param {Array<number|string>} productIds - brand_checked 상태를 업데이트할 제품 ID 목록.
 * @returns {Promise<void>} - 작업 완료 시 프라미스를 반환합니다.
 * @throws {Error} - 쿼리 실행 중 오류가 발생하면 던집니다.
 */
export async function updateBrandChecked(productIds) {
  const query = 'INSERT INTO preprocessing (productid, brand_checked) VALUES (?, TRUE) ON DUPLICATE KEY UPDATE brand_checked = TRUE';
  try {
    for (const productId of productIds) {
      await promisePool.query(query, [productId]);
    }
    console.log(`${productIds.length}개 제품의 brand_checked 상태가 업데이트되었습니다.`);
  } catch (error) {
    console.error('제품 brand_checked 업데이트 중 오류 발생:', error);
    throw error;
  }
} 

/**
 * 번역 및 처리 상태를 업데이트합니다.
 *
 * @param {Object} params - 업데이트할 정보를 담은 객체
 * @param {Array<number|string>} params.productIds - 업데이트할 제품 ID 목록
 * @param {Object} params.updates - 업데이트할 필드와 값 (예: {name_translated: true})
 * @returns {Promise<void>} - 작업 완료 시 프라미스를 반환합니다.
 * @throws {Error} - 쿼리 실행 중 오류가 발생하면 던집니다.
 */
export async function updatePreprocessingStatus(params) {
  try {
    const { productIds, updates } = params;
    
    // 업데이트할 필드와 값을 SET 구문으로 변환
    const setFields = Object.entries(updates)
      .map(([field, value]) => `${field} = ${value}`)
      .join(', ');
    
    // 각 제품 ID에 대해 업데이트 쿼리 실행
    for (const productId of productIds) {
      const query = `INSERT INTO preprocessing (productid, ${Object.keys(updates).join(', ')}) 
                    VALUES (?, ${Object.values(updates).join(', ')}) 
                    ON DUPLICATE KEY UPDATE ${setFields}`;
      
      await promisePool.query(
        `INSERT INTO preprocessing (productid) VALUES (?) ON DUPLICATE KEY UPDATE productid = productid`,
        [productId]
      );
      
      await promisePool.query(
        `UPDATE preprocessing SET ${setFields} WHERE productid = ?`,
        [productId]
      );
    }
    
    console.log(`${productIds.length}개 제품의 preprocessing 상태가 업데이트되었습니다.`);
  } catch (error) {
    console.error('preprocessing 상태 업데이트 중 오류 발생:', error);
    throw error;
  }
}

/**
 * 처리 중 오류가 발생한 제품을 기록하는 함수
 *
 * @param {Object} params - 오류 정보를 담은 객체
 * @param {string|number} params.productId - 오류가 발생한 제품 ID
 * @param {string} params.errorType - 오류 유형 (name_translated, image_translated 등)
 * @returns {Promise<void>} - 작업 완료 시 프라미스를 반환합니다.
 * @throws {Error} - 쿼리 실행 중 오류가 발생하면 던집니다.
 */
export async function recordErrorLog(params) {
  try {
    const { productId, errorType } = params;
    const errorField = `error_in_${errorType}`;
    
    // preprocessing 테이블에서 해당 상태를 false로 설정
    const preprocessingField = errorType;
    await promisePool.query(
      `UPDATE preprocessing SET ${preprocessingField} = FALSE WHERE productid = ?`,
      [productId]
    );
    
    // error_log 테이블에 오류 기록
    const query = `INSERT INTO error_log (productid, ${errorField}) 
                  VALUES (?, TRUE) 
                  ON DUPLICATE KEY UPDATE ${errorField} = TRUE`;
    
    await promisePool.query(query, [productId]);
    
    console.log(`productId ${productId}의 ${errorType} 오류가 기록되었습니다.`);
  } catch (error) {
    console.error('오류 로그 기록 중 문제 발생:', error);
    throw error;
  }
} 