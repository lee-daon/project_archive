import { promisePool } from '../../db/connectDB.js';
import { translateKeywordGenerationPrompt } from './gemini.js';
import pLimit from 'p-limit';

/**
 * 비동기적으로 여러 제품 ID를 updatekeywords 함수에 전달하여 키워드를 생성하고 데이터베이스에 업데이트하는 함수
 * 
 * @param {string[]} productIds - 키워드를 생성할 제품 ID 배열
 * @returns {Promise<Array>} - 모든 키워드 업데이트 작업의 결과 배열
 * @throws {Error} - 키워드 생성 중 오류가 발생할 경우
 */
export default async function keywordGenerationfunc(productIds) {
    const concurrencyLimit = 5; // 동시에 실행할 최대 비동기 작업 수
    const limit = pLimit(concurrencyLimit);
    const tasks = [];
  
    try {
      for (const productid of productIds) {
        tasks.push(limit(() => updateKeywords(productid)));
      }
      // 모든 작업이 완료될 때까지 대기
      return await Promise.all(tasks);
    } catch (error) {
      console.error('키워드 생성 중 오류 발생:', error);
      throw error;
    }
  }
    
/**
 * 특정 제품 ID에 대한 키워드를 생성하고 데이터베이스에 업데이트하는 함수
 * 
 * @param {string} productid - 키워드를 생성할 제품 ID
 * @returns {Promise<void>} - 키워드 업데이트 작업 완료 후 Promise
 * @throws {Error} - 데이터베이스 조회 또는 업데이트 중 오류가 발생할 경우
 */
async function updateKeywords(productid) {
  // 데이터베이스 연결 설정 (실제 환경에 맞게 수정하세요)
  
  try {

    // productid에 해당하는 title_raw, title_translated, title_optimized 값을 조회
    const [rows] = await promisePool.execute(
        `SELECT title_raw, title_translated, title_optimized 
        FROM products_detail 
        WHERE productid = ?`, 
        [productid]);

    if (rows.length === 0) {
      console.log('해당 productid에 대한 데이터가 없습니다.');
      return;
    }

    const row = rows[0];
    const data = row.title_optimized + ", " + row.title_translated;

    // 번역 함수 호출
    const keywordsResult = await translateKeywordGenerationPrompt(data);

    // [a,s,d,s] 형태의 문자열로 변환 (대괄호 포함, 공백 없음)
    let keywordsString = '[';
    if (Array.isArray(keywordsResult) && keywordsResult.length > 0) {
      keywordsString += keywordsResult.join(',');
    } else if (typeof keywordsResult === 'string') {
      keywordsString += keywordsResult;
    }
    keywordsString += ']';

    // keywords 컬럼 업데이트
    await promisePool.execute(
        'UPDATE products_detail SET keywords = ? WHERE productid = ?',
        [keywordsString, productid]
    );
    console.log('keywords,', keywordsString);
  } catch (error) {
    console.error('DB 에러:', error);
  } 
}
