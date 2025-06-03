/**
 * categoryMapping.js
 * 카테고리 ID 매핑 관련 함수 모듈
 */

import { promisePool } from '../connectDB.js';

/**
 * 카테고리 ID를 이용해 네이버 카테고리 ID를 반환하는 함수
 * @param {string} categoryId - 타오바오 카테고리 ID
 * @returns {Promise<number>} 네이버 카테고리 ID
 */
async function getNaverCategoryId(categoryId) {
  try {
    const [rows] = await promisePool.execute(
      'SELECT naver_cat_id FROM categorymapping WHERE catid = ?',
      [categoryId]
    );

    if (rows.length === 0) {
      throw new Error(`카테고리 ID ${categoryId}에 대한 네이버 카테고리 ID를 찾을 수 없습니다.`);
    }

    return rows[0].naver_cat_id;
  } catch (error) {
    console.error('네이버 카테고리 ID 조회 오류:', error);
    throw error;
  }
}

export { getNaverCategoryId }; 