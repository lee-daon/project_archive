import { generateGeminiJson } from '../ai_config/gemini.js';
import { attributePrompt, GeminiAttributeSchema } from '../ai_config/geminiPrompt.js';
import { 
  isAttributeTranslated, 
  createAttributePromptData, 
  saveTranslatedAttributes 
} from '../db/detail.js';
import { 
  updateAttributeTranslated, 
  decreaseTaskCount
} from '../db/processingStatus.js';
import logger from '../../../common/utils/logger.js';

/**
 * 속성 번역 및 저장 처리 함수
 * 
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @returns {Promise<boolean>} 처리 성공 여부
 */
export async function translateAndSaveAttribute(userid, productid) {
  try {
    // 1. 이미 번역된 속성이 있는지 확인
    const isTranslated = await isAttributeTranslated(userid, productid);
    
    // 이미 번역되었으면 작업 완료로 처리하고 종료
    if (isTranslated) {
      logger.debug(`상품 ID ${productid}: 이미 번역된 속성이 있어 작업을 건너뜁니다.`);
      return true;
    }
    
    // 2. 번역할 속성 데이터 준비
    const promptData = await createAttributePromptData(userid, productid);
    
    // 3. Gemini API 호출하여 번역 요청
    const translatedAttributes = await generateGeminiJson(
      promptData,
      attributePrompt,
      GeminiAttributeSchema
    );
    
    // 4. 번역 결과 검증
    if (!translatedAttributes || !Array.isArray(translatedAttributes) || translatedAttributes.length === 0) {
      throw new Error('번역 결과가 유효하지 않습니다.');
    }
    
    // 5. 번역 결과 저장
    const saveResult = await saveTranslatedAttributes(userid, productid, translatedAttributes);
    
    if (!saveResult) {
      throw new Error('번역 결과 저장에 실패했습니다.');
    }

    
    logger.debug(`상품 ID ${productid}: 속성 번역 작업이 성공적으로 완료되었습니다.`);
    return true;
  } catch (error) {
    logger.error(error, { userid, productid });
    
    // 속성 번역 상태 업데이트 (실패: false)
    await updateAttributeTranslated(userid, productid, false);
    
    return false;
  } finally {
    // 작업 개수 감소 및 상태 업데이트
    try {
      await decreaseTaskCount(userid, productid);
    } catch (countError) {
      logger.error(countError, { userid, productid });
    }
  }
}
