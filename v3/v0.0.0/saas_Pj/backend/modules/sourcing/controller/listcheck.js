import express from 'express';
import { getFromTempTable } from '../../../common/utils/assistDb/temp.js';

const router = express.Router();

// 프론트엔드 업데이트용 라우터
router.get('/', async (req, res) => {
  console.log('listcheck 라우터에 요청 도달!');
  try {
    // userid를 다양한 소스에서 가져오기 시도
    let userid;
    
    // 1. 인증 미들웨어를 통해 설정된 req.user에서 가져오기
    if (req.user && req.user.userid) {
      userid = req.user.userid;
    } 
    // 2. 쿼리 파라미터에서 가져오기
    else if (req.query.userid) {
      userid = parseInt(req.query.userid, 10);
    } 
    // 3. userid가 없는 경우 오류 응답
    else {
      return res.status(400).json({
        success: false,
        message: '유효한 사용자 ID가 제공되지 않았습니다.'
      });
    }

    // temp 테이블에서, type_number 1인 데이터 조회 (업로드 데이터)
    const result = await getFromTempTable(userid, 1);
    
    if (!result.success) {
      // 데이터가 없는 경우 빈 배열과 기본값을 반환
      console.log(`사용자 ${userid}의 데이터가 없습니다. 빈 배열 반환.`);
      return res.json({
        bancheckedTarget: [],
        finalTargetCount: 0,
        duplicationCount: 0,
        includeBanCount: 0,
        totalCount: 0,
        dataReady: true,
        timestamp: new Date().toISOString()
      });
    }
    
    console.log(`사용자 ${userid}의 데이터 조회: ${result.data.bancheckedTarget.length}개 상품`);
    
    // 데이터를 클라이언트에 응답
    res.json(result.data);
    
  } catch (error) {
    console.error('데이터 조회 중 오류 발생:', error);
    res.status(500).json({
      success: false,
      message: '데이터 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

export default router;