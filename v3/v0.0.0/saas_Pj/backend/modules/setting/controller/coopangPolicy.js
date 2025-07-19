import express from 'express';
import { getCoopangPolicy, upsertCoopangPolicy, createCoopangPolicy } from '../repository/coopangPolicy.js';

const router = express.Router();

// GET / - 쿠팡 정책 조회
router.get('/', async (req, res) => {
  try {
    const userid = req.user.userid;
    
    if (!userid) {
      return res.status(400).json({
        success: false,
        message: 'userid가 필요합니다.'
      });
    }

    let policy = await getCoopangPolicy(userid);
    
    // 정책이 없으면 기본 정책으로 생성
    if (!policy) {
      await createCoopangPolicy(userid);
      policy = await getCoopangPolicy(userid);
    }

    if (!policy) { // 그래도 없으면 404 (생성 실패 등)
        return res.status(404).json({
            success: false,
            message: "쿠팡 정책을 찾을 수 없습니다."
        });
    }

    res.json({
      success: true,
      data: policy
    });
  } catch (error) {
    console.error('쿠팡 정책 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '쿠팡 정책 조회 중 오류가 발생했습니다.'
    });
  }
});

// PUT / - 쿠팡 정책 생성 또는 업데이트
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
      'delivery_company_code',
      'after_service_guide_content',
      'after_service_telephone',
      'free_shipping',
      'max_option_count',
      'return_delivery_fee',
      'include_import_duty'
    ];

    const missingFields = requiredFields.filter(field => policyData[field] === undefined);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `필수 필드가 누락되었습니다: ${missingFields.join(', ')}`
      });
    }

    // 데이터 유효성 검증
    if (typeof policyData.free_shipping !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'free_shipping은 boolean 값이어야 합니다.'
      });
    }

    if (typeof policyData.include_import_duty !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'include_import_duty는 boolean 값이어야 합니다.'
      });
    }


    if (typeof policyData.max_option_count !== 'number' || policyData.max_option_count < 0) {
        return res.status(400).json({
          success: false,
          message: 'max_option_count는 0 이상의 숫자여야 합니다.'
        });
      }
  
    if (typeof policyData.return_delivery_fee !== 'number' || policyData.return_delivery_fee < 0) {
        return res.status(400).json({
          success: false,
          message: 'return_delivery_fee는 0 이상의 숫자여야 합니다.'
        });
    }

    if (!policyData.delivery_company_code || typeof policyData.delivery_company_code !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'delivery_company_code는 필수 문자열입니다.'
      });
    }

    if (!policyData.after_service_guide_content || typeof policyData.after_service_guide_content !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'after_service_guide_content는 필수 문자열입니다.'
      });
    }

    if (!policyData.after_service_telephone || typeof policyData.after_service_telephone !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'after_service_telephone은 필수 문자열입니다.'
      });
    }

    await upsertCoopangPolicy(userid, policyData);
    const updatedPolicy = await getCoopangPolicy(userid);

    res.json({
      success: true,
      message: '쿠팡 정책이 성공적으로 업데이트되었습니다.',
      data: updatedPolicy
    });
  } catch (error) {
    console.error('쿠팡 정책 업데이트 오류:', error);
    res.status(500).json({
      success: false,
      message: '쿠팡 정책 업데이트 중 오류가 발생했습니다.'
    });
  }
});

export default router;
