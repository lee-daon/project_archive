import { promisePool } from '../../../common/utils/connectDB.js';

/**
 * 사용자와 상품 ID로 소싱 상태를 조회하는 함수
 * @param {number} userid - 사용자 ID
 * @param {string} productId - 상품 ID
 * @returns {Promise<Object|null>} - 조회 결과 객체 또는 null
 */
export const getUserProductStatus = async (userid, productId) => {
  try {
    const query = `
      SELECT * FROM sourcing_status 
      WHERE userid = ? AND productid = ?
    `;
    
    const [rows] = await promisePool.execute(query, [userid, productId]);
    
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('소싱 상태 조회 중 오류:', error);
    throw error;
  }
};

/**
 * 사용자와 상품 ID로 소싱 상태 레코드를 삭제하는 함수
 * @param {number} userid - 사용자 ID
 * @param {string} productId - 상품 ID
 * @returns {Promise<boolean>} - 삭제 성공 여부
 */
export const deleteUserProductStatus = async (userid, productId) => {
  try {
    const query = `
      DELETE FROM sourcing_status 
      WHERE userid = ? AND productid = ?
    `;
    
    const [result] = await promisePool.execute(query, [userid, productId]);
    
    return result.affectedRows > 0;
  } catch (error) {
    console.error('소싱 상태 삭제 중 오류:', error);
    throw error;
  }
};

/**
 * 여러 상품의 소싱 상태를 삭제하는 함수
 * @param {number} userid - 사용자 ID
 * @param {Array<string>} productIds - 상품 ID 배열
 * @returns {Promise<number>} - 삭제된 레코드 수
 */
export const deleteBatchProductStatus = async (userid, productIds) => {
  if (!Array.isArray(productIds) || productIds.length === 0) {
    return 0;
  }

  const connection = await promisePool.getConnection();
  try {
    await connection.beginTransaction();

    const placeholders = productIds.map(() => '?').join(',');
    
    // 1. sourcing_status 테이블에서 데이터 삭제
    const deleteSourcingStatusQuery = `
      DELETE FROM sourcing_status 
      WHERE userid = ? AND productid IN (${placeholders})
    `;
    const sourcingParams = [userid, ...productIds];
    const [sourcingResult] = await connection.execute(deleteSourcingStatusQuery, sourcingParams);

    // 2. 삭제 대상 productid에 연결된 15자리 임시 catid 조회
    const findTempCatIdsQuery = `
      SELECT catid FROM products_detail 
      WHERE userid = ? AND productid IN (${placeholders}) AND LENGTH(catid) = 15
    `;
    const findParams = [userid, ...productIds];
    const [catIdRows] = await connection.execute(findTempCatIdsQuery, findParams);

    const tempCatIds = catIdRows.map(row => row.catid);

    // 3. 15자리 임시 catid가 존재하면 categorymapping 테이블에서 삭제
    if (tempCatIds.length > 0) {
      const catIdPlaceholders = tempCatIds.map(() => '?').join(',');
      const deleteCategoryMappingQuery = `
        DELETE FROM categorymapping
        WHERE userid = ? AND catid IN (${catIdPlaceholders})
      `;
      const categoryParams = [userid, ...tempCatIds];
      await connection.execute(deleteCategoryMappingQuery, categoryParams);
    }

    await connection.commit();
    return sourcingResult.affectedRows;
  } catch (error) {
    await connection.rollback();
    console.error('소싱 상태 및 임시 카테고리 일괄 삭제 중 오류:', error);
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * 상태를 commit으로 변경하고 commitcode를 업데이트하는 함수
 * @param {number} userid - 사용자 ID
 * @param {string} productId - 상품 ID
 * @param {number} commitcode - 그룹 번호
 * @returns {Promise<boolean>} - 업데이트 성공 여부
 */
export const updateStatusToCommit = async (userid, productId, commitcode) => {
  try {
    const query = `
      UPDATE sourcing_status 
      SET status = 'commit', commitcode = ? 
      WHERE userid = ? AND productid = ? AND status = 'uncommit'
    `;
    
    const [result] = await promisePool.execute(query, [commitcode, userid, productId]);
    
    return result.affectedRows > 0;
  } catch (error) {
    console.error('소싱 상태 커밋 업데이트 중 오류:', error);
    throw error;
  }
};

/**
 * 여러 상품의 상태를 commit으로 일괄 변경하는 함수 (commitcode는 기존 값 유지)
 * @param {number} userid - 사용자 ID
 * @param {Array<string>} productIds - 상품 ID 배열
 * @returns {Promise<number>} - 업데이트된 레코드 수
 */
export const batchUpdateStatusToCommit = async (userid, productIds) => {
  try {
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return 0;
    }

    const placeholders = productIds.map(() => '?').join(',');
    const query = `
      UPDATE sourcing_status 
      SET status = 'commit' 
      WHERE userid = ? AND productid IN (${placeholders}) AND status = 'uncommit'
    `;
    
    const params = [userid, ...productIds];
    const [result] = await promisePool.execute(query, params);
    
    return result.affectedRows;
  } catch (error) {
    console.error('소싱 상태 일괄 커밋 업데이트 중 오류:', error);
    throw error;
  }
};

/**
 * 특정 상태와 일치하는 상품 ID 목록을 반환하는 함수
 * @param {number} userid - 사용자 ID
 * @param {Array<string>} productIds - 상품 ID 배열
 * @param {string} status - 상태 값
 * @returns {Promise<Array<string>>} - 해당 상태인 상품 ID 배열
 */
export const getProductIdsWithStatus = async (userid, productIds, status) => {
  try {
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return [];
    }

    const placeholders = productIds.map(() => '?').join(',');
    const query = `
      SELECT productid FROM sourcing_status 
      WHERE userid = ? AND productid IN (${placeholders}) AND status = ?
    `;
    
    const params = [userid, ...productIds, status];
    const [rows] = await promisePool.execute(query, params);
    
    return rows.map(row => row.productid);
  } catch (error) {
    console.error('특정 상태의 상품 ID 조회 중 오류:', error);
    throw error;
  }
};

/**
 * 사용자의 상태별 상품 개수를 조회하는 함수 (commitCode 필터링 지원)
 * @param {number} userid - 사용자 ID
 * @param {number|null} commitCode - 그룹 코드 필터 (null이면 전체 조회)
 * @returns {Promise<Object>} - 상태별 개수 및 처리 중인 상품 ID 목록
 */
export const getStatusCounts = async (userid, commitCode = null) => {
  try {
    // commitCode 필터링 조건 추가
    let whereCondition = 'WHERE userid = ?';
    let params = [userid];
    
    if (commitCode !== null) {
      whereCondition += ' AND commitcode = ?';
      params.push(commitCode);
    }
    
    // 상태별 개수 조회 쿼리
    const countQuery = `
      SELECT status, COUNT(*) as count 
      FROM sourcing_status 
      ${whereCondition}
      GROUP BY status
    `;
    
    // 처리 중인 상품 ID 목록 조회 쿼리 (uncommit, failapi, failsave, banshop, banseller, pending)
    const productIdsQuery = `
      SELECT productid, status 
      FROM sourcing_status 
      ${whereCondition} AND status IN ('uncommit', 'failapi', 'failsave', 'banshop', 'banseller', 'pending')
    `;
    
    // 쿼리 실행
    const [countRows] = await promisePool.execute(countQuery, params);
    const [productIdsRows] = await promisePool.execute(productIdsQuery, params);
    
    // 결과 초기화
    const result = {
      successCount: 0, // uncommit 상태 개수
      failApiCount: 0, // failapi 상태 개수
      failSaveCount: 0, // failsave 상태 개수
      banShopCount: 0, // banshop 상태 개수
      banSellerCount: 0, // banseller 상태 개수
      pendingCount: 0, // pending 상태 개수
      totalCount: 0, // 전체 개수
      productIds: [], // 처리 중인 상품(uncommit, failapi, failsave, banshop, banseller, pending) ID 목록 (호환성 유지)
      uncommitIds: [], // uncommit 상태인 상품 ID 목록
      pendingIds: [], // pending 상태인 상품 ID 목록
      failIds: [], // failapi + failsave 상태인 상품 ID 목록
      banIds: [] // banshop + banseller 상태인 상품 ID 목록
    };
    
    // 상태별 개수 설정
    countRows.forEach(row => {
      switch (row.status) {
        case 'uncommit':
          result.successCount = row.count;
          break;
        case 'failapi':
          result.failApiCount = row.count;
          break;
        case 'failsave':
          result.failSaveCount = row.count;
          break;
        case 'banshop':
          result.banShopCount = row.count;
          break;
        case 'banseller':
          result.banSellerCount = row.count;
          break;
        case 'pending':
          result.pendingCount = row.count;
          break;
      }
      
      // 전체 개수 계산
      result.totalCount += row.count;
    });
    
    // 상품 ID 목록을 상태별로 분류
    productIdsRows.forEach(row => {
      const { productid, status } = row;
      
      // 호환성을 위한 전체 처리 중인 상품 ID 목록
      result.productIds.push(productid);
      
      // 상태별로 분류
      switch (status) {
        case 'uncommit':
          result.uncommitIds.push(productid);
          break;
        case 'pending':
          result.pendingIds.push(productid);
          break;
        case 'failapi':
        case 'failsave':
          result.failIds.push(productid);
          break;
        case 'banshop':
        case 'banseller':
          result.banIds.push(productid);
          break;
      }
    });
    
    return result;
  } catch (error) {
    console.error('상태별 개수 조회 중 오류:', error);
    throw error;
  }
};
