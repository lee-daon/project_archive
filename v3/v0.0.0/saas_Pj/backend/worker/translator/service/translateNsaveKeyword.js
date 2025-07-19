import { generateGeminiJson } from '../ai_config/gemini.js';
import { 
  keywordGenerationprompt, 
  GeminiKeywordSchema,
  imageKeywordGenerationPrompt
} from '../ai_config/geminiPrompt.js';
import { 
  createKeywordPromptData, 
  saveGeneratedKeywords 
} from '../db/detail.js';
import { 
  updateKeywordGenerated, 
  decreaseTaskCount
} from '../db/processingStatus.js';
import logger from '../../../common/utils/logger.js';
import { generateImageBasedKeywords } from './advancedProcess.js';
import { isKeywordSpacingAllowed } from '../db/checkSpacing.js';

/**
 * 키워드 생성 및 저장 처리 함수
 * 
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @param {string} keywordType - 키워드 생성 타입 ("basic" 또는 "advanced")
 * @param {Array<string>} include - 포함할 키워드 배열 (예: ["brand", "category"])
 * @returns {Promise<boolean>} 처리 성공 여부
 */
export async function generateAndSaveKeywords(userid, productid, keywordType = "basic", include = []) {
  logger.debug(`[${productid}] 키워드 생성 시작 - 타입: ${keywordType}`);
  
  try {
    
    // 2. 키워드 생성 데이터 준비
    const promptData = await createKeywordPromptData(userid, productid, include);
    
    // 3. 키워드 생성 타입에 따라 서로 다른 API 호출
    let generatedKeywords;
    
    if (keywordType === "advanced") {
      // 이미지 기반 고급 키워드 생성 호출 (productid를 직접 전달)
      generatedKeywords = await generateImageBasedKeywords(
        promptData, 
        productid, 
        imageKeywordGenerationPrompt,
        GeminiKeywordSchema
      );
    } else {
      // 기본 텍스트 기반 키워드 생성 호출
      generatedKeywords = await generateGeminiJson(
        promptData,
        keywordGenerationprompt,
        GeminiKeywordSchema
      );
    }
    
    // 4. 생성 결과 검증
    if (!generatedKeywords || !Array.isArray(generatedKeywords) || generatedKeywords.length === 0) {
      throw new Error('키워드 생성 결과가 유효하지 않습니다.');
    }
    
    // 중국어, 특수문자 필터링 (공백은 유지)
    generatedKeywords = generatedKeywords.map(keyword => {
      if (typeof keyword === 'string') {
        // 한글, 영어, 숫자, 공백을 제외한 모든 문자 제거
        return keyword.replace(/[^a-zA-Z0-9ㄱ-ㅎㅏ-ㅣ가-힣\s]/g, '');
      }
      return keyword;
    }).filter(keyword => typeof keyword === 'string' && keyword.trim().length > 0); // 유효한 문자열 키워드만 남김

    // 4.5. 뛰어쓰기 설정 확인 및 처리
    const spacingAllowed = await isKeywordSpacingAllowed(userid);
    
    if (!spacingAllowed) {
      // 뛰어쓰기가 허용되지 않는 경우 모든 키워드에서 공백 제거
      generatedKeywords = generatedKeywords.map(keyword => {
        if (typeof keyword === 'string') {
          return keyword.replace(/\s+/g, ''); // 모든 공백 제거
        }
        return keyword;
      });
      
      logger.debug(`[${productid}] 뛰어쓰기 미허용 설정으로 키워드 공백 제거 적용`);
    }
    
    // 5. 생성 결과 저장
    const saveResult = await saveGeneratedKeywords(userid, productid, generatedKeywords);
    
    if (!saveResult) {
      throw new Error('키워드 저장에 실패했습니다.');
    }

    // 6. 키워드 생성 상태 업데이트 (성공: true)
    await updateKeywordGenerated(userid, productid, true);
    
    const keywordTypeStr = keywordType === "advanced" ? "고급(이미지 기반)" : "기본";
    logger.debug(`[${productid}] ✅ ${keywordTypeStr} 키워드 생성 완료 (${generatedKeywords.length}개)`);
    return true;
  } catch (error) {
    logger.error(error, { userid, productid });
    
    // 키워드 생성 상태 업데이트 (실패: false)
    await updateKeywordGenerated(userid, productid, false);
    
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