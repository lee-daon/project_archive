import { getFromQueue } from '../../common/utils/redisClient.js';
import { translateAndSaveAttribute } from './service/translateNsaveAttribute.js';
import { translateAndSaveOption } from './service/translateNsaveOption.js';
import { generateAndSaveKeywords } from './service/translateNsaveKeyword.js';
import { generateAndSaveProductName } from './service/translateNsaveProductname.js';
import logger from '../../common/utils/logger.js';
import { QUEUE_NAMES, API_SETTINGS } from '../../common/config/settings.js';
import pLimit from 'p-limit';

// 큐 이름 및 설정
const TEXT_TRANSLATION_QUEUE = QUEUE_NAMES.TEXT_TRANSLATION_QUEUE;
const QUEUE_TIMEOUT = 0; // 무한 대기
const PROCESS_INTERVAL_MS = API_SETTINGS.TRANSLATOR_WORKER_DELAY_MS; // 1초마다 작업 처리

// p-limit 설정 - 동시 실행 작업 수 제한
const limit = pLimit(API_SETTINGS.CONCURRENCY_LIMITS.TRANSLATOR_WORKER);

/**
 * 작업 타입에 따라 적절한 처리 함수를 호출하는 함수
 * @param {Object} job - 작업 데이터
 * @returns {Promise<boolean>} - 처리 성공 여부
 */
async function processJob(job) {
  const { type, userId, productId } = job;
  
  logger.debug(`작업 처리 시작 [타입: ${type}, 사용자: ${userId}, 상품: ${productId}]`);
  
  try {
    let result = false;
    
    // 작업 타입에 따라 처리 함수 호출
    switch (type) {
      case 'attribute':
        result = await translateAndSaveAttribute(userId, productId);
        break;
        
      case 'option':
        const { propPath } = job;
        result = await translateAndSaveOption(userId, productId, propPath);
        break;
        
      case 'keyword':
        const { keywordType, include } = job;
        result = await generateAndSaveKeywords(userId, productId, keywordType, include);
        break;
        
      case 'seo':
        const { include: seoInclude, includeBrand } = job;
        result = await generateAndSaveProductName(userId, productId, seoInclude, includeBrand);
        break;
        
      default:
        throw new Error(`알 수 없는 작업 타입: ${type}`);
    }
    
    return result;
  } catch (error) {
    logger.error(error, { userid: userId, productid: productId });
    return false;
  }
}

/**
 * 워커 실행 함수
 */
async function runWorker() {
  logger.info(`번역 워커 시작`);
  logger.debug(`큐 모니터링 중: ${TEXT_TRANSLATION_QUEUE}`);
  logger.debug(`처리 간격: ${PROCESS_INTERVAL_MS}ms`);

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  let processedCount = 0;

  process.on('SIGTERM', () => {
    logger.info('SIGTERM 신호 수신, 워커 종료 중...');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT 신호 수신, 워커 종료 중...');
    process.exit(0);
  });

  while (true) {
    try {
      // 큐에서 작업이 올 때까지 무한 대기
      const job = await getFromQueue(TEXT_TRANSLATION_QUEUE, QUEUE_TIMEOUT);

      if (job) {
        processedCount++;
        logger.debug(`작업 가져옴: 사용자 ${job.userId}, 상품 ${job.productId}, 타입: ${job.type}`);

        // 작업 처리는 비동기로 시작하고 다음으로 넘어감
        limit(() => processJob(job))
          .then((result) => {
            if (result) {
              logger.debug(`처리 성공: 상품 ${job.productId}, 타입: ${job.type}`);
            } else {
              logger.debug(`처리 실패: 상품 ${job.productId}, 타입: ${job.type}`);
            }
          })
          .catch((error) => {
            logger.error(error, { userid: job.userId, productid: job.productId });
          });
        
        if (processedCount % 300 === 0) {
          logger.info(`translator 총 처리된 작업: ${processedCount}`);
        }
      }
    } catch (error) {
      logger.error(error);
    }
    // 다음 작업을 가져오기 전, 설정된 간격만큼 대기
    await sleep(PROCESS_INTERVAL_MS);
  }
}

// 워커 시작
runWorker().catch(error => {
  logger.error(error);
  process.exit(1);
});
