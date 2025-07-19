import cron from 'node-cron';
import { promisePool } from '../../common/utils/connectDB.js';
import { saveErrorLog } from '../../common/utils/assistDb/error_log.js';

/**
 * 24시간 초과된 pending 상태의 sourcing_status 레코드를 정리하는 함수
 */
const cleanupOldPendingSourcing = async () => {
  const connection = await promisePool.getConnection();
  
  try {
    console.log('🧹 24시간 초과된 pending 상태 sourcing_status 정리 작업 시작...');
    
    await connection.beginTransaction();
    
    // 1. 24시간 초과된 pending 상태 레코드 조회 (배치 처리를 위해 LIMIT 추가)
    const [expiredRecords] = await connection.query(
      `SELECT userid, productid, status, commitcode, created_at, updated_at
       FROM sourcing_status 
       WHERE status = 'pending' 
         AND updated_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)
       ORDER BY updated_at ASC
       LIMIT 1000`
    );
    
    if (expiredRecords.length === 0) {
      console.log('⏰ 24시간 초과된 pending 상태 레코드가 없습니다.');
      await connection.commit();
      return;
    }
    
    console.log(`📋 ${expiredRecords.length}개의 24시간 초과 레코드 발견`);
    
    // 2. 각 레코드에 대해 처리
    for (const record of expiredRecords) {
      try {
        // 2-1. sourcing_status에서 레코드 삭제 (실패 처리)
        await connection.query(
          `DELETE FROM sourcing_status 
           WHERE userid = ? AND productid = ?`,
          [record.userid, record.productid]
        );
        
        // 2-2. error_log에 24시간 초과 정보 저장
        const errorMessage = JSON.stringify({
          reason: '소싱 24시간 초과 - 실패 처리',
          original_status: record.status,
          commitcode: record.commitcode,
          original_created_at: record.created_at,
          original_updated_at: record.updated_at,
          deleted_at: new Date().toISOString()
        });
        
        await saveErrorLog(record.userid, record.productid, errorMessage);
        
        console.log(`✅ 사용자 ${record.userid}, 상품 ${record.productid} 소싱 실패 처리 완료`);
        
      } catch (recordError) {
        console.error(`❌ 사용자 ${record.userid}, 상품 ${record.productid} 처리 중 오류:`, recordError);
        
        // 개별 레코드 처리 실패 시에도 error_log에 기록
        await saveErrorLog(
          record.userid, 
          record.productid, 
          `소싱 24시간 초과 정리 작업 중 오류: ${recordError.message}`
        );
      }
    }
    
    await connection.commit();
    console.log(`🎉 총 ${expiredRecords.length}개 소싱 레코드 정리 작업 완료`);
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ 소싱 24시간 초과 정리 작업 중 전체 오류:', error);
  } finally {
    connection.release();
  }
};

/**
 * 1시간마다 실행되는 cron 작업
 * 매시 30분에 실행 (30 * * * *)
 */
const startSourcingStatusCleaner = () => {
  console.log('🚀 Sourcing Status Cleaner 시작됨 - 매시간 30분에 실행');
  
  // 1시간마다 실행 (매시 30분)
  cron.schedule('30 * * * *', async () => {
    console.log(`⏰ [${new Date().toISOString()}] Sourcing Status 정리 작업 실행`);
    await cleanupOldPendingSourcing();
  }, {
    scheduled: true,
    timezone: "Asia/Seoul"
  });
  
  // 서버 시작 시 즉시 한 번 실행
  console.log('🔄 서버 시작 시 초기 소싱 정리 작업 실행');
  cleanupOldPendingSourcing();
};

/**
 * 수동으로 정리 작업을 실행하는 함수 (테스트용)
 */
const runManualSourcingCleanup = async () => {
  console.log('🔧 수동 소싱 정리 작업 실행');
  await cleanupOldPendingSourcing();
};
 
export { startSourcingStatusCleaner, runManualSourcingCleanup };
