import { promisePool } from '../../../common/utils/connectDB.js';

/**
 * 사용자의 추가 설정 조회
 * @param {number} userid - 사용자 ID
 * @returns {Object|null} 사용자 추가 설정 정보
 */
export async function getExtraSettings(userid) {
  try {
    const [rows] = await promisePool.query(
      'SELECT use_deep_ban, allow_keyword_spacing FROM extra_setting WHERE userid = ?',
      [userid]
    );

    if (rows.length === 0) {
      // 기본값으로 새 행 생성
      await promisePool.query(
        'INSERT INTO extra_setting (userid, use_deep_ban, allow_keyword_spacing) VALUES (?, ?, ?)',
        [userid, false, true]
      );
      
      return {
        use_deep_ban: 0,
        allow_keyword_spacing: 1
      };
    }

    return {
      use_deep_ban: rows[0].use_deep_ban ? 1 : 0,
      allow_keyword_spacing: rows[0].allow_keyword_spacing ? 1 : 0
    };
  } catch (error) {
    console.error('사용자 추가 설정 조회 오류:', error);
    throw error;
  }
}

/**
 * 사용자의 추가 설정 저장/업데이트
 * @param {number} userid - 사용자 ID
 * @param {number} useDeepBan - 심층 벤 사용여부 (0: 미사용, 1: 사용)
 * @param {number} allowKeywordSpacing - 키워드 뛰어쓰기 허용여부 (0: 비허용, 1: 허용)
 */
export async function saveExtraSettings(userid, useDeepBan, allowKeywordSpacing) {
  try {
    await promisePool.query(
      `INSERT INTO extra_setting (userid, use_deep_ban, allow_keyword_spacing)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE 
       use_deep_ban = VALUES(use_deep_ban),
       allow_keyword_spacing = VALUES(allow_keyword_spacing),
       updated_at = NOW()`,
      [userid, useDeepBan, allowKeywordSpacing]
    );
  } catch (error) {
    console.error('사용자 추가 설정 저장 오류:', error);
    throw error;
  }
}
