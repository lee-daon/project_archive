import cron from 'node-cron';
import { promisePool } from '../../common/utils/connectDB.js';
import { saveErrorLog } from '../../common/utils/assistDb/error_log.js';

/**
 * 만료된 사용자들의 플랜을 free로 변경하는 함수
 */
const expirePlans = async () => {
  const connection = await promisePool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // 만료된 사용자들 조회 (expired_at이 현재 시간보다 작은 사용자들)
    const [expiredUsers] = await connection.query(
      `SELECT userid, name, plan, expired_at 
       FROM user_info 
       WHERE expired_at IS NOT NULL 
         AND expired_at < NOW() 
         AND plan != 'free'
         AND is_active = TRUE`
    );
    
    let successCount = 0;
    
    for (const user of expiredUsers) {
      try {
        // plan을 free로 변경하고 maximum_market_count를 1로 초기화
        const [result] = await connection.query(
          `UPDATE user_info 
           SET plan = 'free', maximum_market_count = 1 
           WHERE userid = ?`,
          [user.userid]
        );
        
        if (result.affectedRows > 0) {
          successCount++;
          
          // 성공 로그 저장
          const logMessage = JSON.stringify({
            reason: '플랜 만료로 인한 free 플랜 변경',
            original_plan: user.plan,
            new_plan: 'free',
            maximum_market_count: 1,
            expired_at: user.expired_at,
            changed_at: new Date().toISOString()
          });
          
          await saveErrorLog(user.userid, 0, logMessage);
          
          console.log(`✅ 플랜 만료 처리 완료: 사용자 ${user.name}(${user.userid}) ${user.plan} -> free, maximum_market_count -> 1`);
        }
        
      } catch (userError) {
        console.error(`플랜 만료 처리 오류 (사용자 ${user.userid}):`, userError.message);
        await saveErrorLog(user.userid, 0, `플랜 만료 처리 실패: ${userError.message}`);
      }
    }
    
    await connection.commit();
    
    // 최종 결과 로그 출력
    if (successCount > 0) {
      console.log(`✅ 플랜 만료 처리 완료: 총 ${successCount}명의 사용자 플랜이 free로 변경됨`);
    } else {
      console.log('📋 만료된 플랜이 없습니다.');
    }
    
  } catch (error) {
    await connection.rollback();
    console.error('플랜 만료 처리 오류:', error.message);
    await saveErrorLog(0, 0, `플랜 만료 처리 작업 실패: ${error.message}`);
  } finally {
    connection.release();
  }
};

/**
 * 매일 0시 5분에 실행되는 cron 작업
 */
const startPlanExpireCheck = () => {
  // 매일 0시 5분에 실행 (일일 할당량 리셋 후에 실행)
  cron.schedule('5 0 * * *', async () => {
    console.log('🔄 플랜 만료 체크 작업 시작');
    await expirePlans();
  }, {
    scheduled: true,
    timezone: "Asia/Seoul"
  });
  
  // 서버 시작 시 즉시 한 번 실행
  expirePlans();
  
  console.log('🚀 플랜 만료 체크 스케줄러 시작');
};

/**
 * 수동으로 플랜 만료 체크 작업을 실행하는 함수 (테스트용)
 */
const runManualPlanExpireCheck = async () => {
  console.log('🔧 수동 플랜 만료 체크 작업 실행');
  await expirePlans();
};

export { startPlanExpireCheck, runManualPlanExpireCheck };
