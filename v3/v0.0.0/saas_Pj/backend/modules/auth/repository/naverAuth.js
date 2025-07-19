import { promisePool } from '../../../common/utils/connectDB.js';
import { checkDuplicateId } from './common.js';

/**
 * 네이버 ID로 사용자 조회
 * @param {string} naverId - 네이버 사용자 ID
 * @returns {Promise<object|null>} 사용자 정보 또는 null
 */
const findUserByNaverId = async (naverId) => {
  try {
    const [rows] = await promisePool.query(
      'SELECT * FROM user_info WHERE naver_id = ? AND is_active = true',
      [naverId]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('네이버 ID로 사용자 조회 오류:', error);
    throw new Error('사용자 조회 중 오류가 발생했습니다.');
  }
};

/**
 * 네이버 사용자 회원가입
 * @param {object} userData - 사용자 데이터
 * @returns {Promise<object>} 저장 결과
 */
const saveNaverUser = async (userData) => {
  const { naverId, name, email } = userData;
  try {
    const query = `
      INSERT INTO user_info (naver_id, name, email, login_type) 
      VALUES (?, ?, ?, 'naver')
    `;
    const [result] = await promisePool.query(query, [naverId, name, email]);
    
    return { 
      success: true, 
      userid: result.insertId,
      message: '네이버 회원가입이 완료되었습니다.' 
    };
  } catch (error) {
    console.error('네이버 사용자 저장 오류:', error);
    
    // 이메일 중복 오류 처리
    if (error.code === 'ER_DUP_ENTRY' && error.message.includes('email')) {
      throw new Error('이미 해당 이메일로 등록된 계정이 있습니다. 기존 계정으로 로그인해주세요.');
    }
    
    // 네이버 ID 중복 오류 처리
    if (error.code === 'ER_DUP_ENTRY' && error.message.includes('naver_id')) {
      throw new Error('이미 등록된 네이버 계정입니다.');
    }
    
    throw new Error('사용자 정보 저장 중 오류가 발생했습니다.');
  }
};

/**
 * 로컬 로그인 크리덴셜 설정
 * @param {number} userid - 사용자 ID
 * @param {string} localId - 로컬 로그인 아이디
 * @param {string} hashedPassword - 암호화된 비밀번호
 * @returns {Promise<object>} 설정 결과
 */
const setLocalCredentials = async (userid, localId, hashedPassword) => {
  try {
    // 아이디 중복 확인 (공통 함수 사용)
    const isDuplicate = await checkDuplicateId(localId);
    if (isDuplicate) {
      // 현재 사용자가 이미 해당 아이디를 사용하는지 확인
      const [currentUser] = await promisePool.query(
        'SELECT userid FROM user_info WHERE id = ? AND userid = ?',
        [localId, userid]
      );
      
      if (currentUser.length === 0) {
        throw new Error('이미 사용 중인 아이디입니다.');
      }
    }
    
    // 현재 로그인 타입 확인
    const [userInfo] = await promisePool.query(
      'SELECT login_type FROM user_info WHERE userid = ?',
      [userid]
    );
    
    if (userInfo.length === 0) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }
    
    const newLoginType = userInfo[0].login_type === 'naver' ? 'both' : 'both';
    
    const query = `
      UPDATE user_info 
      SET id = ?, password = ?, login_type = ?, updated_at = NOW()
      WHERE userid = ?
    `;
    
    await promisePool.query(query, [localId, hashedPassword, newLoginType, userid]);
    
    return { 
      success: true, 
      message: '로컬 로그인 정보가 설정/변경되었습니다.' 
    };
  } catch (error) {
    console.error('로컬 크리덴셜 설정 오류:', error);
    
    if (error.message === '이미 사용 중인 아이디입니다.' || 
        error.message === '사용자를 찾을 수 없습니다.') {
      throw error;
    }
    
    throw new Error('로컬 로그인 정보 설정 중 오류가 발생했습니다.');
  }
};

export { 
  findUserByNaverId, 
  saveNaverUser, 
  setLocalCredentials 
}; 