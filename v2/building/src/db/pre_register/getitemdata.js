/**
 * @fileoverview 상품 정보 관련 데이터베이스 접근 모듈
 * 상품의 기본 정보, 이미지, 속성, 옵션 등 관련 데이터를 DB에서 조회하는 기능을 제공합니다.
 * 이 모듈은 DB 계층으로 순수 데이터 접근만 담당하며, 데이터 가공은 서비스 계층에서 수행합니다.
 */

import { promisePool } from '../connectDB.js';

/**
 * 상품의 기본 정보를 데이터베이스에서 조회합니다. (필드명 변경)
 * @param {string} productid - 조회할 상품의 ID
 * @returns {Promise<Object|null>} 상품 기본 정보 객체 또는 상품이 없을 경우 null
 */
export async function fetchProductBasicInfo(productid) {
  let connection;
  try {
    connection = await promisePool.getConnection();
    const [basicInfo] = await connection.query(`
      SELECT pd.title_raw AS productNameOrigin, 
             pd.title_translated, 
             pd.title_optimized,
             pd.catid AS categoryId, 
             pd.brand_name, 
             pd.brand_name_translated, 
             pd.detail_url AS url, 
             pd.delivery_fee AS deliveryFee, 
             pd.video, 
             pd.keywords
      FROM products_detail pd
      WHERE pd.productid = ?
    `, [productid]);
    
    // productName 결정 로직은 서비스 레이어에서 처리
    return basicInfo.length > 0 ? basicInfo[0] : null;
  } catch (error) {
    console.error('기본 정보 조회 오류:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * 상품의 누끼 이미지 정보를 조회합니다.
 * 
 * @param {string} productid - 조회할 상품의 ID
 * @returns {Promise<Array>} 누끼 이미지 정보 배열
 * @throws {Error} 데이터베이스 조회 중 오류 발생 시
 */
export async function fetchNukkiImages(productid) {
  let connection;
  try {
    connection = await promisePool.getConnection();
    const [nukkiImage] = await connection.query(`
      SELECT image_url FROM nukki_image WHERE productid = ?
    `, [productid]);
    
    return nukkiImage;
  } catch (error) {
    console.error('누끼 이미지 조회 오류:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * 상품의 번역된 일반 이미지 정보를 조회합니다.
 * 
 * @param {string} productid - 조회할 상품의 ID
 * @returns {Promise<Array>} 번역된 이미지 정보 배열
 * @throws {Error} 데이터베이스 조회 중 오류 발생 시
 */
export async function fetchTranslatedImages(productid) {
  let connection;
  try {
    connection = await promisePool.getConnection();
    const [translatedImages] = await connection.query(`
      SELECT imageurl, imageorder FROM item_image_translated 
      WHERE productid = ? ORDER BY imageorder
    `, [productid]);
    
    return translatedImages;
  } catch (error) {
    console.error('번역된 이미지 조회 오류:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * 상품의 원본 일반 이미지 정보를 조회합니다.
 * 
 * @param {string} productid - 조회할 상품의 ID
 * @returns {Promise<Array>} 원본 이미지 정보 배열
 * @throws {Error} 데이터베이스 조회 중 오류 발생 시
 */
export async function fetchRawImages(productid) {
  let connection;
  try {
    connection = await promisePool.getConnection();
    const [rawImages] = await connection.query(`
      SELECT imageurl, imageorder FROM item_images_raw 
      WHERE productid = ? ORDER BY imageorder
    `, [productid]);
    
    return rawImages;
  } catch (error) {
    console.error('원본 이미지 조회 오류:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * 상품의 번역된 설명 이미지 정보를 조회합니다.
 * 
 * @param {string} productid - 조회할 상품의 ID
 * @returns {Promise<Array>} 번역된 설명 이미지 정보 배열
 * @throws {Error} 데이터베이스 조회 중 오류 발생 시
 */
export async function fetchTranslatedDescImages(productid) {
  let connection;
  try {
    connection = await promisePool.getConnection();
    const [translatedDesImages] = await connection.query(`
      SELECT imageurl FROM item_image_des_translated 
      WHERE productid = ? ORDER BY imageorder
    `, [productid]);
    
    return translatedDesImages;
  } catch (error) {
    console.error('번역된 설명 이미지 조회 오류:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * 상품의 원본 설명 이미지 정보를 조회합니다.
 * 
 * @param {string} productid - 조회할 상품의 ID
 * @returns {Promise<Array>} 원본 설명 이미지 정보 배열
 * @throws {Error} 데이터베이스 조회 중 오류 발생 시
 */
export async function fetchRawDescImages(productid) {
  let connection;
  try {
    connection = await promisePool.getConnection();
    const [rawDesImages] = await connection.query(`
      SELECT imageurl FROM item_images_des_raw 
      WHERE productid = ? ORDER BY imageorder
    `, [productid]);
    
    return rawDesImages;
  } catch (error) {
    console.error('원본 설명 이미지 조회 오류:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * 상품의 속성 정보를 조회합니다. (필드명 변경)
 * @param {string} productid - 조회할 상품의 ID
 * @returns {Promise<Array>} 속성 정보 배열
 */
export async function fetchProperties(productid) {
  let connection;
  try {
    connection = await promisePool.getConnection();
    const [properties] = await connection.query(`
      SELECT name_raw, value_raw, 
             name_translated, value_translated
      FROM properties WHERE productid = ? ORDER BY prop_order
    `, [productid]);
    
    // name, value 결정 로직은 서비스 레이어에서 처리
    return properties;
  } catch (error) {
    console.error('속성 정보 조회 오류:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * 상품의 SKU(Stock Keeping Unit) 데이터를 조회합니다. (기존 로직 유지)
 * @param {string} productId - 조회할 상품의 ID
 * @returns {Promise<Array>} SKU 데이터 배열
 */
export async function fetchSkuData(productId) {
  let connection;
  try {
    connection = await promisePool.getConnection();
    const [skusRows] = await connection.execute(
      'SELECT prop_path, price, promotionprice, quantity FROM skus WHERE productid = ?',
      [productId]
    );
    return skusRows;
  } catch (error) {
    console.error('SKU 데이터 조회 오류:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * 상품과 관련된 모든 옵션 정보를 조회합니다. (신규 함수)
 * @param {string} productId - 조회할 상품의 ID
 * @returns {Promise<Array>} 옵션 정보 배열
 */
export async function fetchAllOptions(productId) {
  let connection;
  try {
    connection = await promisePool.getConnection();
    // product_options 테이블에서 이 상품의 SKU와 연결된 모든 고유 옵션 정보 조회
    const [options] = await connection.execute(`
      SELECT DISTINCT 
             po.prop_path, 
             po.optionname, 
             po.translated_optionname, 
             po.optionvalue, 
             po.translated_optionvalue,
             po.imageurl, 
             po.imageurl_translated
      FROM product_options po
      JOIN skus s ON FIND_IN_SET(po.prop_path, REPLACE(s.prop_path, ';', ','))
      WHERE s.productid = ?
    `, [productId]);
    return options;
  } catch (error) {
    console.error('옵션 전체 정보 조회 오류:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}
