import { promisePool } from '../../../common/utils/connectDB.js';

// 그룹 코드로 상품 ID 필터링
export const getProductIdsByGroupCode = async (userid, groupCode) => {
  const query = `
    SELECT productid
    FROM pre_register
    WHERE userid = ? AND product_group_code = ?
  `;
  
  const [rows] = await promisePool.execute(query, [userid, groupCode]);
  return rows.map(row => row.productid);
};

// 탭 정보에 따른 등록 가능한 상품 ID 목록 조회 (트리거 기반)
export const getRegistrableProductIdsByTab = async (userid, tabInfo, filteredProductIds = null) => {
  let whereConditions = [
    'userid = ?',
    'baseJson_completed = true',
    'shop_banned = false',
    'seller_banned = false',
    'discarded = false'
  ];
  
  let pendingConditions = [];
  
  // 탭 정보에 따른 조건 추가
  if (tabInfo === 'common') {
    // 공통 탭인 경우 모든 마켓 (네이버, 쿠팡, 11번가, ESM) 포함
    whereConditions.push(
      'naver_mapping_ready = true',
      'coopang_mapping_ready = true',
      'elevenstore_mapping_ready = true',
      'esm_mapping_ready = true',
      'coopang_registered = false',
      'naver_registered = false',
      'elevenstore_registered = false',
      'esm_registered = false',
      'naver_register_failed = false',
      'coopang_register_failed = false',
      'elevenstore_register_failed = false',
      'esm_register_failed = false'
    );
    pendingConditions.push(
      'productid NOT IN (SELECT productid FROM coopang_register_management WHERE userid = ? AND status IN (\'pending\', \'optionMapRequired\'))',
      'productid NOT IN (SELECT productid FROM naver_register_management WHERE userid = ? AND status = \'pending\')',
      'productid NOT IN (SELECT productid FROM elevenstore_register_management WHERE userid = ? AND status = \'pending\')',
      'productid NOT IN (SELECT productid FROM esm_register_management WHERE userid = ? AND status = \'pending\')'
    );
  } else if (tabInfo === 'naver') {
    whereConditions.push(
      'naver_mapping_ready = true',
      'naver_registered = false',
      'naver_register_failed = false'
    );
    pendingConditions.push(
      'productid NOT IN (SELECT productid FROM naver_register_management WHERE userid = ? AND status = \'pending\')'
    );
  } else if (tabInfo === 'coupang') {
    whereConditions.push(
      'coopang_mapping_ready = true',
      'coopang_registered = false',
      'coopang_register_failed = false'
    );
    pendingConditions.push(
      'productid NOT IN (SELECT productid FROM coopang_register_management WHERE userid = ? AND status IN (\'pending\', \'optionMapRequired\'))'
    );
  } else if (tabInfo === 'elevenstore') {
    whereConditions.push(
      'elevenstore_mapping_ready = true',
      'elevenstore_registered = false',
      'elevenstore_register_failed = false'
    );
    pendingConditions.push(
      'productid NOT IN (SELECT productid FROM elevenstore_register_management WHERE userid = ? AND status = \'pending\')'
    );
  } else if (tabInfo === 'esm') {
    whereConditions.push(
      'esm_mapping_ready = true',
      'esm_registered = false',
      'esm_register_failed = false'
    );
    pendingConditions.push(
      'productid NOT IN (SELECT productid FROM esm_register_management WHERE userid = ? AND status = \'pending\')'
    );
  }
  
  // pending 조건 추가
  whereConditions.push(...pendingConditions);
  
  let query = `
    SELECT productid
    FROM status
    WHERE ${whereConditions.join(' AND ')}
  `;
  
  // 파라미터 개수 계산
  let params = [userid];
  if (tabInfo === 'common') {
    params.push(userid, userid, userid, userid); // 쿠팡, 네이버, 11번가, ESM 서브쿼리용
  } else {
    params.push(userid); // 단일 서브쿼리용
  }
  
  // 그룹 코드로 필터링된 상품 ID가 있는 경우
  if (filteredProductIds && filteredProductIds.length > 0) {
    const placeholders = filteredProductIds.map(() => '?').join(',');
    query += ` AND productid IN (${placeholders})`;
    params.push(...filteredProductIds);
  } else if (filteredProductIds && filteredProductIds.length === 0) {
    // 그룹 코드로 필터링했지만 결과가 없는 경우
    return [];
  }
  
  const [rows] = await promisePool.execute(query, params);
  return rows.map(row => row.productid);
};

// 상품 상세 정보 조회
export const getProductDetails = async (userid, productIds) => {
  if (productIds.length === 0) return [];
  
  const placeholders = productIds.map(() => '?').join(',');
  const query = `
    SELECT 
      productid,
      COALESCE(title_optimized, title_translated) as name,
      detail_url as url
    FROM products_detail
    WHERE userid = ? AND productid IN (${placeholders})
  `;
  
  const [rows] = await promisePool.execute(query, [userid, ...productIds]);
  return rows;
};

// 쿠팡 등록 시도 횟수 조회
export const getCoopangAttempts = async (userid, productIds) => {
  if (productIds.length === 0) return [];
  
  const placeholders = productIds.map(() => '?').join(',');
  const query = `
    SELECT 
      productid,
      registration_attempt_time
    FROM coopang_register_management
    WHERE userid = ? AND productid IN (${placeholders})
  `;
  
  const [rows] = await promisePool.execute(query, [userid, ...productIds]);
  return rows;
};

// 네이버 등록 시도 횟수 조회
export const getNaverAttempts = async (userid, productIds) => {
  if (productIds.length === 0) return [];
  
  const placeholders = productIds.map(() => '?').join(',');
  const query = `
    SELECT 
      productid,
      registration_attempt_time
    FROM naver_register_management
    WHERE userid = ? AND productid IN (${placeholders})
  `;
  
  const [rows] = await promisePool.execute(query, [userid, ...productIds]);
  return rows;
};

// 11번가 등록 시도 횟수 조회
export const getElevenstoreAttempts = async (userid, productIds) => {
  if (productIds.length === 0) return [];
  
  const placeholders = productIds.map(() => '?').join(',');
  const query = `
    SELECT 
      productid,
      registration_attempt_time
    FROM elevenstore_register_management
    WHERE userid = ? AND productid IN (${placeholders})
  `;
  
  const [rows] = await promisePool.execute(query, [userid, ...productIds]);
  return rows;
};

// ESM 등록 시도 횟수 조회
export const getEsmAttempts = async (userid, productIds) => {
  if (productIds.length === 0) return [];
  
  const placeholders = productIds.map(() => '?').join(',');
  const query = `
    SELECT 
      productid,
      registration_attempt_time
    FROM esm_register_management
    WHERE userid = ? AND productid IN (${placeholders})
  `;
  
  const [rows] = await promisePool.execute(query, [userid, ...productIds]);
  return rows;
};
