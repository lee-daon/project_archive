import { generateGeminiJson } from '../ai_config/gemini.js';
import { optionPrompt, GeminiOptionSchema } from '../ai_config/geminiPrompt.js';
import { 
  isOptionTranslated, 
  createOptionPromptData, 
  saveTranslatedOption 
} from '../db/options.js';
import { 
  updateOptionTranslated, 
  decreaseOptionTaskCount
} from '../db/processingStatus.js';
import logger from '../../../common/utils/logger.js';

/**
 * 옵션 번역 및 저장 처리 함수
 * 
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @param {string} propPath - 옵션 속성 경로
 * @returns {Promise<boolean>} 처리 성공 여부
 */
export async function translateAndSaveOption(userid, productid, propPath) {
  try {
    // 1. 이미 번역된 옵션이 있는지 확인
    const isTranslated = await isOptionTranslated(userid, productid, propPath);
    
    // 이미 번역되었으면 작업 완료로 처리하고 종료
    if (isTranslated) {
      logger.debug(`상품 ID ${productid}, 속성 경로 ${propPath}: 이미 번역된 옵션이 있어 작업을 건너뜁니다.`);
      return true;
    }
    
    // 2. 번역할 옵션 데이터 준비
    const promptData = await createOptionPromptData(userid, productid, propPath);
    
    // 3. Gemini API 호출하여 번역 요청
    const translatedOption = await generateGeminiJson(
      JSON.stringify(promptData),
      optionPrompt,
      GeminiOptionSchema
    );
    
    // 4. 번역 결과 검증
    if (!translatedOption || !translatedOption.translated_optionname || !translatedOption.translated_optionvalue) {
      // 번역 결과가 없는 경우, 원본 값을 그대로 사용
      logger.warn(`상품 ID ${productid}, 속성 경로 ${propPath}: 번역 결과가 유효하지 않아 원본 값을 사용합니다.`);
      translatedOption = {
        translated_optionname: promptData.optionname,
        translated_optionvalue: promptData.optionvalue
      };
    }
    
    // 5. 번역 결과 저장
    const saveResult = await saveTranslatedOption(userid, productid, propPath, translatedOption);
    
    if (!saveResult) {
      throw new Error('옵션 번역 결과 저장에 실패했습니다.');
    }
    
    logger.debug(`상품 ID ${productid}, 속성 경로 ${propPath}: 옵션 번역 작업이 성공적으로 완료되었습니다.`);
    return true;
  } catch (error) {
    logger.error(error, { userid, productid });
    
    // 옵션 번역 상태 업데이트 (실패: false)
    await updateOptionTranslated(userid, productid, false);
    
    return false;
  } finally {
    // 옵션 작업 개수 감소 및 상태 업데이트
    try {
      await decreaseOptionTaskCount(userid, productid);
    } catch (countError) {
      logger.error(countError, { userid, productid });
    }
  }
}
