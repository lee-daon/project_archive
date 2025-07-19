import { promisePool } from '../../../common/utils/connectDB.js';

/**
 * API 키 발급 이력 조회
 * @param {number} userid - 사용자 ID
 * @returns {Object|null} - 사용자 API 키 정보
 */
const findApiKeyInfo = async (userid) => {
  const [result] = await promisePool.execute(
    'SELECT api_key_issued_at FROM user_info WHERE userid = ?',
    [userid]
  );
  
  return result.length > 0 ? result[0] : null;
};

/**
 * API 키 업데이트
 * @param {number} userid - 사용자 ID
 * @param {string} hashedApiKey - 해시된 API 키
 * @param {Date} issuedAt - 발급 시간
 */
const updateApiKey = async (userid, hashedApiKey, issuedAt) => {
  await promisePool.execute(
    'UPDATE user_info SET hashed_api_key = ?, api_key_issued_at = ? WHERE userid = ?',
    [hashedApiKey, issuedAt, userid]
  );
};

/**
 * API 키 상태 조회
 * @param {number} userid - 사용자 ID
 * @returns {Object|null} - API 키 상태 정보
 */
const findApiKeyStatus = async (userid) => {
  const [result] = await promisePool.execute(
    'SELECT api_key_issued_at, hashed_api_key IS NOT NULL as has_api_key FROM user_info WHERE userid = ?',
    [userid]
  );
  
  return result.length > 0 ? result[0] : null;
};

export { findApiKeyInfo, updateApiKey, findApiKeyStatus }; 