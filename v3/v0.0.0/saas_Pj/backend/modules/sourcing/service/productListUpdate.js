// src/services/productService.js
import * as db from '../repository/Productlist.js';

/**
 * Step 1 & 2: 중복 체크 및 신규 상품 DB 저장
 *
 * - 입력된 상품 배열에서 DB에 이미 존재하는 상품은 업데이트하고, 중복 건수를 기록합니다.
 * - 신규 상품은 DB에 저장한 후, 저장된 데이터를 newProducts 배열에 담아 반환합니다.
 *
 * @param {Array} products - 업로드 받은 상품 배열
 * @param {number} userid - 사용자 ID
 * @returns {Object} { duplicationCount, newProducts }
 */
export async function processNewProducts(products, userid) {
  let duplicationCount = 0;
  let target = [];
  let newProducts = [];

  // Step 1: 중복 체크 및 기존 상품 업데이트
  for (const product of products) {
    const existing = await db.findByProductId(product.productId, userid);
    if (existing) {
      duplicationCount++;
      console.log('중복 상품 존재', product.productId);
      
      // 중복 상품이라도 가격, 이미지 URL, 판매량 정보 업데이트
      const updateData = {
        price: product.price,
        image_url: product.pic,
        sales_count: parseSalesCount(product.sales)
      };
      
      await db.updateProductInfo(product.productId, userid, updateData);
    } else {
      target.push(product);
    }
  }

  // Step 2: 신규 상품 DB 저장
  for (const product of target) {
    const newProduct = {
      userid: userid,
      productId: product.productId,
      url: product.detail_url || `https://item.taobao.com/item.htm?id=${product.productId}`,
      productName: product.productName,
      price: product.price,
      image_url: product.pic,
      sales_count: parseSalesCount(product.sales),
      banwords: '',
      ban: false,
    };
    const inserted = await db.insertProduct(newProduct);
    newProducts.push(inserted);
  }

  return { duplicationCount, newProducts };
}

/**
 * 판매량 문자열을 숫자로 변환
 * @param {string} salesStr - 예: "100以内" (100 이내)
 * @returns {number} 판매량 숫자
 */
function parseSalesCount(salesStr) {
  if (!salesStr) return 0;
  
  // 숫자만 추출 (예: "100以内" -> 100)
  const match = salesStr.match(/\d+/);
  return match ? parseInt(match[0]) : 0;
}
