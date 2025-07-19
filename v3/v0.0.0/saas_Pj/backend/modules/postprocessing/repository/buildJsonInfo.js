import { promisePool } from '../../../common/utils/connectDB.js';

/**
 * 상품 기본 정보를 가져오는 함수
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @returns {Promise<Object|null>} 상품 기본 정보
 */
export const fetchProductBasicInfo = async (userid, productid) => {
  try {
    const [rows] = await promisePool.query(
      `SELECT 
        productid,
        detail_url as url,
        COALESCE(title_optimized, title_translated, title_raw) as productName,
        catid as categoryId,
        COALESCE(brand_name_translated, brand_name) as brandName,
        delivery_fee as deliveryFee,
        video,
        keywords
      FROM products_detail 
      WHERE userid = ? AND productid = ?`,
      [userid, productid]
    );
    
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error(`상품 기본 정보 조회 실패 (userid: ${userid}, productid: ${productid}):`, error);
    throw error;
  }
};

/**
 * 대표 이미지를 가져오는 함수 (누끼 이미지 우선, 없으면 메인 이미지의 첫 번째)
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @returns {Promise<string|null>} 대표 이미지 URL
 */
export const fetchRepresentativeImage = async (userid, productid) => {
  try {
    // 먼저 누끼 이미지가 있는지 확인
    const [nukkiRows] = await promisePool.query(
      `SELECT image_url 
      FROM private_nukki_image 
      WHERE userid = ? AND productid = ? 
      ORDER BY image_order ASC 
      LIMIT 1`,
      [userid, productid]
    );
    
    if (nukkiRows.length > 0) {
      return nukkiRows[0].image_url;
    }
    
    // 누끼 이미지가 없으면 메인 이미지의 첫 번째 (image_order가 가장 낮은 것)
    const [mainRows] = await promisePool.query(
      `SELECT imageurl 
      FROM private_main_image 
      WHERE userid = ? AND productid = ? 
      ORDER BY imageorder ASC 
      LIMIT 1`,
      [userid, productid]
    );
    
    return mainRows.length > 0 ? mainRows[0].imageurl : null;
  } catch (error) {
    console.error(`대표 이미지 조회 실패 (userid: ${userid}, productid: ${productid}):`, error);
    throw error;
  }
};

/**
 * 메인 이미지 배열을 가져오는 함수 (대표 이미지 제외)
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @param {string} representativeImageUrl - 대표 이미지 URL (제외할 이미지)
 * @returns {Promise<Array>} 이미지 URL 배열
 */
export const fetchMainImages = async (userid, productid, representativeImageUrl) => {
  try {
    const [rows] = await promisePool.query(
      `SELECT imageurl 
      FROM private_main_image 
      WHERE userid = ? AND productid = ? 
      ORDER BY imageorder ASC`,
      [userid, productid]
    );
    
    // 대표 이미지와 동일한 URL은 제외
    return rows
      .map(row => row.imageurl)
      .filter(url => url !== representativeImageUrl);
  } catch (error) {
    console.error(`메인 이미지 조회 실패 (userid: ${userid}, productid: ${productid}):`, error);
    throw error;
  }
};

/**
 * 상세 설명 이미지 배열을 가져오는 함수
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @returns {Promise<Array>} 상세 이미지 URL 배열
 */
export const fetchDescriptionImages = async (userid, productid) => {
  try {
    const [rows] = await promisePool.query(
      `SELECT imageurl 
      FROM private_description_image 
      WHERE userid = ? AND productid = ? 
      ORDER BY imageorder ASC`,
      [userid, productid]
    );
    
    return rows.map(row => row.imageurl);
  } catch (error) {
    console.error(`상세 이미지 조회 실패 (userid: ${userid}, productid: ${productid}):`, error);
    throw error;
  }
};

/**
 * 속성 정보를 가져오는 함수
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @returns {Promise<Array>} 속성 배열
 */
export const fetchAttributes = async (userid, productid) => {
  try {
    const [rows] = await promisePool.query(
      `SELECT property_name as name, property_value as value 
      FROM private_properties 
      WHERE userid = ? AND productid = ? 
      ORDER BY property_order ASC`,
      [userid, productid]
    );
    
    return rows.filter(row => row.name && row.value && row.name !== "null" && row.value !== "null");
  } catch (error) {
    console.error(`속성 정보 조회 실패 (userid: ${userid}, productid: ${productid}):`, error);
    throw error;
  }
};

/**
 * SKU 데이터를 가져오는 함수
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @returns {Promise<Array>} SKU 배열
 */
export const fetchSkuData = async (userid, productid) => {
  try {
    const [rows] = await promisePool.query(
      `SELECT prop_path, price, promotionprice, quantity 
      FROM skus 
      WHERE productid = ? 
      ORDER BY skus_order ASC`,
      [productid]
    );
    
    return rows;
  } catch (error) {
    console.error(`SKU 데이터 조회 실패 (userid: ${userid}, productid: ${productid}):`, error);
    throw error;
  }
};

/**
 * 개인 옵션 정보를 가져오는 함수
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @returns {Promise<Array>} 옵션 배열
 */
export const fetchPrivateOptions = async (userid, productid) => {
  try {
    const [rows] = await promisePool.query(
      `SELECT prop_path, private_optionname, private_optionvalue, private_imageurl 
      FROM private_options 
      WHERE userid = ? AND productid = ?`,
      [userid, productid]
    );
    
    return rows;
  } catch (error) {
    console.error(`개인 옵션 정보 조회 실패 (userid: ${userid}, productid: ${productid}):`, error);
    throw error;
  }
};
