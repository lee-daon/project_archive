import { promisePool } from '../../db/connectDB.js';
import { translateProductNameWithKeywordPrompt } from './gemini.js';
import pLimit from 'p-limit';

/**
 * 비동기적으로 여러 제품 ID와 키워드 배열을 사용하여 제품명을 번역하고 데이터베이스에 업데이트하는 함수
 *
 * @param {string[]} productids - 제품명을 번역할 제품 ID 배열
 * @param {string[]} keywords - 각 제품명 번역 시 사용할 키워드 배열
 * @returns {Promise<Array>} - 모든 번역 업데이트 작업의 결과 배열
 * @throws {Error} - 제품명 번역 중 오류가 발생할 경우
 */
export default async function translateWithKeyword(productids, keywords) {
    const concurrencyLimit = 5; // 동시에 실행할 최대 비동기 작업 수
    const limit = pLimit(concurrencyLimit);
    const tasks = [];

    try {
      for (const productid of productids) {
        // updateTitleWithKeyword 함수 호출 시 keywords 배열 전달
        tasks.push(limit(() => updateTitleWithKeyword(productid, keywords)));
      }
      console.log(`제품명 키워드포함 번역 작업 완료: ${tasks.length}개`);
      // 모든 작업이 완료될 때까지 대기
      return await Promise.all(tasks);
    } catch (error) {
      console.error('제품명 번역 중 오류 발생:', error);
      throw error;
    }
  }

/**
 * 특정 제품 ID에 대한 제품명을 키워드를 포함하여 최적화 번역하고 데이터베이스에 업데이트하는 함수
 *
 * @param {string} productid - 제품명을 번역할 제품 ID
 * @param {string[]} keywords - 제품명 번역 시 사용할 키워드 배열
 * @returns {Promise<void>} - 번역 업데이트 작업 완료 후 Promise
 * @throws {Error} - 데이터베이스 조회 또는 업데이트 중 오류가 발생할 경우
 */
async function updateTitleWithKeyword(productid, keywords) {
  try {
    // productid에 해당하는 title_raw를 조회
    const [rows] = await promisePool.execute(
      'SELECT title_raw FROM products_detail WHERE productid = ?',
      [productid]
    );

    if (rows.length === 0) {
      console.log(`productid '${productid}'에 해당하는 데이터가 없습니다.`);
      return;
    }

    const title_raw = rows[0].title_raw;
    //console.log(`조회된 title_raw: ${title_raw}`);

    // title_raw와 keywords를 번역 함수에 전달하여 title_optimized 값을 생성
    const title_optimized = await translateProductNameWithKeywordPrompt(title_raw, keywords);
    console.log(`변환된 title_optimized (with keywords): ${title_optimized}`);

    // 업데이트 쿼리 실행: title_optimized 값을 저장
    await promisePool.execute(
      'UPDATE products_detail SET title_optimized = ? WHERE productid = ?',
      [title_optimized, productid]
    );
  } catch (err) {
    console.error('오류 발생:', err);
  }
}