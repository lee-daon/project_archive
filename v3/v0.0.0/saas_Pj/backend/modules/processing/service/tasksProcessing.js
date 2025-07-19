import { getPropPaths, getImageCounts, calculateTaskCounts } from '../repository/getTasksInfo.js';
import { 
  addAttributeTranslationTask,
  addOptionTranslationTasks,
  addKeywordGenerationTask,
  addSeoOptimizationTask,
  addNukkiImageTask,
  addImageTranslationTasks
} from './producer.js';
import { updateTasksCount, completeProcessingImmediately } from '../repository/controlPrcStatus.js';
import { promisePool } from '../../../common/utils/connectDB.js';

/**
 * 가공 상태를 업데이트하는 함수
 * 
 * @param {number} userId - 사용자 ID
 * @param {number} productId - 상품 ID
 * @param {Object} taskCounts - 작업 개수 객체
 * @returns {Promise<boolean>} - 성공 여부
 */
export async function updateProcessingStatus(userId, productId, taskCounts) {
  try {
    const result = await updateTasksCount(userId, productId, taskCounts);
    return result.success;
  } catch (error) {
    console.error(`상품 ID ${productId}의 가공 상태 업데이트 중 오류 발생:`, error);
    throw error;
  }
}

/**
 * 상품 작업을 처리하는 함수
 * 
 * @param {number} userId - 사용자 ID
 * @param {number} productId - 상품 ID
 * @param {Object} options - 작업 옵션
 * @returns {Promise<Object>} - 처리 결과
 */
export async function processProduct(userId, productId, options) {
  try {
    // 1. prop_path 정보 조회 (옵션 번역에 필요)
    let propPaths = [];
    if (options.optionTranslation) {
      propPaths = await getPropPaths(productId);
    }
    
    // 2. 이미지 개수 조회
    const imageCounts = await getImageCounts(productId);
    
    // 3. 작업 개수 계산
    const taskCounts = await calculateTaskCounts(
      options,
      propPaths.length,
      imageCounts.mainImageCount,
      imageCounts.descImageCount,
      imageCounts.optionImageCount
    );
    
    // 4. 모든 작업 개수가 0인지 확인 후 즉시 완료 처리
    if (taskCounts.imgTasksCount === 0 && 
        taskCounts.optionTasksCount === 0 && 
        taskCounts.overallTasksCount === 0) {
      
      await completeProcessingImmediately(userId, productId);
      
      return {
        success: true,
        productId,
        taskCounts,
        immediateCompletion: true,
        results: {
          attributeTranslation: false,
          optionTranslation: false,
          keywordGeneration: false,
          seoOptimization: false,
          nukkiImage: false,
          imageTranslation: false
        }
      };
    }
    
    // 5. 가공 상태 업데이트 (작업이 있는 경우만)
    await updateProcessingStatus(userId, productId, taskCounts);
    
    // 6. 각 작업 큐에 등록
    const results = {
      attributeTranslation: false,
      optionTranslation: false,
      keywordGeneration: false,
      seoOptimization: false,
      nukkiImage: false,
      imageTranslation: false
    };
    
    // 6.1. 속성 번역 작업 등록
    if (options.attributeTranslation) {
      await addAttributeTranslationTask(userId, productId);
      results.attributeTranslation = true;
    }
    
    // 6.2. 옵션 번역 작업 등록
    if (options.optionTranslation && propPaths.length > 0) {
      await addOptionTranslationTasks(userId, productId, propPaths);
      results.optionTranslation = true;
    }
    
    // 6.3. 키워드 생성 작업 등록
    if (options.keyword?.type) {
      await addKeywordGenerationTask(userId, productId, options.keyword);
      results.keywordGeneration = true;
    }
    
    // 6.4. SEO 최적화 작업 등록
    if (options.seo) {
      await addSeoOptimizationTask(userId, productId, options.seo);
      results.seoOptimization = true;
    }
    
    // 6.5. 누끼 이미지 작업 등록
    if (options.nukkiImages?.enabled) {
      await addNukkiImageTask(userId, productId, options.nukkiImages);
      results.nukkiImage = true;
    }
    
    // 6.6. 이미지 번역 작업 등록
    if (options.imageTranslation) {
      await addImageTranslationTasks(userId, productId, options.imageTranslation);
      results.imageTranslation = true;
    }
    
    return {
      success: true,
      productId,
      taskCounts,
      results
    };
  } catch (error) {
    console.error(`상품 ID ${productId} 작업 처리 중 오류 발생:`, error);
    
    try {
      // 오류 발생 시 상태를 'fail'로 업데이트
      const connection = await promisePool.getConnection();
      
      try {
        await connection.query(
          `UPDATE processing_status SET status = 'fail' WHERE userid = ? AND productid = ?`,
          [userId, productId]
        );
      } finally {
        connection.release();
      }
    } catch (updateError) {
      console.error(`상태 업데이트 중 추가 오류 발생:`, updateError);
    }
    
    throw error;
  }
}
