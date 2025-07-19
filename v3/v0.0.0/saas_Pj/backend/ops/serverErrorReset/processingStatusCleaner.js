import cron from 'node-cron';
import { promisePool } from '../../common/utils/connectDB.js';
import { updatePreprocessingCompletedStatus } from '../../common/utils/assistDb/GlobalStatus.js';
import { saveErrorLog } from '../../common/utils/assistDb/error_log.js';

/**
 * 24시간 초과된 pending 상태의 processing_status 레코드를 정리하는 함수
 */
const cleanupOldPendingProcesses = async () => {
  const connection = await promisePool.getConnection();
  
  try {
    console.log('🧹 24시간 초과된 pending 상태 processing_status 정리 작업 시작...');
    
    await connection.beginTransaction();
    
    // 1. 24시간 초과된 pending 상태 레코드 조회 (배치 처리를 위해 LIMIT 추가)
    const [expiredRecords] = await connection.query(
      `SELECT userid, productid, img_tasks_count, option_tasks_count, overall_tasks_count,
              brandfilter, banned, name_optimized, main_image_translated, 
              description_image_translated, option_image_translated, 
              attribute_translated, keyword_generated, nukki_created, 
              nukki_image_order, option_optimized, updated_at
       FROM processing_status 
       WHERE status = 'processing' 
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
        // 2-1. status를 success로 업데이트
        await connection.query(
          `UPDATE processing_status 
           SET status = 'success', updated_at = NOW() 
           WHERE userid = ? AND productid = ?`,
          [record.userid, record.productid]
        );
        
        // 2-2. GlobalStatus의 updatePreprocessingCompletedStatus 호출
        const updateResult = await updatePreprocessingCompletedStatus(record.userid, record.productid);
        
        // 2-3. error_log에 24시간 초과 정보 저장
        const errorMessage = JSON.stringify({
          reason: '24시간 초과',
          img_tasks_count: record.img_tasks_count,
          option_tasks_count: record.option_tasks_count,
          overall_tasks_count: record.overall_tasks_count,
          brandfilter: record.brandfilter,
          banned: record.banned,
          name_optimized: record.name_optimized,
          main_image_translated: record.main_image_translated,
          description_image_translated: record.description_image_translated,
          option_image_translated: record.option_image_translated,
          attribute_translated: record.attribute_translated,
          keyword_generated: record.keyword_generated,
          nukki_created: record.nukki_created,
          nukki_image_order: record.nukki_image_order,
          option_optimized: record.option_optimized,
          original_updated_at: record.updated_at,
          preprocessing_status_update: updateResult.success
        });
        
        await saveErrorLog(record.userid, record.productid, errorMessage);
        
        console.log(`✅ 사용자 ${record.userid}, 상품 ${record.productid} 처리 완료`);
        
      } catch (recordError) {
        console.error(`❌ 사용자 ${record.userid}, 상품 ${record.productid} 처리 중 오류:`, recordError);
        
        // 개별 레코드 처리 실패 시에도 error_log에 기록
        await saveErrorLog(
          record.userid, 
          record.productid, 
          `24시간 초과 정리 작업 중 오류: ${recordError.message}`
        );
      }
    }
    
    await connection.commit();
    console.log(`🎉 총 ${expiredRecords.length}개 레코드 정리 작업 완료`);
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ 24시간 초과 정리 작업 중 전체 오류:', error);
  } finally {
    connection.release();
  }
};

/**
 * 1시간마다 실행되는 cron 작업
 * 매시 정각에 실행 (0 * * * *)
 */
const startProcessingStatusCleaner = () => {
  console.log('🚀 Processing Status Cleaner 시작됨 - 매시간 정각에 실행');
  
  // 1시간마다 실행 (매시 정각)
  cron.schedule('0 * * * *', async () => {
    console.log(`⏰ [${new Date().toISOString()}] Processing Status 정리 작업 실행`);
    await cleanupOldPendingProcesses();
  }, {
    scheduled: true,
    timezone: "Asia/Seoul"
  });
  
  // 서버 시작 시 즉시 한 번 실행
  console.log('🔄 서버 시작 시 초기 정리 작업 실행');
  cleanupOldPendingProcesses();
};

/**
 * 수동으로 정리 작업을 실행하는 함수 (테스트용)
 */
const runManualCleanup = async () => {
  console.log('🔧 수동 정리 작업 실행');
  await cleanupOldPendingProcesses();
};

export { startProcessingStatusCleaner, runManualCleanup }; 