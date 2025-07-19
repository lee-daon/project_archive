import { promisePool } from '../../../common/utils/connectDB.js';

/**
 * 상품의 첫 번째 메인 이미지 URL을 가져오는 함수
 * 
 * @param {number} productid - 상품 ID
 * @returns {Promise<string|null>} 이미지 URL 또는 이미지가 없을 경우 null
 */
export async function getMainImageUrl(productid) {
  try {
    const [rows] = await promisePool.execute(
      `SELECT imageurl 
       FROM item_images_raw 
       WHERE productid = ? AND imageorder = 0
       LIMIT 1`,
      [productid]
    );
    
    return rows.length > 0 ? rows[0].imageurl : null;
  } catch (error) {
    console.error(`상품 ID ${productid} 메인 이미지 URL 조회 중 오류:`, error);
    throw error;
  }
}

