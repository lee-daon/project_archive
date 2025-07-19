import { promisePool } from '../../../common/utils/connectDB.js';
import { updatePreprocessingCompletedStatus } from '../../../common/utils/assistDb/GlobalStatus.js';

/**
 * 상품의 가공 상태 정보를 조회하는 함수
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @returns {Promise<Object|null>} 가공 상태 정보 객체
 */
export async function getProcessingStatus(userid, productid) {
  try {
    const [rows] = await promisePool.execute(
      `SELECT * FROM processing_status 
       WHERE userid = ? AND productid = ?`,
      [userid, productid]
    );
    
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error(`상품 ID ${productid} 가공 상태 조회 중 오류:`, error);
    throw error;
  }
}

/**
 * 상품명 최적화 상태를 업데이트하는 함수
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @param {boolean} isOptimized - 최적화 완료 여부
 * @returns {Promise<boolean>} 업데이트 성공 여부
 */
export async function updateNameOptimized(userid, productid, isOptimized) {
  try {
    const [result] = await promisePool.execute(
      `UPDATE processing_status 
       SET name_optimized = ?
       WHERE userid = ? AND productid = ?`,
      [isOptimized, userid, productid]
    );
    
    return result.affectedRows > 0;
  } catch (error) {
    console.error(`상품 ID ${productid} 상품명 최적화 상태 업데이트 중 오류:`, error);
    throw error;
  }
}

/**
 * 상품의 속성 번역 상태를 업데이트하는 함수
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @param {boolean} isTranslated - 번역 완료 여부
 * @returns {Promise<boolean>} 업데이트 성공 여부
 */
export async function updateAttributeTranslated(userid, productid, isTranslated) {
  try {
    const [result] = await promisePool.execute(
      `UPDATE processing_status 
       SET attribute_translated = ?
       WHERE userid = ? AND productid = ?`,
      [isTranslated, userid, productid]
    );
    
    return result.affectedRows > 0;
  } catch (error) {
    console.error(`상품 ID ${productid} 속성 번역 상태 업데이트 중 오류:`, error);
    throw error;
  }
}

/**
 * 상품의 옵션 번역 상태를 업데이트하는 함수
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @param {boolean} isTranslated - 번역 완료 여부
 * @returns {Promise<boolean>} 업데이트 성공 여부
 */
export async function updateOptionTranslated(userid, productid, isTranslated) {
  try {
    const [result] = await promisePool.execute(
      `UPDATE processing_status 
       SET option_optimized = ?
       WHERE userid = ? AND productid = ?`,
      [isTranslated, userid, productid]
    );
    
    return result.affectedRows > 0;
  } catch (error) {
    console.error(`상품 ID ${productid} 옵션 번역 상태 업데이트 중 오류:`, error);
    throw error;
  }
}

/**
 * 작업 개수 감소 및 상태 업데이트 함수 (원자적 업데이트)
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @returns {Promise<boolean>} 업데이트 성공 여부
 */
export async function decreaseTaskCount(userid, productid) {
  const connection = await promisePool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // 원자적 업데이트: overall_tasks_count를 1 감소시키고 현재 상태 조회
    const [updateResult] = await connection.execute(
      `UPDATE processing_status 
       SET overall_tasks_count = GREATEST(0, overall_tasks_count - 1)
       WHERE userid = ? AND productid = ? AND overall_tasks_count > 0`,
      [userid, productid]
    );
    
    // 업데이트가 실행되지 않았으면 (이미 0이거나 레코드가 없음)
    if (updateResult.affectedRows === 0) {
      await connection.rollback();
      console.warn(`상품 ID ${productid}: overall_tasks_count 감소 실패 (이미 0이거나 레코드 없음)`);
      return false;
    }
    
    // 업데이트 후 현재 상태 조회
    const [rows] = await connection.execute(
      `SELECT overall_tasks_count, img_tasks_count, option_tasks_count, status
       FROM processing_status 
       WHERE userid = ? AND productid = ?`,
      [userid, productid]
    );
    
    if (rows.length === 0) {
      await connection.rollback();
      return false;
    }
    
    const status = rows[0];
    
    // 상태 업데이트 확인
    let newStatus = status.status;
    let isCompleted = false;
    
    // 모든 작업이 완료되었는지 확인
    if (status.overall_tasks_count === 0 && status.img_tasks_count === 0 && status.option_tasks_count === 0) {
      newStatus = 'success';
      isCompleted = true;
      
      // 상태만 업데이트
      await connection.execute(
        `UPDATE processing_status 
         SET status = ?
         WHERE userid = ? AND productid = ?`,
        [newStatus, userid, productid]
      );
    }
    
    await connection.commit();
    
    // 모든 작업이 완료되었으면 preprocessing_completed 상태 업데이트
    if (isCompleted) {
      await updatePreprocessingCompletedStatus(userid, productid);
      console.log(`상품 ID ${productid}: 모든 작업 완료 - 상태를 success로 업데이트`);
    }
    
    console.log(`상품 ID ${productid}: overall_tasks_count 감소 완료 (현재: ${status.overall_tasks_count})`);
    return true;
  } catch (error) {
    await connection.rollback();
    console.error(`상품 ID ${productid} 작업 개수 감소 중 오류:`, error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * 옵션 작업 개수 감소 및 상태 업데이트 함수 (원자적 업데이트)
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @returns {Promise<boolean>} 업데이트 성공 여부
 */
export async function decreaseOptionTaskCount(userid, productid) {
  const connection = await promisePool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // 원자적 업데이트: option_tasks_count를 1 감소시키고 현재 상태 조회
    const [updateResult] = await connection.execute(
      `UPDATE processing_status 
       SET option_tasks_count = GREATEST(0, option_tasks_count - 1)
       WHERE userid = ? AND productid = ? AND option_tasks_count > 0`,
      [userid, productid]
    );
    
    // 업데이트가 실행되지 않았으면 (이미 0이거나 레코드가 없음)
    if (updateResult.affectedRows === 0) {
      await connection.rollback();
      console.warn(`상품 ID ${productid}: option_tasks_count 감소 실패 (이미 0이거나 레코드 없음)`);
      return false;
    }
    
    // 업데이트 후 현재 상태 조회
    const [rows] = await connection.execute(
      `SELECT overall_tasks_count, img_tasks_count, option_tasks_count, status
       FROM processing_status 
       WHERE userid = ? AND productid = ?`,
      [userid, productid]
    );
    
    if (rows.length === 0) {
      await connection.rollback();
      return false;
    }
    
    const status = rows[0];
    
    // 상태 업데이트 확인
    let newStatus = status.status;
    let isCompleted = false;
    
    // 모든 작업이 완료되었는지 확인
    if (status.option_tasks_count === 0 && status.overall_tasks_count === 0 && status.img_tasks_count === 0) {
      newStatus = 'success';
      isCompleted = true;
      
      // 상태만 업데이트
      await connection.execute(
        `UPDATE processing_status 
         SET status = ?
         WHERE userid = ? AND productid = ?`,
        [newStatus, userid, productid]
      );
    }
    
    await connection.commit();
    
    // 모든 작업이 완료되었으면 preprocessing_completed 상태 업데이트
    if (isCompleted) {
      await updatePreprocessingCompletedStatus(userid, productid);
      console.log(`상품 ID ${productid}: 모든 작업 완료 - 상태를 success로 업데이트`);
    }
    
    console.log(`상품 ID ${productid}: option_tasks_count 감소 완료 (현재: ${status.option_tasks_count})`);
    return true;
  } catch (error) {
    await connection.rollback();
    console.error(`상품 ID ${productid} 옵션 작업 개수 감소 중 오류:`, error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * 오류 상태로 업데이트하는 함수
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @param {string} errorMessage - 오류 메시지
 * @returns {Promise<boolean>} 업데이트 성공 여부
 */
export async function updateErrorStatus(userid, productid, errorMessage) {
  try {
    // error_log 테이블에 오류 저장
    await promisePool.execute(
      `INSERT INTO error_log (userid, productid, error_message)
       VALUES (?, ?, ?)`,
      [userid, productid, errorMessage]
    );
    
    return true;
  } catch (error) {
    console.error(`상품 ID ${productid} 오류 상태 업데이트 중 오류:`, error);
    return false;
  }
}

/**
 * 상품의 키워드 생성 상태를 업데이트하는 함수
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @param {boolean} isGenerated - 생성 완료 여부
 * @returns {Promise<boolean>} 업데이트 성공 여부
 */
export async function updateKeywordGenerated(userid, productid, isGenerated) {
  try {
    const [result] = await promisePool.execute(
      `UPDATE processing_status 
       SET keyword_generated = ?
       WHERE userid = ? AND productid = ?`,
      [isGenerated, userid, productid]
    );
    
    return result.affectedRows > 0;
  } catch (error) {
    console.error(`상품 ID ${productid} 키워드 생성 상태 업데이트 중 오류:`, error);
    throw error;
  }
}
