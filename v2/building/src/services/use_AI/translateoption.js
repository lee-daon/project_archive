import { translateOptionPrompt } from './gemini.js';
import { promisePool } from '../../db/connectDB.js';
import pLimit from 'p-limit';

/**
 * prop_path에 해당하는 옵션을 번역하고 데이터베이스에 업데이트합니다.
 * 
 * @param {string} propPath - 번역할 옵션의 prop_path (예: "pid:vid")
 * @returns {Promise<boolean>} - 성공 여부
 */
async function updateOptionTranslation(propPath) {
  try {
    // 해당 propPath의 옵션명과 옵션값 조회
    const [rows] = await promisePool.execute(
      'SELECT optionname, optionvalue, translated_optionname, translated_optionvalue FROM product_options WHERE prop_path = ?',
      [propPath]
    );

    if (rows.length === 0) {
      console.log(`propPath ${propPath}에 해당하는 데이터가 없습니다.`);
      return false;
    }

    const option = rows[0];
    
    // 이미 번역된 경우 건너뛰기
    if (option.translated_optionname && option.translated_optionvalue) {
      console.log(`propPath ${propPath}의 옵션은 이미 번역되어 있습니다. 업데이트를 건너뜁니다.`);
      return true;
    }
    
    // 번역 데이터 준비
    const translationInput = {
      optionname: option.optionname,
      optionvalue: option.optionvalue
    };
    
    // 번역 함수 호출
    const translatedOption = await translateOptionPrompt(translationInput);
    
    // 옵션명과 옵션값이 25글자를 초과하지 않도록 제한
    const limitedOptionName = translatedOption.translated_optionname?.substring(0, 25) || '';
    const limitedOptionValue = translatedOption.translated_optionvalue?.substring(0, 25) || '';
    
    // 번역 결과 데이터베이스에 저장
    await promisePool.execute(
      'UPDATE product_options SET translated_optionname = ?, translated_optionvalue = ? WHERE prop_path = ?',
      [
        limitedOptionName, 
        limitedOptionValue, 
        propPath
      ]
    );
    
    //console.log(`propPath ${propPath}의 옵션이 성공적으로 번역되었습니다.`);
    //console.log(`옵션명: ${option.optionname} -> ${translatedOption.translated_optionname}`);
    //console.log(`옵션값: ${option.optionvalue} -> ${translatedOption.translated_optionvalue}`);
    
    return true;
  } catch (error) {
    console.error(`propPath ${propPath} 번역 중 에러 발생:`, error);
    return false;
  }
}

/**
 * propPaths 배열을 받아 각 옵션을 번역하고 데이터베이스에 업데이트합니다.
 * 동시성 제한을 통해 비동기 작업을 관리합니다.
 * 
 * @param {Array<string>} propPaths - 번역할 옵션의 prop_path 배열
 * @returns {Promise<Object>} - 번역 작업 결과
 */
export default async function translateOption(propPaths) {
  const concurrencyLimit = 5; // 동시에 실행할 최대 비동기 작업 수
  const limit = pLimit(concurrencyLimit);
  const tasks = [];
  
  if (!propPaths || propPaths.length === 0) {
    console.log("번역할 옵션이 없습니다.");
    return { success: false, message: "번역할 옵션이 없습니다." };
  }

  try {
    console.log(`총 ${propPaths.length}개의 옵션을 번역합니다.`);
    
    // 각 propPath에 대해 번역 작업 등록
    for (const propPath of propPaths) {
      tasks.push(limit(() => updateOptionTranslation(propPath)));
    }

    // 모든 작업이 완료될 때까지 대기
    const results = await Promise.all(tasks);
    
    const successCount = results.filter(result => result === true).length;
    
    return {
      success: true,
      totalCount: propPaths.length,
      successCount: successCount,
      failCount: propPaths.length - successCount
    };
  } catch (error) {
    console.error('옵션 번역 중 오류 발생:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
  
