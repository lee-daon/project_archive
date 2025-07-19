import { promisePool } from '../../../common/utils/connectDB.js';

/**
 * 각 마켓별 정책 설정 여부를 확인합니다.
 * @param {number} userid - 사용자 ID
 * @param {object} markets - 확인할 마켓 정보 { coopangMarket, naverMarket, elevenstoreMarket, esmMarket }
 * @returns {Promise<{isValid: boolean, message?: string}>}
 */
export async function checkPolicySetup(userid, markets) {
  const { coopangMarket, naverMarket, elevenstoreMarket, esmMarket } = markets;
  const missingPolicies = [];

  if (coopangMarket) {
    const query = `SELECT after_service_guide_content, after_service_telephone FROM coopang_setting WHERE userid = ?`;
    const [rows] = await promisePool.query(query, [userid]);
    if (rows.length === 0 || !rows[0].after_service_guide_content || !rows[0].after_service_telephone) {
      missingPolicies.push('쿠팡');
    }
  }

  if (naverMarket) {
    const query = `SELECT after_service_guide_content, after_service_telephone FROM naver_register_config WHERE userid = ?`;
    const [rows] = await promisePool.query(query, [userid]);
    if (rows.length === 0 || !rows[0].after_service_guide_content || !rows[0].after_service_telephone) {
      missingPolicies.push('네이버');
    }
  }

  if (elevenstoreMarket) {
    // 참고: elevenstore_setting 테이블 스키마에는 after_service_telephone 필드가 없고 as_guide 필드가 있습니다.
    const query = `SELECT as_guide FROM elevenstore_setting WHERE userid = ?`;
    const [rows] = await promisePool.query(query, [userid]);
    if (rows.length === 0 || !rows[0].as_guide) {
      missingPolicies.push('11번가');
    }
  }

  if (esmMarket) {
    // ESM 정책 설정 확인 (관부과세, 배송비 포함 여부)
    const query = `SELECT include_import_duty, include_delivery_fee FROM esm_setting WHERE userid = ?`;
    const [rows] = await promisePool.query(query, [userid]);
    if (rows.length === 0) {
      missingPolicies.push('ESM');
    }
  }

  if (missingPolicies.length > 0) {
    return {
      isValid: false,
      message: `${missingPolicies.join(', ')} 마켓의 정책설정(A/S 안내, 연락처, 가격 정책 등)을 완료해 주세요.`
    };
  }

  return { isValid: true };
}
