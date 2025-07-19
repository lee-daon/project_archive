import express from 'express';
import { findUserByUserId } from '../repository/common.js';
import { generateToken, setTokenCookie } from '../service/createJWT.js';

const router = express.Router();

// 인증 상태 확인
router.get('/', async (req, res) => {
  try {
    // JWT 미들웨어를 통해 설정된 사용자 정보 확인
    if (req.user && req.user.userid) {
      // DB에서 최신 정보 조회
      const user = await findUserByUserId(req.user.userid);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          authenticated: false,
          message: '사용자를 찾을 수 없습니다.'
        });
      }

      // JWT 토큰 갱신
      const token = generateToken(user);
      setTokenCookie(res, token);

      return res.status(200).json({
        success: true,
        authenticated: true,
        user: {
          userid: user.userid,
          id: user.id || null, // 네이버 로그인 사용자는 id가 없을 수 있음
          name: user.name,
          email: user.email,
          plan: user.plan,
          hasLocalCredentials: !!user.id, // 로컬 ID 존재 여부
        }
      });
    } else {
      return res.status(401).json({
        success: false,
        authenticated: false,
        message: '인증되지 않은 사용자입니다.'
      });
    }
  } catch (error) {
    console.error('인증 상태 확인 오류:', error);
    return res.status(500).json({
      success: false,
      authenticated: false,
      message: '인증 상태 확인 중 오류가 발생했습니다.'
    });
  }
});

export default router; 