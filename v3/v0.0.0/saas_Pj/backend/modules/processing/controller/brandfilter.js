import express from 'express';
import axios from 'axios';
import { getFromTempTable, deleteFromTempTable } from '../../../common/utils/assistDb/temp.js';
import { updateBrandBannedStatus, updateNonBannedStatus } from '../repository/controlPrcStatus.js';
import { processBrandFilterResults } from '../service/brandban.js';
import { updateTotalFilteredProducts } from '../../../common/QuotaUsageLimit/Usage/updateUsage.js';

const router = express.Router();
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

/**
 * 브랜드 필터링 결과 처리 엔드포인트
 * productId와 ban 여부 객체의 배열을 받아 처리
 */
router.post('/', async (req, res) => {
  try {
    const filterResults = req.body.products || []; // [{productid: number, ban: boolean}, ...]
    const userId = req.user.userid; // JWT 토큰에서 추출된 사용자 ID
    
    if (!Array.isArray(filterResults) || filterResults.length === 0) {
      return res.status(400).json({
        success: false,
        message: '유효한 필터링 결과가 제공되지 않았습니다.'
      });
    }
    
    // 1. temp 테이블에서 타입 3 데이터(브랜드 필터링 결과) 가져오기
    const tempResult = await getFromTempTable(userId, 3);
    
    if (!tempResult.success || !tempResult.data) {
      return res.status(404).json({
        success: false,
        message: '가공 대기 중인 상품 데이터를 찾을 수 없습니다.'
      });
    }
    
    // 2. 브랜드 필터링 결과 처리
    const processResult = await processBrandFilterResults(userId, filterResults, tempResult.data);
    
    // 3. 브랜드 금지된 상품의 상태 업데이트
    if (processResult.bannedItems.length > 0) {
      await updateBrandBannedStatus(userId, processResult.bannedItems);
      // 브랜드 금지된 상품 수를 누적 필터링된 상품수에 추가
      await updateTotalFilteredProducts(userId, processResult.bannedItems.length);
    }
    
    // 4. 브랜드 필터링을 통과한 상품의 상태를 'notbanned'로 업데이트
    if (processResult.nonBannedItems.length > 0) {
      await updateNonBannedStatus(userId, processResult.nonBannedItems);
    }
    
    // 5. 가공 진행 가능한 상품을 translatedetail로 전송
    if (processResult.nonBannedItems.length > 0) {
      await sendToTranslateDetail(userId, processResult.nonBannedItems);
    }
    
    // 6. temp 테이블에서 타입 3 데이터 삭제
    await deleteFromTempTable(userId, 3);
    
    // 7. 클라이언트에 응답
    res.status(200).json({
      success: true,
      message: '가공 요청이 성공적으로 접수되었습니다.',
      stats: {
        bannedCount: processResult.bannedItems.length,
        nonBannedCount: processResult.nonBannedItems.length,
        totalProcessed: filterResults.length
      }
    });
    
  } catch (error) {
    console.error('브랜드 필터링 결과 처리 중 오류 발생:', error);
    res.status(500).json({
      success: false,
      message: '브랜드 필터링 결과 처리 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * 번역 작업을 위해 translatedetail 엔드포인트로 요청을 보내는 함수
 */
async function sendToTranslateDetail(userId, items) {
  try {
    // 요청할 데이터 구성
    const requestData = items.map(item => ({
      userId,
      productId: item.productId,
      options: item.options
    }));

    // 내부 API 호출
    const response = await axios.post(
      `${API_BASE_URL}/prc/translatedetail?userid=${userId}`,
      requestData,
      {
        headers: {
          'x-api-key': process.env.INTERNAL_API_KEY
        }
      }
    );

    console.log('번역 작업 요청 완료:', response.data);
    return response.data;
  } catch (error) {
    console.error('번역 작업 요청 중 오류 발생:', error);
    throw error;
  }
}

export default router;
