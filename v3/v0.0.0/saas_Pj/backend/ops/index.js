import { startProcessingStatusCleaner } from './serverErrorReset/processingStatusCleaner.js';
import { startSourcingStatusCleaner } from './serverErrorReset/sourcingStatusCleaner.js';
import { startPlanReset } from './users/planServiceReset.js';
import { startDailyQuotaReset } from './users/dailyQuataReset.js';
import { startPlanExpireCheck } from './users/planExpire.js';
import { startDailyRegisterableLimitReset } from './dailyRegisterableLimitReset.js';

/**
 * Ops 모듈 초기화 및 모든 cron 작업 시작
 */
const initializeOps = () => {
  console.log('🔧 Ops 모듈 초기화 시작...');
  
  // Processing Status 정리 작업 시작
  startProcessingStatusCleaner();

  // Sourcing Status 정리 작업 시작
  startSourcingStatusCleaner();

  // Plan Reset 작업 시작
  startPlanReset();

  // Daily Quota Reset 작업 시작
  startDailyQuotaReset();

  // Plan Expire Check 작업 시작
  startPlanExpireCheck();

  // 등록 한계 수량 측정 작업 시작
  startDailyRegisterableLimitReset();
  
  console.log('✅ Ops 모듈 초기화 완료');
};

export { initializeOps }; 