import express from 'express';
import { processProduct } from '../service/tasksProcessing.js';
import { saveErrorLog } from '../../../common/utils/assistDb/error_log.js';
import { updateTotalProcessedProducts } from '../../../common/QuotaUsageLimit/Usage/updateUsage.js';

/**
 * 번역 작업 처리를 위한 테스트용 라우터
 * 실제 번역은 수행하지 않고 요청을 받아 성공 응답만 반환
 */
const router = express.Router();

/**
 * 번역 및 가공 요청을 처리하는 엔드포인트
 * 요청된 상품을 작업 큐에 등록하고 가공 상태를 업데이트
 * 
 * @route POST /prc/translatedetail
 * @param {Array} req.body - 가공할 상품 정보 배열 [{userId, productId, options}]
 * @param {string} req.query.userid - 사용자 ID (선택사항)
 */
router.post('/', async (req, res) => {
  try {
    const requestData = req.body;
    
    // 요청 데이터 유효성 검사
    if (!Array.isArray(requestData) || requestData.length === 0) {
      return res.status(400).json({
        success: false,
        message: '유효한 요청 데이터가 제공되지 않았습니다.'
      });
    }
    
    // 사용자 ID (쿼리에서 가져오거나 첫 번째 항목에서 가져옴)
    const userId = req.query.userid || requestData[0].userId;
    
    // 각 항목을 개별적으로 처리 (각 항목마다 다른 옵션 사용)
    const processPromises = requestData.map(item => 
      processProduct(userId, item.productId, item.options)
    );
    
    // 누적 가공 상품수 업데이트
    await updateTotalProcessedProducts(userId, requestData.length);
    
    // 작업 처리 시작 (비동기적으로 처리하고 즉시 응답)
    Promise.all(processPromises)
      .then(results => {
        const successCount = results.filter(result => result.success).length;
        const failedCount = results.length - successCount;
        
        console.log(`[translatedetail] 작업 처리 완료:`, {
          totalCount: results.length,
          successCount,
          failedCount
        });
      })
      .catch(async (error) => {
        console.error('[translatedetail] 작업 처리 중 오류 발생:', error);
        
        // 각 상품에 대해 오류 로그 저장
        for (const item of requestData) {
          await saveErrorLog(userId, item.productId, `번역 작업 처리 중 오류: ${error.message}`);
        }
      });
    
    // 즉시 성공 응답 반환
    res.status(200).json({
      success: true,
      message: `${requestData.length}개 상품의 번역 작업이 요청되었습니다.`,
      requestedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('[translatedetail] 오류 발생:', error);
    
    // 오류 로그 저장 (사용자 ID와 첫 번째 상품 ID 사용)
    const userId = req.query.userid || (req.body && req.body[0] && req.body[0].userId);
    const productId = req.body && req.body[0] && req.body[0].productId;
    
    if (userId && productId) {
      await saveErrorLog(userId, productId, `번역 요청 처리 중 오류: ${error.message}`);
    }
    
    res.status(500).json({
      success: false,
      message: '번역 요청 처리 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

export default router;




