import { promisePool } from '../../../common/utils/connectDB.js';

/**
 * 아이디 중복 확인
 * @param {string} id - 확인할 아이디
 * @returns {Promise<boolean>} 중복 여부 (true: 중복, false: 사용 가능)
 */
const checkDuplicateId = async (id) => {
  try {
    const [rows] = await promisePool.query('SELECT id FROM user_info WHERE id = ?', [id]);
    return rows.length > 0;
  } catch (error) {
    console.error('아이디 중복 확인 중 오류:', error);
    throw new Error('아이디 중복 확인 중 오류가 발생했습니다.');
  }
};

/**
 * 사용자 정보 조회 (userid로)
 * @param {number} userid - 사용자 ID
 * @returns {Promise<object|null>} 사용자 정보 또는 null
 */
const findUserByUserId = async (userid) => {
  try {
    const [rows] = await promisePool.query(
      'SELECT * FROM user_info WHERE userid = ? AND is_active = true',
      [userid]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('사용자 ID로 조회 오류:', error);
    throw new Error('사용자 조회 중 오류가 발생했습니다.');
  }
};

/**
 * 사용자 정보 조회 (로컬 아이디로)
 * @param {string} id - 로컬 로그인 아이디
 * @returns {Promise<object|null>} 사용자 정보 또는 null
 */
const findUserById = async (id) => {
  try {
    const query = 'SELECT * FROM user_info WHERE id = ? AND is_active = TRUE';
    const [rows] = await promisePool.query(query, [id]);
    
    if (rows.length === 0) {
      return null;
    }
    
    return rows[0];
  } catch (error) {
    console.error('사용자 조회 중 오류:', error);
    throw new Error('사용자 정보 조회 중 오류가 발생했습니다.');
  }
};

export { 
  checkDuplicateId, 
  findUserByUserId, 
  findUserById 
}; 