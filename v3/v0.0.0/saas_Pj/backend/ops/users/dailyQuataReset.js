import cron from 'node-cron';
import { promisePool } from '../../common/utils/connectDB.js';
import { saveErrorLog } from '../../common/utils/assistDb/error_log.js';

/**
 * 플랜별 일일 할당량 설정
 */
const DAILY_QUOTA = {
  free: {
    sourcing: 0,
    image_processing: 0
  },
  basic: {
    sourcing: 100,
    image_processing: 50
  },
  enterprise: {
    sourcing: 5000,
    image_processing: 200
  }
};

/**
 * 모든 유저의 일일 할당량을 플랜에 따라 리셋하는 함수
 */
const resetDailyQuota = async () => {
  const connection = await promisePool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // 모든 활성 유저 조회
    const [activeUsers] = await connection.query(
      `SELECT userid, name, plan 
       FROM user_info 
       WHERE is_active = TRUE`
    );
    
    let successCount = 0;
    
    for (const user of activeUsers) {
      try {
        const quota = DAILY_QUOTA[user.plan];
        
        // user_statistics 테이블에서 일일 할당량 리셋
        const [result] = await connection.query(
          `UPDATE user_statistics 
           SET daily_sourcing_remaining = ?, 
               daily_image_processing_remaining = ?
           WHERE userid = ?`,
          [quota.sourcing, quota.image_processing, user.userid]
        );
        
        // 만약 user_statistics에 레코드가 없으면 생성
        if (result.affectedRows === 0) {
          await connection.query(
            `INSERT INTO user_statistics (userid, daily_sourcing_remaining, daily_image_processing_remaining)
             VALUES (?, ?, ?)`,
            [user.userid, quota.sourcing, quota.image_processing]
          );
        }
        
        successCount++;
        
        // 성공 로그 저장
        const logMessage = JSON.stringify({
          reason: '일일 할당량 리셋',
          plan: user.plan,
          sourcing_quota: quota.sourcing,
          image_processing_quota: quota.image_processing,
          reset_time: new Date().toISOString()
        });
        
        await saveErrorLog(user.userid, 0, logMessage);
        
      } catch (userError) {
        console.error(`일일 할당량 리셋 오류 (사용자 ${user.userid}):`, userError.message);
        await saveErrorLog(user.userid, 0, `일일 할당량 리셋 실패: ${userError.message}`);
      }
    }
    
    await connection.commit();
    
    // 최종 결과 로그 출력
    if (successCount > 0) {
      console.log(`✅ 일일 할당량 리셋 완료: 총 ${successCount}명`)
    }
  } catch (error) {
    await connection.rollback();
    console.error('일일 할당량 리셋 오류:', error.message);
    await saveErrorLog(0, 0, `일일 할당량 리셋 작업 실패: ${error.message}`);
  } finally {
    connection.release();
  }
};

/**
 * 매일 0시에 실행되는 cron 작업
 */
const startDailyQuotaReset = () => {
  // 매일 0시 정각에 실행
  cron.schedule('0 0 * * *', async () => {
    console.log('🔄 일일 할당량 리셋 작업 시작');
    await resetDailyQuota();
  }, {
    scheduled: true,
    timezone: "Asia/Seoul"
  });
  
  // 서버 시작 시 즉시 한 번 실행-하면 안된다,,
  console.log('🚀 일일 할당량 리셋 스케줄러 시작');
};

/**
 * 수동으로 일일 할당량 리셋 작업을 실행하는 함수 (테스트용)
 */
const runManualDailyQuotaReset = async () => {
  console.log('🔧 수동 일일 할당량 리셋 작업 실행');
  await resetDailyQuota();
};

export { startDailyQuotaReset, runManualDailyQuotaReset };
