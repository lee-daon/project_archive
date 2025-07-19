import express from 'express';
import { getNaverLoginUrl, getNaverAccessToken, getNaverUserInfo, generateState } from '../service/naverLogin.js';
import { findUserByNaverId, saveNaverUser } from '../repository/naverAuth.js';
import { generateToken, setTokenCookie } from '../service/createJWT.js';

const router = express.Router();

// 네이버 로그인 URL 생성 및 리다이렉트
router.get('/login', (req, res) => {
  try {
    const state = generateState();
    
    // 세션에 state 저장 (CSRF 방지)
    req.session = req.session || {};
    req.session.naverState = state;
    
    const loginUrl = getNaverLoginUrl(state);
    
    return res.status(200).json({
      success: true,
      loginUrl: loginUrl,
      state: state
    });
  } catch (error) {
    console.error('네이버 로그인 URL 생성 오류:', error);
    return res.status(500).json({ 
      success: false, 
      message: '네이버 로그인 URL 생성에 실패했습니다.' 
    });
  }
});

// 네이버 로그인 콜백 처리
router.post('/callback', async (req, res) => {
  try {
    const { code, state } = req.body;
    
    if (!code || !state) {
      return res.status(400).json({ 
        success: false, 
        message: '필수 파라미터가 누락되었습니다.' 
      });
    }
    
    // 상태값 검증 (CSRF 방지)
    if (req.session?.naverState !== state) {
      return res.status(400).json({ 
        success: false, 
        message: '유효하지 않은 요청입니다.' 
      });
    }
    
    // 네이버 액세스 토큰 발급
    const tokenData = await getNaverAccessToken(code, state);
    
    if (!tokenData.access_token) {
      return res.status(400).json({ 
        success: false, 
        message: '네이버 토큰 발급에 실패했습니다.' 
      });
    }
    
    // 네이버 사용자 정보 조회
    const naverUserInfo = await getNaverUserInfo(tokenData.access_token);
    
    // 기존 사용자 확인
    let user = await findUserByNaverId(naverUserInfo.id);
    
    if (user) {
      // 기존 사용자 로그인
      const token = generateToken(user);
      setTokenCookie(res, token);
      
      // 세션에서 상태값 제거
      delete req.session.naverState;
      
      return res.status(200).json({
        success: true,
        message: '네이버 로그인에 성공했습니다.',
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
    } else {
      // 신규 사용자 회원가입
      const userData = {
        naverId: naverUserInfo.id,
        name: naverUserInfo.name || naverUserInfo.nickname,
        email: naverUserInfo.email
      };
      
      const saveResult = await saveNaverUser(userData);
      
      // 새로 생성된 사용자 정보로 토큰 생성
      const newUser = await findUserByNaverId(naverUserInfo.id);
      const token = generateToken(newUser);
      setTokenCookie(res, token);
      
      // 세션에서 상태값 제거
      delete req.session.naverState;
      
      return res.status(201).json({
        success: true,
        message: '네이버 회원가입이 완료되었습니다.',
        user: {
          userid: newUser.userid,
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          loginType: newUser.login_type,
          plan: newUser.plan,
          isNewUser: true
        }
      });
    }
    
  } catch (error) {
    console.error('네이버 로그인 콜백 처리 오류:', error);
    
    // 세션에서 상태값 제거
    if (req.session?.naverState) {
      delete req.session.naverState;
    }
    
    return res.status(500).json({ 
      success: false, 
      message: error.message || '네이버 로그인 처리 중 오류가 발생했습니다.' 
    });
  }
});

export default router; 