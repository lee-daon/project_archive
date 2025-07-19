import { promisePool } from '../../../common/utils/connectDB.js';

// 사용자의 네이버 등록 설정 조회
export const getNaverRegisterConfig = async (userid) => {
  try {
    const [rows] = await promisePool.execute(
      'SELECT * FROM naver_register_config WHERE userid = ?',
      [userid]
    );
    return rows[0] || null;
  } catch (error) {
    throw new Error(`네이버 등록 설정 조회 실패: ${error.message}`);
  }
};

// 사용자의 네이버 등록 설정 업데이트
export const updateNaverRegisterConfig = async (userid, configData) => {
  try {
    const {
      delivery_company,
      after_service_telephone,
      after_service_guide_content,
      naver_point,
      return_delivery_fee,
      exchange_delivery_fee,
      purchase_point,
      naver_cashback_price,
      text_review_point,
      photo_video_review_point,
      after_use_text_review_point,
      after_use_photo_video_review_point,
      store_member_review_point,
      include_delivery_fee,
      include_import_duty,
      price_setting_logic
    } = configData;

    const [result] = await promisePool.execute(
      `UPDATE naver_register_config SET 
        delivery_company = ?,
        after_service_telephone = ?,
        after_service_guide_content = ?,
        naver_point = ?,
        return_delivery_fee = ?,
        exchange_delivery_fee = ?,
        purchase_point = ?,
        naver_cashback_price = ?,
        text_review_point = ?,
        photo_video_review_point = ?,
        after_use_text_review_point = ?,
        after_use_photo_video_review_point = ?,
        store_member_review_point = ?,
        include_delivery_fee = ?,
        include_import_duty = ?,
        price_setting_logic = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE userid = ?`,
      [
        delivery_company,
        after_service_telephone,
        after_service_guide_content,
        naver_point,
        return_delivery_fee,
        exchange_delivery_fee,
        purchase_point,
        naver_cashback_price,
        text_review_point,
        photo_video_review_point,
        after_use_text_review_point,
        after_use_photo_video_review_point,
        store_member_review_point,
        include_delivery_fee,
        include_import_duty,
        price_setting_logic,
        userid
      ]
    );

    if (result.affectedRows === 0) {
      throw new Error('해당 사용자의 네이버 설정을 찾을 수 없습니다.');
    }

    return result;
  } catch (error) {
    throw new Error(`네이버 등록 설정 업데이트 실패: ${error.message}`);
  }
};

// 사용자의 네이버 등록 설정 생성 (초기 설정)
export const createNaverRegisterConfig = async (userid) => {
  try {
    const [result] = await promisePool.execute(
      `INSERT INTO naver_register_config (userid) VALUES (?)`,
      [userid]
    );
    return result;
  } catch (error) {
    throw new Error(`네이버 등록 설정 생성 실패: ${error.message}`);
  }
};
