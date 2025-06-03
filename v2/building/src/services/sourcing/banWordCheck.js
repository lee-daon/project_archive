import * as db from '../../db/sourcing/Productlist.js';
import bannedWords from '../../config/bannedWords.js';

/**
 * 금지어 처리 함수.
 *
 * 이 함수는 새로운 상품(newProducts) 배열을 받아 각 상품의 productName에 금지어가 포함되어 있는지 확인합니다.
 * 금지어가 발견되면, 해당 상품의 DB를 업데이트하여 금지어 목록과 ban 플래그를 설정하고,
 * 모든 상품은 금지어 포함 여부와 관계없이 allProducts 배열에 추가됩니다.
 *
 * @param {Array} newProducts - 새로 저장된 상품 배열
 * @returns {Object} { includeBanCount, allProducts }
 */
export async function processBannedProducts(newProducts) {
  let includeBanCount = 0;
  let allProducts = [];

  for (let i = 0; i < newProducts.length; i++) {
    const product = newProducts[i];
    // productName에서 금지어를 검색하여 포함된 모든 금지어를 foundBanned 배열에 저장합니다.
    const foundBanned = bannedWords.filter(word => product.productName.includes(word));
    
    if (i % 12 === 0) {
      console.log(i + '번째 상품 금지어 체크 완료');
    }

    if (foundBanned.length > 0) {
      // 금지어가 발견되면, DB를 업데이트하여 금지어 목록과 ban 플래그를 설정합니다.
      await db.updateProduct({
        productId: product.productId,
        banwords: foundBanned.join(', '),
        ban: true,
      });
      // 상품 객체에도 업데이트를 적용합니다.
      product.banwords = foundBanned.join(', ');
      product.ban = true;
      includeBanCount++;
    }
    // 금지어 포함 여부와 관계없이 모든 상품을 banwordCheckedProducts 배열에 추가합니다.
    allProducts.push(product);
  }

  return { includeBanCount, allProducts };
}