import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';
dotenv.config();
// 내부 API 통신을 위한 키 설정
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY ;

/**
 * JWT 토큰을 검증하는 미들웨어
 * 쿠키에서 토큰을 가져와 검증하고 사용자 정보를 req.user에 설정합니다.
 * 토큰이 없거나 유효하지 않은 경우 인증 오류 응답을 반환합니다.
 */
const jwtParser = (req, res, next) => {
  try {
    // 내부 API 호출 확인
    if (req.headers['x-api-key'] === INTERNAL_API_KEY) {
      // 내부 API 요청인 경우 바로 통과
      // userid가 쿼리에 있으면 사용하고, 없으면 기본값 설정
      const userid = req.query.userid ? parseInt(req.query.userid, 10) : -1;
      req.user = { 
        userid: userid,
        isInternalAPI: true 
      };
      return next();
    }
    
    // 기존 JWT 검증 로직
    const token = req.cookies?.auth_token;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다. 로그인해 주세요.'
      });
    }
    
    const secretKey = process.env.JWT_SECRET;
    const decoded = jwt.verify(token, secretKey);
    
    req.user = {
      userid: decoded.userid,
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      plan: decoded.plan
    };
    
    next();
  } catch (error) {
    logger.error(error, { userid: decoded.userid });
    return res.status(401).json({
      success: false,
      message: '인증 토큰이 유효하지 않습니다. 다시 로그인해 주세요.'
    });
  }
};

export { INTERNAL_API_KEY };
export default jwtParser;
