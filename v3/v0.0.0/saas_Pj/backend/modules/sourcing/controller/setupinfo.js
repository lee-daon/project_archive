import express from 'express';
import { getStatusCounts } from '../repository/controlScrStatus.js';

const router = express.Router();

/**
 * 소싱 페이지 상태 정보 조회 API 엔드포인트
 * sourcing_status 테이블에서 상태별 개수와 uncommit 상품 ID 목록을 반환
 * commitCode 쿼리 파라미터로 특정 그룹코드 필터링 지원
 */
router.get('/', async (req, res) => {
  try {
    // userid 가져오기
    let userid;
    if (req.user && req.user.userid) {
      userid = req.user.userid;
    } else if (req.query.userid) {
      userid = parseInt(req.query.userid, 10);
    } else {
      return res.status(400).json({
        success: false,
        message: '유효한 사용자 ID가 제공되지 않았습니다.'
      });
    }

    // commitCode 쿼리 파라미터 처리
    const commitCode = req.query.commitCode ? parseInt(req.query.commitCode, 10) : null;
    
    // 상태별 개수 조회 (commitCode 필터링 포함)
    const statusCounts = await getStatusCounts(userid, commitCode);
    
    // 조회 결과 반환
    res.json({
      success: true,
      ...statusCounts,
      commitCode: commitCode,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('상태 정보 조회 중 오류:', error);
    res.status(500).json({
      success: false,
      message: '상태 정보 조회 중 오류가 발생했습니다.'
    });
  }
});

export default router;
