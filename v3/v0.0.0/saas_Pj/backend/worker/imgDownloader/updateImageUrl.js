import { promisePool } from "../../common/utils/connectDB.js";

/**
 * item_images_raw 테이블의 메인 이미지 URL을 업데이트합니다.
 * @param {string|number} productid - 상품 ID
 * @param {number} imageorder - 이미지 순서
 * @param {string} newUrl - 새로운 이미지 URL
 */
async function updateMainImageUrl({ productid, imageorder, newUrl }) {
  const query = `
    UPDATE item_images_raw
    SET imageurl = ?
    WHERE productid = ? AND imageorder = ?
  `;
  try {
    await promisePool.execute(query, [newUrl, productid, imageorder]);
  } catch (error) {
    console.error(`메인 이미지 URL 업데이트 실패 (productid: ${productid}, imageorder: ${imageorder}):`, error);
    // 에러 로그 저장 등의 추가 처리
    throw error;
  }
}

/**
 * item_images_des_raw 테이블의 상세 이미지 URL을 업데이트합니다.
 * @param {string|number} productid - 상품 ID
 * @param {number} imageorder - 이미지 순서
 * @param {string} newUrl - 새로운 이미지 URL
 */
async function updateDescriptionImageUrl({ productid, imageorder, newUrl }) {
  const query = `
    UPDATE item_images_des_raw
    SET imageurl = ?
    WHERE productid = ? AND imageorder = ?
  `;
  try {
    await promisePool.execute(query, [newUrl, productid, imageorder]);
  } catch (error) {
    console.error(`상세 이미지 URL 업데이트 실패 (productid: ${productid}, imageorder: ${imageorder}):`, error);
    throw error;
  }
}

/**
 * product_options 테이블의 옵션 이미지 URL을 업데이트합니다.
 * @param {string} prop_path - 옵션 식별자
 * @param {string} newUrl - 새로운 이미지 URL
 */
async function updateOptionImageUrl({ prop_path, newUrl }) {
  const query = `
    UPDATE product_options
    SET imageurl = ?
    WHERE prop_path = ?
  `;
  try {
    await promisePool.execute(query, [newUrl, prop_path]);
  } catch (error) {
    console.error(`옵션 이미지 URL 업데이트 실패 (prop_path: ${prop_path}):`, error);
    throw error;
  }
}

export {
  updateMainImageUrl,
  updateDescriptionImageUrl,
  updateOptionImageUrl,
};
