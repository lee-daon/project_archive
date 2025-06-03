import { promisePool } from './connectDB.js';

/**
 * 상품의 상태 정보를 데이터베이스에 저장하는 함수
 * 해당 productId가 이미 존재하면 정보를 업데이트합니다 (ON DUPLICATE KEY)
 * 
 * @param {Object} params - 저장할 상태 정보 객체
 * @param {string|number} params.productId - 상품 ID
 * @param {boolean} params.sourcing_completed - 소싱 완료 여부
 * @throws {Error} 데이터베이스 저장 중 오류 발생 시
 * @returns {Promise<void>} 
 */
export async function saveStatus({ productId, sourcing_completed }) {
  const query = 'INSERT INTO status (productid, sourcing_completed) VALUES (?, ?) ON DUPLICATE KEY UPDATE sourcing_completed = ?';
  try {
    await promisePool.query(query, [productId, sourcing_completed, sourcing_completed]);
  } catch (error) {
    console.error(`Error saving status for product ${productId}:`, error);
    throw error;
  }
} 

/**
 * 여러 제품의 brand_banned 상태를 true로 업데이트합니다.
 *
 * @param {Array<number|string>} productIds - brand_banned 상태를 업데이트할 제품 ID 배열
 * @returns {Promise<void>} - 작업 완료 시 프라미스를 반환합니다.
 * @throws {Error} - 쿼리 실행 중 오류가 발생하면 던집니다.
 */
export async function updateBrandBannedProducts(productIds) {
  const query = 'UPDATE status SET brand_banned = TRUE WHERE productid = ?';
  try {
    // 각 productId에 대해 쿼리 실행
    for (const productId of productIds) {
      await promisePool.query(query, [productId]);
    }
    console.log(`${productIds.length}개 제품이 status에서 brand_banned 처리되었습니다.`);
  } catch (error) {
    console.error('브랜드 금지 처리 중 오류 발생:', error);
    throw error;
  }
} 

/**
 * 여러 제품의 preprocessing_completed 상태를 true로 업데이트합니다.
 * 해당 productId가 없으면 새로 삽입합니다.
 *
 * @param {Array<number|string>} productIds - 상태를 업데이트할 제품 ID 배열
 * @returns {Promise<void>} - 작업 완료 시 프라미스를 반환합니다.
 * @throws {Error} - 쿼리 실행 중 오류가 발생하면 던집니다.
 */
export async function updatePreprocessingCompletedStatus(productIds) {
  const query = 'INSERT INTO status (productid, preprocessing_completed) VALUES (?, TRUE) ON DUPLICATE KEY UPDATE preprocessing_completed = TRUE';
  try {
    // 각 productId에 대해 쿼리 실행
    for (const productId of productIds) {
      await promisePool.query(query, [productId]);
    }
    console.log(`${productIds.length}개 제품의 preprocessing_completed 상태가 true로 업데이트되었습니다.`);
  } catch (error) {
    console.error('preprocessing_completed 상태 업데이트 중 오류 발생:', error);
    throw error;
  }
} 