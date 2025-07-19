import { getFromQueue, addToQueue, getMultipleFromQueue } from '../../common/utils/redisClient.js';
import { 
  getMainImages, 
  getDetailImages, 
  getOptionImages,
  checkTranslatedImageExists
} from './db/getImages.js';
import {decreaseImageTaskCount} from './db/updateStatus.js';
import { saveTranslatedImagesBulk } from './db/saveImages.js';
import { saveErrorLog } from '../../common/utils/assistDb/error_log.js';
import { QUEUE_NAMES, API_SETTINGS } from '../../common/config/settings.js';

// 큐 이름 상수
const IMAGE_TRANSLATION_QUEUE = QUEUE_NAMES.IMAGE_TRANSLATION_QUEUE;
const IMG_TRANSLATE_TASK_QUEUE = QUEUE_NAMES.IMG_TRANSLATE_TASK_QUEUE;

// 요청 제한 시간 (밀리초)
const REQUEST_RATE_LIMIT = API_SETTINGS.IMAGE_REQUEST_RATE_LIMIT;
const BATCH_SIZE = 50;

/**
 * 지정된 시간만큼 대기하는 함수
 * @param {number} ms - 대기 시간 (밀리초)
 * @returns {Promise<void>}
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 이미지 번역 작업을 큐에 전송하는 함수
 * @param {string} imageUrl - 이미지 URL
 * @param {string} imageId - 이미지 ID (고유함)
 * @param {boolean} isLong - 긴 이미지 여부
 * @returns {Promise<void>}
 */
const sendImageTranslateTask = async (imageUrl, imageId, isLong) => {
  try {
    const taskData = {
      image_url: imageUrl,
      image_id: imageId,
      is_long: isLong
    };
    
    await addToQueue(IMG_TRANSLATE_TASK_QUEUE, taskData);
    console.log(`이미지 번역 작업 전송 완료: ${imageId} (is_long=${isLong})`);
  } catch (error) {
    console.error(`이미지 번역 작업 전송 오류 (${imageId}):`, error);
    throw error;
  }
};

/**
 * 이미지 타입별 처리 - 통합된 함수
 * @param {Object} taskData - 작업 데이터
 * @returns {Promise<void>}
 */
const processImagesByType = async (taskData) => {
  const { userId, productId, type } = taskData;
  const imageType = type.split('_')[0]; // main_image -> main, detail_image -> detail, option_image -> option
  
  console.log(`[${userId}-${productId}] ${imageType} 이미지 번역 작업 전송 시작`);
  
  // 이미지 타입에 따라 이미지 목록 조회
  let images = [];
  let isLongImage = false; // 상세 이미지만 긴 이미지 처리
  
  switch (imageType) {
    case 'main':
      images = await getMainImages(productId);
      break;
    case 'detail':
      images = await getDetailImages(productId);
      isLongImage = true; // 상세 이미지는 긴 이미지로 처리
      break;
    case 'option':
      images = await getOptionImages(productId);
      break;
    default:
      throw new Error(`지원하지 않는 이미지 타입: ${imageType}`);
  }
  
  if (images.length === 0) {
    console.warn(`${imageType} 이미지가 없습니다. (상품ID: ${productId})`);
    return;
  }
  
  // 각 이미지를 번역 파이프라인 큐에 전송
  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    let imgId;
    
    // 이미지 ID 생성 규칙 (userid 추가)
    if (imageType === 'option') {
      imgId = `${productId}-${image.prop_path}-option-${userId}`;
    } else if (imageType === 'detail') {
      imgId = `${productId}-${i+1}-detail-${userId}`;
    } else {
      imgId = `${productId}-${image.imageorder}-${imageType}-${userId}`;
    }
    
    // 이미지 번역 작업 전송
    await sendImageTranslateTask(image.imageurl, imgId, isLongImage);
    
    // 마지막 이미지가 아니면 요청 제한 적용
    if (i < images.length - 1) {
      await delay(REQUEST_RATE_LIMIT);
    }
  }
  
  console.log(`${imageType} 이미지 번역 작업 전송 완료 (상품ID: ${productId}, ${images.length}개)`);
};

/**
 * 이미지 번역 작업 처리 함수 (번역 파이프라인 큐로 전송)
 * @param {Object} taskData - 작업 데이터
 * @returns {Promise<void>}
 */
const processImageTranslationTask = async (taskData) => {
  try {
    const { type, userId, productId } = taskData;
    
    // 지원하지 않는 타입 확인
    if (!['main_image', 'detail_image', 'option_image'].includes(type)) {
      console.error(`지원하지 않는 작업 유형: ${type}`);
      return;
    }
    
    // 해당 타입의 번역된 이미지가 이미 있는지 확인
    const imageCheck = await checkTranslatedImageExists(productId, type);
    
    if (imageCheck.exists) {
      console.log(`[${userId}-${productId}] ${type} 이미 번역되어 있습니다(${imageCheck.count}개). 작업을 건너뜁니다.`);
      
      // 이미지 작업 카운트 감소
      await decreaseImageTaskCount(userId, productId, imageCheck.count);
      return;
    }
    
    // 이미지가 번역되어 있지 않은 경우에만 번역 파이프라인 작업 전송
    await processImagesByType(taskData);
  } catch (error) {
    console.error('이미지 번역 작업 처리 중 오류:', error);
  }
};

/**
 * 그룹화된 결과 배치를 처리하는 함수
 * @param {string} groupKey - 그룹 키 (e.g., "userId-productId")
 * @param {Array<Object>} successResults - 성공 결과 배열
 * @param {Array<Object>} errorResults - 에러 결과 배열
 */
async function processResultGroup(groupKey, successResults, errorResults) {
  const [userId, productId] = groupKey.split('-').map(Number);
  const totalItems = successResults.length + errorResults.length;

  if (totalItems === 0) return;

  console.log(`[${groupKey}] 배치 처리 시작: 성공 ${successResults.length}개, 실패 ${errorResults.length}개`);

  try {
    // 1. 성공한 이미지 일괄 저장
    if (successResults.length > 0) {
      const imagesToSave = successResults.map(result => {
        const parts = result.image_id.split('-');
        const imageType = parts[parts.length - 2];
        const orderOrPropPath = parts.slice(1, parts.length - 2).join('-');
        return { productId, orderOrPropPath, imageUrl: result.image_url, imageType };
      });
      await saveTranslatedImagesBulk(imagesToSave);
    }

    // 2. 실패한 항목 에러 로그 저장
    for (const result of errorResults) {
      const errorLogMessage = `이미지 번역 실패 (${result.image_id}): ${result.error_message}`;
      await saveErrorLog(userId, productId, errorLogMessage);
    }

  } catch (error) {
    console.error(`[${groupKey}] 배치 처리 중 오류:`, error);
  } finally {
    // 3. 작업 카운트 일괄 감소
    await decreaseImageTaskCount(userId, productId, totalItems);
    console.log(`[${groupKey}] 작업 카운트 일괄 감소 완료: ${totalItems}개`);
  }
}

/**
 * 큐 처리 워커 - 통합된 결과 처리기
 * @param {string} queueName - 처리할 큐 이름
 * @param {string} workerName - 워커 이름 (로깅용)
 * @param {boolean} isSuccessQueue - 성공 큐인지 여부
 */
export const runResultHandler = async (queueName, workerName, isSuccessQueue) => {
  console.log(`${workerName} 시작...`);
  
  while (true) {
    try {
      const results = await getMultipleFromQueue(queueName, BATCH_SIZE);

      if (results.length > 0) {
        console.log(`[${workerName}] ${results.length}개의 메시지를 가져와 처리 시작...`);
        
        // userId와 productId 기준으로 결과 그룹화
        const groupedResults = new Map();
        for (const result of results) {
          if (!result || !result.image_id) {
            console.error('결과 데이터 또는 image_id가 없습니다:', result);
            continue;
          }
          const parts = result.image_id.split('-');
          if (parts.length < 4) {
            console.error('잘못된 image_id 형식 (그룹화 불가):', result.image_id);
            continue;
          }
          const userId = parts[parts.length - 1];
          const productId = parts[0];
          const key = `${userId}-${productId}`;

          if (!groupedResults.has(key)) {
            groupedResults.set(key, { successResults: [], errorResults: [] });
          }
          
          if (isSuccessQueue && result.image_url) {
            groupedResults.get(key).successResults.push(result);
          } else {
            groupedResults.get(key).errorResults.push(result);
          }
        }
        
        // 그룹화된 결과를 순차적으로 처리
        for (const [groupKey, batch] of groupedResults.entries()) {
          await processResultGroup(groupKey, batch.successResults, batch.errorResults);
        }

      } else {
        await delay(2000); 
      }
    } catch (error) {
      console.error(`${workerName} 실행 중 오류:`, error);
      await delay(5000);
    }
  }
};

/**
 * 작업 전송 워커 - IMAGE_TRANSLATION_QUEUE에서 작업을 받아 OCR 큐로 전송
 */
export const runTaskSender = async () => {
  console.log('이미지 번역 작업 전송 워커 시작...');
  
  while (true) {
    try {
      const taskData = await getFromQueue(IMAGE_TRANSLATION_QUEUE, 0);
      
      if (taskData) {
        console.log('새 이미지 번역 작업 수신:', JSON.stringify(taskData));
        await processImageTranslationTask(taskData);
      }
    } catch (error) {
      console.error('작업 전송 워커 실행 중 오류:', error);
      await delay(5000);
    }
  }
};
