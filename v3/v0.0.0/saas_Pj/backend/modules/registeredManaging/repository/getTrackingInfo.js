import { promisePool } from '../../../common/utils/connectDB.js';

/**
 * 특정 사용자의 상품 정보를 가져오는 함수
 * @param {number} userid - 사용자 ID
 * @param {string} productid - 상품 ID
 * @returns {Promise<Object>} 상품 정보
 */
export async function getProductInfo(userid, productid) {
  try {
    const [productRows] = await promisePool.execute(
      `SELECT 
         pd.productid,
         COALESCE(pd.title_optimized, pd.title_translated, pd.title_raw) as productName,
         pr.product_group_code as groupCode
       FROM products_detail pd
       LEFT JOIN pre_register pr ON pd.userid = pr.userid AND pd.productid = pr.productid
       WHERE pd.userid = ? AND pd.productid = ?`,
      [userid, productid]
    );

    if (productRows.length === 0) {
      return null;
    }

    // 메인 이미지 가져오기 (imageorder 최소값)
    const [imageRows] = await promisePool.execute(
      `SELECT imageurl 
       FROM private_main_image 
       WHERE userid = ? AND productid = ? 
       ORDER BY imageorder ASC 
       LIMIT 1`,
      [userid, productid]
    );

    // 쿠팡 등록 정보 가져오기
    const [coopangRows] = await promisePool.execute(
      `SELECT 
         registered_product_number as productNumber,
         current_margin
       FROM coopang_register_management 
       WHERE userid = ? AND productid = ?`,
      [userid, productid]
    );

    // 네이버 등록 정보 가져오기
    const [naverRows] = await promisePool.execute(
      `SELECT 
         originProductNo as productNumber,
         current_margin
       FROM naver_register_management 
       WHERE userid = ? AND productid = ?`,
      [userid, productid]
    );

    // 11번가 등록 정보 가져오기
    const [elevenstoreRows] = await promisePool.execute(
      `SELECT 
         originProductNo as productNumber,
         current_margin
       FROM elevenstore_register_management 
       WHERE userid = ? AND productid = ?`,
      [userid, productid]
    );

    // ESM 등록 정보 가져오기
    const [esmRows] = await promisePool.execute(
      `SELECT 
         originProductNo as productNumber,
         current_margin
       FROM esm_register_management 
       WHERE userid = ? AND productid = ?`,
      [userid, productid]
    );

    return {
      ...productRows[0],
      imageUrl: imageRows[0]?.imageurl || null,
      platforms: {
        coopang: coopangRows[0] ? {
          productNumber: coopangRows[0].productNumber,
          currentMargin: coopangRows[0].current_margin
        } : null,
        naver: naverRows[0] ? {
          productNumber: naverRows[0].productNumber,
          currentMargin: naverRows[0].current_margin
        } : null,
        elevenstore: elevenstoreRows[0] ? {
          productNumber: elevenstoreRows[0].productNumber,
          currentMargin: elevenstoreRows[0].current_margin
        } : null,
        esm: esmRows[0] ? {
          productNumber: esmRows[0].productNumber,
          currentMargin: esmRows[0].current_margin
        } : null
      }
    };

  } catch (error) {
    console.error('상품 정보 조회 중 오류:', error);
    throw error;
  }
}

/**
 * 특정 사용자의 여러 상품 정보를 가져오는 함수
 * @param {number} userid - 사용자 ID
 * @param {string[]} productIds - 상품 ID 배열
 * @returns {Promise<Object[]>} 상품 정보 배열
 */
export async function getMultipleProductInfo(userid, productIds) {
  try {
    if (!productIds || productIds.length === 0) {
      return [];
    }

    const placeholders = productIds.map(() => '?').join(',');
    
    // 상품 기본 정보 조회
    const [productRows] = await promisePool.execute(
      `SELECT 
         pd.productid,
         COALESCE(pd.title_optimized, pd.title_translated, pd.title_raw) as productName,
         pr.product_group_code as groupCode
       FROM products_detail pd
       LEFT JOIN pre_register pr ON pd.userid = pr.userid AND pd.productid = pr.productid
       WHERE pd.userid = ? AND pd.productid IN (${placeholders})`,
      [userid, ...productIds]
    );

    // 각 상품별 이미지 정보 조회
    const [imageRows] = await promisePool.execute(
      `SELECT productid, imageurl, imageorder
       FROM private_main_image 
       WHERE userid = ? AND productid IN (${placeholders})
       ORDER BY productid, imageorder ASC`,
      [userid, ...productIds]
    );

    // 쿠팡 등록 정보 조회
    const [coopangRows] = await promisePool.execute(
      `SELECT 
         productid,
         registered_product_number as productNumber,
         current_margin
       FROM coopang_register_management 
       WHERE userid = ? AND productid IN (${placeholders})`,
      [userid, ...productIds]
    );

    // 네이버 등록 정보 조회
    const [naverRows] = await promisePool.execute(
      `SELECT 
         productid,
         originProductNo as productNumber,
         current_margin
       FROM naver_register_management 
       WHERE userid = ? AND productid IN (${placeholders})`,
      [userid, ...productIds]
    );

    // 11번가 등록 정보 조회
    const [elevenstoreRows] = await promisePool.execute(
      `SELECT 
         productid,
         originProductNo as productNumber,
         current_margin
       FROM elevenstore_register_management 
       WHERE userid = ? AND productid IN (${placeholders})`,
      [userid, ...productIds]
    );

    // ESM 등록 정보 조회
    const [esmRows] = await promisePool.execute(
      `SELECT 
         productid,
         originProductNo as productNumber,
         current_margin
       FROM esm_register_management 
       WHERE userid = ? AND productid IN (${placeholders})`,
      [userid, ...productIds]
    );

    // 데이터 결합
    const result = productRows.map(product => {
      // 해당 상품의 첫 번째 이미지 찾기
      const productImage = imageRows.find(img => img.productid === product.productid);
      
      // 해당 상품의 플랫폼 정보 찾기
      const coopangInfo = coopangRows.find(c => c.productid === product.productid);
      const naverInfo = naverRows.find(n => n.productid === product.productid);
      const elevenstoreInfo = elevenstoreRows.find(e => e.productid === product.productid);
      const esmInfo = esmRows.find(e => e.productid === product.productid);

      return {
        ...product,
        imageUrl: productImage?.imageurl || null,
        platforms: {
          coopang: coopangInfo ? {
            productNumber: coopangInfo.productNumber,
            currentMargin: coopangInfo.current_margin
          } : null,
          naver: naverInfo ? {
            productNumber: naverInfo.productNumber,
            currentMargin: naverInfo.current_margin
          } : null,
          elevenstore: elevenstoreInfo ? {
            productNumber: elevenstoreInfo.productNumber,
            currentMargin: elevenstoreInfo.current_margin
          } : null,
          esm: esmInfo ? {
            productNumber: esmInfo.productNumber,
            currentMargin: esmInfo.current_margin
          } : null
        }
      };
    });

    return result;

  } catch (error) {
    console.error('여러 상품 정보 조회 중 오류:', error);
    throw error;
  }
}



