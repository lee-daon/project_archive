import { promisePool } from '../connectDB.js';
import logger from '../logger.js';

/**
 * sourcing_status 테이블에서 commit 상태인 상품들을 가져와서 
 * status 테이블의 sourcing_completed를 true로 업데이트하는 함수
 * 
 * @param {number} userid - 사용자 ID
 * @returns {Promise<Object>} - 업데이트 결과 객체
 */
export const updateSourcingCompletedStatus = async (userid) => {
  const connection = await promisePool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // 1. sourcing_status 테이블에서 해당 사용자의 commit 상태인 상품 ID 목록 조회
    const [commitedProducts] = await connection.query(
      `SELECT productid FROM sourcing_status 
       WHERE userid = ? AND status = 'commit'`,
      [userid]
    );
    
    if (commitedProducts.length === 0) {
      await connection.commit();
      return {
        success: true,
        message: '업데이트할 상품이 없습니다.',
        updatedCount: 0,
        productIds: []
      };
    }
    
    // 상품 ID 배열 추출
    const productIds = commitedProducts.map(product => product.productid);
    
    // 2. status 테이블에서 해당 상품들의 sourcing_completed 필드를 true로 업데이트
    const [updateResult] = await connection.query(
      `UPDATE status 
       SET sourcing_completed = TRUE 
       WHERE userid = ? AND productid IN (?)`,
      [userid, productIds]
    );
    
    await connection.commit();
    
    return {
      success: true,
      message: `${updateResult.affectedRows}개 상품의 sourcing_completed 상태가 업데이트되었습니다.`,
      updatedCount: updateResult.affectedRows,
      productIds: productIds
    };
  } catch (error) {
    await connection.rollback();
    logger.error(error, { userid });
    
    return {
      success: false,
      message: `상태 업데이트 중 오류가 발생했습니다: ${error.message}`,
      error
    };
  } finally {
    connection.release();
  }
};

/**
 * status 테이블에 새 항목을 생성하는 함수
 * 테이블 스키마: userid, productid, sourcing_completed, preprocessing_completed,
 * shop_banned, seller_banned, discarded, naver_mapping_ready, coopang_mapping_ready, elevenstore_mapping_ready,
 * is_registrable, coopang_registered, naver_registered, elevenstore_registered,
 * naver_register_failed, coopang_register_failed, elevenstore_register_failed, testcode
 * 
 * @param {number} userid - 사용자 ID
 * @param {Array} products - 상품 정보 배열 [{productId, productName}]
 * @returns {Promise<Object>} - 생성 결과 객체
 */
export const createStatusEntries = async (userid, products) => {
  const connection = await promisePool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // 추가된 항목 수를 추적
    let insertedCount = 0;
    
    // 각 상품에 대해 status 테이블에 항목 생성
    for (const product of products) {
      // 먼저 status 테이블에 해당 항목이 이미 존재하는지 확인
      const [existingRows] = await connection.query(
        `SELECT * FROM status WHERE userid = ? AND productid = ?`,
        [userid, product.productId]
      );
      
      // 이미 존재하는 경우 조용히 넘어감
      if (existingRows.length > 0) {
        continue;
      }
      
      // 존재하지 않는 경우 새 항목 생성
      await connection.query(
        `INSERT INTO status (
          userid, productid, sourcing_completed, preprocessing_completed, 
          shop_banned, seller_banned, discarded, naver_mapping_ready, coopang_mapping_ready, elevenstore_mapping_ready,
          is_registrable, coopang_registered, naver_registered, elevenstore_registered,
          naver_register_failed, coopang_register_failed, elevenstore_register_failed, testcode
        ) VALUES (
          ?, ?, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE,
          FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 0
        )`,
        [userid, product.productId]
      );
      insertedCount++;
    }
    
    await connection.commit();
    
    return {
      success: true,
      message: `${insertedCount}개 상품의 상태 항목이 생성되었습니다.`,
      insertedCount
    };
  } catch (error) {
    await connection.rollback();
    logger.error(error, { userid });
    
    return {
      success: false,
      message: `상태 항목 생성 중 오류가 발생했습니다: ${error.message}`,
      error
    };
  } finally {
    connection.release();
  }
};

/**
 * status 테이블의 preprocessing_completed 상태를 true로 업데이트하는 함수
 * 
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @returns {Promise<Object>} - 업데이트 결과 객체
 */
export const updatePreprocessingCompletedStatus = async (userid, productid) => {
  const connection = await promisePool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // status 테이블에서 해당 상품의 preprocessing_completed 필드를 true로 업데이트
    const [updateResult] = await connection.query(
      `UPDATE status 
       SET preprocessing_completed = TRUE 
       WHERE userid = ? AND productid = ?`,
      [userid, productid]
    );
    
    await connection.commit();
    
    return {
      success: true,
      message: `상품 ID ${productid}의 preprocessing_completed 상태가 업데이트되었습니다.`,
      updatedCount: updateResult.affectedRows
    };
  } catch (error) {
    await connection.rollback();
    logger.error(error, { userid, productid });
    
    return {
      success: false,
      message: `상태 업데이트 중 오류가 발생했습니다: ${error.message}`,
      error
    };
  } finally {
    connection.release();
  }
};

/**
 * status 테이블의 baseJson_completed 상태를 true로 업데이트하는 함수
 * 
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @returns {Promise<Object>} - 업데이트 결과 객체
 */
export const updateBaseJsonCompletedStatus = async (userid, productid) => {
  const connection = await promisePool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // status 테이블에서 해당 상품의 baseJson_completed 필드를 true로 업데이트
    const [updateResult] = await connection.query(
      `UPDATE status 
       SET baseJson_completed = TRUE 
       WHERE userid = ? AND productid = ?`,
      [userid, productid]
    );
    
    await connection.commit();
    
    return {
      success: true,
      message: `상품 ID ${productid}의 baseJson_completed 상태가 업데이트되었습니다.`,
      updatedCount: updateResult.affectedRows
    };
  } catch (error) {
    await connection.rollback();
    logger.error(error, { userid, productid });
    
    return {
      success: false,
      message: `상태 업데이트 중 오류가 발생했습니다: ${error.message}`,
      error
    };
  } finally {
    connection.release();
  }
};



/**
 * 특정 상품들의 카테고리 매핑 상태를 동기화하는 함수 (효율적인 한 번의 쿼리로 처리)
 * 
 * @param {number} userid - 사용자 ID
 * @param {Array} productIds - 상품 ID 배열
 * @returns {Promise<Object>} - 동기화 결과 객체
 */
export const syncCategoryMappingStatus = async (userid, productIds) => {
  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    return {
      success: true,
      message: '동기화할 상품이 없습니다.',
      updatedCount: 0
    };
  }

  const connection = await promisePool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // 특정 상품들의 카테고리 매핑 상태를 실제 categorymapping 테이블과 동기화
    const placeholders = productIds.map(() => '?').join(',');
    const [updateResult] = await connection.query(
      `UPDATE status s 
       JOIN products_detail pd ON s.userid = pd.userid AND s.productid = pd.productid
       LEFT JOIN categorymapping cm ON pd.catid = cm.catid AND cm.userid = pd.userid
       SET s.naver_mapping_ready = CASE WHEN cm.naver_cat_id IS NOT NULL THEN TRUE ELSE FALSE END,
           s.coopang_mapping_ready = CASE WHEN cm.coopang_cat_id IS NOT NULL THEN TRUE ELSE FALSE END,
           s.elevenstore_mapping_ready = CASE WHEN cm.elevenstore_cat_id IS NOT NULL THEN TRUE ELSE FALSE END,
           s.esm_mapping_ready = CASE WHEN cm.esm_cat_id IS NOT NULL THEN TRUE ELSE FALSE END,
           s.updated_at = NOW()
       WHERE s.userid = ? AND s.productid IN (${placeholders})`,
      [userid, ...productIds]
    );
    
    await connection.commit();
    
    return {
      success: true,
      message: `${updateResult.affectedRows}개 상품의 카테고리 매핑 상태가 동기화되었습니다.`,
      updatedCount: updateResult.affectedRows
    };
  } catch (error) {
    await connection.rollback();
    logger.error(error, { userid, productIds });
    
    return {
      success: false,
      message: `카테고리 매핑 상태 동기화 중 오류가 발생했습니다: ${error.message}`,
      error
    };
  } finally {
    connection.release();
  }
};


