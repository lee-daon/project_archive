import express from 'express';
import { registInNaver } from '../../services/register/registInNaver.js';

const router = express.Router();

/**
 * 네이버 상품 등록 API
 */
router.post('/registInNaver', async (req, res) => {
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
      // 서비스 계층 호출
      const result = await registInNaver({
        groupCode,
        groupMemo,
        tabType,
        marketNumber,
        deliveryFee,
        profitMargin,
        minProfitMargin
      });
      
      if (!result.success) {
        return res.status(404).json({ error: result.message });
      }
      
      res.json({
        success: true,
        successCount: result.successCount,
        failedCount: result.failedCount,
        message: result.message
      });
      
    } catch (error) {
      console.error('네이버 상품 등록 중 오류:', error);
      res.status(500).json({ error: '네이버 상품 등록 중 오류가 발생했습니다.' });
    }
  });

export default router;