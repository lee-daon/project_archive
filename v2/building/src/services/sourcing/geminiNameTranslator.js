import { translateSimpleProductNamePrompt } from '../use_AI/gemini.js';
import * as db from '../../db/sourcing/Productlist.js';
import pLimit from 'p-limit';

/**
 * newProducts 배열의 각 객체의 productName 값을 번역하여 교체하고, DB도 업데이트합니다.
 * 만약 번역 중 두번째 오류가 발생하면 전체 번역 과정을 중지합니다.
 * gemini 번역 프롬프트 사용,브랜드 이름을 강조해서 번역합니다.
 * @param {Array<Object>} newProducts - 번역 후 상품명 업데이트 대상 객체 배열
 * @param {number} concurrencyLimit - 동시에 실행할 수 있는 번역 작업 수 (기본값: 5)
 * @returns {Promise<Array<Object>>} 번역이 완료된 배열
 */
export async function translateProductNames(newProducts, concurrencyLimit = 5) {
  const limit = pLimit(concurrencyLimit);
  const promises = [];

  for (let i = 0; i < newProducts.length; i++) {
    const product = newProducts[i];
    const index = i;
    
    if (product.productName) {
      promises.push(
        limit(async () => {
          try {
            // productName을 번역하고 그 결과로 교체
            const translatedName = await translateSimpleProductNamePrompt(product.productName);
            product.productName = translatedName;
            // DB 업데이트: 번역된 상품명을 저장
            await db.updateProduct({
              productId: product.productId,
              productName: translatedName,
            });
            if (index % 10 === 0) {console.log(index + '번째 상품 번역 완료');}
          } catch (error) {
            console.error(`상품 [${product.productName}] 번역 중 에러 발생 (1차 시도):`, error);
            // 1차 시도에 실패하면 재시도
            try {
              const translatedName = await translateSimpleProductNamePrompt(product.productName);
              product.productName = translatedName;
              // 재시도 성공 시 DB 업데이트
              await db.updateProduct({
                productId: product.productId,
                productName: translatedName,
              });
            } catch (retryError) {
              // 두번째 오류가 발생하면 전체 번역 과정을 중지
              console.error(`상품 번호 [${index + 1}] 번역 재시도 중 에러 발생:`, retryError);
              throw new Error(`상품 번호 [${index + 1}] 번역 재시도 중 에러 발생 - 번역 과정을 중지합니다.`);
            }
          }
          return product;
        })
      );
    }
  }

  await Promise.all(promises);
  return newProducts;
}