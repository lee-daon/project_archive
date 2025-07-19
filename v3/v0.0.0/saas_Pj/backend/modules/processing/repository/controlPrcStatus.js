import { promisePool } from '../../../common/utils/connectDB.js';
import { updatePreprocessingCompletedStatus } from '../../../common/utils/assistDb/GlobalStatus.js';

/**
 * 상품 가공 상태를 초기화하고 옵션에 따라 필드를 설정하는 함수
 * 
 * @param {number} userId - 사용자 ID
 * @param {Array<number>} productIds - 상품 ID 배열
 * @param {object} options - 가공 옵션 설정
 * @returns {Promise<object>} - 업데이트 결과
 */
export async function initProcessingStatus(userId, productIds, options) {
  if (!productIds || productIds.length === 0) {
    return Promise.resolve({ success: false, message: '상품 ID가 제공되지 않았습니다.' });
  }

  try {
    // 트랜잭션 시작
    const connection = await promisePool.getConnection();
    await connection.beginTransaction();

    try {
      // 각 상품에 대해 처리
      for (const productId of productIds) {
        // 기존 데이터가 있는지 확인
        const [existingRows] = await connection.query(
          'SELECT productid FROM processing_status WHERE userid = ? AND productid = ?', 
          [userId, productId]
        );

        // 기본 필드 설정
        const baseFields = {
          status: 'pending',
          brandfilter: options.brandFiltering || false,
          name_optimized: options.seo ? true : false,
          main_image_translated: options.imageTranslation?.main || false,
          description_image_translated: options.imageTranslation?.detail || false,
          option_image_translated: options.imageTranslation?.option || false,
          attribute_translated: options.attributeTranslation || false,
          keyword_generated: options.keyword?.type ? true : false,
          nukki_created: options.nukkiImages?.enabled || false,
          nukki_image_order: options.nukkiImages?.order || 0,
          option_optimized: options.optionTranslation || false,
          banned: false
        };

        if (existingRows.length > 0) {
          // 기존 데이터 업데이트
          const fieldsToUpdate = Object.entries(baseFields)
            .map(([key, value]) => `${key} = ${typeof value === 'boolean' ? (value ? 'TRUE' : 'FALSE') : `'${value}'`}`)
            .join(', ');

          await connection.query(
            `UPDATE processing_status SET ${fieldsToUpdate} WHERE userid = ? AND productid = ?`,
            [userId, productId]
          );
        } else {
          // 새 데이터 삽입
          const columns = ['userid', 'productid', ...Object.keys(baseFields)];
          const values = [
            userId, 
            productId, 
            ...Object.values(baseFields).map(val => 
              typeof val === 'boolean' ? val : val
            )
          ];

          const placeholders = values.map(() => '?').join(', ');

          await connection.query(
            `INSERT INTO processing_status (${columns.join(', ')}) VALUES (${placeholders})`,
            values
          );
        }
      }

      // 트랜잭션 커밋
      await connection.commit();
      connection.release();

      return { 
        success: true, 
        message: `${productIds.length}개 상품의 가공 상태가 초기화되었습니다.`
      };
    } catch (error) {
      // 트랜잭션 롤백
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('가공 상태 초기화 중 오류 발생:', error);
    throw error;
  }
}

/**
 * 브랜드 금지 상품의 상태를 'brandbanned'로 업데이트하는 함수
 * 
 * @param {number} userId - 사용자 ID
 * @param {Array<object>} bannedItems - 금지된 상품 항목 배열 [{productId: number, options: object}, ...]
 * @returns {Promise<object>} - 업데이트 결과
 */
export async function updateBrandBannedStatus(userId, bannedItems) {
  if (!bannedItems || bannedItems.length === 0) {
    return Promise.resolve({ success: false, message: '업데이트할 금지 상품이 없습니다.' });
  }

  try {
    // 트랜잭션 시작
    const connection = await promisePool.getConnection();
    await connection.beginTransaction();

    try {
      // productId 배열 추출
      const productIds = bannedItems.map(item => item.productId);
      
      // IN 절을 위한 플레이스홀더 생성
      const placeholders = productIds.map(() => '?').join(', ');
      
      // 상태 업데이트 쿼리 실행
      const [result] = await connection.query(
        `UPDATE processing_status 
         SET status = 'brandbanned', banned = TRUE 
         WHERE userid = ? AND productid IN (${placeholders})`,
        [userId, ...productIds]
      );

      // 트랜잭션 커밋
      await connection.commit();
      connection.release();

      return { 
        success: true, 
        message: `${result.affectedRows}개 상품의 상태가 '브랜드 금지'로 업데이트되었습니다.`,
        affectedRows: result.affectedRows
      };
    } catch (error) {
      // 트랜잭션 롤백
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('브랜드 금지 상태 업데이트 중 오류 발생:', error);
    throw error;
  }
}

/**
 * 상품의 가공 작업 개수를 업데이트하는 함수
 * 
 * @param {number} userId - 사용자 ID
 * @param {number} productId - 상품 ID
 * @param {Object} taskCounts - 작업 개수 객체 { imgTasksCount, optionTasksCount, overallTasksCount }
 * @returns {Promise<Object>} - 업데이트 결과
 */
export async function updateTasksCount(userId, productId, taskCounts) {
  try {
    // 상태 및 작업 개수 업데이트
    const [result] = await promisePool.execute(
      `UPDATE processing_status 
       SET status = 'processing',
           img_tasks_count = ?,
           option_tasks_count = ?,
           overall_tasks_count = ?
       WHERE userid = ? AND productid = ?`,
      [
        taskCounts.imgTasksCount || 0,
        taskCounts.optionTasksCount || 0,
        taskCounts.overallTasksCount || 0,
        userId,
        productId
      ]
    );

    return { 
      success: true, 
      message: `상품 ID ${productId}의 작업 개수가 업데이트되었습니다.`,
      affectedRows: result.affectedRows
    };
  } catch (error) {
    console.error(`작업 개수 업데이트 중 오류 발생:`, error);
    throw error;
  }
}

/**
 * 브랜드 필터링을 통과한 상품의 상태를 'notbanned'로 업데이트하는 함수
 * 
 * @param {number} userId - 사용자 ID
 * @param {Array<object>} nonBannedItems - 필터링을 통과한 상품 항목 배열 [{productId: number, options: object}, ...]
 * @returns {Promise<object>} - 업데이트 결과
 */
export async function updateNonBannedStatus(userId, nonBannedItems) {
  if (!nonBannedItems || nonBannedItems.length === 0) {
    return Promise.resolve({ success: false, message: '업데이트할 상품이 없습니다.' });
  }

  try {
    // 트랜잭션 시작
    const connection = await promisePool.getConnection();
    await connection.beginTransaction();

    try {
      // productId 배열 추출
      const productIds = nonBannedItems.map(item => item.productId);
      
      // IN 절을 위한 플레이스홀더 생성
      const placeholders = productIds.map(() => '?').join(', ');
      
      // 상태 업데이트 쿼리 실행
      const [result] = await connection.query(
        `UPDATE processing_status 
         SET status = 'notbanned', banned = FALSE 
         WHERE userid = ? AND productid IN (${placeholders})`,
        [userId, ...productIds]
      );

      // 트랜잭션 커밋
      await connection.commit();
      connection.release();

      return { 
        success: true, 
        message: `${result.affectedRows}개 상품의 상태가 '브랜드 필터링 통과'로 업데이트되었습니다.`,
        affectedRows: result.affectedRows
      };
    } catch (error) {
      // 트랜잭션 롤백
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('브랜드 필터링 통과 상태 업데이트 중 오류 발생:', error);
    throw error;
  }
}


/**
 * 모든 작업이 0개일 때 바로 완료 처리하는 함수
 * 
 * @param {number} userId - 사용자 ID
 * @param {number} productId - 상품 ID
 * @returns {Promise<object>} - 업데이트 결과
 */
export async function completeProcessingImmediately(userId, productId) {
  try {
    // 상태를 success로 업데이트
    const [result] = await promisePool.execute(
      `UPDATE processing_status 
       SET status = 'success'
       WHERE userid = ? AND productid = ?`,
      [userId, productId]
    );

    // preprocessing_completed 상태 업데이트
    await updatePreprocessingCompletedStatus(userId, productId);

    console.log(`상품 ID ${productId}: 모든 작업이 0개 - 바로 완료 처리`);

    return { 
      success: true, 
      message: `상품 ID ${productId}의 처리가 즉시 완료되었습니다.`,
      affectedRows: result.affectedRows
    };
  } catch (error) {
    console.error('즉시 완료 처리 중 오류 발생:', error);
    throw error;
  }
}
