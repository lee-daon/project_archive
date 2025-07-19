import express from 'express';
import { searchProduct } from '../service/searchProduct.js';

const router = express.Router();

/**
 * 상품 검색 컨트롤러
 * GET /order/search-product?searchTerm=검색어
 * 
 * 검색어가 숫자로만 구성되면 상품 ID(productId)로 인식하여 검색합니다.
 * 문자가 포함된 경우 상품명으로 인식하여 검색합니다.
 * 
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 * @returns {Promise<void>}
 */
router.get('/', async (req, res) => {
  try {
    const { searchTerm } = req.query;
    const userid = req.user.userid;
    
    const searchValue = searchTerm;
    
    if (!searchValue) {
      return res.status(400).json({
        success: false,
        message: '검색어(searchTerm)가 필요합니다.'
      });
    }
    
    console.log(`상품 검색 요청 - userid: ${userid}, searchTerm: ${searchValue}`);
    
    const result = await searchProduct(userid, searchValue);
    
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(404).json(result);
    }
  } catch (error) {
    console.error('상품 검색 중 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message
    });
  }
});

export default router;
