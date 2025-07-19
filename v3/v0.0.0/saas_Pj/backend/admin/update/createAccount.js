import express from 'express';
import { promisePool } from '../../common/utils/connectDB.js';
import { validateEmail, validatePassword, validateName, validateId } from '../../modules/auth/service/checkValidation.js';
import { encryptPassword } from '../../modules/auth/service/crypt.js';
import { checkDuplicateId } from '../../modules/auth/repository/common.js';
import logger from '../../common/utils/logger.js';

const router = express.Router();

/**
 * 이메일 중복 확인
 */
const checkDuplicateEmail = async (email) => {
  try {
    const [rows] = await promisePool.execute('SELECT email FROM user_info WHERE email = ?', [email]);
    return rows.length > 0;
  } catch (error) {
    logger.error(error);
    throw new Error('이메일 중복 확인 중 오류가 발생했습니다.');
  }
};

/**
 * 로컬 계정 생성
 */
const createLocalAccount = async (userData) => {
  const { id, password, email, plan = 'free', expired_at } = userData;
  
  try {
    // 암호화
    const hashedPassword = await encryptPassword(password);
    
    const query = `
      INSERT INTO user_info (id, password, email, login_type, plan, expired_at) 
      VALUES (?, ?, ?, 'local', ?, ?)
    `;
    
    const [result] = await promisePool.execute(query, [
      id, hashedPassword, email, plan, expired_at
    ]);
    
    return { 
      success: true, 
      userid: result.insertId,
      message: '로컬 계정이 성공적으로 생성되었습니다.' 
    };
  } catch (error) {
    logger.error(error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      if (error.message.includes('email')) {
        throw new Error('이미 해당 이메일로 등록된 계정이 있습니다.');
      }
      if (error.message.includes('id')) {
        throw new Error('이미 사용 중인 아이디입니다.');
      }
    }
    
    throw new Error('계정 생성 중 오류가 발생했습니다.');
  }
};

// POST /createAccount/local - 로컬 계정 생성
router.post('/local', async (req, res) => {
  try {
    const { id, password, email, plan, expired_at } = req.body;
    
    // 필수 필드 검증
    if (!id || !password || !email) {
      return res.status(400).json({ 
        success: false, 
        message: '아이디, 비밀번호, 이메일을 모두 입력해주세요.' 
      });
    }
    
    // 유효성 검사
    const idValidation = validateId(id);
    if (!idValidation.valid) {
      return res.status(400).json({ 
        success: false, 
        message: idValidation.message 
      });
    }
    
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ 
        success: false, 
        message: passwordValidation.message 
      });
    }
    
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({ 
        success: false, 
        message: emailValidation.message 
      });
    }
    
    // plan 유효성 검증
    if (plan && !['free', 'basic', 'enterprise'].includes(plan)) {
      return res.status(400).json({
        success: false,
        message: 'plan은 free, basic, enterprise 중 하나여야 합니다.'
      });
    }
    
    // 중복 확인
    const isDuplicateId = await checkDuplicateId(id);
    if (isDuplicateId) {
      return res.status(409).json({ 
        success: false, 
        message: '이미 사용 중인 아이디입니다.' 
      });
    }
    
    const isDuplicateEmail = await checkDuplicateEmail(email);
    if (isDuplicateEmail) {
      return res.status(409).json({ 
        success: false, 
        message: '이미 사용 중인 이메일입니다.' 
      });
    }
    
    // 계정 생성
    const result = await createLocalAccount({
      id, password, email, plan, expired_at
    });
    
    return res.status(201).json(result);
    
  } catch (error) {
    logger.error(error);
    
    if (error.message === '이미 해당 이메일로 등록된 계정이 있습니다.' ||
        error.message === '이미 사용 중인 아이디입니다.') {
      return res.status(409).json({ 
        success: false, 
        message: error.message 
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      message: '계정 생성 중 오류가 발생했습니다.' 
    });
  }
});



export default router;
