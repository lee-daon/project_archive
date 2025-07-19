import express from 'express';
import { registerProducts } from '../service/register.js';
import { checkMarketLimit } from '../../../common/QuotaUsageLimit/Limit/checkMarkerLimit.js';
import { checkPolicySetup } from '../repository/checkPolicySetup.js';
import { checkDailyRegisterable } from '../repository/checkDailyRegisterable.js';

const router = express.Router();

/**
 * POST /reg/register
 * 상품 등록 API
 */
router.post('/', async (req, res) => {
  try {
    const { ids, tabInfo, settings } = req.body;
    const userid = req.user.userid;
    
    // 요청 데이터 검증
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '등록할 상품 ID가 필요합니다.'
      });
    }

    if (!tabInfo) {
      return res.status(400).json({
        success: false,
        message: '탭 정보가 필요합니다.'
      });
    }

    if (!settings) {
      return res.status(400).json({
        success: false,
        message: '등록 설정이 필요합니다.'
      });
    }

    // 마켓 수 제한 확인
    const marketLimitInfo = await checkMarketLimit(userid);
    if (!marketLimitInfo.canCreate) {
      return res.status(403).json({
        success: false,
        message: '사업자 수를 초과하였습니다'
      });
    }

    // 기본값 설정
    const registrationSettings = {
      groupCode: settings.groupCode ,
      shippingFee: settings.shippingFee ,
      minMargin: settings.minMargin ,
      defaultMargin: settings.defaultMargin ,
      coopangMarket: settings.coopangMarket ,
      naverMarket: settings.naverMarket,
      elevenstoreMarket: settings.elevenstoreMarket,
      esmMarket: settings.esmMarket
    };

    // 일일 등록 가능 수량 체크 및 차감 (11번가, 쿠팡만)
    const dailyLimitCheck = await checkDailyRegisterable(
      tabInfo, 
      ids.length, 
      userid, 
      registrationSettings
    );
    
    if (!dailyLimitCheck.success) {
      return res.status(400).json({
        success: false,
        message: dailyLimitCheck.error
      });
    }

    // 정책 설정 확인
    const policyCheck = await checkPolicySetup(userid, registrationSettings);
    if (!policyCheck.isValid) {
      return res.status(400).json({
        success: false,
        message: policyCheck.message
      });
    }

    // 상품 등록 서비스 호출
    const result = await registerProducts(userid, ids, tabInfo, registrationSettings);

    // 성공 응답
    res.status(200).json(result);

  } catch (error) {
    console.error('상품 등록 API 오류:', error);
    
    // 에러 응답
    res.status(500).json({
      success: false,
      message: error.message || '등록 처리 중 오류가 발생했습니다.'
    });
  }
});

export default router;
