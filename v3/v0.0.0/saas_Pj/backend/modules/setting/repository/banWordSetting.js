import { promisePool } from '../../../common/utils/connectDB.js';

/**
 * 사용자 금지어 설정 조회 (없으면 자동 생성)
 * @param {number} userid - 사용자 ID
 * @returns {string} 사용자 금지어 목록 (쉼표로 구분된 문자열)
 */
export async function getUserBannedWords(userid) {
  try {
    const [rows] = await promisePool.execute(
      'SELECT user_banned_words FROM extra_setting WHERE userid = ?',
      [userid]
    );

    if (rows.length === 0) {
      // 레코드가 없으면 빈 문자열로 생성
      await promisePool.execute(
        'INSERT INTO extra_setting (userid, user_banned_words) VALUES (?, ?)',
        [userid, '']
      );
      return '';
    }

    return rows[0].user_banned_words || '';
  } catch (error) {
    console.error('getUserBannedWords 오류:', error);
    throw error;
  }
}

/**
 * 사용자 금지어 설정 저장/업데이트
 * @param {number} userid - 사용자 ID
 * @param {string} bannedWords - 사용자 금지어 목록 (쉼표로 구분된 문자열)
 * @returns {boolean} 성공 여부
 */
export async function saveUserBannedWords(userid, bannedWords) {
  try {
    await promisePool.execute(
      `INSERT INTO extra_setting (userid, user_banned_words) 
       VALUES (?, ?) 
       ON DUPLICATE KEY UPDATE 
       user_banned_words = VALUES(user_banned_words)`,
      [userid, bannedWords]
    );

    return true;
  } catch (error) {
    console.error('saveUserBannedWords 오류:', error);
    throw error;
  }
}
