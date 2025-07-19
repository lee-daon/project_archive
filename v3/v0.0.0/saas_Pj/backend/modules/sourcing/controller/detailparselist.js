import express from 'express';
import { enqueueDetailJobs } from '../service/detail_info.js';
import { createStatusEntries } from '../../../common/utils/assistDb/GlobalStatus.js';
import { updateTotalCollectedProducts } from '../../../common/QuotaUsageLimit/Usage/updateUsage.js';

const router = express.Router();

// 상품 상세 정보 파싱 요청을 큐에 추가
router.post('/', async (req, res) => {
  // 요청 구조 변경: 배열 → 객체 { products: [], commitCode: number, sameCategory: boolean }
  const { products, commitCode, sameCategory } = req.body;
  
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

  // 요청 데이터 검증
  if (!products || !Array.isArray(products) || products.length === 0) {
    return res.status(400).json({
      success: false,
      message: '유효한 상품 배열이 필요합니다.'
    });
  }

  if (commitCode === undefined || commitCode === null) {
    return res.status(400).json({
      success: false,
      message: 'commitCode가 필요합니다.'
    });
  }
  
  // sameCategory가 true일 경우, 12자리 랜덤 카테고리 ID 생성
  let sameCategoryId = null;
  if (sameCategory) {
    const min = 100000000000; // 10^11
    const max = 999999999999; // 10^12 - 1
    sameCategoryId = String(Math.floor(Math.random() * (max - min + 1)) + min);
  }

  console.log(`사용자 ${userid}의 ${products.length}개 상품에 대한 상세 파싱 요청 (commitCode: ${commitCode}, sameCategory: ${sameCategory})`);

  try {
    // detail_info.js의 함수를 사용하여 작업 큐에 추가 (sameCategoryId 포함)
    const result = await enqueueDetailJobs(userid, products, commitCode, sameCategoryId);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.message
      });
    }
    
    // 누적 수집 상품수 업데이트
    await updateTotalCollectedProducts(userid, products.length);
    
    // status 테이블에 항목 생성
    const statusResult = await createStatusEntries(userid, products);
    
    // 클라이언트에게 성공 응답
    res.json({
      success: true,
      message: `${products.length}개 상품의 상세 정보 파싱 요청이 접수되었습니다. (그룹코드: ${commitCode})`,
      queuedCount: result.queueCount,
      statusUpdatedCount: result.statusCount,
      statusInsertedCount: statusResult.insertedCount,
      commitCode: commitCode,
      sameCategoryId: sameCategoryId
    });
    
    // 이전 방식의 데이터 저장은 삭제 (app.locals.setupinfo)
    // 대신 Redis와 DB를 통해 상태를 추적
    
  } catch (error) {
    console.error('상품 파싱 요청 처리 중 오류:', error);
    res.status(500).json({
      success: false,
      message: '상품 파싱 요청 처리 중 오류가 발생했습니다.'
    });
  }
});

export default router; 