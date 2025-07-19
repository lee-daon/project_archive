import {
  fetchProductBasicInfo,
  fetchRepresentativeImage,
  fetchMainImages,
  fetchDescriptionImages,
  fetchAttributes,
  fetchSkuData,
  fetchPrivateOptions
} from '../repository/buildJsonInfo.js';
import { saveErrorLog } from '../../../common/utils/assistDb/error_log.js';
import { cleanImageUrl, cleanImageArray } from '../../../common/utils/Validator.js';

/**
 * 상품 데이터를 최종 스키마 구조로 변환합니다.
 * 
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 조회할 상품의 ID
 * @returns {Promise<Object>} 상품 정보 처리 결과 객체
 */
export async function createProductSchema(userid, productid) {
  try {
    // 1. 기본 상품 정보 가져오기
    const basicInfo = await fetchProductBasicInfo(userid, productid);
    if (!basicInfo) {
      const errorMessage = '상품을 찾을 수 없습니다.';
      await saveErrorLog(userid, productid, errorMessage);
      return { success: false, message: errorMessage };
    }

    // keywords 배열 처리
    const keywordsArray = basicInfo.keywords ? 
      basicInfo.keywords.replace(/[\[\]]/g, '').split(',').map(item => item.trim()) : [];

    // 2. 이미지 정보 처리
    const rawRepresentativeImage = await fetchRepresentativeImage(userid, productid);
    const rawImagesArr = await fetchMainImages(userid, productid, rawRepresentativeImage);
    const rawDescImagesArr = await fetchDescriptionImages(userid, productid);
    
    // 이미지 URL 정리 및 검증
    const representativeImage = cleanImageUrl(rawRepresentativeImage);
    const imagesArr = cleanImageArray(rawImagesArr);
    const descImagesArr = cleanImageArray(rawDescImagesArr);
    
    
    // 대표 이미지가 없고 메인 이미지가 있는 경우 첫 번째 메인 이미지를 대표 이미지로 사용
    const finalRepresentativeImage = representativeImage || (imagesArr.length > 0 ? imagesArr[0] : null);
    const finalImagesArr = representativeImage ? imagesArr : imagesArr.slice(1); // 대표 이미지를 메인 이미지에서 제거
    
    if (!finalRepresentativeImage) {
      const errorMessage = '유효한 대표 이미지가 없습니다.';
      await saveErrorLog(userid, productid, errorMessage);
      return { success: false, message: errorMessage };
    }

    // 3. 속성 정보 처리
    const attributesArr = await fetchAttributes(userid, productid);
    const attributes_cut = attributesArr.map(attr => attr.name).join(' / ');

    // 4. 옵션 및 SKU 정보 처리
    const skus = await fetchSkuData(userid, productid);
    const privateOptions = await fetchPrivateOptions(userid, productid);

    // 가격 필터링: 비정상적으로 낮은 가격의 SKU 제외
    // 중앙값의 1/3 이하인 가격의 SKU 제외
    const prices = skus.map(sku => parseFloat(sku.promotionprice || sku.price)).sort((a, b) => a - b);
    const medianPrice = prices.length > 0 ? prices[Math.floor(prices.length / 2)] : 0;
    const thresholdPrice = medianPrice / 3;
    const filteredSkus = skus.filter(sku => parseFloat(sku.promotionprice || sku.price) > thresholdPrice);

    // 필터링된 SKU에서 사용되는 prop_path만 수집
    const relevantPropPathsSet = new Set();
    filteredSkus.forEach(sku => {
      if (sku.prop_path) {
        sku.prop_path.split(';').forEach(p => {
          if (p) {
            relevantPropPathsSet.add(p);
          }
        });
      }
    });

    // 관련된 개인 옵션만 필터링
    const relevantPrivateOptions = privateOptions.filter(opt => relevantPropPathsSet.has(opt.prop_path));

    // 새로운 옵션 스키마 구조 생성
    const optionMap = new Map(); // pid -> {optionName, values: Map(vid -> {valueName, imageUrl})}

    relevantPrivateOptions.forEach(opt => {
      const [pid, vid] = opt.prop_path.split(':');
      if (!pid || !vid) return;

      if (!optionMap.has(pid)) {
        optionMap.set(pid, {
          optionName: opt.private_optionname,
          values: new Map()
        });
      }

      optionMap.get(pid).values.set(vid, {
        valueName: opt.private_optionvalue,
        imageUrl: cleanImageUrl(opt.private_imageurl) // 옵션 이미지도 정리
      });
    });

    // SKU의 prop_path에서 옵션 순서 추출 (첫 번째 SKU의 순서를 기준으로 사용)
    const optionOrder = [];
    if (filteredSkus.length > 0 && filteredSkus[0].prop_path) {
      const firstSkuPropPaths = filteredSkus[0].prop_path.split(';').filter(p => p);
      firstSkuPropPaths.forEach(propPath => {
        const [pid] = propPath.split(':');
        if (pid && !optionOrder.includes(pid)) {
          optionOrder.push(pid);
        }
      });
    }

    // 옵션 스키마 배열 생성 (SKU의 prop_path 순서를 따름)
    const optionSchema = optionOrder.map(pid => {
      const optionData = optionMap.get(pid);
      if (!optionData) return null;
      
      return {
        optionId: pid,
        optionName: optionData.optionName,
        optionValues: Array.from(optionData.values.entries())
          .sort(([vidA], [vidB]) => parseInt(vidA) - parseInt(vidB))
          .map(([vid, valueData]) => {
            const optionValue = {
              valueId: vid,
              valueName: valueData.valueName
            };
            
            // imageUrl이 정리된 후 유효한 경우에만 추가
            if (valueData.imageUrl) {
              optionValue.imageUrl = valueData.imageUrl;
            }
            
            return optionValue;
          })
      };
    }).filter(option => option !== null);

    // Variants 생성 (skus_order 순서 유지)
    const variants = [];
    filteredSkus.forEach(sku => {
      if (variants.length >= 50) return;

      const propPathsArray = sku.prop_path ? sku.prop_path.split(';').filter(p => p) : [];
      
      // 유효성 검사: 모든 prop_path가 relevantPropPathsSet에 존재하는지 확인
      if (propPathsArray.length > 0 && propPathsArray.some(p => !relevantPropPathsSet.has(p))) {
        console.warn(`SKU ${sku.prop_path}에 유효하지 않은 prop_path가 포함되어 있습니다.`);
        return;
      }

      // optionCombination 생성
      const optionCombination = propPathsArray.map(propPath => {
        const [pid, vid] = propPath.split(':');
        return {
          optionId: pid,
          valueId: vid
        };
      });

      variants.push({
        stockQuantity: sku.quantity || 0,
        price: parseFloat(sku.promotionprice || sku.price).toFixed(2),
        optionCombination: optionCombination
      });
    });

    // 최종 결과 구성
    const finalResult = {
      success: true,
      productInfo: {
        productId: productid.toString(),
        url: basicInfo.url,
        productName: basicInfo.productName,
        categoryId: basicInfo.categoryId,
        brandName: basicInfo.brandName,
        deliveryFee: basicInfo.deliveryFee,
        video: basicInfo.video,
        keywords: keywordsArray,
        representativeImage: finalRepresentativeImage,
        images: finalImagesArr,
        descriptionImages: descImagesArr,
        attributes: attributesArr,
        attributes_cut: attributes_cut
      },
      optionSchema: optionSchema,
      variants: variants
    };

    return finalResult;

  } catch (error) {
    const errorMessage = `상품 정보 구성 중 오류: ${error.message}`;
    console.error('상품 정보 구성 실패:', error);
    
    // 에러 로그 저장
    await saveErrorLog(userid, productid, errorMessage);
    
    return { success: false, message: '상품 정보 구성 중 오류가 발생했습니다.' };
  }
}
