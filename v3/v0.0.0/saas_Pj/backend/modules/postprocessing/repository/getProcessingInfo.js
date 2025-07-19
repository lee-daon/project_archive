import { promisePool } from '../../../common/utils/connectDB.js';

/**
 * 전체 처리 상태별 카운트를 가져오는 함수
 * @param {number} userid - 사용자 ID
 * @returns {Promise<Object>} - 상태별 카운트 객체
 */
const getStatusCounts = async (userid) => {
  try {
    const [rows] = await promisePool.execute(
      `SELECT 
        status, 
        COUNT(*) as count 
      FROM processing_status 
      WHERE userid = ? 
      AND status IN ('pending', 'brandbanCheck', 'processing', 'success', 'fail')
      GROUP BY status`,
      [userid]
    );
    
    // 결과를 객체 형태로 변환
    const statusCounts = {
      pending: 0,
      brandbanCheck: 0,
      processing: 0,
      success: 0,
      fail: 0,
      total: 0
    };
    
    let total = 0;
    rows.forEach(row => {
      if (statusCounts.hasOwnProperty(row.status)) {
        statusCounts[row.status] = row.count;
      }
      total += row.count;
    });
    
    statusCounts.total = total;
    
    return statusCounts;
  } catch (error) {
    console.error('상태별 카운트 조회 중 오류 발생:', error);
    throw error;
  }
};

/**
 * 처리 상태에 따른 상품 목록을 가져오는 함수
 * @param {number} userid - 사용자 ID
 * @param {string} status - 처리 상태 (pending, brandbanCheck, processing, success, fail)
 * @param {number} limit - 가져올 항목 수
 * @param {string} order - 정렬 순서 (desc: 최신순, asc: 과거순)
 * @param {string} group_code - 조회할 그룹 코드
 * @returns {Promise<Array>} - 해당 상태의 상품 목록
 */
const getProductsByStatus = async (userid, status, limit, order, group_code) => {
  try {
    const orderDirection = order === 'asc' ? 'ASC' : 'DESC';
    
    // 상태별 조회 또는 전체 조회
    let whereClause = 'WHERE userid = ?';
    let params = [userid];
    
    // status가 비어있거나 'all'인 경우 5개 특정 상태만 필터링
    if (!status || status.trim() === '' || status === 'all') {
      whereClause += ' AND status IN ("pending", "brandbanCheck", "processing", "success", "fail")';
    } else {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    // group_code가 있는 경우, 해당 group_code로 필터링
    if (group_code && group_code.trim() !== '') {
      whereClause += ' AND group_code = ?';
      params.push(group_code);
    }
    
    // limit 값을 안전하게 정수로 변환
    const limitValue = parseInt(limit, 10);
    const safeLimit = isNaN(limitValue) || limitValue <= 0 ? 10 : limitValue;
    
    // SQL 쿼리 생성 (LIMIT 값을 직접 삽입)
    const query = `
      SELECT 
        productid,
        brandfilter,
        status,
        name_optimized,
        main_image_translated,
        description_image_translated,
        option_image_translated,
        attribute_translated,
        keyword_generated,
        nukki_created,
        option_optimized,
        created_at
      FROM processing_status
      ${whereClause}
      ORDER BY created_at ${orderDirection}
      LIMIT ${safeLimit}`;
    
    const [rows] = await promisePool.execute(query, params);
    
    return rows;
  } catch (error) {
    console.error('상품 목록 조회 중 오류 발생:', error);
    throw error;
  }
};

export {
  getStatusCounts,
  getProductsByStatus
};
