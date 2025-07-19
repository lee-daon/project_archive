import express from 'express';
import { createCoupangAuthHeaders } from '../../../common/utils/coopang_auth.js';
import { proxyPost } from '../../../common/utils/proxy.js';

const router = express.Router();

/**
 * 쿠팡 카테고리 예측 컨트롤러
 * POST /api/postprocessing/coopang-suggestion
 * 
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 * @returns {Promise<void>}
 */
router.post('/', async (req, res) => {
  try {
    const { productName } = req.body;
    
    // 입력값 검증
    if (!productName || typeof productName !== 'string' || productName.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '상품명이 필요합니다.'
      });
    }
    
    // 환경변수 확인
    const accessKey = process.env.COOPANG_ACCESS_KEY;
    const secretKey = process.env.COOPANG_SECRET_KEY;
    const vendorId = process.env.COOPANG_VENDER_ID;
    
    if (!accessKey || !secretKey || !vendorId) {
      return res.status(500).json({
        success: false,
        message: '쿠팡 API 인증 정보가 설정되지 않았습니다.'
      });
    }
    
    // API 요청 설정
    const method = 'POST';
    const path = '/v2/providers/openapi/apis/api/v1/categorization/predict';
    const requestData = {
      productName: productName.trim()
    };
    
    // 쿠팡 인증 헤더 생성
    const headers = createCoupangAuthHeaders(accessKey, secretKey, method, path);
    
    // 프록시를 통한 쿠팡 API 요청
    const url = `api-gateway.coupang.com${path}`;
    
    console.log(`쿠팡 카테고리 예측 요청: ${productName}`);
    const response = await proxyPost(url, requestData, headers);
    
    // 응답 성공 처리
    if (response.data && response.data.code === 200) {
      return res.status(200).json({
        success: true,
        data: response.data.data,
        message: '카테고리 예측 성공'
      });
    } else {
      // 쿠팡 API에서 오류 응답
      return res.status(400).json({
        success: false,
        message: '카테고리 예측 실패',
        error: response.data
      });
    }
    
  } catch (error) {
    console.error('쿠팡 카테고리 예측 중 오류:', error);
    
    // API 요청 오류 상세 처리
    if (error.response) {
      return res.status(error.response.status || 500).json({
        success: false,
        message: '쿠팡 API 요청 실패',
        error: error.response.data || error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message
    });
  }
});

export default router;
