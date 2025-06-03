/**
 * A_Zoption.js
 * productInfo의 optionValueNames 중 이미지가 있는 옵션에만 A부터 Z까지 접두어를 추가하는 모듈
 */

/**
 * 이미지가 있는 optionValueNames에만 A부터 Z까지 접두어를 추가하는 함수
 * @param {Object} productInfo - 상품 정보 객체
 * @returns {Object} 접두어가 추가된 상품 정보 객체
 */
function addAZPrefixToOptions(productInfo) {
  // optionValueNames 또는 optionImages가 없으면 그대로 반환
  if (!productInfo.optionValueNames || !productInfo.optionImages || 
      Object.keys(productInfo.optionValueNames).length === 0) {
    return productInfo;
  }
  
  // 이미지가 있는 옵션 키 추출
  const optionKeysWithImages = Object.keys(productInfo.optionImages);
  
  // 이미지가 있는 옵션이 1개 이하이면 접두어를 추가하지 않고 그대로 반환
  if (optionKeysWithImages.length <= 1) {
    return productInfo;
  }
  
  // 알파벳 배열 생성 (A부터 Z까지)
  const alphabets = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
  
  // 원래 옵션 이름 복사
  const modifiedOptionValueNames = { ...productInfo.optionValueNames };
  
  // 이미지가 있는 옵션에만 알파벳 접두어 추가
  optionKeysWithImages.forEach((key, index) => {
    if (modifiedOptionValueNames[key]) {
      // 알파벳 인덱스가 넘어가면 AA, AB 등으로 처리 (26개 이상인 경우)
      const prefix = index < 26 ? alphabets[index] : 
                    alphabets[Math.floor(index / 26) - 1] + alphabets[index % 26];
      
      modifiedOptionValueNames[key] = `${prefix}. ${modifiedOptionValueNames[key]}`;
    }
  });
  
  // 수정된 optionValueNames로 업데이트
  productInfo.optionValueNames = modifiedOptionValueNames;
  
  return productInfo;
}

export { addAZPrefixToOptions };
