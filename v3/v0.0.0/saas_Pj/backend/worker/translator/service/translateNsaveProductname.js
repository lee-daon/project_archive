import { generateGeminiText } from '../ai_config/gemini.js';
import { productNameprompt} from '../ai_config/geminiPrompt.js';
import { getProductRawTitle, saveTranslatedTitle} from '../db/detail.js';
import { updateNameOptimized, decreaseTaskCount} from '../db/processingStatus.js';
import logger from '../../../common/utils/logger.js';

/**
 * 상품명을 필터링하는 함수
 * @param {string} productName - 원본 상품명
 * @returns {string} - 필터링된 상품명
 */
const filterProductName = (productName) => {
    if (!productName || typeof productName !== 'string') {
        return '';
    }

    // 1. 특수문자 제거 (한글, 영문, 숫자, 공백만 남김)
    const removeSpecialChars = (text) => {
        return text.replace(/[^\w\s가-힣]/g, ' ');
    };

    // 2. 중복단어 제거
    const removeDuplicateWords = (text) => {
        const words = text.split(/\s+/).filter(word => word.length > 0);
        const uniqueWords = [...new Set(words)];
        return uniqueWords.join(' ');
    };

    // 3. 100글자 제한
    const limitLength = (text) => {
        return text.length > 100 ? text.substring(0, 100).trim() : text;
    };

    // 필터링 순서: 특수문자 제거 → 중복단어 제거 → 길이 제한
    let filtered = removeSpecialChars(productName);
    filtered = removeDuplicateWords(filtered);
    filtered = limitLength(filtered);

    return filtered.trim();
};

/**
 * 상품명 최적화 및 저장 처리 함수
 * 
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @param {Array<string>} include - 포함할 키워드 배열
 * @param {boolean} includeBrand - 브랜드명 포함 여부
 * @returns {Promise<boolean>} 처리 성공 여부
 */
export async function generateAndSaveProductName(userid, productid, include = [], includeBrand = false) {
  try {
    
    // 2. 상품명 원본 데이터 가져오기
    const rawTitle = await getProductRawTitle(userid, productid);
    if (!rawTitle) {
      throw new Error('상품명 원본 데이터를 찾을 수 없습니다.');
    }
    
    // 3. 프롬프트 데이터 준비
    const promptData = {
      productName: rawTitle,
      includeBrand: includeBrand
    };
    
    // 최종 프롬프트 데이터를 JSON 문자열로 변환
    const promptDataStr = JSON.stringify(promptData);
    
    // 4. 기본 텍스트 기반 상품명 최적화 호출 (항상 기본 프롬프트 사용)
    const optimizedTitle = await generateGeminiText(
      promptDataStr,
      productNameprompt
    );
    
    // 5. 생성 결과 검증
    if (!optimizedTitle || optimizedTitle.trim().length === 0) {
      throw new Error('상품명 최적화 결과가 유효하지 않습니다.');
    }
    
    // 6. 키워드가 있으면 앞에 붙이기
    let finalTitle = optimizedTitle.trim();
    if (include.length > 0) {
      const keywordPrefix = include.join(' ') + ' ';
      finalTitle = keywordPrefix + finalTitle;
    }
    
    // 7. 상품명 필터링 (특수문자 제거, 중복단어 제거, 100글자 제한)
    const filteredTitle = filterProductName(finalTitle);
    
    // 필터링 후 재검증
    if (!filteredTitle || filteredTitle.trim().length === 0) {
      throw new Error('상품명 필터링 후 결과가 유효하지 않습니다.');
    }
    
    // 8. 필터링된 상품명 저장
    const saveResult = await saveTranslatedTitle(userid, productid, filteredTitle);
    
    if (!saveResult) {
      throw new Error('최적화된 상품명 저장에 실패했습니다.');
    }

    // 9. 상품명 최적화 상태 업데이트 (성공: true)
    await updateNameOptimized(userid, productid, true);
    
    logger.debug(`상품 ID ${productid}: 기본 상품명 최적화 작업이 성공적으로 완료되었습니다.`);
    return true;
  } catch (error) {
    logger.error(error, { userid, productid });
    
    // 상품명 최적화 상태 업데이트 (실패: false)
    await updateNameOptimized(userid, productid, false);
    
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
