import { promisePool } from '../../../common/utils/connectDB.js';

/**
 * 사용자의 쿠팡 정책 설정을 데이터베이스에서 조회합니다.
 * @param {number} userid - 조회할 사용자의 ID
 * @returns {Promise<object|null>} 조회된 쿠팡 정책 객체 또는 null (없는 경우)
 * @throws {Error} 데이터베이스 조회 실패 시 에러 발생
 */
export const getCoopangPolicy = async (userid) => {
  try {
    const [rows] = await promisePool.execute(
      'SELECT * FROM coopang_setting WHERE userid = ?',
      [userid]
    );
    return rows[0] || null;
  } catch (error) {
    throw new Error(`쿠팡 정책 조회 실패: ${error.message}`);
  }
};

/**
 * 사용자의 쿠팡 정책 설정을 데이터베이스에 업데이트하거나 새로 생성합니다. (UPSERT)
 * @param {number} userid - 정책을 설정할 사용자의 ID
 * @param {object} policyData - 업데이트 또는 생성할 정책 데이터
 * @param {string} policyData.delivery_company_code - 택배사 코드
 * @param {string} policyData.after_service_guide_content - A/S 안내 내용
 * @param {string} policyData.after_service_telephone - A/S 전화번호
 * @param {boolean} policyData.free_shipping - 무료배송 여부
 * @param {number} policyData.max_option_count - 최대 옵션 개수
 * @param {number} policyData.return_delivery_fee - 반품 배송비
 * @param {boolean} policyData.include_import_duty - 수입 관세 포함 여부
 * @returns {Promise<object>} 데이터베이스 작업 결과 객체
 * @throws {Error} 데이터베이스 작업 실패 시 에러 발생
 */
export const upsertCoopangPolicy = async (userid, policyData) => {
  try {
    const {
      delivery_company_code,
      after_service_guide_content,
      after_service_telephone,
      free_shipping,
      max_option_count,
      return_delivery_fee,
      include_import_duty
    } = policyData;

    const [result] = await promisePool.execute(
      `INSERT INTO coopang_setting (
        userid, delivery_company_code, after_service_guide_content, after_service_telephone, 
        free_shipping, max_option_count, return_delivery_fee, include_import_duty
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        delivery_company_code = VALUES(delivery_company_code),
        after_service_guide_content = VALUES(after_service_guide_content),
        after_service_telephone = VALUES(after_service_telephone),
        free_shipping = VALUES(free_shipping),
        max_option_count = VALUES(max_option_count),
        return_delivery_fee = VALUES(return_delivery_fee),
        include_import_duty = VALUES(include_import_duty)`,
      [
        userid,
        delivery_company_code,
        after_service_guide_content,
        after_service_telephone,
        free_shipping,
        max_option_count,
        return_delivery_fee,
        include_import_duty
      ]
    );

    return result;
  } catch (error) {
    throw new Error(`쿠팡 정책 업데이트/생성 실패: ${error.message}`);
  }
};

/**
 * 사용자의 쿠팡 정책 설정을 데이터베이스에 기본값으로 생성합니다.
 * @param {number} userid - 정책을 생성할 사용자의 ID
 * @returns {Promise<object>} 데이터베이스 작업 결과 객체
 * @throws {Error} 데이터베이스 생성 실패 시 에러 발생
 */
export const createCoopangPolicy = async (userid) => {
  try {
    const [result] = await promisePool.execute(
      `INSERT INTO coopang_setting (userid) VALUES (?)`,
      [userid]
    );
    return result;
  } catch (error) {
    throw new Error(`쿠팡 정책 생성 실패: ${error.message}`);
  }
};
