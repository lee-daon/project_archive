import express from 'express';
import { stageProductsService } from '../../services/pre_register/preRegisterService.js';

const router = express.Router();

/**
 * 스테이징 처리 라우트
 * 선택한 상품들을 스테이징 처리합니다. 상품군 번호(marketNumber)와 메모를 함께 등록합니다.
 * 각 상품의 카테고리 매핑 여부를 확인하고, 필요한 데이터를 생성하여 pre_register 테이블에 저장합니다.
 * 
 * @route POST /stage_products
 * @param {Object} req.body - 요청 본문
 * @param {Array<string|number>} req.body.productIds - 스테이징 처리할 상품 ID 배열
 * @param {string} req.body.marketNumber - 마켓 번호(상품군 단위 코드)
 * @param {string} [req.body.memo] - 상품 그룹 메모
 * 
 */
router.post('/stage_products', async (req, res) => {
  const { productIds, marketNumber, memo } = req.body;
  console.log('수신완료', productIds, marketNumber, memo);
  
  try {
    const result = await stageProductsService(productIds, marketNumber, memo);
    res.json(result);
  } catch (error) {
    console.error('등록 전 처리 오류:', error);
    res.status(500).json({
      success: false,
      message: error.message || '등록 전 처리 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

export default router;


