import express from 'express';
import { validateId, validatePassword } from '../service/checkValidation.js';
import { encryptPassword } from '../service/crypt.js';
import { setLocalCredentials } from '../repository/naverAuth.js';
import { findUserByUserId } from '../repository/common.js';

const router = express.Router();

// 로컬 로그인 크리덴셜 설정/변경
router.post('/set', async (req, res) => {
  try {
    const { id, password } = req.body;
    
    // JWT 토큰에서 사용자 정보 확인 (미들웨어에서 설정)
    const userid = req.user.userid;
    
    if (!userid) {
      return res.status(401).json({ 
        success: false, 
        message: '로그인이 필요합니다.' 
      });
    }
    
    // 입력값 검증
    if (!id || !password) {
      return res.status(400).json({ 
        success: false, 
        message: '아이디와 비밀번호를 모두 입력해주세요.' 
      });
    }
    
    // 1. 유효성 검사
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
    
    // 사용자 존재 여부 확인
    const user = await findUserByUserId(userid);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: '사용자를 찾을 수 없습니다.' 
      });
    }
    
    // 2. 패스워드 암호화
    const hashedPassword = await encryptPassword(password);
    
    // 3. 로컬 크리덴셜 설정/변경 (중복 확인은 repository에서 처리)
    const result = await setLocalCredentials(userid, id, hashedPassword);
    
    return res.status(200).json({
      success: true,
      message: result.message
    });
    
  } catch (error) {
    console.error('로컬 크리덴셜 설정/변경 오류:', error);
    
    // 예상 가능한 오류 처리
    if (error.message === '이미 사용 중인 아이디입니다.') {
      return res.status(409).json({ 
        success: false, 
        message: error.message 
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      message: '로컬 로그인 정보 설정 중 오류가 발생했습니다.' 
    });
  }
});


export default router; 