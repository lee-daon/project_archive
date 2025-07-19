import express from 'express';
import { banSellerByProductId } from '../repository/banSeller.js';

const router = express.Router();

/**
 * 판매자 차단 API
 * POST /setting/ban-seller/
 */
router.post('/', async (req, res) => {
  try {
    const { product_id } = req.body;
    const userid = req.user.userid;

    // 필수 파라미터 검증
    if (!product_id) {
      return res.status(400).json({
        success: false,
        message: '잘못된 요청입니다.',
        error: 'product_id가 필요합니다.'
      });
    }

    if (!userid) {
      return res.status(400).json({
        success: false,
        message: '잘못된 요청입니다.',
        error: 'userid가 필요합니다.'
      });
    }

    // 판매자 차단 처리
    const result = await banSellerByProductId(parseInt(userid), parseInt(product_id));

    if (!result.success) {
      if (result.error === 'PRODUCT_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          message: '상품을 찾을 수 없습니다.',
          error: '해당 상품 ID로 등록된 상품이 없습니다.'
        });
      }
      
      if (result.error === 'ALREADY_BANNED') {
        return res.status(409).json({
          success: false,
          message: '이미 차단된 판매자입니다.',
          error: '해당 판매자는 이미 차단 목록에 등록되어 있습니다.'
        });
      }

      return res.status(400).json({
        success: false,
        message: '잘못된 요청입니다.',
        error: result.message
      });
    }

    // 성공 응답
    return res.json({
      success: true,
      message: '판매자가 성공적으로 차단되었습니다.',
      data: {
        product_id: product_id,
        seller_id: result.data.seller_id,
        seller_name: result.data.seller_name || null,
        shop_id: result.data.shop_id,
        banned_products_count: result.data.banned_products_count,
        banned_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
      }
    });

  } catch (error) {
    console.error('판매자 차단 API 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message
    });
  }
});

export default router;
