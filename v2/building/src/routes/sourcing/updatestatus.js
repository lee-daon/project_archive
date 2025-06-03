import express from 'express';
import { updateTestCode } from '../../db/sourcing/statusModel.js';

const router = express.Router();

// status 테이블 업데이트 API 엔드포인트 추가
router.post('/updatestatus', async (req, res) => {
    const { testCode, productIds } = req.body;
    
    if (!testCode || !productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 요청입니다.'
      });
    }
    
    try {
      await updateTestCode(testCode, productIds);
      
      res.json({
        success: true,
        message: `${productIds.length}개 상품의 테스트 코드가 ${testCode}로 업데이트되었습니다.`
      });
    } catch (error) {
      console.error('테스트 코드 업데이트 중 오류 발생:', error);
      res.status(500).json({
        success: false,
        message: '서버 오류가 발생했습니다.'
      });
    }
  });

export default router; 