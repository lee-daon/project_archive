import { promisePool } from '../connectDB.js';

/**
 * 네이버 상품 등록 정보를 업데이트합니다
 * @param {Array<string>} productIds - 등록할 상품 ID 배열
 * @param {number} marketNumber - 마켓 번호
 * @param {number} profitMargin - 이익률
 * @param {number} minProfitMargin - 최소 이익률
 * @param {number} deliveryFee - 배송비
 * @returns {Promise<number>} - 업데이트된 상품 개수
 */
export const updateNaverRegistInfo = async (productIds, marketNumber, profitMargin, minProfitMargin, deliveryFee) => {
  try {
    if (!productIds || productIds.length === 0) {
      throw new Error('등록할 상품이 없습니다.');
    }

    // 상품별로 업데이트 작업 수행
    const updatePromises = productIds.map(async (productId) => {
      const insertQuery = `
        INSERT INTO naver_register_management 
          (productid, market_number, profit_margin, minimum_profit_margin, delivery_fee, registration_attempt_time, status_code, current_margin)
        VALUES (?, ?, ?, ?, ?, 1, 0, ?)
        ON DUPLICATE KEY UPDATE 
          market_number = VALUES(market_number),
          profit_margin = VALUES(profit_margin),
          minimum_profit_margin = VALUES(minimum_profit_margin),
          delivery_fee = VALUES(delivery_fee),
          registration_attempt_time = IFNULL(registration_attempt_time, 0) + 1,
          status_code = 0,
          current_margin = VALUES(current_margin)
      `;
      
      await promisePool.query(insertQuery, [
        productId, 
        marketNumber,
        profitMargin, 
        minProfitMargin,
        deliveryFee,
        profitMargin  // current_margin을 위한 추가 파라미터
      ]);
    });
    
    await Promise.all(updatePromises);
    return productIds.length;
  } catch (error) {
    console.error('네이버 상품 등록 정보 업데이트 중 오류:', error);
    throw error;
  }
};
