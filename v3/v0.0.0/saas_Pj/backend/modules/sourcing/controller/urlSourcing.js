import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import { processProductIds } from '../service/UrlSourcing.js';
import { INTERNAL_API_KEY } from '../../../common/middleware/jwtparser.js';
import { checkSourcingLimit } from '../../../common/QuotaUsageLimit/Quota/checkSourcingLimit.js';
import { checkRequestLimit } from '../../../common/QuotaUsageLimit/Limit/requestLimit.js';

dotenv.config();
const router = express.Router();
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

router.post('/', async (req, res) => {
  try {
    // 요청 본문에서 상품 ID 배열 추출
    const { productIds } = req.body;
    
    // userid 가져오기
    let userid;
    if (req.user && req.user.userid) {
      userid = req.user.userid;
    } else if (req.query.userid) {
      userid = parseInt(req.query.userid, 10);
    } else {
      return res.status(400).json({
        success: false,
        message: '유효한 사용자 ID가 제공되지 않았습니다.'
      });
    }
    
    // 상품 ID 배열 유효성 검사
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '유효한 상품 ID 배열이 제공되지 않았습니다.'
      });
    }
    
    // 요청 개수 제한 검사 (200개 제한)
    const limitResult = checkRequestLimit(productIds.length, 100);
    if (!limitResult.success) {
      return res.status(limitResult.statusCode).json({
        success: false,
        message: limitResult.message
      });
    }
    
    console.log(`사용자 ${userid}의 ${productIds.length}개 상품 ID 직접 소싱 요청`);
    
    // 소싱 할당량 확인 및 차감
    const limitCheckResult = await checkSourcingLimit(userid, productIds.length);
    if (!limitCheckResult.success) {
      return res.status(limitCheckResult.statusCode || 429).json({
        success: false,
        message: limitCheckResult.message
      });
    }
    console.log('할당량 확인 완료');
    
    // UrlSourcing 서비스를 사용하여 상품 정보 API 호출 및 포맷팅
    const result = await processProductIds(productIds, userid);
    
    // 성공적으로 가져온 상품들을 upload 라우터로 전송
    if (result.formattedProducts.length > 0) {
      try {
        // upload 라우터로 상품 데이터 전송
        const uploadResponse = await axios.post(
          `${API_BASE_URL}/src/upload?userid=${userid}`,
          result.formattedProducts,
          {
            headers: {
              'x-api-key': INTERNAL_API_KEY,
              'Content-Type': 'application/json'
            }
          }
        );
        
        // 클라이언트에게 응답
        res.json({
          success: true,
          message: `${result.totalSuccess}개 상품이 처리되었습니다. ${result.totalFailed}개 상품은 API 호출에 실패했습니다.`,
          successCount: result.totalSuccess,
          failedCount: result.totalFailed,
          failedProducts: result.failedProducts
        });
      } catch (uploadError) {
        console.error('업로드 라우터 요청 중 오류:', uploadError);
        const status = uploadError.response?.status || 500;
        const message = uploadError.response?.data?.message || uploadError.message;
        res.status(status).json({
          success: false,
          message
        });
      }
    } else {
      res.json({
        success: false,
        message: '모든 상품의 API 호출이 실패했습니다.',
        successCount: 0,
        failedCount: result.totalFailed,
        failedProducts: result.failedProducts
      });
    }
  } catch (error) {
    console.error('URL 소싱 중 오류:', error);
    res.status(500).json({
      success: false, 
      message: `URL 소싱 중 오류 발생: ${error.message}`
    });
  }
});

export default router;
