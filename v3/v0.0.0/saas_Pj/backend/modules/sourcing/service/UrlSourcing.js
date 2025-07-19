// V1 API (주석처리)
// import { getProductDetail } from "../../../common/utils/taobaoApi.js";
// import { saveProductDetail } from '../repository/saveProductDetail.js';
// V2 API (현재 사용)
import { getProductDetail_V2 } from "../../../common/utils/taobaoApi.js";
import { saveProductDetailV2 } from '../repository/saveProductDetailV2.js';

/**
 * 상품 ID 배열을 처리하여 API로부터 상품 정보를 가져온 후 DB에 저장하고 upload 형태로 변환
 * @param {number[]} productIds - 처리할 상품 ID 배열
 * @param {number} userid - 사용자 ID
 * @returns {Promise<Array>} - upload 라우터로 보낼 상품 배열
 */
export async function processProductIds(productIds, userid) {
  try {
    const formattedProducts = [];
    const failedProducts = [];

    // 각 상품 ID에 대해 API 호출
    for (const productId of productIds) {
      try {
        // 타오바오 V2 API를 통해 상품 정보 가져오기 (rate limiting 내장)
        // V1 API (주석처리)
        // const apiResponse = await getProductDetail(productId);
        // V2 API (현재 사용)
        const apiResponse = await getProductDetail_V2(productId);
        
        // V1 API 응답 검증 (주석처리)
        // if (apiResponse.result && apiResponse.result.item) {
        // V2 API 응답 검증 (현재 사용)
        if (apiResponse.success && apiResponse.data) {
          // DB에 상품 상세 정보 저장
          // V1 API (주석처리)
          // const saveResult = await saveProductDetail(apiResponse, userid, productId.toString());
          // V2 API (현재 사용)
          const saveResult = await saveProductDetailV2(apiResponse, userid, productId.toString());
          
          if (saveResult.success) {
            console.log(`상품 ${productId} DB 저장 성공`);
          } else {
            console.warn(`상품 ${productId} DB 저장 실패: ${saveResult.message}`);
          }
          
          // V1 API 데이터 처리 (주석처리)
          // const item = apiResponse.result.item;
          // const imageUrl = item.images && item.images.length > 0 
          //   ? `https:${item.images[0]}` 
          //   : null;
          // let finalPrice = 0;
          // if (item.sku_base && Array.isArray(item.sku_base) && item.sku_base.length > 0) {
          //   const firstSku = item.sku_base[0];
          //   const skuPrice = firstSku.price || 0;
          //   const skuPromotionPrice = firstSku.promotion_price || 0;
          //   finalPrice = parseFloat(skuPromotionPrice || skuPrice);
          // }
          
          // V2 API 데이터 처리 (현재 사용)
          const data = apiResponse.data;
          
          // 첫 번째 이미지 URL 추출 (medias에서 비디오가 아닌 것)
          let imageUrl = null;
          if (data.medias && Array.isArray(data.medias)) {
            const images = data.medias.filter(media => !media.isVideo);
            if (images.length > 0) {
              imageUrl = images[0].link;
            }
          }

          // 가격 정보 추출 (skuInfos 구조에서)
          let finalPrice = 0;
          if (data.skuInfos && Array.isArray(data.skuInfos) && data.skuInfos.length > 0) {
            const firstSku = data.skuInfos[0];
            const skuPrice = firstSku.price || 0;
            const skuPromotionPrice = firstSku.promotionPrice || 0;
            finalPrice = parseFloat(skuPromotionPrice || skuPrice);
          }

          // upload 라우터 형태에 맞는 데이터 구조로 변환
          formattedProducts.push({
            productId: productId.toString(),
            productName: data.title,
            pic: imageUrl,
            price: finalPrice,
            sales: "0", // V2 API에서는 판매량 정보가 없음
            detail_url: `https://item.taobao.com/item.htm?id=${productId}`
          });
        } else {
          console.error(`상품 ${productId}의 API 응답이 올바르지 않습니다:`, apiResponse);
          failedProducts.push(productId);
        }
      } catch (apiError) {
        // 예측 가능한 에러는 더 명확하게 로깅
        if (apiError.message.includes('상품정보가 존재하지 않습니다')) {
          console.warn(`상품 ${productId}: ${apiError.message}`);
        } else {
          console.error(`상품 ${productId}의 API 호출 중 오류:`, apiError.message);
        }
        failedProducts.push(productId);
      }
    }

    return {
      formattedProducts,
      failedProducts,
      totalRequested: productIds.length,
      totalSuccess: formattedProducts.length,
      totalFailed: failedProducts.length
    };
  } catch (error) {
    console.error('상품 ID 처리 중 오류:', error);
    throw error;
  }
}
