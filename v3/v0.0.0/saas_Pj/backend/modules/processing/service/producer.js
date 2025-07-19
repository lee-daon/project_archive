import { addToQueue } from '../../../common/utils/redisClient.js';
import { QUEUE_NAMES } from '../../../common/config/settings.js';

// 큐 이름 상수 사용
const TEXT_TRANSLATION_QUEUE = QUEUE_NAMES.TEXT_TRANSLATION_QUEUE;
const IMAGE_TRANSLATION_QUEUE = QUEUE_NAMES.IMAGE_TRANSLATION_QUEUE;
const NUKKI_IMAGE_QUEUE = QUEUE_NAMES.NUKKI_IMAGE_QUEUE;

/**
 * 텍스트 번역 작업을 Redis 큐에 등록
 * 
 * @param {Object} data - 작업 데이터
 * @returns {Promise<number>} - 큐 길이
 */
export async function addToTextTranslationQueue(data) {
  try {
    return await addToQueue(TEXT_TRANSLATION_QUEUE, data);
  } catch (error) {
    console.error('텍스트 번역 작업 큐 등록 중 오류 발생:', error);
    throw error;
  }
}

/**
 * 이미지 번역 작업을 Redis 큐에 등록
 * 
 * @param {Object} data - 작업 데이터
 * @returns {Promise<number>} - 큐 길이
 */
export async function addToImageTranslationQueue(data) {
  try {
    return await addToQueue(IMAGE_TRANSLATION_QUEUE, data);
  } catch (error) {
    console.error('이미지 번역 작업 큐 등록 중 오류 발생:', error);
    throw error;
  }
}

/**
 * 누끼 이미지 작업을 Redis 큐에 등록
 * 
 * @param {Object} data - 작업 데이터
 * @returns {Promise<number>} - 큐 길이
 */
export async function addToNukkiImageQueue(data) {
  try {
    return await addToQueue(NUKKI_IMAGE_QUEUE, data);
  } catch (error) {
    console.error('누끼 이미지 작업 큐 등록 중 오류 발생:', error);
    throw error;
  }
}

/**
 * 속성 번역 작업을 Redis 큐에 등록
 * 
 * @param {number} userId - 사용자 ID
 * @param {number} productId - 상품 ID
 * @returns {Promise<number>} - 큐 길이
 */
export async function addAttributeTranslationTask(userId, productId) {
  const data = {
    type: 'attribute',
    userId,
    productId
  };
  
  return await addToTextTranslationQueue(data);
}

/**
 * 옵션 번역 작업을 Redis 큐에 등록
 * 
 * @param {number} userId - 사용자 ID
 * @param {number} productId - 상품 ID
 * @param {Array<string>} propPaths - prop_path 배열
 * @returns {Promise<Array<number>>} - 각 작업의 큐 길이 배열
 */
export async function addOptionTranslationTasks(userId, productId, propPaths) {
  const queueLengths = [];
  
  for (const propPath of propPaths) {
    const data = {
      type: 'option',
      userId,
      productId,
      propPath
    };
    
    const queueLength = await addToTextTranslationQueue(data);
    queueLengths.push(queueLength);
  }
  
  return queueLengths;
}

/**
 * 키워드 생성 작업을 Redis 큐에 등록
 * 
 * @param {number} userId - 사용자 ID
 * @param {number} productId - 상품 ID
 * @param {Object} keywordOptions - 키워드 옵션
 * @returns {Promise<number>} - 큐 길이
 */
export async function addKeywordGenerationTask(userId, productId, keywordOptions) {
  const data = {
    type: 'keyword',
    userId,
    productId,
    keywordType: keywordOptions.type,
    include: keywordOptions.include
  };
  
  return await addToTextTranslationQueue(data);
}

/**
 * SEO 최적화 작업을 Redis 큐에 등록
 * 
 * @param {number} userId - 사용자 ID
 * @param {number} productId - 상품 ID
 * @param {Object} seoOptions - SEO 옵션
 * @returns {Promise<number>} - 큐 길이
 */
export async function addSeoOptimizationTask(userId, productId, seoOptions) {
  const data = {
    type: 'seo',
    userId,
    productId,
    seoType: seoOptions.type,
    include: seoOptions.include,
    category: seoOptions.category,
    includeBrand: seoOptions.includeBrand
  };
  
  return await addToTextTranslationQueue(data);
}

/**
 * 누끼 이미지 생성 작업을 Redis 큐에 등록
 * 
 * @param {number} userId - 사용자 ID
 * @param {number} productId - 상품 ID
 * @param {Object} nukkiOptions - 누끼 이미지 옵션
 * @returns {Promise<number>} - 큐 길이
 */
export async function addNukkiImageTask(userId, productId, nukkiOptions) {
  const data = {
    type: 'nukki',
    userId,
    productId,
    order: nukkiOptions.order
  };
  
  return await addToNukkiImageQueue(data);
}

/**
 * 이미지 번역 작업을 Redis 큐에 등록
 * 
 * @param {number} userId - 사용자 ID
 * @param {number} productId - 상품 ID
 * @param {Object} imageOptions - 이미지 옵션
 * @returns {Promise<Object>} - 등록 결과
 */
export async function addImageTranslationTasks(userId, productId, imageOptions) {
  const results = {
    main: 0,
    detail: 0,
    option: 0
  };
  
  if (imageOptions.main) {
    const data = {
      type: 'main_image',
      userId,
      productId
    };
    
    results.main = await addToImageTranslationQueue(data);
  }
  
  if (imageOptions.detail) {
    const data = {
      type: 'detail_image',
      userId,
      productId
    };
    
    results.detail = await addToImageTranslationQueue(data);
  }
  
  if (imageOptions.option) {
    const data = {
      type: 'option_image',
      userId,
      productId
    };
    
    results.option = await addToImageTranslationQueue(data);
  }
  
  return results;
}
