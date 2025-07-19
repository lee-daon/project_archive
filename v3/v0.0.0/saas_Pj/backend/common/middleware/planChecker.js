import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config();
// 내부 API 통신을 위한 키 설정
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

/**
 * 플랜 제한 미들웨어
 * JWT 또는 API 키 인증 후 사용자의 플랜을 확인하여 접근을 제한합니다.
 */

/**
 * Basic 이상 플랜 사용자만 접근 가능한 미들웨어
 * @param {Object} req - Express request 객체
 * @param {Object} res - Express response 객체
 * @param {Function} next - Express next 함수
 */
const requireBasicPlan = (req, res, next) => {
  try {
    // 내부 API 호출 확인
    if (req.headers['x-api-key'] === INTERNAL_API_KEY) {
      return next();
    }

    const { plan } = req.user;
    
    if (!plan) {
      return res.status(403).json({
        success: false,
        message: '플랜 업그레이드가 필요합니다.'
      });
    }

    // basic 또는 enterprise 플랜인 경우 통과
    if (plan === 'basic' || plan === 'enterprise') {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: '플랜 업그레이드가 필요합니다.'
    });

  } catch (error) {
    logger.error(error, { userid: req.user.userid });
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
};

/**
 * Enterprise 플랜 사용자만 접근 가능한 미들웨어
 * @param {Object} req - Express request 객체
 * @param {Object} res - Express response 객체
 * @param {Function} next - Express next 함수
 */
const requireEnterprisePlan = (req, res, next) => {
  try {
    // 내부 API 호출 확인
    if (req.headers['x-api-key'] === INTERNAL_API_KEY) {
      return next();
    }

    const { plan } = req.user;
    
    if (!plan) {
      return res.status(403).json({
        success: false,
        message: '플랜 업그레이드가 필요합니다.'
      });
    }

    // enterprise 플랜인 경우만 통과
    if (plan === 'enterprise') {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: '플랜 업그레이드가 필요합니다.'
    });

  } catch (error) {
    logger.error(error, { userid: req.user.userid });
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
};

export { requireBasicPlan, requireEnterprisePlan };
