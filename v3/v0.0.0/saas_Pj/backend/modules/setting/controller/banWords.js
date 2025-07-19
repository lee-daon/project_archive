import express from 'express';
import { getUserBannedWords, saveUserBannedWords } from '../repository/banWordSetting.js';
import { invalidateUserCache } from '../../sourcing/repository/user_ban_settings.js';

const router = express.Router();

/**
 * 사용자 금지어 설정 조회
 * GET /setting/banwords
 */
router.get('/', async (req, res) => {
  try {
    const userid = req.user.userid;

    if (!userid) {
      return res.status(400).json({
        success: false,
        message: '사용자 ID가 필요합니다.'
      });
    }

    const userBannedWords = await getUserBannedWords(userid);
    
    let bannedWordsArray = [];
    if (userBannedWords) {
      bannedWordsArray = userBannedWords
        .split(',')
        .map(word => word.trim())
        .filter(word => word.length > 0);
    }

    return res.json({
      success: true,
      data: {
        userid: userid,
        bannedWords: bannedWordsArray,
        bannedWordsString: userBannedWords
      }
    });

  } catch (error) {
    console.error('사용자 금지어 조회 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

/**
 * 사용자 금지어 설정 저장/업데이트
 * PUT /setting/banwords
 */
router.put('/', async (req, res) => {
  try {
    const userid = req.user.userid;
    const { bannedWords } = req.body;

    if (!userid) {
      return res.status(400).json({
        success: false,
        message: '사용자 ID가 필요합니다.'
      });
    }

    if (typeof bannedWords !== 'string') {
      return res.status(400).json({
        success: false,
        message: '금지어는 문자열 형태여야 합니다.'
      });
    }

    // 금지어 문자열 정리 (공백 제거, 빈 값 제거)
    const cleanedBannedWords = bannedWords
      .split(',')
      .map(word => word.trim())
      .filter(word => word.length > 0)
      .join(', ');

    await saveUserBannedWords(userid, cleanedBannedWords);
    
    // 해당 사용자의 캐시 무효화
    invalidateUserCache(userid);

    return res.json({
      success: true,
      message: '사용자 금지어 설정이 저장되었습니다.',
      data: {
        userid: userid,
        bannedWords: cleanedBannedWords
      }
    });

  } catch (error) {
    console.error('사용자 금지어 저장 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

export default router;
