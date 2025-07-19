import express from 'express';
import { getNaverRegisterConfig, updateNaverRegisterConfig, createNaverRegisterConfig } from '../repository/NaverPolicy.js';

const router = express.Router();

// GET / - 네이버 등록 설정 조회
router.get('/', async (req, res) => {
  try {
    const userid = req.user.userid;
    
    if (!userid) {
      return res.status(400).json({
        success: false,
        message: 'userid가 필요합니다.'
      });
    }

    let config = await getNaverRegisterConfig(userid);
    
    // 설정이 없으면 기본 설정으로 생성
    if (!config) {
      await createNaverRegisterConfig(userid);
      config = await getNaverRegisterConfig(userid);
    }

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('네이버 등록 설정 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '네이버 등록 설정 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// PUT / - 네이버 등록 설정 수정
router.put('/', async (req, res) => {
  try {
    const userid = req.user.userid;
    const configData = req.body;
    
    if (!userid) {
      return res.status(400).json({
        success: false,
        message: 'userid가 필요합니다.'
      });
    }

    // 필수 필드 검증
    const requiredFields = [
      'delivery_company',
      'after_service_telephone',
      'after_service_guide_content',
      'naver_point',
      'return_delivery_fee',
      'exchange_delivery_fee',
      'purchase_point',
      'naver_cashback_price',
      'text_review_point',
      'photo_video_review_point',
      'after_use_text_review_point',
      'after_use_photo_video_review_point',
      'store_member_review_point',
      'include_delivery_fee',
      'include_import_duty',
      'price_setting_logic'
    ];

    const missingFields = requiredFields.filter(field => configData[field] === undefined);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `필수 필드가 누락되었습니다: ${missingFields.join(', ')}`
      });
    }

    // 데이터 유효성 검증
    if (!configData.delivery_company || configData.delivery_company.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '배송업체는 필수입니다.'
      });
    }

    if (!configData.after_service_telephone || configData.after_service_telephone.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'A/S 전화번호는 필수입니다.'
      });
    }

    if (!configData.after_service_guide_content || configData.after_service_guide_content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'A/S 안내 내용은 필수입니다.'
      });
    }

    // 가격 설정 로직 유효성 검증
    const validPriceLogics = ['low_price', 'ai', 'many'];
    if (!validPriceLogics.includes(configData.price_setting_logic)) {
      return res.status(400).json({
        success: false,
        message: 'price_setting_logic은 low_price, ai, many 중 하나여야 합니다.'
      });
    }

    // Boolean 필드 유효성 검증
    if (typeof configData.include_delivery_fee !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'include_delivery_fee는 boolean 값이어야 합니다.'
      });
    }

    if (typeof configData.include_import_duty !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'include_import_duty는 boolean 값이어야 합니다.'
      });
    }

    // 숫자 필드 유효성 검증
    const numericFields = [
      'naver_point', 'return_delivery_fee', 'exchange_delivery_fee',
      'purchase_point', 'naver_cashback_price', 'text_review_point',
      'photo_video_review_point', 'after_use_text_review_point',
      'after_use_photo_video_review_point', 'store_member_review_point'
    ];

    for (const field of numericFields) {
      if (configData[field] < 0) {
        return res.status(400).json({
          success: false,
          message: `${field}는 0 이상이어야 합니다.`
        });
      }
    }

    await updateNaverRegisterConfig(userid, configData);

    res.json({
      success: true,
      message: '네이버 등록 설정이 성공적으로 업데이트되었습니다.'
    });
  } catch (error) {
    console.error('네이버 등록 설정 업데이트 오류:', error);
    res.status(500).json({
      success: false,
      message: '네이버 등록 설정 업데이트 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

export default router;
