import express from 'express';
import { getEsmPolicy, upsertEsmPolicy, createEsmPolicy } from '../repository/esmPolicy.js';

const router = express.Router();

// GET / - ESM 정책 조회
router.get('/', async (req, res) => {
  try {
    const userid = req.user.userid;
    
    if (!userid) {
      return res.status(400).json({
        success: false,
        message: 'userid가 필요합니다.'
      });
    }

    let policy = await getEsmPolicy(userid);
    
    // 정책이 없으면 기본 정책으로 생성
    if (!policy) {
      await createEsmPolicy(userid);
      policy = await getEsmPolicy(userid);
    }

    if (!policy) { // 그래도 없으면 404 (생성 실패 등)
        return res.status(404).json({
            success: false,
            message: "ESM 정책을 찾을 수 없습니다."
        });
    }

    res.json({
      success: true,
      data: policy
    });
  } catch (error) {
    console.error('ESM 정책 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: 'ESM 정책 조회 중 오류가 발생했습니다.'
    });
  }
});

// PUT / - ESM 정책 생성 또는 업데이트
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
      'include_import_duty',
      'include_delivery_fee',
      'max_option_count'
    ];

    const missingFields = requiredFields.filter(field => policyData[field] === undefined);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `필수 필드가 누락되었습니다: ${missingFields.join(', ')}`
      });
    }

    // 데이터 유효성 검증
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

    if (!Number.isInteger(policyData.max_option_count) || policyData.max_option_count <= 0) {
      return res.status(400).json({
        success: false,
        message: 'max_option_count는 양의 정수여야 합니다.'
      });
    }

    if (policyData.max_option_count > 100) {
      return res.status(400).json({
        success: false,
        message: 'max_option_count는 100 이하여야 합니다.'
      });
    }

    await upsertEsmPolicy(userid, policyData);
    const updatedPolicy = await getEsmPolicy(userid);

    res.json({
      success: true,
      message: 'ESM 정책이 성공적으로 업데이트되었습니다.',
      data: updatedPolicy
    });
  } catch (error) {
    console.error('ESM 정책 업데이트 오류:', error);
    res.status(500).json({
      success: false,
      message: 'ESM 정책 업데이트 중 오류가 발생했습니다.'
    });
  }
});

export default router;
