import express from 'express';
import { validateId, validatePassword } from '../service/checkValidation.js';
import { findUserById } from '../repository/common.js';
import { comparePassword } from '../service/crypt.js';
import { generateToken, setTokenCookie } from '../service/createJWT.js';

const router = express.Router();

// 로그인 라우트 핸들러
router.post('/', async (req, res) => {
  try {
    const { id, password } = req.body;

    // ID 형식 검증
    const idValidation = validateId(id);
    if (!idValidation.valid) {
      return res.status(400).json({ success: false, message: idValidation.message });
    }

    // 비밀번호 형식 검증 (추가 보안을 위해 - 선택적)
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ success: false, message: passwordValidation.message });
    }

    // 사용자 조회
    const user = await findUserById(id);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: '아이디 또는 비밀번호가 올바르지 않습니다.' 
      });
    }

    // 비밀번호 검증
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: '아이디 또는 비밀번호가 올바르지 않습니다.' 
      });
    }

    // JWT 토큰 생성
    const token = generateToken(user);
    
    // 토큰을 HTTP-only 쿠키로 설정
    setTokenCookie(res, token);

    // 로그인 성공 응답
    return res.status(200).json({
      success: true,
      message: '로그인에 성공했습니다.',
      user: {
        userid: user.userid,
        id: user.id,
        name: user.name,
        email: user.email,
        loginType: user.login_type,
        plan: user.plan,
        isNewUser: false
      }
    });
  } catch (error) {
    console.error('로그인 처리 중 오류:', error);
    return res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
  }
});

export default router;
