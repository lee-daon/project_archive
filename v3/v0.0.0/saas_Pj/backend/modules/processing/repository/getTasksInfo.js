import { promisePool } from '../../../common/utils/connectDB.js';

/**
 * 상품 ID를 기반으로 skus 테이블에서 prop_path 정보를 조회하는 함수
 * skus 테이블의 prop_path는 세미콜론(;)으로 구분된 형태이므로 분리하여 중복 제거 후 반환
 * 
 * @param {number} productId - 상품 ID
 * @returns {Promise<Array<string>>} - 중복 제거된 개별 prop_path 배열
 */
export async function getPropPaths(productId) {
  try {
    const connection = await promisePool.getConnection();
    
    try {
      const [rows] = await connection.query(
        'SELECT prop_path FROM skus WHERE productid = ?',
        [productId]
      );
      
      // 모든 prop_path를 세미콜론으로 분리하고 중복 제거
      const allPropPaths = new Set();
      
      rows.forEach(row => {
        if (row.prop_path) {
          // 세미콜론으로 분리하여 개별 prop_path 추출
          const individualPaths = row.prop_path.split(';');
          individualPaths.forEach(path => {
            const trimmedPath = path.trim();
            if (trimmedPath) {
              allPropPaths.add(trimmedPath);
            }
          });
        }
      });
      
      return Array.from(allPropPaths);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(`상품 ID ${productId}의 prop_path 조회 중 오류 발생:`, error);
    throw error;
  }
}

/**
 * 작업 개수를 계산하는 함수
 * 
 * @param {Object} options - 작업 옵션
 * @param {number} propPathCount - prop_path 개수
 * @param {number} mainImageCount - 메인 이미지 개수
 * @param {number} descImageCount - 상세 이미지 개수
 * @param {number} optionImageCount - 옵션 이미지 개수
 * @returns {Object} - 작업 개수 객체
 */
export async function calculateTaskCounts(options, propPathCount, mainImageCount, descImageCount, optionImageCount) {
  try {
    // 이미지 작업 개수 계산
    let imgTasksCount = 0;
    
    if (options.imageTranslation?.main) {
      imgTasksCount += mainImageCount;
    }
    
    if (options.imageTranslation?.detail) {
      imgTasksCount += descImageCount;
    }
    
    if (options.imageTranslation?.option) {
      imgTasksCount += optionImageCount;
    }
    
    // 옵션 작업 개수 계산
    const optionTasksCount = options.optionTranslation ? propPathCount : 0;
    
    // 전체 작업 개수 계산 (속성 번역, 키워드 생성, SEO 최적화, 누끼 이미지 생성)
    let overallTasksCount = 0;
    
    if (options.attributeTranslation) {
      overallTasksCount += 1;
    }
    
    if (options.keyword?.type) {
      overallTasksCount += 1;
    }
    
    if (options.seo?.type) {
      overallTasksCount += 1;
    }
    
    if (options.nukkiImages?.enabled) {
      overallTasksCount += 1;
    }
    
    return {
      imgTasksCount,
      optionTasksCount,
      overallTasksCount
    };
  } catch (error) {
    console.error('작업 개수 계산 중 오류 발생:', error);
    throw error;
  }
}

/**
 * 상품의 이미지 개수를 조회하는 함수
 * 
 * @param {number} productId - 상품 ID
 * @returns {Promise<Object>} - 이미지 개수 객체
 */
export async function getImageCounts(productId) {
  try {
    const connection = await promisePool.getConnection();
    
    try {
      // 메인 이미지 개수 조회
      const [mainImageRows] = await connection.query(
        'SELECT COUNT(*) as count FROM item_images_raw WHERE productid = ?',
        [productId]
      );
      
      // 상세 이미지 개수 조회
      const [descImageRows] = await connection.query(
        'SELECT COUNT(*) as count FROM item_images_des_raw WHERE productid = ?',
        [productId]
      );
      
      // 옵션 이미지 개수 조회 - skus 테이블의 prop_path를 세미콜론으로 분리하여 처리
      let optionImageCount = 0;
      
      // 1. skus 테이블에서 prop_path 조회
      const [skus] = await connection.query(
        'SELECT prop_path FROM skus WHERE productid = ?',
        [productId]
      );
      
      if (skus.length > 0) {
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
        
        if (allPropPaths.size > 0) {
          // 3. 중복 제거된 prop_path로 이미지가 있는 옵션 개수 확인
          const propPaths = Array.from(allPropPaths);
          const placeholders = propPaths.map(() => '?').join(',');
          
          const [optionImageRows] = await connection.query(
            `SELECT COUNT(*) as count FROM product_options WHERE imageurl IS NOT NULL AND imageurl != "" AND prop_path IN (${placeholders})`,
            propPaths
          );
          
          optionImageCount = optionImageRows[0].count;
        }
      }
      
      return {
        mainImageCount: mainImageRows[0].count,
        descImageCount: descImageRows[0].count,
        optionImageCount: optionImageCount
      };
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(`상품 ID ${productId}의 이미지 개수 조회 중 오류 발생:`, error);
    throw error;
  }
}
