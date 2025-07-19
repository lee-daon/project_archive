import express from 'express';
import { searchProduct } from '../../modules/orderControl/service/searchProduct.js';

const router = express.Router();

// 판매된 상품 검색
router.post('/', async (req, res) => {
  try {
    const { searchTerm } = req.body;
    const userid = req.user.userid;

    // 입력값 검증
    if (!searchTerm || typeof searchTerm !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'searchTerm이 필요합니다.'
      });
    }

    console.log(`판매 상품 검색 요청 - userid: ${userid}, searchTerm: ${searchTerm}`);

    // searchProduct 함수 호출
    const result = await searchProduct(userid, searchTerm);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: '상품을 성공적으로 찾았습니다.',
        searchType: result.searchType,
        productData: result.data
      });
    } else {
      return res.status(404).json({
        success: false,
        message: result.error || '상품을 찾을 수 없습니다.',
        searchType: result.searchType || null,
        productData: null
      });
    }

  } catch (error) {
    console.error('판매 상품 검색 중 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message
    });
  }
});

export default router;
