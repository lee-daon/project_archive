import express from 'express';
import { processProductsStatus } from '../service/UpdateStatus.js';
import { updateSourcingCompletedStatus, syncCategoryMappingStatus } from '../../../common/utils/assistDb/GlobalStatus.js';

const router = express.Router();

// sourcing_status 테이블 상태 업데이트 API 엔드포인트
router.post('/', async (req, res) => {
    const {productIds } = req.body;
    
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
    
    // 요청 데이터 로깅
    console.log('받은 요청 데이터:', req.body);
    
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 요청입니다. productIds 배열이 필요합니다.',
        receivedData: req.body
      });
    }
    
    try {
      // 1. 서비스 함수 호출하여 상태 처리 (commitcode 무시)
      // 요구사항: commitcode 값은 무시하고 승인 처리만 수행
      const result = await processProductsStatus(userid, productIds);
      
      if (!result.success) {
        return res.status(500).json(result);
      }
      
      // 2. commit 상태인 모든 상품의 sourcing_completed 상태 업데이트
      const globalStatusResult = await updateSourcingCompletedStatus(userid);
      
      // 3. commit된 상품들의 카테고리 매핑 상태 동기화 (트리거 보완용)
      await syncCategoryMappingStatus(userid, globalStatusResult.productIds);
      
      res.json({
        success: true,
        message: `상태 업데이트 완료: ${result.committedCount}개 상품 승인완료, ${result.deletedCount}개 상품 삭제`,
        committedCount: result.committedCount,
        deletedCount: result.deletedCount,
      });
    } catch (error) {
      console.error('상태 업데이트 중 오류 발생:', error);
      res.status(500).json({
        success: false,
        message: '서버 오류가 발생했습니다.'
      });
    }
  });

export default router; 