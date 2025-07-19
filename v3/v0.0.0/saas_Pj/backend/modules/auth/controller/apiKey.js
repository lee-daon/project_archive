import express from 'express';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { findApiKeyInfo, updateApiKey, findApiKeyStatus } from '../repository/apiKey.js';
import logger from '../../../common/utils/logger.js';
const router = express.Router();

// API 키 발급
router.post('/generate', async (req, res) => {
  try {
    // JWT에서 사용자 정보 가져오기 (jwtParser 미들웨어를 통해 설정됨)
    const { userid, plan } = req.user;
    
    if (!userid) {
      return res.status(401).json({
        success: false,
        message: '유효하지 않은 사용자입니다.'
      });
    }

    // enterprise 플랜 확인
    if (plan !== 'enterprise') {
      return res.status(403).json({
        success: false,
        message: 'API 키 발급은 enterprise 플랜에서만 가능합니다.'
      });
    }

    // 기존 API 키 발급 이력 확인
    const user = await findApiKeyInfo(userid);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      });
    }

    const now = new Date();

    // API 키 발급 시간 제한 확인 (24시간)
    if (user.api_key_issued_at) {
      const issuedAt = new Date(user.api_key_issued_at);
      const timeDiff = now - issuedAt;
      const hoursDiff = timeDiff / (1000 * 60 * 60);

      if (hoursDiff < 24) {
        const remainingHours = Math.ceil(24 - hoursDiff);
        return res.status(429).json({
          success: false,
          message: `API 키는 24시간에 한 번만 발급 가능합니다. ${remainingHours}시간 후에 다시 시도해주세요.`
        });
      }
    }

    // API 키 생성 (sk_userid_고유번호 형태)
    const randomString = crypto.randomBytes(16).toString('hex');
    const apiKey = `sk_${userid}_${randomString}`;

    // API 키 해시
    const saltRounds = 10;
    const hashedApiKey = await bcrypt.hash(apiKey, saltRounds);

    // DB에 해시된 키와 발급 시간 저장
    await updateApiKey(userid, hashedApiKey, now);

    // 원문 API 키 반환 (단 한 번)
    return res.status(200).json({
      success: true,
      message: 'API 키가 성공적으로 발급되었습니다. 이 키는 다시 확인할 수 없으니 안전한 곳에 보관해주세요.',
      apiKey: apiKey,
      issuedAt: now.toISOString()
    });

  } catch (error) {
    logger.error(error, { userid });
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

// API 키 상태 확인
router.get('/status', async (req, res) => {
  try {
    const { userid, plan } = req.user;
    
    if (!userid) {
      return res.status(401).json({
        success: false,
        message: '유효하지 않은 사용자입니다.'
      });
    }

    // API 키 발급 상태 확인
    const user = await findApiKeyStatus(userid);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      });
    }

    let nextIssueTime = null;

    if (user.api_key_issued_at) {
      const issuedAt = new Date(user.api_key_issued_at);
      const nextTime = new Date(issuedAt.getTime() + 24 * 60 * 60 * 1000);
      nextIssueTime = nextTime > new Date() ? nextTime.toISOString() : null;
    }

    return res.status(200).json({
      success: true,
      hasApiKey: Boolean(user.has_api_key),
      lastIssuedAt: user.api_key_issued_at,
      nextAvailableTime: nextIssueTime,
      canIssueNew: !nextIssueTime && plan === 'enterprise'
    });

  } catch (error) {
    logger.error(error, { userid });
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

export default router; 