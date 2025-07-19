import { promisePool } from '../../../common/utils/connectDB.js';

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

// 그룹 코드 목록 조회
export const getGroupCodes = async (userid, productIds) => {
  if (productIds.length === 0) return [];
  
  const placeholders = productIds.map(() => '?').join(',');
  const query = `
    SELECT DISTINCT 
      product_group_code as code,
      product_group_memo as memo
    FROM pre_register
    WHERE userid = ? AND productid IN (${placeholders})
  `;
  
  const [rows] = await promisePool.execute(query, [userid, ...productIds]);
  return rows;
};

// 쿠팡 마켓 정보 조회
export const getCoopangMarkets = async (userid) => {
  const query = `
    SELECT 
      coopang_market_number as market_number,
      coopang_market_memo as market_memo,
      coopang_maximun_sku_count as maximun_sku_count,
      registered_sku_count as sku_count
    FROM coopang_account_info
    WHERE userid = ?
  `;
  
  const [rows] = await promisePool.execute(query, [userid]);
  return rows;
};

// 네이버 마켓 정보 조회
export const getNaverMarkets = async (userid) => {
  const query = `
    SELECT 
      naver_market_number as market_number,
      naver_market_memo as market_memo,
      naver_maximun_sku_count as maximun_sku_count,
      registered_sku_count as sku_count
    FROM naver_account_info
    WHERE userid = ?
  `;
  
  const [rows] = await promisePool.execute(query, [userid]);
  return rows;
};

// 11번가 마켓 정보 조회
export const getElevenstoreMarkets = async (userid) => {
  const query = `
    SELECT 
      elevenstore_market_number as market_number,
      elevenstore_market_memo as market_memo,
      elevenstore_maximun_sku_count as maximun_sku_count,
      registered_sku_count as sku_count
    FROM elevenstore_account_info
    WHERE userid = ?
  `;
  
  const [rows] = await promisePool.execute(query, [userid]);
  return rows;
};

// ESM 마켓 정보 조회
export const getEsmMarkets = async (userid) => {
  const query = `
    SELECT 
      esm_market_number as market_number,
      esm_market_memo as market_memo,
      esm_maximun_sku_count as maximun_sku_count,
      registered_sku_count as sku_count
    FROM esm_account_info
    WHERE userid = ?
  `;
  
  const [rows] = await promisePool.execute(query, [userid]);
  return rows;
};

// 기본 설정 조회
export const getDefaultSettings = async (userid) => {
  const query = `
    SELECT 
      basic_minimum_margin_percentage as minMargin,
      basic_margin_percentage as defaultMargin,
      basic_delivery_fee as shippingFee
    FROM common_setting
    WHERE userid = ?
  `;
  
  const [rows] = await promisePool.execute(query, [userid]);
  
  if (rows.length === 0) {
    // 기본값 반환
    return {
      shippingFee: 8000,
      defaultMargin: 30,
      minMargin: 15
    };
  }
  
  return {
    shippingFee: rows[0].shippingFee,
    defaultMargin: rows[0].defaultMargin,
    minMargin: rows[0].minMargin
  };
};
