import cron from 'node-cron';
import { promisePool } from '../common/utils/connectDB.js';
import { saveErrorLog } from '../common/utils/assistDb/error_log.js';

/**
 * 일일 등록 가능 수량을 초기화하는 함수
 */
const resetDailyRegisterableLimit = async () => {
  const connection = await promisePool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // 쿠팡 일일 등록 가능 수량 초기화 (5000개)
    const [coopangResult] = await connection.query(
      `UPDATE coopang_account_info 
       SET daily_registerable_left_count = 5000,
           updated_at = NOW()`
    );
    
    // 11번가 일일 등록 가능 수량 초기화 (500개)
    const [elevenstoreResult] = await connection.query(
      `UPDATE elevenstore_account_info 
       SET daily_registerable_left_count = 500,
           updated_at = NOW()`
    );
    
    await connection.commit();
    
    console.log(`✅ 일일 등록 가능 수량 초기화 완료:`);
    console.log(`   - 쿠팡: ${coopangResult.affectedRows}개 계정 → 5000개로 초기화`);
    console.log(`   - 11번가: ${elevenstoreResult.affectedRows}개 계정 → 500개로 초기화`);
    
    // 성공 로그 저장
    const logMessage = JSON.stringify({
      reason: '일일 등록 가능 수량 초기화',
      coopang_accounts: coopangResult.affectedRows,
      coopang_limit: 5000,
      elevenstore_accounts: elevenstoreResult.affectedRows,
      elevenstore_limit: 500,
      reset_at: new Date().toISOString()
    });
    
    await saveErrorLog(0, 0, logMessage);
    
  } catch (error) {
    await connection.rollback();
    console.error('일일 등록 가능 수량 초기화 오류:', error.message);
    await saveErrorLog(0, 0, `일일 등록 가능 수량 초기화 실패: ${error.message}`);
  } finally {
    connection.release();
  }
};

/**
 * 매일 0시에 실행되는 cron 작업
 */
const startDailyRegisterableLimitReset = () => {
  // 매일 0시에 실행
  cron.schedule('0 0 * * *', async () => {
    console.log('🔄 일일 등록 가능 수량 초기화 작업 시작');
    await resetDailyRegisterableLimit();
  }, {
    scheduled: true,
    timezone: "Asia/Seoul"
  });
  
  // 서버 시작 시 즉시 한 번 실행
  resetDailyRegisterableLimit();
  
  console.log('🚀 일일 등록 가능 수량 초기화 스케줄러 시작');
};

/**
 * 수동으로 일일 등록 가능 수량 초기화 작업을 실행하는 함수 (테스트용)
 */
const runManualDailyLimitReset = async () => {
  console.log('🔧 수동 일일 등록 가능 수량 초기화 작업 실행');
  await resetDailyRegisterableLimit();
};

export { startDailyRegisterableLimitReset, runManualDailyLimitReset };
