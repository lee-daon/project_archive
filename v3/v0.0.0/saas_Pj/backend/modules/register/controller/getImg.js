import express from 'express';
import { getProductMainImage } from '../repository/getImg.js';

const router = express.Router();

/**
 * 상품 이미지 조회 라우터
 * GET /reg/image/:productId
 * 
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 * @returns {Promise<void>}
 */
router.get('/:productId', async (req, res) => {
  try {
    const userid = req.user.userid;
    
    if (!userid) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.'
      });
    }
    
    const { productId } = req.params;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: '상품 ID가 필요합니다.'
      });
    }
    
    // productId를 숫자로 변환
    const productIdNum = parseInt(productId);
    
    if (isNaN(productIdNum)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 상품 ID 형식입니다.'
      });
    }
    
    const imageUrl = await getProductMainImage(userid, productIdNum);
    
    if (!imageUrl) {
      return res.status(404).json({
        success: false,
        message: '이미지를 찾을 수 없습니다.'
      });
    }
    
    return res.status(200).json({
      imageUrl: imageUrl
    });
  } catch (error) {
    console.error('Image API 오류:', error);
    
    return res.status(500).json({
      success: false,
      message: '서버 내부 오류가 발생했습니다.'
    });
  }
});

export default router;
