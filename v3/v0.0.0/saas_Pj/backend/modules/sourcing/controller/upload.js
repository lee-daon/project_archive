import express from 'express';
import { processNewProducts } from '../service/productListUpdate.js';
import { processBannedProducts, removeDuplicateProducts } from '../service/uploadservice.js';
import { translateProductNames } from '../service/geminiNameTranslator.js';
import { saveToTempTable } from '../../../common/utils/assistDb/temp.js';
import { checkSourcingLimit } from '../../../common/QuotaUsageLimit/Quota/checkSourcingLimit.js';
import { updateTotalSourcedProducts, updateDuplicateFilteredProducts } from '../../../common/QuotaUsageLimit/Usage/updateUsage.js';
import { checkRequestLimit } from '../../../common/QuotaUsageLimit/Limit/requestLimit.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    // 클라이언트로부터 전달받은 원본 상품 배열
    /**
     * req.body는 상품 정보가 담긴 배열이어야 합니다.
     * @type {ProductItem[]}
     * 
     * 예시:
     * [
     *   {
     *     "productId": "607454902338",
     *     "productName": "Intel/英特尔S4510 240G 480G 960G 1.92T 3.84T 7.68T企业级硬盘",
     *     "pic": "https://img.alicdn.com/imgextra/i3/14349340/O1CN01RV9ZwS2Irlr6omqcG_!!14349340.jpg",
     *     "price": 309,
     *     "sales": "100以内",
     *     "detail_url": "https://item.taobao.com/item.htm?id=607454902338"
     *   },
     *   ...
     * ]
     */
    const rawProducts = req.body;
    
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
    // 4. userid가 없는 경우 오류 응답
    else {
      return res.status(400).json({
        message: '유효한 사용자 ID가 제공되지 않았습니다.'
      });
    }
    
    console.log(`처리 중인 사용자 ID: ${userid}`);

    // 배열 유효성 검사
    if (!Array.isArray(rawProducts) || rawProducts.length === 0) {
      return res.status(400).json({
        message: '유효한 상품 배열이 제공되지 않았습니다.'
      });
    }

    // 요청 개수 제한 검사 (200개 제한)
    const limitResult = checkRequestLimit(rawProducts.length, 500);
    if (!limitResult.success) {
      return res.status(limitResult.statusCode).json({
        message: limitResult.message
      });
    }

    // 1. 소싱 할당량 확인 및 차감
    const limitCheckResult = await checkSourcingLimit(userid, rawProducts.length);
    if (!limitCheckResult.success) {
      return res.status(limitCheckResult.statusCode || 429).json({
        message: limitCheckResult.message
      });
    }
    console.log('할당량 확인 완료');

    // 소싱 할당량 통과 시 누적 소싱 상품수 업데이트
    await updateTotalSourcedProducts(userid, rawProducts.length);

    // 2. duplicatefilter를 사용하여 중복 상품 제거
    const products = await removeDuplicateProducts(rawProducts, userid);
    console.log('과정1 완료');
    
    // 3. 신규 상품 저장 및 중복상품 갱신    
    const { duplicationCount, newProducts } = await processNewProducts(products, userid);
    console.log('과정2 완료');

    // 중복 제외 상품수 업데이트
    if (duplicationCount > 0) {
      await updateDuplicateFilteredProducts(userid, duplicationCount);
    }

    // 4. 번역 진행, 번역된 상품명은 DB도 업데이트됨
    const translatedProducts = await translateProductNames(newProducts, 20, userid);
    console.log('과정3 완료');
    
    // 5. 금지어 체크 및 DB 업데이트 (번역된 상품명을 기준으로 검사)
    const { includeBanCount, allProducts } = await processBannedProducts(translatedProducts, userid);
    console.log('과정4 완료');

    // 6. 최종 결과와 통계 계산
    const totalCount = rawProducts.length;
    const finalTargetCount = totalCount - includeBanCount;

    // 데이터 준비
    const uploadData = {
      bancheckedTarget: allProducts,
      finalTargetCount: finalTargetCount,
      duplicationCount: duplicationCount,
      includeBanCount: includeBanCount,
      totalCount: totalCount,
      dataReady: true,
      timestamp: new Date().toISOString()
    };

    // temp 테이블에 데이터 저장 (type_number 1을 상품 업로드 데이터로 사용)
    const saveResult = await saveToTempTable(userid, 1, uploadData);
    
    if (!saveResult.success) {
      console.error('데이터 저장 중 오류 발생:', saveResult.error);
    }

    console.log('업로드 처리 완료, 데이터가 DB에 저장됨');
    res.json({
      message: '처리가 완료되었습니다.',
      success: true,
    });

  } catch (error) {
    console.error('상품 업로드 처리 중 오류 발생:', error);
    res.status(500).json({
      message: '상품 처리 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

export default router; 