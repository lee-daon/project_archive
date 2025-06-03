/**
 * assembleInitialJson.js
 * 타오바오 상품 정보를 네이버 쇼핑 API 형식으로 변환하는 모듈
 */

// 분리된 모듈 임포트
import { filterRestrictedTags } from './1st_Assist/tagProcessing.js';
import { processAndUploadImages, hostImagesOnS3 } from './1st_Assist/imageProcessing.js';
import { calculatePrices, generateRandomDiscount, convertPropPathsToOptionNames } from './1st_Assist/priceCalculation.js';
import { generateDetailContent } from './1st_Assist/generateDetailContent.js';
import { addAZPrefixToOptions } from './1st_Assist/A_Zoption.js';

// DB 관련 함수 임포트
import { getProductInfoFromPreregister } from '../../db/register/getFronPreregister.js';
import { saveInitialJson, ensureNaverRegistInfoExists } from '../../db/register/naverRegisterInfo.js';
import { getNaverCategoryId } from '../../db/register/getNaverCategoryId.js';

/**
 * 최종 JSON 데이터 조립 및 DB 저장 함수
 * @param {Object} productInfo - 상품 정보 객체
 * @returns {Promise<Object>} 생성된 JSON 데이터
 */
async function assembleInitialJson(productInfo, firstImages, lastImages) {
  try {
    const productId = productInfo.productInfo.productId;
    
    // DB에 레코드가 있는지 확인하고, 없으면 생성
    await ensureNaverRegistInfoExists(productId);
    
    // 1. 네이버 카테고리 ID 조회
    const naverCategoryId = await getNaverCategoryId(productInfo.productInfo.categoryId);
    
    // 2. 키워드 필터링
    const filteredKeywords = await filterRestrictedTags(productInfo.productInfo.keywords);
    
    // 3. 이미지 처리 및 업로드
    const imageData = await processAndUploadImages(
      productInfo.productInfo.representativeImage,
      productInfo.productInfo.images,
      productId
    );
    
    // 4.5. optionValueNames에 A부터 Z까지 접두어 추가
    productInfo = addAZPrefixToOptions(productInfo);

    // 4. 상세 이미지 및 옵션 이미지 S3 호스팅
    const hostedImageData = await hostImagesOnS3(
      productInfo.productInfo.descriptionImages,
      productInfo.optionImages,
      productInfo.optionValueNames,
      productId
    );
    
    
    // 5. 가격 계산
    const calculatedVariants = await calculatePrices(
      productInfo.variants,
      productInfo.productInfo.deliveryFee,
      productId
    );
    
    // 6. propPaths를 실제 옵션 이름으로 변환
    const variantsWithOptionNames = convertPropPathsToOptionNames(
      calculatedVariants,
      productInfo.optionValueNames
    );
    
    // 7. 상세 페이지 HTML 생성
    const detailContent = generateDetailContent( // 상세 이미지 섹션 생성 
      hostedImageData.descriptionImages,
      productInfo.productInfo.attributes,
      hostedImageData.optionNamesWithImages, 
      firstImages,
      lastImages
    );

    console.log(hostedImageData)
    
    // 8. 랜덤 할인율 생성
    const discountRate = await generateRandomDiscount(productId);
    
    // 9. 최종 JSON 조립
    const initialJson = {
      productId: productId,
      productName: productInfo.productInfo.productName,
      naverCategoryId: naverCategoryId,
      brandName: productInfo.productInfo.brandName,
      keywords: filteredKeywords,
      images: imageData,
      contents: detailContent,
      optionSchema: productInfo.optionSchema,
      variants: variantsWithOptionNames,
      discountRate: discountRate
    };
    
    // DB에 저장
    await saveInitialJson(productId, initialJson);
    
    return initialJson;
  } catch (error) {
    console.error('초기 JSON 조립 오류:', error);
    throw error;
  }
}

/**
 * pre_register 테이블에서 json_data를 가져와 initialJson 생성
 * @param {string} productId - 상품 ID
 * @returns {Promise<Object>} 생성된 JSON 데이터
 */
async function getPreRegisterJsonAndAssemble(productId) {
  try {
    // pre_register 테이블에서 상품 정보 가져오기
    const productInfo = await getProductInfoFromPreregister(productId);
    
    // assembleInitialJson 함수 호출하여 initialJson 생성
    return await assembleInitialJson(productInfo);
  } catch (error) {
    console.error('pre_register JSON 변환 오류:', error);
    throw error;
  }
}

export { assembleInitialJson, getPreRegisterJsonAndAssemble };
