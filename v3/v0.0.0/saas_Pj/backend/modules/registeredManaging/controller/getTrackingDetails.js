import express from 'express';
import { getTrackingDetails } from '../service/trackingService.js';

const router = express.Router();

/**
 * 상품별 날짜별 조회수 상세 조회 컨트롤러
 * GET /regmng/get-tracking-details
 * 
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 * @returns {Promise<void>}
 */
router.get('/', async (req, res) => {
  try {
    const {
      productId,
      days = 14
    } = req.query;
    
    const userid = req.user.userid;
    
    // 필수 파라미터 검증
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'productId는 필수 파라미터입니다.'
      });
    }
    
    // 파라미터 유효성 검증
    if (days && (isNaN(days) || days < 1 || days > 365)) {
      return res.status(400).json({
        success: false,
        message: 'days는 1~365 사이의 숫자여야 합니다.'
      });
    }
    
    console.log(`트래킹 상세 조회 요청 - userid: ${userid}, productId: ${productId}, days: ${days}`);
    
    const result = await getTrackingDetails(userid, productId, parseInt(days));
    
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error('트래킹 상세 조회 중 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message
    });
  }
});

export default router; 