import express from 'express';
import { promisePool } from '../../db/connectDB.js';

const router = express.Router();

/**
 * 쿠팡 상품 등록 API (DB 저장용)
 */
router.post('/registInCoopang', async (req, res) => {
    const { 
      groupCode,
      groupMemo, 
      tabType,
      marketNumber, 
      deliveryFee, 
      profitMargin, 
      minProfitMargin 
    } = req.body;
    
    if (!groupCode || !marketNumber) {
      return res.status(400).json({ error: '그룹 코드와 마켓 번호가 필요합니다.' });
    }
    
    try {
      // 등록할 상품 ID 목록 조회
      let statusCondition = '';
      if (tabType === 'common') {
        statusCondition = 'status.is_registrable = true AND status.registered = false';
      } else if (tabType === 'coopang') {
        statusCondition = 'status.is_registrable = true AND status.coopang_registered = false AND status.registered = false';
      } else {
        return res.status(400).json({ error: '잘못된 등록 타입입니다.' });
      }
      
      // 메모 조건 설정
      let memoCondition = '';
      let params = [groupCode];
      
      if (groupMemo === null || groupMemo === 'null' || groupMemo === '') {
        memoCondition = 'AND (pre.product_group_memo IS NULL OR pre.product_group_memo = "")';
      } else {
        memoCondition = 'AND pre.product_group_memo = ?';
        params.push(groupMemo);
      }
      
      const query = `
        SELECT pre.product_id
        FROM pre_register pre
        JOIN status ON pre.product_id = status.productid
        WHERE pre.product_group_code = ? ${memoCondition} AND ${statusCondition}
      `;
      
      const [products] = await promisePool.query(query, params);
      
      if (products.length === 0) {
        return res.status(404).json({ error: '등록할 상품이 없습니다.' });
      }
      
      // 상품 등록 정보 업데이트
      const updatePromises = products.map(async (product) => {
        // coopang_register_management 테이블 업데이트/삽입
        const insertQuery = `
          INSERT INTO coopang_register_management 
            (productid, market_number, profit_margin, minimum_profit_margin, delivery_fee, registration_attempt_time, status_code)
          VALUES (?, ?, ?, ?, ?, 1, 0)
          ON DUPLICATE KEY UPDATE 
            market_number = VALUES(market_number),
            profit_margin = VALUES(profit_margin),
            minimum_profit_margin = VALUES(minimum_profit_margin),
            delivery_fee = VALUES(delivery_fee),
            registration_attempt_time = IFNULL(registration_attempt_time, 0) + 1,
            status_code = 0
        `;
        
        await promisePool.query(insertQuery, [
          product.product_id, 
          marketNumber,
          profitMargin, 
          minProfitMargin,
          deliveryFee
        ]);
      });
      
      await Promise.all(updatePromises);
      
      res.json({ 
        success: true, 
        successCount: products.length,
        message: '쿠팡 상품 등록 정보가 성공적으로 저장되었습니다.' 
      });
      
    } catch (error) {
      console.error('쿠팡 상품 등록 정보 저장 중 오류:', error);
      res.status(500).json({ error: '쿠팡 상품 등록 정보 저장 중 오류가 발생했습니다.' });
    }
  });

export default router;
