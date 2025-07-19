import * as db from '../repository/Productlist.js';
import bannedWords from '../../../common/config/bannedWords.js';
import { getAllBannedWords } from '../repository/user_ban_settings.js';

/**
 * 금지어 처리 함수.
 *
 * 이 함수는 새로운 상품(newProducts) 배열을 받아 각 상품의 productName에 금지어가 포함되어 있는지 확인합니다.
 * 금지어가 발견되면, 해당 상품의 DB를 업데이트하여 금지어 목록과 ban 플래그를 설정하고,
 * 모든 상품은 금지어 포함 여부와 관계없이 allProducts 배열에 추가됩니다.
 *
 * @param {Array} newProducts - 새로 저장된 상품 배열
 * @param {number} userid - 사용자 ID
 * @returns {Object} { includeBanCount, allProducts }
 */
export async function processBannedProducts(newProducts, userid) {
  let includeBanCount = 0;
  let allProducts = [];

  // 사용자의 모든 금지어 가져오기 (공통 금지어 + 사용자 개별 금지어)
  const allBannedWords = await getAllBannedWords(userid);

  for (let i = 0; i < newProducts.length; i++) {
    const product = newProducts[i];
    
    // 1차: 공통 금지어로 필터링
    let foundBanned = bannedWords.filter(word => product.productName.includes(word));
    
    // 2차: 사용자 개별 금지어로 추가 필터링
    const userSpecificBanned = allBannedWords.filter(word => 
      !bannedWords.includes(word) && product.productName.includes(word)
    );
    
    // 모든 발견된 금지어 합치기
    foundBanned = [...foundBanned, ...userSpecificBanned];
    
    if (i % 12 === 0) {
      console.log(i + '번째 상품 금지어 체크 완료');
    }

    if (foundBanned.length > 0) {
      // 금지어가 발견되면, DB를 업데이트하여 금지어 목록과 ban 플래그를 설정합니다.
      await db.updateProduct({
        userid: userid,
        productId: product.productId,
        banwords: foundBanned.join(', '),
        ban: true,
      });
      // 상품 객체에도 업데이트를 적용합니다.
      product.banwords = foundBanned.join(', ');
      product.ban = true;
      includeBanCount++;
    }
    // 금지어 포함 여부와 관계없이 모든 상품을 allProducts 배열에 추가합니다.
    allProducts.push(product);
  }

  return { includeBanCount, allProducts };
}

/**
 * products 배열에서 productid가 중복된 객체를 제거하는 비동기 함수입니다.
 * 중복이 있을 경우 경고 메시지를 출력합니다.
 *
 * @param {Array} products - 제품 객체들이 담긴 배열
 * @param {number} userid - 사용자 ID
 * @returns {Array} 중복이 제거된 제품 배열 (products)
 */
export async function removeDuplicateProducts(products, userid) {
  const seen = new Set();
  let duplicateFound = false;
  const uniqueProducts = [];

  for (const product of products) {
    if (seen.has(product.productId)) {
      duplicateFound = true;
      continue; // 중복된 경우 건너뜁니다.
    }
    seen.add(product.productId);
    uniqueProducts.push(product);
  }

  if (duplicateFound) {
    console.log("!!!!!경고!!!!! - 중복된 상품 ID가 발견되었습니다.");
  }

  return uniqueProducts;
}