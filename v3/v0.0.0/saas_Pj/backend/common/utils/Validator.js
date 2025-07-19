import logger from './logger.js';
/**
 * 타당성 검사 정규식 모음 
 */

/**
 * 이미지 URL을 정리하고 유효성을 검사하는 함수
 * @param {string} imageUrl - 정리할 이미지 URL
 * @returns {string|null} 정리된 이미지 URL 또는 null (유효하지 않은 경우)
 */
export function cleanImageUrl(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return null;
  }
  
  let cleanedUrl = imageUrl.trim();
  
  // 프로토콜이 없는 경우 https:// 추가
  if (cleanedUrl.startsWith('//')) {
    cleanedUrl = 'https:' + cleanedUrl;
  }
  
  // http://를 https://로 변경
  if (cleanedUrl.startsWith('http://')) {
    cleanedUrl = cleanedUrl.replace('http://', 'https://');
  }
  
  // 기본적인 URL 유효성 확인
  try {
    new URL(cleanedUrl); // URL 파싱 가능한지만 확인
    return cleanedUrl;
  } catch (error) {
    logger.warn(error);
    return null;
  }
}

/**
 * 이미지 배열을 정리하고 필터링하는 함수
 * @param {Array} imageArray - 이미지 URL 배열
 * @returns {Array} 정리된 이미지 URL 배열
 */
export function cleanImageArray(imageArray) {
  if (!Array.isArray(imageArray)) {
    return [];
  }
  
  return imageArray
    .map(cleanImageUrl)
    .filter(url => url !== null);
}

/**
 * 옵션명을 정리하는 함수 (25글자 이하, 특수문자 제거)
 * @param {string} optionName - 정리할 옵션명
 * @returns {string} 정리된 옵션명
 */
export function cleanOptionName(optionName) {
  if (!optionName || typeof optionName !== 'string') {
    return '';
  }
  
  // 특수문자 제거 (한글, 영문, 숫자, 공백, 하이픈, 언더스코어만 허용)
  let cleanedName = optionName.replace(/[^\w\s\-가-힣]/g, '');
  
  // "환불", "반품" 단어 제거
  cleanedName = cleanedName.replace(/환불|반품/g, '');

  // 연속된 공백을 하나로 변환
  cleanedName = cleanedName.replace(/\s+/g, ' ');
  
  // 앞뒤 공백 제거
  cleanedName = cleanedName.trim();
  
  // 25글자 이하로 자르기
  if (cleanedName.length > 25) {
    cleanedName = cleanedName.substring(0, 25);
  }
  
  return cleanedName;
}


