import { promisePool } from '../../../common/utils/connectDB.js';

/**
 * 메인 이미지 목록 조회
 * @param {number} productId - 상품 ID
 * @returns {Promise<Array>} - 이미지 정보 배열
 */
export const getMainImages = async (productId) => {
  try {
    const [rows] = await promisePool.execute(
      'SELECT productid, imageurl, imageorder FROM item_images_raw WHERE productid = ?',
      [productId]
    );
    return rows;
  } catch (error) {
    console.error('메인 이미지 조회 중 오류:', error);
    throw error;
  }
};

/**
 * 상세 이미지 목록 조회
 * @param {number} productId - 상품 ID
 * @returns {Promise<Array>} - 이미지 정보 배열
 */
export const getDetailImages = async (productId) => {
  try {
    const [rows] = await promisePool.execute(
      'SELECT productid, imageurl, imageorder FROM item_images_des_raw WHERE productid = ?',
      [productId]
    );
    return rows;
  } catch (error) {
    console.error('상세 이미지 조회 중 오류:', error);
    throw error;
  }
};

/**
 * 옵션 이미지 목록 조회
 * skus 테이블의 prop_path는 세미콜론(;)으로 구분된 형태이므로 분리하여 처리
 * @param {number} productId - 상품 ID
 * @returns {Promise<Array>} - 이미지 정보 배열
 */
export const getOptionImages = async (productId) => {
  try {
    // 1. skus 테이블에서 productid로 prop_path 찾기
    const [skus] = await promisePool.execute(
      'SELECT prop_path FROM skus WHERE productid = ?',
      [productId]
    );
    
    if (skus.length === 0) {
      return [];
    }
    
    // 2. 모든 prop_path를 세미콜론으로 분리하고 중복 제거
    const allPropPaths = new Set();
    
    skus.forEach(sku => {
      if (sku.prop_path) {
        // 세미콜론으로 분리하여 개별 prop_path 추출
        const individualPaths = sku.prop_path.split(';');
        individualPaths.forEach(path => {
          const trimmedPath = path.trim();
          if (trimmedPath) {
            allPropPaths.add(trimmedPath);
          }
        });
      }
    });
    
    if (allPropPaths.size === 0) {
      return [];
    }
    
    // 3. 중복 제거된 prop_path 배열로 변환
    const propPaths = Array.from(allPropPaths);
    const placeholders = propPaths.map(() => '?').join(',');
    
    // 4. product_options 테이블에서 이미지가 있는 옵션 찾기
    const [options] = await promisePool.query(
      `SELECT prop_path, imageurl 
       FROM product_options 
       WHERE prop_path IN (${placeholders}) AND imageurl IS NOT NULL AND imageurl != ''`,
      propPaths
    );
    
    // 조회 결과를 원하는 형식으로 변환
    return options.map((option, index) => ({
      productid: productId,
      imageurl: option.imageurl,
      imageorder: index + 1,
      prop_path: option.prop_path
    }));
  } catch (error) {
    console.error('옵션 이미지 조회 중 오류:', error);
    throw error;
  }
};

/**
 * 특정 타입의 번역된 이미지 존재 여부 확인
 * 원본 이미지와 번역된 이미지의 개수를 비교하여 모든 이미지가 번역되었는지 확인
 * 
 * @param {number} productId - 상품 ID
 * @param {string} type - 이미지 타입 ('main_image', 'detail_image', 'option_image')
 * @returns {Promise<Object>} - 이미지 존재 여부 및 개수 정보
 */
export const checkTranslatedImageExists = async (productId, type) => {
  try {
    let originalCount = 0;
    let translatedCount = 0;
    let exists = false;
    
    if (type === 'main_image') {
      // 원본 메인 이미지 개수 조회
      const [originalResult] = await promisePool.execute(
        'SELECT COUNT(*) as count FROM item_images_raw WHERE productid = ?',
        [productId]
      );
      originalCount = originalResult[0].count;
      
      // 번역된 메인 이미지 개수 조회
      const [translatedResult] = await promisePool.execute(
        'SELECT COUNT(*) as count FROM item_image_translated WHERE productid = ?',
        [productId]
      );
      translatedCount = translatedResult[0].count;
      
      // 원본 이미지가 없거나, 모든 원본 이미지가 번역되었을 때 완료로 판단
      exists = originalCount === 0 || originalCount === translatedCount;
    } 
    else if (type === 'detail_image') {
      // 원본 상세 이미지 개수 조회
      const [originalResult] = await promisePool.execute(
        'SELECT COUNT(*) as count FROM item_images_des_raw WHERE productid = ?',
        [productId]
      );
      originalCount = originalResult[0].count;
      
      // 번역된 상세 이미지 개수 조회
      const [translatedResult] = await promisePool.execute(
        'SELECT COUNT(*) as count FROM item_image_des_translated WHERE productid = ?',
        [productId]
      );
      translatedCount = translatedResult[0].count;
      
      // 원본 이미지가 없거나, 모든 원본 이미지가 번역되었을 때 완료로 판단
      exists = originalCount === 0 || originalCount === translatedCount;
    } 
    else if (type === 'option_image') {
      // 1. skus 테이블에서 해당 상품의 prop_path 조회
      const [skus] = await promisePool.execute(
        'SELECT prop_path FROM skus WHERE productid = ?',
        [productId]
      );
      
      if (skus.length === 0) {
        originalCount = 0;
        translatedCount = 0;
      } else {
        // 2. 모든 prop_path를 세미콜론으로 분리하고 중복 제거
        const allPropPaths = new Set();
        
        skus.forEach(sku => {
          if (sku.prop_path) {
            const individualPaths = sku.prop_path.split(';');
            individualPaths.forEach(path => {
              const trimmedPath = path.trim();
              if (trimmedPath) {
                allPropPaths.add(trimmedPath);
              }
            });
          }
        });
        
        if (allPropPaths.size === 0) {
          originalCount = 0;
          translatedCount = 0;
        } else {
          const propPaths = Array.from(allPropPaths);
          const placeholders = propPaths.map(() => '?').join(',');
          
          // 3. 이미지가 있는 원본 옵션 개수 조회 (imageurl이 있는 것만)
          const [originalResult] = await promisePool.query(
            `SELECT COUNT(*) as count 
             FROM product_options 
             WHERE prop_path IN (${placeholders}) AND imageurl IS NOT NULL AND imageurl != ''`,
            propPaths
          );
          originalCount = originalResult[0].count;
          
          // 4. 번역된 옵션 이미지 개수 조회 (imageurl_translated가 있는 것)
          const [translatedResult] = await promisePool.query(
            `SELECT COUNT(*) as count 
             FROM product_options 
             WHERE prop_path IN (${placeholders}) AND imageurl IS NOT NULL AND imageurl != '' 
             AND imageurl_translated IS NOT NULL AND imageurl_translated != ''`,
            propPaths
          );
          translatedCount = translatedResult[0].count;
          
          // 원본 이미지가 없거나, 모든 원본 이미지가 번역되었을 때 완료로 판단
          exists = originalCount === 0 || originalCount === translatedCount;
        }
      }
      
      // 모든 경우에 대해 통일된 완료 판단 로직 적용
      exists = originalCount === 0 || originalCount === translatedCount;
    }
    
    console.log(`[${productId}] ${type} 이미지 상태: 원본 ${originalCount}개, 번역됨 ${translatedCount}개, 완료: ${exists}`);
    
    return {
      exists: exists,
      count: originalCount, // 원본 이미지 개수 반환 (작업 카운트 감소용)
    };
  } catch (error) {
    console.error(`상품 ID ${productId}의 ${type} 이미지 번역 여부 확인 중 오류:`, error);
    throw error;
  }
};
