import express from 'express';
import { getBrandBanCheckProducts } from '../repository/brandchecker.js';

const router = express.Router();

/**
 * @route GET /api/processing/brandbancheck
 * @desc 브랜드밴 체크 상태인 상품 목록 조회
 * @access Private
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.userid; // 인증 미들웨어에서 제공된 사용자 ID 사용
    
    // 브랜드밴 체크 상태인 상품 목록 조회
    const brandBanProducts = await getBrandBanCheckProducts(userId);
    
    // 조회 결과 반환
    return res.status(200).json({
      success: true,
      data: brandBanProducts
    });
  } catch (error) {
    console.error('브랜드밴 체크 상품 조회 중 오류 발생:', error);
    return res.status(500).json({
      success: false,
      message: '브랜드밴 체크 상품 조회 중 오류가 발생했습니다.'
    });
  }
});

export default router;
