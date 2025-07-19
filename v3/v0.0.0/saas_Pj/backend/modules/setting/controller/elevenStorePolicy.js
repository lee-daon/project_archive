import express from 'express';
import { getElevenStorePolicy, upsertElevenStorePolicy, createElevenStorePolicy } from '../repository/elevenStorePolicy.js';

const router = express.Router();

// GET / - 11번가 정책 조회
router.get('/', async (req, res) => {
  try {
    const userid = req.user.userid;
    
    if (!userid) {
      return res.status(400).json({
        success: false,
        message: 'userid가 필요합니다.'
      });
    }

    let policy = await getElevenStorePolicy(userid);
    
    // 정책이 없으면 기본 정책으로 생성
    if (!policy) {
      await createElevenStorePolicy(userid);
      policy = await getElevenStorePolicy(userid);
    }

    if (!policy) { // 그래도 없으면 404 (생성 실패 등)
        return res.status(404).json({
            success: false,
            message: "11번가 정책을 찾을 수 없습니다."
        });
    }

    res.json({
      success: true,
      data: policy
    });
  } catch (error) {
    console.error('11번가 정책 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '11번가 정책 조회 중 오류가 발생했습니다.'
    });
  }
});

// PUT / - 11번가 정책 생성 또는 업데이트
router.put('/', async (req, res) => {
  try {
    const userid = req.user.userid;
    const policyData = req.body;
    
    if (!userid) {
      return res.status(400).json({
        success: false,
        message: 'userid가 필요합니다.'
      });
    }

    // 필수 필드 검증
    const requiredFields = [
      'overseas_size_chart_display',
      'include_import_duty',
      'include_delivery_fee',
      'elevenstore_point_amount',
      'option_array_logic',
      'return_cost',
      'exchange_cost',
      'as_guide',
      'return_exchange_guide',
      'delivery_company_code',
      'overseas_product_indication'
    ];

    const missingFields = requiredFields.filter(field => policyData[field] === undefined);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `필수 필드가 누락되었습니다: ${missingFields.join(', ')}`
      });
    }

    // 데이터 유효성 검증
    if (typeof policyData.overseas_size_chart_display !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'overseas_size_chart_display는 boolean 값이어야 합니다.'
      });
    }

    if (typeof policyData.include_import_duty !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'include_import_duty는 boolean 값이어야 합니다.'
      });
    }

    if (typeof policyData.include_delivery_fee !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'include_delivery_fee는 boolean 값이어야 합니다.'
      });
    }

    if (typeof policyData.overseas_product_indication !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'overseas_product_indication은 boolean 값이어야 합니다.'
      });
    }

    if (typeof policyData.elevenstore_point_amount !== 'number' || policyData.elevenstore_point_amount < 0) {
      return res.status(400).json({
        success: false,
        message: 'elevenstore_point_amount는 0 이상의 숫자여야 합니다.'
      });
    }

    if (!['most_products', 'lowest_price'].includes(policyData.option_array_logic)) {
      return res.status(400).json({
        success: false,
        message: 'option_array_logic은 most_products 또는 lowest_price 중 하나여야 합니다.'
      });
    }

    if (typeof policyData.return_cost !== 'number' || policyData.return_cost < 0) {
      return res.status(400).json({
        success: false,
        message: 'return_cost는 0 이상의 숫자여야 합니다.'
      });
    }

    if (typeof policyData.exchange_cost !== 'number' || policyData.exchange_cost < 0) {
      return res.status(400).json({
        success: false,
        message: 'exchange_cost는 0 이상의 숫자여야 합니다.'
      });
    }

    if (!policyData.as_guide || typeof policyData.as_guide !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'as_guide는 필수 문자열입니다.'
      });
    }

    if (!policyData.return_exchange_guide || typeof policyData.return_exchange_guide !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'return_exchange_guide는 필수 문자열입니다.'
      });
    }

    if (!policyData.delivery_company_code || typeof policyData.delivery_company_code !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'delivery_company_code는 필수 문자열입니다.'
      });
    }
    await upsertElevenStorePolicy(userid, policyData);
    const updatedPolicy = await getElevenStorePolicy(userid);

    res.json({
      success: true,
      message: '11번가 정책이 성공적으로 업데이트되었습니다.',
      data: updatedPolicy
    });
  } catch (error) {
    console.error('11번가 정책 업데이트 오류:', error);
    res.status(500).json({
      success: false,
      message: '11번가 정책 업데이트 중 오류가 발생했습니다.'
    });
  }
});

export default router;
