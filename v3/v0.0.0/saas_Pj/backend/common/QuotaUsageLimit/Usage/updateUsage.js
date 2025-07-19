import { promisePool } from '../../utils/connectDB.js';
import logger from '../../utils/logger.js';
/**
 * 누적 소싱 상품수 업데이트
 * @param {number} userId - 사용자 ID
 * @param {number} count - 증가시킬 개수 (기본값: 1)
 * @returns {Promise<boolean>} 성공 여부
 */
export async function updateTotalSourcedProducts(userId, count = 1) {
  try {
    await promisePool.execute(
      `UPDATE user_statistics SET total_sourced_products = total_sourced_products + ? WHERE userid = ?`,
      [count, userId]
    );
    return true;
  } catch (error) {
    logger.error(error, { userId });
    return false;
  }
}

/**
 * 중복 제외 상품수 업데이트
 * @param {number} userId - 사용자 ID
 * @param {number} count - 증가시킬 개수 (기본값: 1)
 * @returns {Promise<boolean>} 성공 여부
 */
export async function updateDuplicateFilteredProducts(userId, count = 1) {
  try {
    await promisePool.execute(
      `UPDATE user_statistics SET duplicate_filtered_products = duplicate_filtered_products + ? WHERE userid = ?`,
      [count, userId]
    );
    return true;
  } catch (error) {
    logger.error(error, { userId });
    return false;
  }
}

/**
 * 누적 필터링된 상품수 업데이트 (금지 걸린 상품)
 * @param {number} userId - 사용자 ID
 * @param {number} count - 증가시킬 개수 (기본값: 1)
 * @returns {Promise<boolean>} 성공 여부
 */
export async function updateTotalFilteredProducts(userId, count = 1) {
  try {
    await promisePool.execute(
      `UPDATE user_statistics SET total_filtered_products = total_filtered_products + ? WHERE userid = ?`,
      [count, userId]
    );
    return true;
  } catch (error) {
    logger.error(error, { userId });
    return false;
  }
}

/**
 * 누적 수집 상품수 업데이트 (productlist에 저장된 상품)
 * @param {number} userId - 사용자 ID
 * @param {number} count - 증가시킬 개수 (기본값: 1)
 * @returns {Promise<boolean>} 성공 여부
 */
export async function updateTotalCollectedProducts(userId, count = 1) {
  try {
    await promisePool.execute(
      `UPDATE user_statistics SET total_collected_products = total_collected_products + ? WHERE userid = ?`,
      [count, userId]
    );
    return true;
  } catch (error) {
    logger.error(error, { userId });
    return false;
  }
}

/**
 * 누적 가공 상품수 업데이트 (가공 요청 온 상품)
 * @param {number} userId - 사용자 ID
 * @param {number} count - 증가시킬 개수 (기본값: 1)
 * @returns {Promise<boolean>} 성공 여부
 */
export async function updateTotalProcessedProducts(userId, count = 1) {
  try {
    await promisePool.execute(
      `UPDATE user_statistics SET total_processed_products = total_processed_products + ? WHERE userid = ?`,
      [count, userId]
    );
    return true;
  } catch (error) {
    logger.error(error, { userId });
    return false;
  }
}

/**
 * 누적 이미지 번역수 업데이트
 * @param {number} userId - 사용자 ID
 * @param {number} count - 증가시킬 이미지 장수 (기본값: 1)
 * @returns {Promise<boolean>} 성공 여부
 */
export async function updateTotalTranslatedImages(userId, count = 1) {
  try {
    await promisePool.execute(
      `UPDATE user_statistics SET total_translated_images = total_translated_images + ? WHERE userid = ?`,
      [count, userId]
    );
    return true;
  } catch (error) {
    logger.error(error, { userId });
    return false;
  }
}

/**
 * 누적 등록 상품수 업데이트
 * @param {number} userId - 사용자 ID
 * @param {number} count - 증가시킬 개수 (기본값: 1)
 * @returns {Promise<boolean>} 성공 여부
 */
export async function updateTotalRegisteredProducts(userId, count = 1) {
  try {
    await promisePool.execute(
      `UPDATE user_statistics SET total_registered_products = total_registered_products + ? WHERE userid = ?`,
      [count, userId]
    );
    return true;
  } catch (error) {
    logger.error(error, { userId });
    return false;
  }
}
