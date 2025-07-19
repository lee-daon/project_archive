import { getMultipleQueueLengths } from '../../../common/utils/redisClient.js';
import { QUEUE_NAMES, API_SETTINGS } from '../../../common/config/settings.js';

/**
 * 번역 큐의 현재 대기 상황을 확인하고 예상 대기시간을 계산합니다.
 * @returns {Promise<Object>} 대기 상황 정보 객체
 */
export async function checkTranslationQueueStatus() {
  try {
    // 이미지 번역 큐와 텍스트 번역 큐의 길이를 동시에 조회
    const queueLengths = await getMultipleQueueLengths([
      QUEUE_NAMES.IMAGE_TRANSLATION_QUEUE,
      QUEUE_NAMES.TEXT_TRANSLATION_QUEUE
    ]);

    const imageQueueLength = queueLengths[QUEUE_NAMES.IMAGE_TRANSLATION_QUEUE] || 0;
    const textQueueLength = queueLengths[QUEUE_NAMES.TEXT_TRANSLATION_QUEUE] || 0;

    // 이미지 번역 대기 정보 계산
    const imageWaitingTasks = imageQueueLength * 50;
    const imageEstimatedWaitTime = imageQueueLength * 1.5 * API_SETTINGS.IMAGE_REQUEST_RATE_LIMIT*30; // 밀리초

    // 텍스트 번역 대기 정보 계산  
    const textWaitingTasks = textQueueLength * 3;
    const textEstimatedWaitTime = textQueueLength * 1.2 * API_SETTINGS.TRANSLATOR_WORKER_DELAY_MS*10; // 밀리초

    // 더 긴 대기시간을 기준으로 선택
    const isImageLonger = imageEstimatedWaitTime >= textEstimatedWaitTime;
    
    const result = {
      imageQueue: {
        length: imageQueueLength,
        waitingTasks: imageWaitingTasks,
        estimatedWaitTimeMs: imageEstimatedWaitTime
      },
      textQueue: {
        length: textQueueLength,
        waitingTasks: textWaitingTasks,
        estimatedWaitTimeMs: textEstimatedWaitTime
      },
      selectedQueue: isImageLonger ? 'image' : 'text',
      maxWaitingTasks: isImageLonger ? imageWaitingTasks : textWaitingTasks,
      maxEstimatedWaitTimeMs: isImageLonger ? imageEstimatedWaitTime : textEstimatedWaitTime
    };

    console.log(`[큐 상태 확인] 이미지 큐: ${imageQueueLength}개, 텍스트 큐: ${textQueueLength}개`);
    console.log(`[큐 상태 확인] 선택된 큐: ${result.selectedQueue}, 예상 대기시간: ${Math.round(result.maxEstimatedWaitTimeMs / 1000)}초`);

    return result;
  } catch (error) {
    console.error('번역 큐 상태 확인 중 오류 발생:', error);
    // 오류 발생 시 기본값 반환
    return {
      imageQueue: { length: 0, waitingTasks: 0, estimatedWaitTimeMs: 0 },
      textQueue: { length: 0, waitingTasks: 0, estimatedWaitTimeMs: 0 },
      selectedQueue: 'text',
      maxWaitingTasks: 0,
      maxEstimatedWaitTimeMs: 0,
      error: error.message
    };
  }
}

/**
 * 대기시간을 사용자 친화적인 형태로 포맷팅합니다.
 * @param {number} waitTimeMs - 대기시간 (밀리초)
 * @returns {string} 포맷팅된 시간 문자열
 */
export function formatWaitTime(waitTimeMs) {
  if (waitTimeMs < 1000) {
    return '1초 미만';
  }
  
  const seconds = Math.round(waitTimeMs / 1000);
  
  if (seconds < 60) {
    return `약 ${seconds}초`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    return remainingSeconds > 0 ? `약 ${minutes}분 ${remainingSeconds}초` : `약 ${minutes}분`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return remainingMinutes > 0 ? `약 ${hours}시간 ${remainingMinutes}분` : `약 ${hours}시간`;
}
