import express from 'express';
import { getCommonSetting, updateCommonSetting, createCommonSetting } from '../repository/commonPolicy.js';

const router = express.Router();

// GET / - 공통 설정 조회
router.get('/', async (req, res) => {
  try {
    const userid = req.user.userid;
    
    if (!userid) {
      return res.status(400).json({
        success: false,
        message: 'userid가 필요합니다.'
      });
    }

    let setting = await getCommonSetting(userid);
    
    // 설정이 없으면 기본 설정으로 생성
    if (!setting) {
      await createCommonSetting(userid);
      setting = await getCommonSetting(userid);
    }

    res.json({
      success: true,
      data: setting
    });
  } catch (error) {
    console.error('공통 설정 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '공통 설정 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// PUT / - 공통 설정 수정
router.put('/', async (req, res) => {
  try {
    const userid = req.user.userid;
    const settingData = req.body;
    
    if (!userid) {
      return res.status(400).json({
        success: false,
        message: 'userid가 필요합니다.'
      });
    }

    // 필수 필드 검증
    const requiredFields = [
      'minimum_margin',
      'basic_minimum_margin_percentage',
      'basic_margin_percentage',
      'buying_fee',
      'import_duty',
      'import_vat',
      'china_exchange_rate',
      'usa_exchange_rate',
      'min_percentage',
      'max_percentage',
      'basic_delivery_fee',
      'use_az_option'
    ];

    const missingFields = requiredFields.filter(field => settingData[field] === undefined);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `필수 필드가 누락되었습니다: ${missingFields.join(', ')}`
      });
    }

    // 데이터 유효성 검증
    if (settingData.basic_minimum_margin_percentage > 100) {
      return res.status(400).json({
        success: false,
        message: '기본 최소 마진 퍼센트는 100 이하여야 합니다.'
      });
    }

    if (settingData.basic_margin_percentage > 1000) {
      return res.status(400).json({
        success: false,
        message: '기본 마진 퍼센트는 1000 이하여야 합니다.'
      });
    }

    if (settingData.buying_fee > 100 || settingData.import_duty > 100 || settingData.import_vat > 100) {
      return res.status(400).json({
        success: false,
        message: '구매 수수료, 수입 관세, 수입 부가세는 100 이하여야 합니다.'
      });
    }

    if (settingData.min_percentage > settingData.max_percentage) {
      return res.status(400).json({
        success: false,
        message: '최소 할인 퍼센트는 최대 할인 퍼센트보다 작거나 같아야 합니다.'
      });
    }

    if (settingData.min_percentage < 0 || settingData.max_percentage > 100) {
      return res.status(400).json({
        success: false,
        message: '할인 퍼센트는 0-100 범위여야 합니다.'
      });
    }

    if (settingData.basic_delivery_fee < 0) {
      return res.status(400).json({
        success: false,
        message: '기본 배송비는 0 이상이어야 합니다.'
      });
    }

    await updateCommonSetting(userid, settingData);

    res.json({
      success: true,
      message: '공통 설정이 성공적으로 업데이트되었습니다.'
    });
  } catch (error) {
    console.error('공통 설정 업데이트 오류:', error);
    res.status(500).json({
      success: false,
      message: '공통 설정 업데이트 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

export default router;
