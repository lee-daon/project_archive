import cron from 'node-cron';
import { promisePool } from '../../common/utils/connectDB.js';
import { saveErrorLog } from '../../common/utils/assistDb/error_log.js';

/**
 * Basic/Free 플랜 유저의 API 키와 deep ban 설정을 초기화하는 함수
 */
const resetPlanLimitations = async () => {
  const connection = await promisePool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // 1. basic 또는 free 플랜이면서 hashed_api_key가 있는 유저 조회
    const [usersWithApiKey] = await connection.query(
      `SELECT userid, name, plan, hashed_api_key 
       FROM user_info 
       WHERE plan IN ('basic', 'free') 
         AND hashed_api_key IS NOT NULL`
    );
    
    // 2. basic 또는 free 플랜이면서 use_deep_ban이 true인 유저 조회
    const [usersWithDeepBan] = await connection.query(
      `SELECT u.userid, u.name, u.plan, e.use_deep_ban
       FROM user_info u
       JOIN extra_setting e ON u.userid = e.userid
       WHERE u.plan IN ('basic', 'free') 
         AND e.use_deep_ban = TRUE`
    );
    
    // 3. API 키 삭제 작업
    let apiKeySuccessCount = 0;
    if (usersWithApiKey.length > 0) {
      for (const user of usersWithApiKey) {
        try {
          const [apiKeyResult] = await connection.query(
            `UPDATE user_info 
             SET hashed_api_key = NULL, api_key_issued_at = NULL, updated_at = NOW()
             WHERE userid = ? AND plan IN ('basic', 'free')`,
            [user.userid]
          );
          
          if (apiKeyResult.affectedRows > 0) {
            apiKeySuccessCount++;
            
            const errorMessage = JSON.stringify({
              reason: 'API 키 자동 삭제',
              plan: user.plan,
              reset_time: new Date().toISOString()
            });
            
            await saveErrorLog(user.userid, 0, errorMessage);
          }
          
        } catch (userError) {
          console.error(`API 키 삭제 오류 (사용자 ${user.userid}):`, userError.message);
          await saveErrorLog(user.userid, 0, `API 키 삭제 실패: ${userError.message}`);
        }
      }
    }
    
    // 4. Deep Ban 설정 해제 작업
    let deepBanSuccessCount = 0;
    if (usersWithDeepBan.length > 0) {
      for (const user of usersWithDeepBan) {
        try {
          const [deepBanResult] = await connection.query(
            `UPDATE extra_setting 
             SET use_deep_ban = FALSE, updated_at = NOW()
             WHERE userid = ?`,
            [user.userid]
          );
          
          if (deepBanResult.affectedRows > 0) {
            deepBanSuccessCount++;
            
            const errorMessage = JSON.stringify({
              reason: 'Deep Ban 자동 해제',
              plan: user.plan,
              reset_time: new Date().toISOString()
            });
            
            await saveErrorLog(user.userid, 0, errorMessage);
          }
          
        } catch (userError) {
          console.error(`Deep Ban 해제 오류 (사용자 ${user.userid}):`, userError.message);
          await saveErrorLog(user.userid, 0, `Deep Ban 해제 실패: ${userError.message}`);
        }
      }
    }
    
    await connection.commit();
    
    // 최종 결과 (처리된 건수가 있을 때만 로그 출력)
    if (apiKeySuccessCount > 0 || deepBanSuccessCount > 0) {
      console.log(`플랜 제한사항 초기화 완료: API 키 ${apiKeySuccessCount}건, Deep Ban ${deepBanSuccessCount}건`);
    }
    
  } catch (error) {
    await connection.rollback();
    console.error('플랜 제한사항 초기화 오류:', error.message);
    await saveErrorLog(0, 0, `플랜 제한사항 초기화 작업 실패: ${error.message}`);
  } finally {
    connection.release();
  }
};

/**
 * 12시간마다 실행되는 cron 작업
 * 매일 0시 10분, 12시 10분에 실행
 */
const startPlanReset = () => {
  // 12시간마다 실행 (0시 10분, 12시 10분)
  cron.schedule('10 0,12 * * *', async () => {
    await resetPlanLimitations();
  }, {
    scheduled: true,
    timezone: "Asia/Seoul"
  });
  
  // 서버 시작 시 즉시 한 번 실행
  resetPlanLimitations();
};

/**
 * 수동으로 플랜 초기화 작업을 실행하는 함수 (테스트용)
 */
const runManualPlanReset = async () => {
  console.log('🔧 수동 플랜 초기화 작업 실행');
  await resetPlanLimitations();
};

export { startPlanReset, runManualPlanReset };
