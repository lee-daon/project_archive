import { promisePool } from '../../../common/utils/connectDB.js';

/**
 * 옵션이 이미 번역되었는지 확인하는 함수
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @param {string} propPath - 옵션 속성 경로
 * @returns {Promise<boolean>} 이미 번역되었는지 여부
 */
export async function isOptionTranslated(userid, productid, propPath) {
  try {
    const [rows] = await promisePool.execute(
      `SELECT translated_optionname, translated_optionvalue 
       FROM product_options 
       WHERE prop_path = ?`,
      [propPath]
    );
    
    // 번역된 옵션명과 값이 모두 존재하면 이미 번역됨으로 간주
    return rows.length > 0 && 
           rows[0].translated_optionname && 
           rows[0].translated_optionvalue;
  } catch (error) {
    console.error(`상품 ID ${productid}, 속성 경로 ${propPath} 번역 상태 확인 중 오류:`, error);
    throw error;
  }
}

/**
 * 번역할 옵션 데이터 준비 함수
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @param {string} propPath - 옵션 속성 경로
 * @returns {Promise<Object>} 번역할 옵션 데이터
 */
export async function createOptionPromptData(userid, productid, propPath) {
  try {
    const [rows] = await promisePool.execute(
      `SELECT optionname, optionvalue 
       FROM product_options 
       WHERE prop_path = ?`,
      [propPath]
    );
    
    if (rows.length === 0) {
      throw new Error(`속성 경로 ${propPath}에 해당하는 옵션을 찾을 수 없습니다.`);
    }
    
    return {
      optionname: rows[0].optionname,
      optionvalue: rows[0].optionvalue
    };
  } catch (error) {
    console.error(`상품 ID ${productid}, 속성 경로 ${propPath} 옵션 데이터 준비 중 오류:`, error);
    throw error;
  }
}

/**
 * 번역된 옵션 저장 함수
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @param {string} propPath - 옵션 속성 경로
 * @param {Object} translatedOption - 번역된 옵션 데이터
 * @returns {Promise<boolean>} 저장 성공 여부
 */
export async function saveTranslatedOption(userid, productid, propPath, translatedOption) {
  try {
    // 옵션명과 옵션값이 25글자를 초과하지 않도록 제한
    const limitedOptionName = translatedOption.translated_optionname?.substring(0, 25) || '';
    const limitedOptionValue = translatedOption.translated_optionvalue?.substring(0, 25) || '';
    
    const [result] = await promisePool.execute(
      `UPDATE product_options 
       SET translated_optionname = ?, 
           translated_optionvalue = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE prop_path = ?`,
      [
        limitedOptionName,
        limitedOptionValue,
        propPath
      ]
    );
    
    return result.affectedRows > 0;
  } catch (error) {
    console.error(`상품 ID ${productid}, 속성 경로 ${propPath} 번역 결과 저장 중 오류:`, error);
    throw error;
  }
}
