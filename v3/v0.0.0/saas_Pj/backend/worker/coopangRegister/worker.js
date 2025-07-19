import dotenv from 'dotenv';
import { getFromQueue, addToQueue } from '../../common/utils/redisClient.js';
import { QUEUE_NAMES, API_SETTINGS } from '../../common/config/settings.js';
import { mainOperator } from './operator.js';
import { saveSuccessStatus, saveFailStatus, saveOptionMapRequiredStatus } from './db/saveStatus.js';
import pLimit from 'p-limit';
import { createMaybeCleanup } from '../../common/utils/rateLimitCleaner.js';

dotenv.config();

// 사용자별 마지막 처리 시간 추적 (Rate Limiting용)
const userLastProcessTime = new Map();

// 설정값
const USER_RATE_LIMIT_MS = API_SETTINGS.COOPANG_USER_RATE_LIMIT_MS;
const WORKER_DELAY_MS = API_SETTINGS.COOPANG_WORKER_DELAY_MS;

// Rate-limit 기록 자동 정리용
const RATE_LIMIT_ENTRY_EXPIRE_MS = 60 * 60 * 1000; // 1 hour
const GC_CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

const maybeCleanupOldRateLimitEntries = createMaybeCleanup({
  map: userLastProcessTime,
  expireMs: RATE_LIMIT_ENTRY_EXPIRE_MS,
  intervalMs: GC_CHECK_INTERVAL_MS
});

// p-limit 설정 - 동시 실행 작업 수 제한
const limit = pLimit(API_SETTINGS.CONCURRENCY_LIMITS.COOPANG_WORKER);

/**
 * 사용자별 rate limiting 체크
 * @param {number} userid - 사용자 ID
 * @param {number} intervalMs - 최소 간격 (밀리초)
 * @returns {boolean} - 처리 가능하면 true, rate limit에 걸리면 false
 */
function checkUserRateLimit(userid, intervalMs = USER_RATE_LIMIT_MS) {
  const now = Date.now();
  const lastTime = userLastProcessTime.get(userid) || 0;
  const timeSinceLastProcess = now - lastTime;
  
  if (timeSinceLastProcess < intervalMs) {
    return false;
  }
  
  userLastProcessTime.set(userid, now);
  return true;
}

/**
 * 쿠팡 등록 작업 처리 함수
 * @param {Object} task - 큐에서 가져온 작업 데이터
 * @returns {Promise<Object>} 작업 처리 결과
 */
async function processCoopangRegister(task) {
  let result = null;
  
  try {
    // 작업 데이터에서 userid와 productid 추출
    const { userid, productid } = task;
    
    console.log(`쿠팡 등록 작업 시작: 사용자 ${userid}, 상품 ${productid}`);
    
    // mainOperator 실행
    console.log(`mainOperator 실행 중: 사용자 ${userid}, 상품 ${productid}`);
    result = await mainOperator(userid, productid);
    
    console.log(`mainOperator 실행 완료: 사용자 ${userid}, 상품 ${productid}, 성공: ${result.success}`);
    
    // 결과에 따른 상태 저장
    let statusUpdateResult;
    
    if (result.success && result.statusData) {
      // 등록 성공 시
      statusUpdateResult = await saveSuccessStatus(
        userid,
        productid,
        result.statusData.mappingData,
        result.statusData.discountRate,
        result.registeredProductNumber,
        result.statusData.marketNumber
      );
      console.log('쿠팡 등록 성공 - 데이터베이스 업데이트 완료');
    } else if (result.isOptionMapRequired && result.statusData) {
      // 옵션 매핑이 필요한 경우
      statusUpdateResult = await saveOptionMapRequiredStatus(
        userid,
        productid,
        result.statusData.mappingData,
        result.error || result.message
      );
      console.log('쿠팡 등록 실패 (옵션 매핑 필요) - 데이터베이스 업데이트 완료');
    } else {
      // 일반적인 등록 실패 시
      statusUpdateResult = await saveFailStatus(
        userid,
        productid,
        result.statusData?.mappingData || null,
        result.error || result.message
      );
      console.log('쿠팡 등록 실패 - 데이터베이스 업데이트 완료');
    }
    
    console.log(`쿠팡 등록 작업 완료: 사용자 ${userid}, 상품 ${productid}`);
    
    return {
      success: result.success,
      userid,
      productid,
      message: result.success ? '쿠팡 등록 완료' : `쿠팡 등록 실패: ${result.message}`,
      registeredProductNumber: result.registeredProductNumber || null,
      itemsCount: result.itemsCount || 0,
      statusUpdateSuccess: statusUpdateResult.success,
      isOptionMapRequired: result.isOptionMapRequired || false
    };
    
  } catch (error) {
    console.error(`쿠팡 등록 작업 실패: ${error.message}`);
    
    // 오류 발생 시에도 실패 상태를 데이터베이스에 저장
    if (task.userid && task.productid) {
      try {
        await saveFailStatus(
          task.userid,
          task.productid,
          null, // 매핑 데이터가 없을 수 있음
          error.message
        );
        console.log(`실패 상태 데이터베이스 저장 완료: 사용자 ${task.userid}, 상품 ${task.productid}`);
      } catch (saveError) {
        console.error(`실패 상태 저장 중 오류: ${saveError.message}`);
      }
    }
    
    return {
      success: false,
      userid: task.userid,
      productid: task.productid,
      error: error.message,
      message: `쿠팡 등록 작업 실패: ${error.message}`
    };
  }
}

/**
 * 메인 워커 루프
 */
async function startWorker() {
  console.log('쿠팡 등록 워커가 시작되었습니다.');
  console.log(`유저별 rate limit: ${USER_RATE_LIMIT_MS}ms, 워커 처리간격: ${WORKER_DELAY_MS}ms`);

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  let processedCount = 0;

  process.on('SIGTERM', () => {
    console.log('SIGTERM 신호 수신, 워커 종료 중...');
    process.exit(0);
  });
  process.on('SIGINT', () => {
    console.log('SIGINT 신호 수신, 워커 종료 중...');
    process.exit(0);
  });

  while (true) {
    try {
      // 오래된 레이트리밋 정보 정리
      maybeCleanupOldRateLimitEntries();

      // 큐에서 작업이 올 때까지 무한 대기
      const task = await getFromQueue(QUEUE_NAMES.COOPANG_REGISTER, 0);
      if (!task) {
        await sleep(WORKER_DELAY_MS);
        continue;
      }
      
      const { userid } = task;

      // 사용자별 Rate Limit 체크
      if (!checkUserRateLimit(userid)) {
        await addToQueue(QUEUE_NAMES.COOPANG_REGISTER, task);
      } else {
        processedCount++;

        // 작업은 비동기로 처리
        limit(() => processCoopangRegister(task))
          .then((result) => {
            if (result.success) {
            } else {
            }
          })
          .catch((error) => {
            console.error(`작업 처리 중 오류: 사용자 ${task.userid}, 상품 ${task.productid}`, error);
          });
        
        if (processedCount % 100 === 0) {
          console.log(`===== 처리 통계 =====`);
          console.log(`총 처리된 작업: ${processedCount}`);
          console.log(`=====================`);
        }
      }
    } catch (error) {
      console.error('워커 처리 중 오류:', error);
    }
    // 다음 작업을 시도하기 전, 워커 딜레이만큼 대기
    await sleep(WORKER_DELAY_MS);
  }
}

// 워커 시작
startWorker().catch(error => {
  console.error('쿠팡 등록 워커 실행 중 치명적 오류:', error);
  process.exit(1);
});
