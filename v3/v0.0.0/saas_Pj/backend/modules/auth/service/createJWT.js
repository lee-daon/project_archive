import jwt from 'jsonwebtoken';

// JWT 토큰 생성
const generateToken = (user) => {
  const payload = {
    userid: user.userid,
    id: user.id,
    email: user.email,
    name: user.name,
    plan: user.plan
  };
  
  // 환경 변수에서 시크릿 키 가져오기 또는 기본값 설정
  const secretKey = process.env.JWT_SECRET || 'your_secret_key';
  
  // 토큰 생성 (만료 시간 없음)
  return jwt.sign(payload, secretKey);
};

// 토큰을 쿠키에 설정
const setTokenCookie = (res, token) => {
  // HTTP-only 쿠키로 설정 (세션 쿠키 - 만료 시간 없음)
  res.cookie('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // HTTPS에서만 작동
    sameSite: 'strict',
    expires: 0
  });
};

export { generateToken, setTokenCookie };
