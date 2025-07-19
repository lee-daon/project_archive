/**
 * 수집된 제품 목록을 API 요청 형식으로 변환하는 함수
 * @param {Array} products - 수집된 제품 배열
 * @returns {Array} - API 요청에 맞게 변환된 제품 배열
 */
export const mapProductsForUpload = (products) => {
  if (!Array.isArray(products) || products.length === 0) {
    return [];
  }

  return products.map(product => ({
    productId: product.id.toString(),
    productName: product.title,
    pic: product.image,
    price: product.price,
    sales: product.sold ? product.sold.toString() : '0',
    detail_url: `https://item.taobao.com/item.htm?id=${product.id}`
  }));
};
