import express from 'express';
import { getInitialData } from '../service/initial.js';

const router = express.Router();

/**
 * 초기 데이터 로딩 라우터
 * GET /reg/initial
 * 
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 * @returns {Promise<void>}
 */
router.get('/', async (req, res) => {
  try {
    // 사용자 ID는 인증 미들웨어에서 설정된다고 가정
    const userid = req.user.userid;
    
    if (!userid) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.'
      });
    }
    
    const initialData = await getInitialData(userid);
    
    return res.status(200).json(initialData);
  } catch (error) {
    console.error('Initial API 오류:', error);
    
    return res.status(500).json({
      success: false,
      message: '서버 내부 오류가 발생했습니다.'
    });
  }
});

export default router;
