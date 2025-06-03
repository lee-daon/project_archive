import { promisePool } from '../connectDB.js';

/**
 * productId로 상품을 찾는다.
 * @param {string} productId 
 * @returns {Promise<Object|null>}
 */
async function findByProductId(productId) {
  const [rows] = await promisePool.execute(
    'SELECT * FROM productlist WHERE productid = ?',
    [productId]
  );
  return rows.length > 0 ? rows[0] : null;
}

/**
 * 상품 업데이트 (존재하는 항목에 대해 특정 필드 갱신)
 * @param {Object} productData - 업데이트할 데이터 (productId 포함)
 * 동적으로 업데이트할 필드를 구성합니다.
 */
async function updateProduct(productData) {
  const mapping = {
    productId: 'productid',
    productName: 'product_name',
    url: 'url',
    banwords: 'banwords',
    ban: 'ban',
    price: 'price',
    image_url: 'image_url',
    sales_count: 'sales_count'
  };
  let updateFields = [];
  let values = [];
  // productId는 WHERE절에 사용하므로 업데이트 필드에서 제외
  for (const key in productData) {
    if (key === 'productId') continue;
    if (productData[key] !== undefined) {
      const column = mapping[key] || key;
      updateFields.push(`${column} = ?`);
      values.push(productData[key]);
    }
  }
  if (updateFields.length === 0) return;
  const sql = `UPDATE productlist SET ${updateFields.join(', ')} WHERE productid = ?`;
  values.push(productData.productId);
  const [result] = await promisePool.execute(sql, values);
  return result;
}

/**
 * 가격, 이미지 URL, 판매량 정보만 업데이트
 * @param {string} productId - 상품 ID
 * @param {Object} updateData - 업데이트할 데이터 객체 (price, image_url, sales_count)
 * @returns {Promise<Object>} - 업데이트 결과
 */
async function updateProductInfo(productId, updateData) {
  let updateFields = [];
  let values = [];

  // 업데이트할 필드 구성
  if (updateData.price !== undefined) {
    updateFields.push('price = ?');
    values.push(updateData.price);
  }
  
  if (updateData.image_url !== undefined) {
    updateFields.push('image_url = ?');
    values.push(updateData.image_url);
  }
  
  if (updateData.sales_count !== undefined) {
    updateFields.push('sales_count = ?');
    values.push(updateData.sales_count);
  }

  if (updateFields.length === 0) return;
  
  const sql = `UPDATE productlist SET ${updateFields.join(', ')} WHERE productid = ?`;
  values.push(productId);
  
  const [result] = await promisePool.execute(sql, values);
  return result;
}

/**
 * 신규 상품 DB 저장
 * @param {Object} productData 
 * @returns {Promise<Object>} - 저장된 상품 데이터 반환
 */
async function insertProduct(productData) {
  const sql = `
    INSERT INTO productlist (productid, url, product_name, price, image_url, sales_count, banwords, ban)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [
    productData.productId,
    productData.url,
    productData.productName,
    productData.price || null,
    productData.image_url || null,
    productData.sales_count || 0,
    productData.banwords,
    productData.ban,
  ];
  await promisePool.execute(sql, values);
  return productData;
}

export { findByProductId, updateProduct, insertProduct, updateProductInfo }; 