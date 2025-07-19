import bcrypt from 'bcrypt';
import { promisePool } from '../utils/connectDB.js';
import logger from '../utils/logger.js';
/**
 * API 키 인증 미들웨어
 */
const apiKeyMiddleware = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
    
    if (!apiKey || !apiKey.startsWith('sk_')) {
      return res.status(401).json({
        success: false,
        message: 'API 키가 필요합니다.'
      });
    }

    // API 키에서 userid 추출 (sk_userid_고유번호 형태)
    const keyParts = apiKey.split('_');
    if (keyParts.length < 3) {
      return res.status(401).json({
        success: false,
        message: '잘못된 API 키 형식입니다.'
      });
    }

    const userid = parseInt(keyParts[1]);
    if (isNaN(userid)) {
      return res.status(401).json({
        success: false,
        message: '잘못된 API 키 형식입니다.'
      });
    }

    // 해당 사용자의 해시된 API 키와 plan 정보 조회
    const [users] = await promisePool.execute(
      'SELECT hashed_api_key, plan FROM user_info WHERE userid = ? AND hashed_api_key IS NOT NULL',
      [userid]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: '유효하지 않은 API 키입니다.'
      });
    }

    // API 키 검증
    const isValidKey = await bcrypt.compare(apiKey, users[0].hashed_api_key);
    
    if (!isValidKey) {
      return res.status(401).json({
        success: false,
        message: '유효하지 않은 API 키입니다.'
      });
    }

    // 인증 성공 - userid와 plan을 req에 추가
    req.user = { 
      userid,
      plan: users[0].plan 
    };
    return next();

  } catch (error) {
    logger.error(error, { userid });
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
};

export default apiKeyMiddleware; 