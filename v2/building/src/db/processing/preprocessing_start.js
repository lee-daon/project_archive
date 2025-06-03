import { promisePool } from "../connectDB.js";

/**
 * 가공 대상 상품을 조회하는 함수
 * @param {Object} target - 가공 대상 선택 옵션
 * @param {string} target.type - 가공 대상 타입 (all, recent, testcode)
 * @param {number} [target.code] - 테스트코드 (type이 testcode일 때 사용)
 * @param {string} [target.order] - 정렬 순서 (type이 recent일 때 사용, 'asc' 또는 'desc')
 * @param {number} [target.count] - 가공할 상품 개수 (type이 recent일 때 사용)
 * @returns {Promise<Array>} 가공 대상 상품 목록
 */
export async function getProcessingTargets(target) {
  // 가공 대상 쿼리 생성
  let targetQuery = `
    SELECT productid 
    FROM status 
    WHERE sourcing_completed = true 
    AND preprocessing_completed = false 
    AND brand_banned = false 
    AND shop_banned = false 
    AND seller_banned = false
  `;
  
  // 타겟 타입에 따른 추가 조건
  if (target.type === 'testcode') {
    targetQuery += ` AND testcode = ${target.code}`;
  }
  
  // 최신순/과거순 정렬 및 가공 상품 개수 선택
  if (target.type === 'recent') {
    if (target.order === 'desc') {
      targetQuery += ` ORDER BY created_at DESC`;
    } else {
      targetQuery += ` ORDER BY created_at ASC`;
    }
    targetQuery += ` LIMIT ${target.count}`;
  }
  
  // 대상 상품 조회
  const [products] = await promisePool.query(targetQuery);
  return products;
}

/**
 * 여러 상품들의 skus 테이블에서 prop_path를 추출하여 중복 제거된 배열을 반환하는 함수
 * @param {Array<string>} productIds - 상품 ID 배열
 * @returns {Promise<Array<string>>} 중복 제거된 prop_path 배열
 */
export async function getPropPathsFromSkus(productIds) {
  if (!productIds || productIds.length === 0) {
    return [];
  }
  
  try {
    // IN 쿼리용 플레이스홀더 생성
    const placeholders = productIds.map(() => '?').join(',');
    
    // 모든 선택된 상품의 prop_path 조회
    const [rows] = await promisePool.query(
      `SELECT prop_path FROM skus WHERE productid IN (${placeholders})`,
      productIds
    );
    
    // 세미콜론으로 구분된 모든 prop_path를 분리하고 중복 제거
    const uniquePropPaths = new Set();
    rows.forEach(row => {
      if (row.prop_path) {
        const paths = row.prop_path.split(';');
        paths.forEach(path => uniquePropPaths.add(path.trim()));
      }
    });
    
    return Array.from(uniquePropPaths);
  } catch (error) {
    console.error('prop_path 조회 중 오류 발생:', error);
    throw error;
  }
}

/**
 * 번역이 필요한 상품 옵션을 조회하는 함수
 * @param {Array<string>} propPaths - 속성 경로 배열
 * @returns {Promise<Array<string>>} 번역이 필요한 옵션 경로 배열
 */
export async function getUntranslatedPropPaths(propPaths) {
  if (!propPaths || propPaths.length === 0) {
    return [];
  }
  
  try {
    // 번역이 필요한 prop_path만 필터링
    const untranslatedPaths = [];
    
    // 한 번에 처리할 배치 크기 (MySQL 쿼리 제한 고려)
    const batchSize = 1000;
    
    for (let i = 0; i < propPaths.length; i += batchSize) {
      const batch = propPaths.slice(i, i + batchSize);
      const placeholders = batch.map(() => '?').join(',');
      
      // 이미 번역된 옵션은 제외 (옵션명 또는 옵션값이 번역되지 않은 것만 포함)
      const [rows] = await promisePool.query(
        `SELECT prop_path FROM product_options 
         WHERE prop_path IN (${placeholders})
         AND (translated_optionname IS NULL OR translated_optionvalue IS NULL)`,
        batch
      );
      
      rows.forEach(row => untranslatedPaths.push(row.prop_path));
    }
    
    return untranslatedPaths;
  } catch (error) {
    console.error('번역 필요 옵션 조회 중 오류 발생:', error);
    throw error;
  }
}

/**
 * 번역이 필요한 옵션 속성 키(pid)를 조회하는 함수
 * @returns {Promise<Array>} 번역이 필요한 pid 목록
 */
export async function getOptionPids() {
  const [pids] = await promisePool.query(`
    SELECT pid 
    FROM sku_prop_key 
    WHERE translated_name IS NULL 
  `);
  return pids;
}

/**
 * 번역이 필요한 옵션 속성 값(vid)을 조회하는 함수
 * @returns {Promise<Array>} 번역이 필요한 vid 목록
 */
export async function getOptionVids() {
  const [vids] = await promisePool.query(`
    SELECT vid 
    FROM sku_prop_value 
    WHERE translated_name IS NULL 
  `);
  return vids;
}

