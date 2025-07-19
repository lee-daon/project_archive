import dotenv from 'dotenv';
import { getFromQueue, addToQueue } from '../../common/utils/redisclient.js';
import { QUEUE_NAMES, API_SETTINGS } from '../../common/config/settings.js';
import { mainOperator } from './mainOperator.js';
import { saveNaverRegisterResult } from './db/saveStatus.js';
import pLimit from 'p-limit';
import { createMaybeCleanup } from '../../common/utils/rateLimitCleaner.js';

dotenv.config();

// 사용자별 마지막 처리 시간 추적 (Rate Limiting용)
const userLastProcessTime = new Map();
// 현재 처리 중인 유저 추적 (순차처리용)
const processingUsers = new Set();

// 설정값
const USER_RATE_LIMIT_MS = API_SETTINGS.NAVER_USER_RATE_LIMIT_MS;
const WORKER_DELAY_MS = API_SETTINGS.NAVER_WORKER_DELAY_MS;

// Rate-limit GC 설정
const RATE_LIMIT_ENTRY_EXPIRE_MS = 60 * 60 * 1000; // 1 hour
const GC_CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

const maybeCleanupOldRateLimitEntries = createMaybeCleanup({
  map: userLastProcessTime,
  expireMs: RATE_LIMIT_ENTRY_EXPIRE_MS,
  intervalMs: GC_CHECK_INTERVAL_MS
});

// p-limit 설정 - 동시 실행 작업 수 제한
const limit = pLimit(API_SETTINGS.CONCURRENCY_LIMITS.NAVER_WORKER);

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
    console.log(`사용자 ${userid} rate limiting: ${intervalMs - timeSinceLastProcess}ms 남음`);
    return false;
  }
  
  userLastProcessTime.set(userid, now);
  return true;
}

/**
 * 네이버 등록 작업 처리 함수
 * @param {Object} task - 큐에서 가져온 작업 데이터
 * @returns {Promise<Object>} 작업 처리 결과
 */
async function processNaverRegister(task) {
  let result = null;
  
  try {
    // 작업 데이터에서 userid와 productid 추출
    const { userid, productid } = task;
    
    
    // mainOperator 실행
    result = await mainOperator(userid, productid);
    
    
    // 결과를 데이터베이스에 저장
    await saveNaverRegisterResult(result);
    
    
    return {
      success: result.success,
      userid,
      productid,
      message: result.success ? '네이버 등록 완료' : `네이버 등록 실패: ${result.message}`,
      originProductNo: result.success ? result.naverRegisterResponse?.originProductNo : null,
      smartstoreChannelProductNo: result.success ? result.naverRegisterResponse?.smartstoreChannelProductNo : null
    };
    
  } catch (error) {
    console.error(`네이버 등록 작업 실패: ${error.message}`);
    
    // 오류 발생 시에도 실패 상태를 데이터베이스에 저장
    if (task.userid && task.productid) {
      try {
        const failureResult = {
          success: false,
          userid: task.userid,
          productid: task.productid,
          message: error.message
        };
        
        await saveNaverRegisterResult(failureResult);
      } catch (saveError) {
        console.error(`실패 상태 저장 중 오류: ${saveError.message}`);
      }
    }
    
    return {
      success: false,
      userid: task.userid,
      productid: task.productid,
      error: error.message,
      message: `네이버 등록 작업 실패: ${error.message}`
    };
  }
}

/**
 * 메인 워커 루프
 */
async function startWorker() {
  console.log('네이버 등록 워커가 시작되었습니다.');
  console.log(`유저별 rate limit: ${USER_RATE_LIMIT_MS}ms, 워커 처리간격: ${WORKER_DELAY_MS}ms`);
  console.log('네이버 API 특성상 유저별 순차처리를 진행합니다.');

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

      const task = await getFromQueue(QUEUE_NAMES.NAVER_REGISTER, 0);
      if (!task) {
        await sleep(WORKER_DELAY_MS);
        continue;
      }

      const { userid } = task;

      // 해당 유저가 이미 처리 중인지 확인
      if (processingUsers.has(userid)) {
        console.log(`사용자 ${userid} 처리 중 - 큐 뒤로 이동`);
        await addToQueue(QUEUE_NAMES.NAVER_REGISTER, task);
      } 
      // 사용자별 rate limiting 체크
      else if (!checkUserRateLimit(userid)) {
        console.log(`사용자 ${userid} rate limit 대상 - 큐 뒤로 이동`);
        await addToQueue(QUEUE_NAMES.NAVER_REGISTER, task);
      } 
      // 모든 조건 통과 시 작업 처리
      else {
        processingUsers.add(userid);
        processedCount++;

        limit(() => processNaverRegister(task))
          .then((result) => {
            if (result.success) {
            } else {
            }
          })
          .catch((error) => {
            console.error(`작업 처리 중 오류: 사용자 ${task.userid}, 상품 ${task.productid}`, error);
          })
          .finally(() => {
            // 성공/실패 여부와 관계없이 처리 중 상태 해제
            processingUsers.delete(userid);
          });
        
        if (processedCount % 100 === 0) {
          console.log(`===== 처리 통계 =====`);
          console.log(`총 처리된 작업: ${processedCount}`);
          console.log(`현재 처리 중인 유저 수: ${processingUsers.size}`);
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
  console.error('네이버 등록 워커 실행 중 치명적 오류:', error);
  process.exit(1);
});
