import { promisePool } from '../connectDB.js';

/**
 * 상품 그룹 목록을 조회하는 함수
 * 
 * @param {string} type - 등록 타입 (common, coopang, naver)
 * @param {string} search - 검색어 (선택적)
 * @returns {Promise<Array>} 상품 그룹 목록
 */
export async function getProductGroups(type, search) {
  // 등록 타입에 따른 쿼리 조건 설정
  let statusCondition = '';
  if (type === 'common') {
    statusCondition = 'status.is_registrable = true AND status.registered = false';
  } else if (type === 'coopang') {
    statusCondition = 'status.is_registrable = true AND status.coopang_registered = false AND status.registered = false';
  } else if (type === 'naver') {
    statusCondition = 'status.is_registrable = true AND status.naver_registered = false AND status.registered = false';
  } else {
    throw new Error('잘못된 등록 타입입니다.');
  }
  
  // 기본 쿼리
  let query = `
    SELECT 
      pre.product_group_code,
      pre.product_group_memo,
      MAX(pre.registration_ready_time) as latest_ready_time,
      COUNT(pre.product_id) as product_count
    FROM 
      pre_register pre
    JOIN 
      status ON pre.product_id = status.productid
    WHERE 
      ${statusCondition}
  `;
  
  let params = [];
  
  // 검색 조건 추가
  if (search) {
    query += ' AND (pre.product_group_code LIKE ? OR pre.product_group_memo LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  
  // 그룹화 및 정렬
  query += ' GROUP BY pre.product_group_code, pre.product_group_memo ORDER BY latest_ready_time DESC';
  
  const [rows] = await promisePool.query(query, params);
  return rows;
}

/**
 * 특정 그룹에 속한 상품 목록을 조회하는 함수
 * 
 * @param {string} group - 그룹 코드
 * @param {string} memo - 그룹 메모
 * @param {string} type - 등록 타입 (common, coopang, naver)
 * @returns {Promise<Array>} 상품 목록
 */
export async function getProductsByGroup(group, memo, type) {
  let statusCondition = '';
  if (type === 'common') {
    statusCondition = 'status.is_registrable = true AND status.registered = false';
  } else if (type === 'coopang') {
    statusCondition = 'status.is_registrable = true AND status.coopang_registered = false AND status.registered = false';
  } else if (type === 'naver') {
    statusCondition = 'status.is_registrable = true AND status.naver_registered = false AND status.registered = false';
  } else {
    throw new Error('잘못된 등록 타입입니다.');
  }
  
  let memoCondition = '';
  let params = [group];
  
  if (memo === '메모 없음' || memo === null || memo === 'null' || memo === '') {
    memoCondition = 'AND (pre.product_group_memo IS NULL OR pre.product_group_memo = "")';
  } else {
    memoCondition = 'AND pre.product_group_memo = ?';
    params.push(memo);
  }
  
  const query = `
    SELECT 
      p.productid,
      p.title_optimized as product_name,
      c_rm.registration_attempt_time as coopang_registration_attempt_time,
      n_rm.registration_attempt_time as naver_registration_attempt_time
    FROM 
      pre_register pre
    JOIN 
      products_detail p ON pre.product_id = p.productid
    JOIN 
      status ON p.productid = status.productid
    LEFT JOIN 
      coopang_register_management c_rm ON p.productid = c_rm.productid
    LEFT JOIN 
      naver_register_management n_rm ON p.productid = n_rm.productid
    WHERE 
      pre.product_group_code = ? ${memoCondition} AND ${statusCondition}
    ORDER BY 
      p.productid
  `;
  
  const [rows] = await promisePool.query(query, params);
  return rows;
}

/**
 * 마켓 번호 목록을 조회하는 함수
 * 
 * @param {string} type - 마켓 타입 (coopang, naver)
 * @returns {Promise<Array>} 마켓 번호 목록
 */
export async function getMarketNumbers(type) {
  if (type !== 'coopang' && type !== 'naver') {
    throw new Error('유효한 마켓 타입(coopang 또는 naver)이 필요합니다.');
  }
  
  // 마켓 타입에 따른 필드 선택
  const field = type === 'coopang' ? 'coopang_market_number' : 'naver_market_number';
  
  const query = `
    SELECT DISTINCT ${field}, shopid
    FROM account_info
    WHERE ${field} IS NOT NULL
    ORDER BY ${field}
  `;
  
  const [rows] = await promisePool.query(query);
  return rows;
}

/**
 * 마켓 메모를 조회하는 함수
 * 
 * @param {string} type - 마켓 타입 (coopang, naver)
 * @param {string} number - 마켓 번호
 * @returns {Promise<string>} 마켓 메모
 */
export async function getMarketMemo(type, number) {
  const field = type === 'coopang' ? 'coopang_market_memo' : 'naver_market_memo';
  const numberField = type === 'coopang' ? 'coopang_market_number' : 'naver_market_number';
  
  const query = `
    SELECT ${field} as memo
    FROM account_info
    WHERE ${numberField} = ?
    LIMIT 1
  `;
  
  const [rows] = await promisePool.query(query, [number]);
  
  if (rows.length === 0) {
    return '';
  }
  
  return rows[0].memo;
}

/**
 * 마켓 상세 정보를 조회하는 함수
 * 
 * @param {string} type - 마켓 타입 (coopang, naver)
 * @param {string} number - 마켓 번호
 * @returns {Promise<Object>} 마켓 상세 정보
 */
export async function getMarketInfo(type, number) {
  // 마켓 최대 등록 가능 개수 조회
  const maxSkuField = type === 'coopang' ? 'coopang_maximun_sku_count' : 'naver_maximun_sku_count';
  const marketField = type === 'coopang' ? 'coopang_market_number' : 'naver_market_number';
  
  const accountQuery = `
    SELECT ${maxSkuField} as max_sku_count
    FROM account_info
    WHERE ${marketField} = ?
    LIMIT 1
  `;
  
  const [accountRows] = await promisePool.query(accountQuery, [number]);
  
  if (accountRows.length === 0) {
    throw new Error('해당 마켓 번호 정보를 찾을 수 없습니다.');
  }
  
  // 현재 등록된 상품 수 조회
  const countTable = type === 'coopang' ? 'coopang_register_management' : 'naver_register_management';
  
  const countQuery = `
    SELECT COUNT(*) as current_count
    FROM ${countTable}
    WHERE market_number = ?
  `;
  
  const [countRows] = await promisePool.query(countQuery, [number]);
  
  return {
    max_sku_count: accountRows[0].max_sku_count || 0,
    current_count: countRows[0].current_count || 0,
    available_count: (accountRows[0].max_sku_count || 0) - (countRows[0].current_count || 0)
  };
}
