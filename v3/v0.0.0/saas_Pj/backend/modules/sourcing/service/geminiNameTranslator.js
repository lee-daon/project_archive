import { translateSimpleProductNamePrompt } from '../../../common/utils/gemini.js';
import * as db from '../repository/Productlist.js';
import pLimit from 'p-limit';

/**
 * 문자열에 중국어 문자가 포함되어 있는지 확인합니다.
 * @param {string} text - 확인할 문자열
 * @returns {boolean} - 중국어 문자 포함 여부
 */
function hasChineseCharacters(text) {
  // 중국어 문자 범위: 기본 한자(CJK Unified Ideographs)와 확장 한자
  const chineseRegex = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/;
  return chineseRegex.test(text);
}

/**
 * newProducts 배열의 각 객체의 productName 값을 번역하여 교체하고, DB도 업데이트합니다.
 * 만약 번역 중 두번째 오류가 발생하면 전체 번역 과정을 중지합니다.
 * gemini 번역 프롬프트 사용,브랜드 이름을 강조해서 번역합니다.
 * 한국어로만 된 상품명(중국어 문자가 없는 경우)은 번역하지 않고 원본 그대로 사용합니다.
 * @param {Array<Object>} newProducts - 번역 후 상품명 업데이트 대상 객체 배열
 * @param {number} concurrencyLimit - 동시에 실행할 수 있는 번역 작업 수 (기본값: 5)
 * @param {number} userid - 사용자 ID
 * @returns {Promise<Array<Object>>} 번역이 완료된 배열
 */
export async function translateProductNames(newProducts, concurrencyLimit = 5, userid) {
  const limit = pLimit(concurrencyLimit);
  const promises = [];

  for (let i = 0; i < newProducts.length; i++) {
    const product = newProducts[i];
    const index = i;
    
    if (product.productName) {
      promises.push(
        limit(async () => {
          // 중국어 문자가 없으면 번역 건너뛰기
          if (!hasChineseCharacters(product.productName)) {
            console.log(`[${index}] 한국어 상품명이므로 번역 건너뛰기: ${product.productName}`);
            return product;
          }
          
          try {
            // productName을 번역하고 그 결과로 교체
            let translatedName = await translateSimpleProductNamePrompt(product.productName);
            
            // 데이터베이스 스키마(VARCHAR(255))에 맞게 문자열 길이 조절
            if (translatedName.length > 255) {
              translatedName = translatedName.substring(0, 255);
            }

            product.productName = translatedName;
            // DB 업데이트: 번역된 상품명을 저장
            await db.updateProduct({
              userid: userid,
              productId: product.productId,
              productName: translatedName,
            });
            if (index % 10 === 0) {console.log(index + '번째 상품 번역 완료');}
          } catch (error) {
            console.error(`상품 [${product.productName}] 번역 중 에러 발생 (1차 시도):`, error);
            // 1차 시도에 실패하면 재시도
            try {
              let translatedName = await translateSimpleProductNamePrompt(product.productName);
              
              // 데이터베이스 스키마(VARCHAR(255))에 맞게 문자열 길이 조절
              if (translatedName.length > 255) {
                translatedName = translatedName.substring(0, 255);
              }

              product.productName = translatedName;
              // 재시도 성공 시 DB 업데이트
              await db.updateProduct({
                userid: userid,
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