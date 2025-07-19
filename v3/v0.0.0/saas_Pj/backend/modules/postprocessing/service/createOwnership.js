import { 
  getProcessingStatus,
  copyToPrivateMainImage,
  copyToPrivateDescriptionImage,
  copyToPrivateNukkiImage,
  copyToPrivateProperties,
  copyToPrivateOptions
} from '../repository/Ownership.js';


/**
 * processing_status를 조회하고 private 테이블들에 데이터를 복사하는 함수
 * 
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @returns {Promise<Object>} - 처리 결과 객체
 */
export const generatePrivateData = async (userid, productid) => {
  try {
    const processingStatusResult = await getProcessingStatus(userid, productid);
    
    if (!processingStatusResult.success) {
      return {
        success: false,
        message: '가공 상태 정보를 찾을 수 없습니다.'
      };
    }
    
    const processingStatus = processingStatusResult.data;
    const results = {
      mainImage: null,
      descriptionImage: null,
      nukkiImage: null,
      properties: null,
      options: null
    };
    
    // 1. private_main_image 복사
    results.mainImage = await copyToPrivateMainImage(
      userid, 
      productid, 
      processingStatus.main_image_translated
    );
    
    // 2. private_description_image 복사
    results.descriptionImage = await copyToPrivateDescriptionImage(
      userid, 
      productid, 
      processingStatus.description_image_translated
    );
    
    // 3. private_nukki_image 복사
    results.nukkiImage = await copyToPrivateNukkiImage(
      userid, 
      productid, 
      processingStatus.nukki_created,
      processingStatus.nukki_image_order
    );
    
    // 4. private_properties 복사
    results.properties = await copyToPrivateProperties(
      userid, 
      productid, 
      processingStatus.attribute_translated
    );
    
    // 5. private_options 복사
    results.options = await copyToPrivateOptions(
      userid, 
      productid, 
      processingStatus.option_optimized,
      processingStatus.option_image_translated
    );
    
    
    return {
      success: true,
      message: '개인 데이터가 성공적으로 복사되었습니다.',
      results,
      processingStatus: {
        main_image_translated: processingStatus.main_image_translated,
        description_image_translated: processingStatus.description_image_translated,
        nukki_created: processingStatus.nukki_created,
        nukki_image_order: processingStatus.nukki_image_order,
        attribute_translated: processingStatus.attribute_translated,
        option_optimized: processingStatus.option_optimized,
        option_image_translated: processingStatus.option_image_translated
      }
    };
  } catch (error) {
    console.error('개인 데이터 생성 중 오류 발생:', error);
    return {
      success: false,
      message: '개인 데이터 생성 중 오류가 발생했습니다.',
      error: error.message
    };
  }
};

/**
 * 여러 상품의 개인 데이터를 생성하는 함수
 * 
 * @param {number} userid - 사용자 ID
 * @param {Array<number>} productids - 상품 ID 배열
 * @returns {Promise<Object>} - 처리 결과 객체
 */
export const generateMultiplePrivateData = async (userid, productids) => {
  if (!Array.isArray(productids) || productids.length === 0) {
    return {
      success: false,
      message: '처리할 상품 ID가 제공되지 않았습니다.'
    };
  }
  
  const results = {
    success: true,
    message: '',
    successCount: 0,
    failedCount: 0,
    errors: [],
    details: []
  };
  
  for (const productid of productids) {
    try {
      const result = await generatePrivateData(userid, productid);
      
      if (result.success) {
        results.successCount++;
        results.details.push({
          productid,
          success: true,
          processingStatus: result.processingStatus
        });
      } else {
        results.failedCount++;
        results.errors.push({
          productid,
          error: result.message || '개인 데이터 생성 실패'
        });
        results.details.push({
          productid,
          success: false,
          error: result.message
        });
      }
    } catch (error) {
      results.failedCount++;
      results.errors.push({
        productid,
        error: error.message || '처리 중 오류 발생'
      });
      results.details.push({
        productid,
        success: false,
        error: error.message
      });
    }
  }
  
  results.message = `${results.successCount}개 상품의 개인 데이터가 생성되었습니다.`;
  if (results.failedCount > 0) {
    results.message += ` ${results.failedCount}개 상품 처리 실패.`;
  }
  
  return results;
};
