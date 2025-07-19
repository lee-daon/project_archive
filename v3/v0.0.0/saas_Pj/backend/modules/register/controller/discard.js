import express from 'express';
import { updateDiscardStatus } from '../repository/discard.js';

const router = express.Router();

/**
 * 상품 폐기 처리 라우터
 * POST /reg/discard
 * 
 * @param {Object} req - 요청 객체 (ids, tabInfo, settings를 포함)
 * @param {Object} res - 응답 객체
 * @returns {Promise<void>}
 */
router.post('/', async (req, res) => {
  try {
    const userid = req.user.userid;
    
    if (!userid) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.'
      });
    }
    
    const { ids, tabInfo, settings } = req.body;
    
    // ids는 필수 파라미터
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '폐기할 상품 ID 배열이 필요합니다.'
      });
    }
    
    // 상품 ID 변환
    const productIds = ids.map(id => parseInt(id)).filter(id => !isNaN(id));
    
    if (productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '유효한 상품 ID가 없습니다.'
      });
    }
    
    // 상품 폐기 처리
    const discardResult = await updateDiscardStatus(userid, productIds);
    
    return res.status(200).json({
      success: true,
      message: '상품 폐기가 완료되었습니다.',
      discardedCount: discardResult.discardedCount,
      results: discardResult.results
    });
  } catch (error) {
    console.error('Discard API 오류:', error);
    
    return res.status(500).json({
      success: false,
      message: '폐기 처리 중 오류가 발생했습니다.'
    });
  }
});

export default router;
