import { promisePool } from '../connectDB.js';

/**
 * 등록 대기 상품 목록을 조회하는 함수
 * 
 * @param {Object} options - 조회 옵션
 * @param {string} [options.sortBy='desc'] - 정렬 방식 ('desc': 최신순, 'asc': 과거순)
 * @param {string} [options.viewMode='individual'] - 조회 모드 ('individual': 개별 목록, 'grouped': testcode 그룹별)
 * @param {string|null} [options.testCode=null] - 조회할 특정 testcode (viewMode가 'grouped'이고 특정 testcode 조회 시 사용)
 * @returns {Promise<Object>} 조회 결과 객체
 * @returns {Array<Object>} [result.products] - viewMode가 'individual'이거나 특정 testcode 조회 시 반환되는 상품 목록
 * @returns {Array<Object>} [result.testCodeGroups] - viewMode가 'grouped'이고 testCode가 없을 때 반환되는 testcode 그룹 목록
 */
export async function getPreRegisterProducts({ sortBy = 'desc', viewMode = 'individual', testCode = null }) {
  // 기본 쿼리 - 가공은 완료되었으나 등록 가능 상태는 아닌 상품
  let query = `
    SELECT p.productid, pl.product_name, s.created_at, s.updated_at, 
           s.testcode, pp.* 
    FROM status s
    JOIN productlist pl ON s.productid = pl.productid
    JOIN preprocessing pp ON s.productid = pp.productid
    JOIN products_detail p ON s.productid = p.productid
    WHERE s.preprocessing_completed = TRUE 
      AND s.is_registrable = FALSE
      AND s.brand_banned = FALSE
      AND s.shop_banned = FALSE
      AND s.seller_banned = FALSE
      AND s.discarded = FALSE
      AND s.category_mapping_required = FALSE
  `;
  
  if (viewMode === 'individual') {
    // 개별 목록 조회 (최신순/과거순)
    query += ` ORDER BY s.updated_at ${sortBy === 'desc' ? 'DESC' : 'ASC'}`;
    const [products] = await promisePool.query(query);
    return { products };
  } 
  else if (viewMode === 'grouped' && testCode) {
    // 특정 testcode 상품만 조회
    query += ` AND s.testcode = ?
              ORDER BY s.updated_at ${sortBy === 'desc' ? 'DESC' : 'ASC'}`;
    
    const [products] = await promisePool.query(query, [testCode]);
    return { products };
  } 
  else if (viewMode === 'grouped') {
    // testcode 그룹별 통계 및 샘플 조회
    const groupQuery = `
      SELECT s.testcode, 
             COUNT(*) as product_count,
             MAX(s.productid) as sample_product_id
      FROM status s
      WHERE s.preprocessing_completed = TRUE 
        AND s.is_registrable = FALSE
        AND s.brand_banned = FALSE
        AND s.shop_banned = FALSE
        AND s.seller_banned = FALSE
        AND s.testcode IS NOT NULL
        AND s.discarded = FALSE
        AND s.category_mapping_required = FALSE
      GROUP BY s.testcode
      ORDER BY s.testcode ASC
    `;
    
    const [testCodeGroups] = await promisePool.query(groupQuery);
    
    // 각 그룹의 샘플 상품 정보 가져오기
    const groupsWithSample = await Promise.all(
      testCodeGroups.map(async (group) => {
        if (group.sample_product_id) {
          const [sampleDetails] = await promisePool.query(`
            SELECT p.productid, pl.product_name, pp.*
            FROM preprocessing pp
            JOIN productlist pl ON pp.productid = pl.productid
            JOIN products_detail p ON pp.productid = p.productid
            WHERE pp.productid = ?
          `, [group.sample_product_id]);
          
          return {
            ...group,
            sample: sampleDetails[0] || null
          };
        }
        return group;
      })
    );
    
    return { testCodeGroups: groupsWithSample };
  }
  
  return null;
}

/**
 * 상품 폐기 처리를 수행하는 함수
 * status 테이블의 해당 상품들의 discarded 필드를 TRUE로 설정하고
 * is_registrable 필드를 FALSE로 설정합니다.
 * 
 * @param {Array<string|number>} productIds - 폐기 처리할 상품 ID 배열
 * @throws {Error} 상품 ID 배열이 비어있거나 유효하지 않은 경우 에러 발생
 * @returns {Promise<Object>} 폐기 처리 결과
 * @returns {number} result.productCount - 요청한 폐기 처리 상품 수
 * @returns {number} result.updatedCount - 실제로 업데이트된 상품 수
 */
export async function discardProducts(productIds) {
  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    throw new Error('선택된 상품이 없습니다.');
  }
  
  // status 테이블의 discarded 필드를 true로, is_registrable 필드를 false로 업데이트
  const placeholders = productIds.map(() => '?').join(',');
  const updateQuery = `
    UPDATE status 
    SET discarded = TRUE,
        is_registrable = FALSE,
        updated_at = CURRENT_TIMESTAMP 
    WHERE productid IN (${placeholders})
  `;
  
  const [result] = await promisePool.query(updateQuery, productIds);
  
  return {
    productCount: productIds.length,
    updatedCount: result.affectedRows
  };
}

/**
 * 상품의 카테고리 ID를 조회하는 함수
 * 
 * @param {string|number} productId - 카테고리 ID를 조회할 상품 ID
 * @returns {Promise<string|null>} 상품의 카테고리 ID 또는 상품이 없는 경우 null
 */
export async function getProductCategoryId(productId) {
  const [result] = await promisePool.query(`
    SELECT catid FROM products_detail WHERE productid = ?
  `, [productId]);
  
  return result.length > 0 ? result[0].catid : null;
}

/**
 * 카테고리 매핑 정보를 확인하는 함수
 * 해당 카테고리의 네이버, 쿠팡 카테고리 매핑 정보를 조회합니다.
 * 
 * @param {string|number} catId - 확인할 카테고리 ID
 * @returns {Promise<Object>} 카테고리 매핑 정보
 * @returns {boolean} result.isMapped - 카테고리 매핑이 완료되었는지 여부
 * @returns {Object|null} result.mappingData - 카테고리 매핑 데이터 또는 매핑이 없는 경우 null
 */
export async function getCategoryMapping(catId) {
  const [result] = await promisePool.query(`
    SELECT catid, naver_cat_id, coopang_cat_id 
    FROM categorymapping 
    WHERE catid = ?
  `, [catId]);
  
  const isMapped = result.length > 0 && 
                  result[0].naver_cat_id && 
                  result[0].coopang_cat_id;
  
  return { 
    isMapped,
    mappingData: result[0] || null
  };
}

/**
 * 상품을 스테이징 처리하는 함수 (pre_register 테이블에 저장)
 * pre_register 테이블에 상품 정보를 저장하고 status 테이블을 업데이트합니다.
 * 
 * @param {Object} productInfo - 스테이징 처리할 상품 정보
 * @param {string|number} productInfo.productId - 상품 ID
 * @param {string} productInfo.marketNumber - 마켓 번호(상품군 단위 코드)
 * @param {string|null} [productInfo.memo=null] - 상품 그룹 메모
 * @param {Object|null} [productInfo.jsonData=null] - 저장할 상품 데이터 JSON 객체
 * @param {boolean} [productInfo.processingError=false] - 처리 중 오류 발생 여부
 * @param {boolean} [productInfo.categoryMappingRequired=false] - 카테고리 매핑 필요 여부
 * @returns {Promise<void>}
 */
export async function stageProduct({
  productId, 
  marketNumber, 
  memo, 
  jsonData, 
  processingError, 
  categoryMappingRequired
}) {
  // JSON 데이터 준비 - 객체나 문자열에 따라 적절하게 처리
  let jsonDataStr = null;
  if (jsonData !== null && jsonData !== undefined) {
    // 이미 문자열인 경우 그대로 사용, 객체인 경우 JSON으로 변환
    jsonDataStr = typeof jsonData === 'string' ? jsonData : JSON.stringify(jsonData);
  }
  
  // pre_register 테이블에 저장
  await promisePool.query(`
    INSERT INTO pre_register (
      product_id, 
      product_group_code, 
      product_group_memo, 
      json_data, 
      processing_error, 
      category_mapping_required
    ) VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      product_group_code = VALUES(product_group_code),
      product_group_memo = VALUES(product_group_memo),
      json_data = VALUES(json_data),
      processing_error = VALUES(processing_error),
      category_mapping_required = VALUES(category_mapping_required),
      registration_ready_time = CURRENT_TIMESTAMP
  `, [
    productId,
    marketNumber,
    memo,
    jsonDataStr,
    processingError,
    categoryMappingRequired
  ]);
  
  // status 테이블 업데이트
  await promisePool.query(`
    INSERT INTO status (
      productid, 
      is_registrable, 
      discarded, 
      category_mapping_required
    ) VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      is_registrable = VALUES(is_registrable), 
      discarded = VALUES(discarded), 
      category_mapping_required = VALUES(category_mapping_required),
      updated_at = CURRENT_TIMESTAMP
  `, [
    productId, 
    !processingError && !categoryMappingRequired, // is_registrable 값
    processingError,                             // discarded 값
    categoryMappingRequired                      // category_mapping_required 값
  ]);
} 