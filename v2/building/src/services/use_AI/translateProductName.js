import { promisePool } from '../../db/connectDB.js';
import { translateProductNamePrompt } from './gemini.js';
import pLimit from 'p-limit';

/**
 * 비동기적으로 여러 제품 ID에 대해 updateTitleOptimized 함수를 호출하여 데이터베이스에 업데이트하는 함수
 * 
 * @param {string[]} productids - 제품명을 번역할 제품 ID 배열
 * @returns {Promise<Array>} - 모든 번역 업데이트 작업의 결과 배열
 * @throws {Error} - 제품명 번역 중 오류가 발생할 경우
 */
export default async function translateProductName(productids) {
    const concurrencyLimit = 5; // 동시에 실행할 최대 비동기 작업 수
    const limit = pLimit(concurrencyLimit);
    const tasks = [];
    
    try {
      for (const productid of productids) {
        tasks.push(limit(() => updateTitleOptimized(productid)));
      }
      
      // 모든 작업이 완료될 때까지 대기
      return await Promise.all(tasks);
    } catch (error) {
      console.error('제품명 번역 중 오류 발생:', error);
      throw error;
    }
  }

/**
 * 특정 제품 ID에 대한 제품명을 최적화하여 번역하고 데이터베이스에 업데이트하는 함수
 * 
 * @param {string} productid - 제품명을 번역할 제품 ID
 * @returns {Promise<void>} - 번역 업데이트 작업 완료 후 Promise
 * @throws {Error} - 데이터베이스 조회 또는 업데이트 중 오류가 발생할 경우
 */  
async function updateTitleOptimized(productid) {
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

    // title_raw를 번역 함수에 전달하여 title_optimized 값을 생성
    const title_optimized = await translateProductNamePrompt(title_raw);
    console.log(`변환된 title_optimized: ${title_optimized}`);

    // 업데이트 쿼리 실행: title_optimized 값을 저장
    const [updateResult] = await promisePool.execute(
      'UPDATE products_detail SET title_optimized = ? WHERE productid = ?',
      [title_optimized, productid]
    );
    //console.log('업데이트 완료되었습니다.', updateResult.affectedRows, '행이 업데이트되었습니다.');
  } catch (err) {
    console.error('오류 발생:', err);
  }
}

