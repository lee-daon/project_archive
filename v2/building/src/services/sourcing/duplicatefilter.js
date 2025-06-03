

  /**
 * prodocts 배열에서 productid가 중복된 객체를 제거하는 비동기 함수입니다.
 * 중복이 있을 경우 경고 메시지를 출력합니다.
 *
 * @param {Array} prodocts - 제품 객체들이 담긴 배열
 * @returns {Array} 중복이 제거된 제품 배열 (products)
 */
export async function removeDuplicateProducts(prodocts) {
    const seen = new Set();
    let duplicateFound = false;
    const products = [];
  
    for (const product of prodocts) {
      if (seen.has(product.productId)) {
        duplicateFound = true;
        continue; // 중복된 경우 건너뜁니다.
      }
      seen.add(product.productid);
      products.push(product);
    }
  
    if (duplicateFound) {
      console.log("!!!!!경고!!!!");
    }
  
    return products;
  }

  
  