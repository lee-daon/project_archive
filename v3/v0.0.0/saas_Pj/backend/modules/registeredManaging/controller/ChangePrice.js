import express from 'express';
import { checkRequestLimit } from '../../../common/QuotaUsageLimit/Limit/requestLimit.js';
import { prepareAndQueuePriceChange } from '../service/PriceChangeControl.js';

const router = express.Router();

/**
 * 상품 가격 변경 컨트롤러 (서비스 계층 호출)
 */
router.post('/', async (req, res) => {
  try {
    const userid = req.user.userid;
    const { productIds, platform, discountPercent } = req.body;

    // 입력값 검증
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ success: false, message: '상품 ID 배열이 필요합니다.' });
    }
    if (!platform || !['coopang', 'naver', 'elevenstore'].includes(platform)) {
      return res.status(400).json({ success: false, message: '플랫폼은 coopang, naver, 또는 elevenstore여야 합니다. ESM은 가격 변경을 지원하지 않습니다.' });
    }
    if (discountPercent === undefined || typeof discountPercent !== 'number' || discountPercent < 0 || discountPercent >= 100) {
      return res.status(400).json({ success: false, message: '할인율은 0~99 사이의 숫자여야 합니다.' });
    }

    // 요청 개수 제한
    const limitResult = checkRequestLimit(productIds.length, 100);
    if (!limitResult.success) {
      return res.status(limitResult.statusCode).json({ success: false, message: limitResult.message });
    }

    // 서비스 호출
    const result = await prepareAndQueuePriceChange(userid, productIds, platform, discountPercent);

    return res.status(result.statusCode).json(result);

  } catch (error) {
    console.error('가격 변경 컨트롤러 오류:', error);
    return res.status(500).json({
      success: false,
      message: '가격 변경 중 서버 오류가 발생했습니다.',
      statusCode: 500,
      error: error.message
    });
  }
});

export default router;
