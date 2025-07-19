import { promisePool } from '../../../common/utils/connectDB.js';

/**
 * 상품 속성 원본 데이터를 조회하는 함수
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @returns {Promise<Array<Object>>} 속성 정보 배열 [{ name_raw, value_raw, prop_order }]
 */
export async function getProductAttributesRaw(userid, productid) {
  try {
    const [rows] = await promisePool.execute(
      `SELECT name_raw, value_raw, prop_order
       FROM properties 
       WHERE productid = ? 
       ORDER BY prop_order ASC`,
      [productid]
    );
    
    return rows;
  } catch (error) {
    console.error(`상품 ID ${productid} 속성 원본 조회 중 오류:`, error);
    throw error;
  }
}

/**
 * 상품의 원본 상품명을 조회하는 함수
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @returns {Promise<string|null>} 원본 상품명 또는 null
 */
export async function getProductRawTitle(userid, productid) {
  try {
    const [rows] = await promisePool.execute(
      `SELECT title_raw
       FROM products_detail 
       WHERE userid = ? AND productid = ?`,
      [userid, productid]
    );
    
    return rows.length > 0 ? rows[0].title_raw : null;
  } catch (error) {
    console.error(`상품 ID ${productid} 원본 상품명 조회 중 오류:`, error);
    throw error;
  }
}


/**
 * 최적화된 상품명 저장 함수
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @param {string} optimizedTitle - 최적화된 상품명
 * @returns {Promise<boolean>} 저장 성공 여부
 */
export async function saveTranslatedTitle(userid, productid, optimizedTitle) {
  try {
    const [result] = await promisePool.execute(
      `UPDATE products_detail 
       SET title_optimized = ?
       WHERE userid = ? AND productid = ?`,
      [optimizedTitle, userid, productid]
    );
    
    return result.affectedRows > 0;
  } catch (error) {
    console.error(`상품 ID ${productid} 최적화 상품명 저장 중 오류:`, error);
    throw error;
  }
}

/**
 * 속성이 번역되었는지 확인하는 함수
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @returns {Promise<boolean>} 번역 여부
 */
export async function isAttributeTranslated(userid, productid) {
  try {
    const [rows] = await promisePool.execute(
      `SELECT COUNT(*) as count
       FROM properties 
       WHERE productid = ? 
       AND name_translated IS NOT NULL 
       AND value_translated IS NOT NULL`,
      [productid]
    );
    
    // 번역된 속성이 하나라도 있으면 true 반환
    return rows[0].count > 0;
  } catch (error) {
    console.error(`상품 ID ${productid} 속성 번역 확인 중 오류:`, error);
    throw error;
  }
}

/**
 * 번역된 속성 데이터를 저장하는 함수
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @param {Array<Object>} translatedAttributes - 번역된 속성 배열 [{"key": "번역된속성명", "value": "번역된속성값"}, ...]
 * @returns {Promise<boolean>} 저장 성공 여부
 */
export async function saveTranslatedAttributes(userid, productid, translatedAttributes) {
  const connection = await promisePool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // 기존 속성 정보 조회
    const [attributes] = await connection.execute(
      `SELECT prop_order, name_raw, value_raw
       FROM properties 
       WHERE productid = ? 
       ORDER BY prop_order ASC`,
      [productid]
    );
    
    // 번역 결과가 없거나 속성이 없으면 false 반환
    if (!translatedAttributes || translatedAttributes.length === 0 || attributes.length === 0) {
      return false;
    }
    
    // 번역 결과를 DB에 저장 (각 항목을 prop_order와 매핑)
    for (let i = 0; i < Math.min(attributes.length, translatedAttributes.length); i++) {
      const attribute = attributes[i];
      const translated = translatedAttributes[i];
      
      if (translated && translated.key && translated.value) {
        await connection.execute(
          `UPDATE properties 
           SET name_translated = ?, value_translated = ?
           WHERE productid = ? AND prop_order = ?`,
          [translated.key, translated.value, productid, attribute.prop_order]
        );
      }
    }
    
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    console.error(`상품 ID ${productid} 속성 번역 저장 중 오류:`, error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * 번역을 위한 속성 프롬프트 데이터 생성
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @returns {Promise<string>} 번역 프롬프트용 JSON 문자열
 */
export async function createAttributePromptData(userid, productid) {
  try {
    // 상품명 조회
    const [productInfo] = await promisePool.execute(
      `SELECT title_raw
       FROM products_detail 
       WHERE userid = ? AND productid = ?`,
      [userid, productid]
    );
    
    // 속성 정보 조회
    const attributes = await getProductAttributesRaw(userid, productid);
    
    // 번역을 위한 데이터 구조 생성
    const attributePairs = attributes.map(attr => ({
      [attr.name_raw]: attr.value_raw
    }));
    
    // 상품명과 속성 정보를 포함한 JSON 데이터 생성
    const promptData = {
      "상품명": productInfo.length > 0 ? productInfo[0].title_raw : "",
      "속성": attributePairs
    };
    
    return JSON.stringify(promptData);
  } catch (error) {
    console.error(`상품 ID ${productid} 속성 프롬프트 데이터 생성 중 오류:`, error);
    throw error;
  }
}


/**
 * 키워드 생성을 위한 프롬프트 데이터 생성
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @param {Array<string>} includeKeywords - 포함할 키워드 배열 (옵션)
 * @returns {Promise<string>} 키워드 생성 프롬프트용 문자열
 */
export async function createKeywordPromptData(userid, productid, includeKeywords = []) {
  try {
    // 상품명 조회
    const [productInfo] = await promisePool.execute(
      `SELECT title_raw 
       FROM products_detail 
       WHERE userid = ? AND productid = ?`,
      [userid, productid]
    );
    
    if (productInfo.length === 0) {
      throw new Error('상품 정보를 찾을 수 없습니다.');
    }
    
    // 상품명 사용 (우선순위: 번역된 상품명 > 원본 상품명)
    const productName =  productInfo[0].title_raw;
    
    // 프롬프트 데이터 객체 생성
    const promptData = {
      productName: productName
    };
    
    // 포함할 키워드가 있으면 추가
    if (Array.isArray(includeKeywords) && includeKeywords.length > 0) {
      promptData.include = includeKeywords;
    }
    
    return JSON.stringify(promptData);
  } catch (error) {
    console.error(`상품 ID ${productid} 키워드 프롬프트 데이터 생성 중 오류:`, error);
    throw error;
  }
}

/**
 * 생성된 키워드 저장 함수
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @param {Array<string>} keywords - 생성된 키워드 배열
 * @returns {Promise<boolean>} 저장 성공 여부
 */
export async function saveGeneratedKeywords(userid, productid, keywords) {
  try {
    // 배열을 '[키워드1,키워드2,...]' 형식의 문자열로 변환
    let keywordsString = '[';
    if (Array.isArray(keywords) && keywords.length > 0) {
      keywordsString += keywords.join(',');
    }
    keywordsString += ']';
    
    const [result] = await promisePool.execute(
      `UPDATE products_detail 
       SET keywords = ?
       WHERE userid = ? AND productid = ?`,
      [keywordsString, userid, productid]
    );
    
    return result.affectedRows > 0;
  } catch (error) {
    console.error(`상품 ID ${productid} 키워드 저장 중 오류:`, error);
    throw error;
  }
}
