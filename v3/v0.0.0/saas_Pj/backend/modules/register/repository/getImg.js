import { promisePool } from '../../../common/utils/connectDB.js';

// 상품의 첫 번째 메인 이미지 조회
export const getProductMainImage = async (userid, productid) => {
  const query = `
    SELECT imageurl
    FROM private_main_image
    WHERE userid = ? AND productid = ?
    ORDER BY imageorder ASC
    LIMIT 1
  `;
  
  const [rows] = await promisePool.execute(query, [userid, productid]);
  
  if (rows.length === 0) {
    return null;
  }
  
  return rows[0].imageurl;
};
