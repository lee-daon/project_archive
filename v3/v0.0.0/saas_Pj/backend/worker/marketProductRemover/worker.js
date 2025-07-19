import dotenv from 'dotenv';
import pLimit from 'p-limit';
import { getFromQueue, addToQueue } from '../../common/utils/redisClient.js';
import { QUEUE_NAMES, API_SETTINGS } from '../../common/config/settings.js';
import { createMaybeCleanup } from '../../common/utils/rateLimitCleaner.js';
import { removeProductFromMarket } from './operator.js';

dotenv.config();

// --- 설정 ---
const QUEUE_NAME = QUEUE_NAMES.MARKET_PRODUCT_REMOVAL_QUEUE;
const CONCURRENCY_LIMIT = API_SETTINGS.CONCURRENCY_LIMITS.MARKET_PRODUCT_REMOVER_WORKER;
const USER_RATE_LIMIT_MS = 1000; // 사용자별 처리 간격 (1초)
const WORKER_DELAY_MS = 200; // 큐가 비었을 때 대기 시간

// --- 상태 관리 ---
const userLastProcessTime = new Map();
const processingUsers = new Set();
const limit = pLimit(CONCURRENCY_LIMIT);

// --- 유틸리티 ---
const maybeCleanupOldRateLimitEntries = createMaybeCleanup({
  map: userLastProcessTime,
  expireMs: 60 * 60 * 1000,
  intervalMs: 5 * 60 * 1000,
});

/**
 * 사용자별 Rate Limit 확인
 * @param {number} userid - 사용자 ID
 * @returns {boolean} 처리 가능 여부
 */
function checkUserRateLimit(userid) {
  const now = Date.now();
  const lastTime = userLastProcessTime.get(userid) || 0;
  if (now - lastTime < USER_RATE_LIMIT_MS) {
    console.log(`[${QUEUE_NAME}] 사용자 ${userid} Rate Limit: ${USER_RATE_LIMIT_MS - (now - lastTime)}ms 남음`);
    return false;
  }
  userLastProcessTime.set(userid, now);
  return true;
}

/**
 * 작업 처리 함수
 * @param {object} task - 큐에서 가져온 작업
 */
async function processTask(task) {
  try {
    console.log(`[${QUEUE_NAME}] 작업 시작:`, { userid: task.userid, productid: task.productid, platform: task.platform });
    const result = await removeProductFromMarket(task); // task 객체 전체를 전달
    if (result.success) {
      console.log(`[${QUEUE_NAME}] 작업 성공:`, { userid: task.userid, productid: task.productid, platform: task.platform, message: result.message });
    } else {
      console.error(`[${QUEUE_NAME}] 작업 실패:`, { userid: task.userid, productid: task.productid, platform: task.platform, error: result.error });
    }
  } catch (error) {
    console.error(`[${QUEUE_NAME}] 처리 중 심각한 오류 발생:`, { task, error: error.message });
  }
}

/**
 * 메인 워커 루프
 */
async function startWorker() {
  console.log(`[${QUEUE_NAME}] 워커 시작. 동시성: ${CONCURRENCY_LIMIT}, 사용자별 간격: ${USER_RATE_LIMIT_MS}ms`);
  
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  process.on('SIGTERM', () => process.exit(0));
  process.on('SIGINT', () => process.exit(0));

  while (true) {
    maybeCleanupOldRateLimitEntries();

    try {
      const task = await getFromQueue(QUEUE_NAME, 0);
      if (!task || !task.userid) {
        await sleep(WORKER_DELAY_MS);
        continue;
      }
      
      const { userid } = task;

      if (processingUsers.has(userid)) {
        await addToQueue(QUEUE_NAME, task);
      } else if (!checkUserRateLimit(userid)) {
        await addToQueue(QUEUE_NAME, task);
      } else {
        processingUsers.add(userid);
        limit(() => processTask(task)).finally(() => {
          processingUsers.delete(userid);
        });
      }
    } catch (error) {
      console.error(`[${QUEUE_NAME}] 워커 루프 오류:`, error);
      await sleep(WORKER_DELAY_MS);
    }
    await sleep(WORKER_DELAY_MS);
  }
}

startWorker().catch(error => {
  console.error(`[${QUEUE_NAME}] 워커 실행 중 치명적 오류 발생:`, error);
  process.exit(1);
}); 