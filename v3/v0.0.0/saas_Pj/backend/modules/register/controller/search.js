import express from 'express';
import { searchProducts } from '../service/search.js';

const router = express.Router();

/**
 * 상품 검색 라우터
 * GET /reg/search?tabInfo=common&groupCode=GRP001
 * 
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 * @returns {Promise<void>}
 */
router.get('/', async (req, res) => {
  try {
    const userid = req.user.userid;
    
    if (!userid) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.'
      });
    }
    
    const { tabInfo, groupCode } = req.query;
    
    // tabInfo는 필수 파라미터
    if (!tabInfo) {
      return res.status(400).json({
        success: false,
        message: 'tabInfo 파라미터가 필요합니다.'
      });
    }
    
    // tabInfo 유효성 검사
    const validTabInfos = ['common', 'naver', 'coupang', 'elevenstore', 'esm'];
    if (!validTabInfos.includes(tabInfo)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 tabInfo 값입니다.'
      });
    }
    
    const searchResult = await searchProducts(userid, tabInfo, groupCode);
    
    return res.status(200).json(searchResult);
  } catch (error) {
    console.error('Search API 오류:', error);
    
    return res.status(500).json({
      success: false,
      message: '서버 내부 오류가 발생했습니다.'
    });
  }
});

export default router;
