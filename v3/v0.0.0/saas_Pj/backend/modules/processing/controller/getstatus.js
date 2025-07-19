import express from 'express';
import { getCommitStatusInfo } from '../service/status.js';

const router = express.Router();

/**
 * commit 상태인 상품 정보를 조회하는 라우터
 * 1. commit 인 상품의 개수
 * 2. commit인 상품의 commitid별 id, 개수의 배열
 */
router.get('/', async (req, res) => {
  try {
    const userid = req.user.userid;
    
    if (!userid) {
      return res.status(401).json({ 
        success: false, 
        message: '인증되지 않은 요청입니다' 
      });
    }
    
    const commitStatusInfo = await getCommitStatusInfo(userid);
    
    return res.status(200).json({
      success: true,
      data: commitStatusInfo
    });
  } catch (error) {
    console.error('commit 상태 조회 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다',
      error: error.message
    });
  }
});

export default router;
