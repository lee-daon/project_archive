import express from 'express';
import { getTrackingStats } from '../service/trackingService.js';

const router = express.Router();

/**
 * 상품 조회수 통계 조회 컨트롤러
 * GET /regmng/get-tracking-stats
 * 
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 * @returns {Promise<void>}
 */
router.get('/', async (req, res) => {
  try {
    const {
      productId,
      groupId,
      days = 30,
      market = 'total',
      minViews,
      maxViews,
      sortOrder = 'desc'
    } = req.query;
    
    const userid = req.user.userid;
    
    // 파라미터 유효성 검증
    if (days && (isNaN(days) || days < 1 || days > 365)) {
      return res.status(400).json({
        success: false,
        message: 'days는 1~365 사이의 숫자여야 합니다.'
      });
    }
    
    // 마켓 유효성 검증
    const validMarkets = ['cou', 'nav', 'ele', 'esm', 'total'];
    if (market && !validMarkets.includes(market)) {
      return res.status(400).json({
        success: false,
        message: `유효하지 않은 마켓입니다. 가능한 값: ${validMarkets.join(', ')}`
      });
    }
    
    // 정렬 순서 검증
    const validSortOrders = ['asc', 'desc'];
    if (sortOrder && !validSortOrders.includes(sortOrder)) {
      return res.status(400).json({
        success: false,
        message: `유효하지 않은 정렬 순서입니다. 가능한 값: ${validSortOrders.join(', ')}`
      });
    }
    
    // 조회수 범위 검증
    if (minViews && (isNaN(minViews) || minViews < 0)) {
      return res.status(400).json({
        success: false,
        message: 'minViews는 0 이상의 숫자여야 합니다.'
      });
    }
    
    if (maxViews && (isNaN(maxViews) || maxViews < 0)) {
      return res.status(400).json({
        success: false,
        message: 'maxViews는 0 이상의 숫자여야 합니다.'
      });
    }
    
    if (minViews && maxViews && parseInt(minViews) > parseInt(maxViews)) {
      return res.status(400).json({
        success: false,
        message: 'minViews는 maxViews보다 클 수 없습니다.'
      });
    }
    
    console.log(`트래킹 통계 조회 요청 - userid: ${userid}, productId: ${productId}, groupId: ${groupId}, days: ${days}, market: ${market}`);
    
    const options = {
      productId,
      groupId,
      days: parseInt(days),
      market,
      minViews: minViews ? parseInt(minViews) : undefined,
      maxViews: maxViews ? parseInt(maxViews) : undefined,
      sortOrder
    };
    
    const result = await getTrackingStats(userid, options);
    
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error('트래킹 통계 조회 중 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message
    });
  }
});

export default router; 