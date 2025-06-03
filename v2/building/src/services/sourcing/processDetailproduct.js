import pLimit from 'p-limit';
import { getProductDetail } from './getproductdetail.js';
import { saveProductDetail } from '../../db/sourcing/saveProductDetail.js';
import { saveStatus } from '../../db/saveStatus.js';
import { savePreprocessing } from '../../db/savePreprocessing.js';

/**
 * 개별 상품 처리: API 요청 후 결과가 "success"이면 DB 저장 및 newIds 반환
 * getProductDetail 함수에서 받은 데이터를 saveProductDetail 함수에 전달
 * @param {Object} product - { productId, productName }
 * @returns {Object} - 처리 결과 객체 
 *  예: { success: true, productId, newIds } 또는 { failApi: true } / { failSave: true }
 */
export async function processProduct(product) {
  
  const { productId } = product;

  try {
    // getProductDetail 함수는 자체적으로 429 에러를 처리하고 재시도합니다
    const data = await getProductDetail(productId);
    
    //console.log(data.result.status_validate.count);
    if (data.result && data.result.status.msg === "success") {
      
        await saveProductDetail(product, data);
        // status 테이블 업데이트: 성공 시 sourcing_completed true
        await saveStatus({ productId, sourcing_completed: true });
        // processing 테이블 업데이트: saveProductDetail 성공 시 productId 추가
        await savePreprocessing({ productId });
      return { success: true, productId };
    } else {
      console.error(`상품 ${productId} API 응답 실패:`, data.result.status.msg);
      await saveStatus({ productId, sourcing_completed: false });
      return { failApi: true };
    }
  } catch (err) {
    console.error(`상품 ${productId} 처리 중 오류1`,err);
    await saveStatus({ productId, sourcing_completed: false });
    return { failSave: true };
  }
}

/**
 * 여러 상품을 최대 10개씩 동시 처리
 * plimit, delay 조절을 통해 속도와 429 에러 방지
 * @param {Array<Object>} products - 상품 배열 [{ productId, productName }, ...]
 * @returns {Object} - 처리 결과 집계 객체 
 *  ({ successCount, failApiCount, failSaveCount, productIds, catids, pids, vids })
 */
export async function processProducts(products) {
  let successCount = 0;
  let failApiCount = 0;
  let failSaveCount = 0;
  let productIds = []; // 성공한 상품의 ID 목록

  const limit = pLimit(10); // 동시진행개수 조절
  
  // 각 요청 사이에 0.5초 지연을 추가하는 함수
  const delayedProcessProduct = async (product) => {
    // 0.5초 지연 추가
    await new Promise(resolve => setTimeout(resolve, 300)); //요청간격 조절
    return processProduct(product);
  };
  
  const tasks = products.map((product) => limit(() => delayedProcessProduct(product)));
  const results = await Promise.all(tasks);

  // 각 결과를 집계
  results.forEach(result => {
    if (result.success) {
      successCount++;
      productIds.push(result.productId);
    }
    if (result.failApi) {
      failApiCount++;
    }
    if (result.failSave) {
      failSaveCount++;
    }
  });

  return { successCount, failApiCount, failSaveCount, productIds };
}
