import express from 'express';
import { getProductData } from './db/getproductdata.js';

const router = express.Router();

// 상품 상세 데이터 조회
router.post('/', async (req, res) => {
  try {
    const { productId } = req.body;
    const userid = req.user.userid;

    // 데이터 구조 검증
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'productId가 필요합니다.'
      });
    }

    // productId 타입 검증
    if (typeof productId !== 'string' && typeof productId !== 'number') {
      return res.status(400).json({
        success: false,
        message: '유효한 productId 형식이 필요합니다.'
      });
    }

    // 문자열인 경우 숫자로 변환 가능한지 확인
    const numericProductId = Number(productId);
    if (isNaN(numericProductId)) {
      return res.status(400).json({
        success: false,
        message: '유효한 productId 형식이 필요합니다.'
      });
    }

    console.log(`사용자 ${userid}의 상품 ${productId} 상세 데이터 조회 요청`);

    // DB에서 상품 데이터 조회
    const result = await getProductData(userid, numericProductId);

    if (!result.success) {
      const statusCode = result.message.includes('찾을 수 없습니다') ? 404 : 500;
      return res.status(statusCode).json({
        success: false,
        message: result.message
      });
    }

    // 성공 응답
    return res.json({
      success: true,
      message: result.message,
      productData: result.data
    });

  } catch (error) {
    console.error('상품 상세 데이터 조회 오류:', error);
    return res.status(500).json({
      success: false,
      message: '요청 처리 중 오류가 발생했습니다.'
    });
  }
});

export default router;
