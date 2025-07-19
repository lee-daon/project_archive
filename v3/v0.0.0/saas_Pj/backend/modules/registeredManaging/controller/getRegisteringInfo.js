import express from 'express';
import { getRegisteringProducts } from '../repository/getRegisteringInfo.js';

const router = express.Router();

/**
 * 등록된 상품 정보 조회 컨트롤러
 * GET /regmng/get-registering-info
 * 
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 * @returns {Promise<void>}
 */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      platform, // 'coopang' | 'naver' | 'elevenstore' | 'esm'
      groupCode,
      sortOrder = 'desc', // 'asc' | 'desc' (과거순/최신순)
      productName,
      marketNumber
    } = req.query;
    
    const userid = req.user.userid;
    
    // 필수 파라미터 검증
    if (!platform) {
      return res.status(400).json({
        success: false,
        message: '플랫폼(platform)이 필요합니다. (coopang, naver, elevenstore, esm 중 선택)'
      });
    }
    
    // 플랫폼 유효성 검증
    const validPlatforms = ['coopang', 'naver', 'elevenstore', 'esm'];
    if (!validPlatforms.includes(platform)) {
      return res.status(400).json({
        success: false,
        message: `유효하지 않은 플랫폼입니다. 가능한 값: ${validPlatforms.join(', ')}`
      });
    }
    
    // 정렬 순서 검증
    const validSortOrders = ['asc', 'desc'];
    if (!validSortOrders.includes(sortOrder)) {
      return res.status(400).json({
        success: false,
        message: `유효하지 않은 정렬 순서입니다. 가능한 값: ${validSortOrders.join(', ')}`
      });
    }
    
    console.log(`등록된 상품 조회 요청 - userid: ${userid}, platform: ${platform}, page: ${page}, pageSize: ${pageSize}`);
    
    const searchParams = {
      userid,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      platform,
      groupCode,
      sortOrder,
      productName,
      marketNumber: marketNumber ? parseInt(marketNumber) : null
    };
    
    const result = await getRegisteringProducts(searchParams);
    
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error('등록된 상품 조회 중 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message
    });
  }
});

export default router;
