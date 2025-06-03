/**
 * tagProcessing.js
 * 상품 태그 처리 및 필터링 관련 함수 모듈
 */

import { getRestrictedTags } from '../api_assist/restricted_tag.js';

/**
 * 키워드에서 제한된 태그를 필터링하여 최대 10개의 태그를 반환하는 함수
 * @param {string[]} keywords - 키워드 배열
 * @returns {Promise<string[]>} 필터링된 키워드 배열 (최대 10개)
 */
async function filterRestrictedTags(keywords) {
  try {
    // 공백 제거
    const processedKeywords = keywords.map(keyword => keyword.replace(/\s+/g, ''));
    
    // 제한된 태그 확인
    const restrictionResult = await getRestrictedTags(processedKeywords);
    
    // 제한되지 않은 태그만 필터링
    const allowedTags = restrictionResult
      .filter(item => !item.restricted)
      .map(item => item.tag);
    
    // 최대 10개만 반환
    return allowedTags.slice(0, 10);
  } catch (error) {
    console.error('태그 필터링 오류:', error);
    // 오류 발생 시 원본 키워드 중 최대 10개 반환
    return keywords.slice(0, 10);
  }
}

export { filterRestrictedTags }; 