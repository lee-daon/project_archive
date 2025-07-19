import express from 'express';
import { updateDiscardStatus } from '../repository/discardStatusControl.js';

const router = express.Router();

/**
 * 상품 폐기 처리 컨트롤러
 * POST /api/postprocessing/discard
 * 
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 * @returns {Promise<void>}
 */
router.post('/', async (req, res) => {
  try {
    const { productids } = req.body;
    const userid = req.user.userid;
    
    if (!productids || !Array.isArray(productids) || productids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '폐기할 상품 ID 배열이 필요합니다.'
      });
    }
    
    const result = await updateDiscardStatus(userid, productids);
    
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error('상품 폐기 처리 중 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message
    });
  }
});

export default router;
