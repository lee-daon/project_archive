import { promisePool } from '../../../common/utils/connectDB.js';

/**
 * 네이버 등록 관리 테이블에 데이터를 삽입하거나 업데이트합니다.
 * @param {number} userid - 사용자 ID
 * @param {string} productid - 상품 ID
 * @param {object} settings - 등록 설정 정보
 */
export const insertOrUpdateNaverRegisterStatus = async (userid, productid, settings) => {
  try {
    const {
      naverMarket,
      defaultMargin,
      minMargin,
      shippingFee
    } = settings;

    const query = `
      INSERT INTO naver_register_management (
        userid, 
        productid, 
        market_number, 
        status, 
        profit_margin, 
        minimum_profit_margin, 
        registration_attempt_time, 
        delivery_fee,
        status_code,
        current_margin
      ) VALUES (?, ?, ?, 'pending', ?, ?, 1, ?, 0, ?)
      ON DUPLICATE KEY UPDATE
        status = 'pending',
        profit_margin = VALUES(profit_margin),
        minimum_profit_margin = VALUES(minimum_profit_margin),
        registration_attempt_time = registration_attempt_time + 1,
        delivery_fee = VALUES(delivery_fee),
        current_margin = VALUES(current_margin),
        updated_at = CURRENT_TIMESTAMP
    `;

    await promisePool.execute(query, [
      userid,
      productid,
      naverMarket,
      defaultMargin,
      minMargin,
      shippingFee,
      defaultMargin
    ]);

  } catch (error) {
    console.error('네이버 등록 상태 업데이트 중 오류:', error);
    throw error;
  }
};

/**
 * 쿠팡 등록 관리 테이블에 데이터를 삽입하거나 업데이트합니다.
 * @param {number} userid - 사용자 ID
 * @param {string} productid - 상품 ID
 * @param {object} settings - 등록 설정 정보
 */
export const insertOrUpdateCoopangRegisterStatus = async (userid, productid, settings) => {
  try {
    const {
      coopangMarket,
      defaultMargin,
      minMargin,
      shippingFee
    } = settings;

    const query = `
      INSERT INTO coopang_register_management (
        userid, 
        productid, 
        market_number, 
        status, 
        profit_margin, 
        minimum_profit_margin, 
        registration_attempt_time, 
        delivery_fee,
        status_code,
        current_margin
      ) VALUES (?, ?, ?, 'pending', ?, ?, 1, ?, 0, ?)
      ON DUPLICATE KEY UPDATE
        status = 'pending',
        profit_margin = VALUES(profit_margin),
        minimum_profit_margin = VALUES(minimum_profit_margin),
        registration_attempt_time = registration_attempt_time + 1,
        delivery_fee = VALUES(delivery_fee),
        current_margin = VALUES(current_margin),
        updated_at = CURRENT_TIMESTAMP
    `;

    await promisePool.execute(query, [
      userid,
      productid,
      coopangMarket,
      defaultMargin,
      minMargin,
      shippingFee,
      defaultMargin
    ]);

  } catch (error) {
    console.error('쿠팡 등록 상태 업데이트 중 오류:', error);
    throw error;
  }
};

/**
 * 11번가 등록 관리 테이블에 데이터를 삽입하거나 업데이트합니다.
 * @param {number} userid - 사용자 ID
 * @param {string} productid - 상품 ID
 * @param {object} settings - 등록 설정 정보
 */
export const insertOrUpdateElevenstoreRegisterStatus = async (userid, productid, settings) => {
  try {
    const {
      elevenstoreMarket,
      defaultMargin,
      minMargin,
      shippingFee
    } = settings;

    const query = `
      INSERT INTO elevenstore_register_management (
        userid, 
        productid, 
        market_number, 
        status, 
        profit_margin, 
        minimum_profit_margin, 
        registration_attempt_time, 
        delivery_fee,
        status_code,
        current_margin
      ) VALUES (?, ?, ?, 'pending', ?, ?, 1, ?, 0, ?)
      ON DUPLICATE KEY UPDATE
        status = 'pending',
        profit_margin = VALUES(profit_margin),
        minimum_profit_margin = VALUES(minimum_profit_margin),
        registration_attempt_time = registration_attempt_time + 1,
        delivery_fee = VALUES(delivery_fee),
        current_margin = VALUES(current_margin),
        updated_at = CURRENT_TIMESTAMP
    `;

    await promisePool.execute(query, [
      userid,
      productid,
      elevenstoreMarket,
      defaultMargin,
      minMargin,
      shippingFee,
      defaultMargin
    ]);

  } catch (error) {
    console.error('11번가 등록 상태 업데이트 중 오류:', error);
    throw error;
  }
};

/**
 * ESM 등록 관리 테이블에 데이터를 삽입하거나 업데이트합니다.
 * @param {number} userid - 사용자 ID
 * @param {string} productid - 상품 ID
 * @param {object} settings - 등록 설정 정보
 */
export const insertOrUpdateEsmRegisterStatus = async (userid, productid, settings) => {
  try {
    const {
      esmMarket,
      defaultMargin,
      minMargin,
      shippingFee
    } = settings;

    const query = `
      INSERT INTO esm_register_management (
        userid, 
        productid, 
        market_number, 
        status, 
        profit_margin, 
        minimum_profit_margin, 
        registration_attempt_time, 
        delivery_fee,
        current_margin
      ) VALUES (?, ?, ?, 'pending', ?, ?, 1, ?, ?)
      ON DUPLICATE KEY UPDATE
        status = 'pending',
        profit_margin = VALUES(profit_margin),
        minimum_profit_margin = VALUES(minimum_profit_margin),
        registration_attempt_time = registration_attempt_time + 1,
        delivery_fee = VALUES(delivery_fee),
        current_margin = VALUES(current_margin),
        updated_at = CURRENT_TIMESTAMP
    `;

    await promisePool.execute(query, [
      userid,
      productid,
      esmMarket,
      defaultMargin,
      minMargin,
      shippingFee,
      defaultMargin
    ]);

  } catch (error) {
    console.error('ESM 등록 상태 업데이트 중 오류:', error);
    throw error;
  }
};

