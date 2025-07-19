import { promisePool } from '../../../common/utils/connectDB.js';

// 사용자의 공통 설정 조회
export const getCommonSetting = async (userid) => {
  try {
    const [rows] = await promisePool.execute(
      'SELECT * FROM common_setting WHERE userid = ?',
      [userid]
    );
    return rows[0] || null;
  } catch (error) {
    throw new Error(`공통 설정 조회 실패: ${error.message}`);
  }
};

// 사용자의 공통 설정 업데이트
export const updateCommonSetting = async (userid, settingData) => {
  try {
    const {
      minimum_margin,
      basic_minimum_margin_percentage,
      basic_margin_percentage,
      buying_fee,
      import_duty,
      import_vat,
      china_exchange_rate,
      usa_exchange_rate,
      min_percentage,
      max_percentage,
      basic_delivery_fee,
      use_az_option
    } = settingData;

    const [result] = await promisePool.execute(
      `UPDATE common_setting SET 
        minimum_margin = ?,
        basic_minimum_margin_percentage = ?,
        basic_margin_percentage = ?,
        buying_fee = ?,
        import_duty = ?,
        import_vat = ?,
        china_exchange_rate = ?,
        usa_exchange_rate = ?,
        min_percentage = ?,
        max_percentage = ?,
        basic_delivery_fee = ?,
        use_az_option = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE userid = ?`,
      [
        minimum_margin,
        basic_minimum_margin_percentage,
        basic_margin_percentage,
        buying_fee,
        import_duty,
        import_vat,
        china_exchange_rate,
        usa_exchange_rate,
        min_percentage,
        max_percentage,
        basic_delivery_fee,
        use_az_option,
        userid
      ]
    );

    if (result.affectedRows === 0) {
      throw new Error('해당 사용자의 설정을 찾을 수 없습니다.');
    }

    return result;
  } catch (error) {
    throw new Error(`공통 설정 업데이트 실패: ${error.message}`);
  }
};

// 사용자의 공통 설정 생성 (초기 설정)
export const createCommonSetting = async (userid) => {
  try {
    const [result] = await promisePool.execute(
      `INSERT INTO common_setting (userid) VALUES (?)`,
      [userid]
    );
    return result;
  } catch (error) {
    throw new Error(`공통 설정 생성 실패: ${error.message}`);
  }
};
