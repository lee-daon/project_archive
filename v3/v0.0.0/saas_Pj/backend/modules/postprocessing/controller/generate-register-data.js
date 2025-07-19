import express from 'express';
import { createProductSchema } from '../service/createBaseSchema.js';
import { batchSaveProductJsonAndUpdateStatus } from '../repository/registerReadyStatus.js';
import { updateBaseJsonCompletedStatus } from '../../../common/utils/assistDb/GlobalStatus.js';
import { saveErrorLog } from '../../../common/utils/assistDb/error_log.js';

const router = express.Router();

/**
 * 마켓 등록용 JSON 데이터 생성 API
 * POST /postprc/generate-register-data
 */
router.post('/', async (req, res) => {
  try {
    const { productids } = req.body;
    const userid = req.user.userid; // 인증 미들웨어에서 설정된 사용자 ID

    // 입력 검증
    if (!userid) {
      return res.status(401).json({
        success: false,
        message: '사용자 인증이 필요합니다.'
      });
    }

    if (!productids || !Array.isArray(productids) || productids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '유효한 상품 ID 배열이 필요합니다.'
      });
    }

    const processedData = [];
    let processedCount = 0;
    let failedCount = 0;
    const failedProducts = [];

    // 각 상품에 대해 JSON 스키마 생성
    for (const productid of productids) {
      try {
        
        const schemaResult = await createProductSchema(userid, productid);
        
        if (schemaResult.success) {
          processedData.push({
            productid: productid,
            jsonData: schemaResult
          });
          processedCount++;
        } else {
          const errorMessage = `JSON 스키마 생성 실패: ${schemaResult.message}`;
          console.error(`상품 ${productid} JSON 스키마 생성 실패:`, schemaResult.message);
          
          // 에러 로그 저장
          await saveErrorLog(userid, productid, errorMessage);
          
          failedCount++;
          failedProducts.push(productid);
        }
      } catch (error) {
        const errorMessage = `상품 처리 중 예외 발생: ${error.message}`;
        console.error(`상품 ${productid} 처리 중 오류:`, error);
        
        // 에러 로그 저장
        await saveErrorLog(userid, productid, errorMessage);
        
        failedCount++;
        failedProducts.push(productid);
      }
    }

    // 성공한 데이터가 있으면 배치로 저장
    if (processedData.length > 0) {
      
      const saveResult = await batchSaveProductJsonAndUpdateStatus(userid, processedData);
      
      if (!saveResult.success) {
        const errorMessage = `배치 저장 실패: ${saveResult.message}`;
        console.error('배치 저장 실패:', saveResult.message);
        
        // 배치 저장 실패시 모든 상품에 대해 에러 로그 저장
        for (const productData of processedData) {
          await saveErrorLog(userid, productData.productid, errorMessage);
        }
        
        return res.status(500).json({
          success: false,
          message: '데이터 저장 중 오류가 발생했습니다.',
          data: {
            processed_count: 0,
            failed_count: productids.length,
            failed_products: productids
          }
        });
      }

      // 저장 결과를 기반으로 최종 카운트 업데이트
      const finalProcessedCount = saveResult.successCount;
      const finalFailedCount = failedCount + saveResult.failedCount;
      const finalFailedProducts = [...failedProducts, ...saveResult.failedProducts];

      // 성공한 상품들에 대해 status 테이블의 baseJson_completed를 true로 업데이트
      for (const productData of processedData) {
        if (!finalFailedProducts.includes(productData.productid)) {
          try {
            await updateBaseJsonCompletedStatus(userid, productData.productid);
          } catch (statusError) {
            const errorMessage = `상태 업데이트 실패: ${statusError.message}`;
            console.error(`상품 ${productData.productid} 상태 업데이트 실패:`, statusError);
            
            // 상태 업데이트 실패 에러 로그 저장
            await saveErrorLog(userid, productData.productid, errorMessage);
            
            // 상태 업데이트 실패는 전체 프로세스를 중단하지 않음
          }
        }
      }


      return res.status(200).json({
        success: true,
        message: 'JSON 데이터가 성공적으로 생성되었습니다.',
        data: {
          processed_count: finalProcessedCount,
          failed_count: finalFailedCount,
          failed_products: finalFailedProducts
        }
      });
    } else {
      // 모든 상품 처리 실패
      return res.status(400).json({
        success: false,
        message: '모든 상품 처리에 실패했습니다.',
        data: {
          processed_count: 0,
          failed_count: failedCount,
          failed_products: failedProducts
        }
      });
    }

  } catch (error) {
    const errorMessage = `API 전체 오류: ${error.message}`;
    
    // API 레벨 에러 로그 저장 (userid가 있는 경우에만)
    if (req.user?.userid && req.body?.productids?.length > 0) {
      // 요청된 모든 상품에 대해 에러 로그 저장
      for (const productid of req.body.productids) {
        await saveErrorLog(req.user.userid, productid, errorMessage);
      }
    }
    
    return res.status(500).json({
      success: false,
      message: '서버 내부 오류가 발생했습니다.',
      error: error.message
    });
  }
});

export default router;
