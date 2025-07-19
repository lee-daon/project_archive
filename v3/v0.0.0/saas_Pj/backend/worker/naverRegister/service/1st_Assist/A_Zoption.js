/**
 * A_Zoption.js
 * optionSchema 배열에서 이미지가 있는 옵션의 모든 값에 A부터 Z까지 접두어를 추가하는 모듈
 */

/**
 * 이미지가 있는 옵션의 모든 값에 A부터 Z까지 접두어를 추가하는 함수
 * @param {Object} productData - 상품 데이터 객체 (optionSchema 포함)
 * @returns {Object} 접두어가 추가된 상품 데이터 객체
 */
function addAZPrefixToOptions(productData) {
  // optionSchema가 없거나 배열이 아니면 그대로 반환
  if (!productData.optionSchema || !Array.isArray(productData.optionSchema) || 
      productData.optionSchema.length === 0) {
    return productData;
  }
  
  // 이미지가 있는 옵션값들을 수집
  const optionValuesWithImages = [];
  
  productData.optionSchema.forEach(option => {
    if (option.optionValues && Array.isArray(option.optionValues)) {
      // 해당 옵션에 이미지가 하나라도 있는지 확인
      const hasAnyImage = option.optionValues.some(value => value.imageUrl);
      
      if (hasAnyImage) {
        // 이미지가 있는 옵션이면 모든 값을 수집
        option.optionValues.forEach(value => {
          optionValuesWithImages.push({
            optionId: option.optionId,
            valueId: value.valueId,
            originalName: value.valueName
          });
        });
      }
    }
  });
  
  // 이미지가 있는 옵션값이 1개 이하이면 접두어를 추가하지 않고 그대로 반환
  if (optionValuesWithImages.length <= 1) {
    return productData;
  }
  
  // 알파벳 배열 생성 (A부터 Z까지)
  const alphabets = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
  
  // 상품 데이터 복사
  const modifiedProductData = JSON.parse(JSON.stringify(productData));
  
  // 이미지가 있는 옵션값들에 알파벳 접두어 추가
  let alphabetIndex = 0;
  
  modifiedProductData.optionSchema.forEach(option => {
    if (option.optionValues && Array.isArray(option.optionValues)) {
      // 해당 옵션에 이미지가 하나라도 있는지 확인
      const hasAnyImage = option.optionValues.some(value => value.imageUrl);
      
      if (hasAnyImage) {
        // 이미지가 있는 옵션이면 모든 값에 접두어 추가
        option.optionValues.forEach(value => {
          // 알파벳 인덱스가 넘어가면 AA, AB 등으로 처리 (26개 이상인 경우)
          const prefix = alphabetIndex < 26 ? alphabets[alphabetIndex] : 
                        alphabets[Math.floor(alphabetIndex / 26) - 1] + alphabets[alphabetIndex % 26];
          
          value.valueName = `${prefix}. ${value.valueName}`;
          alphabetIndex++;
        });
      }
    }
  });
  
  return modifiedProductData;
}

export { addAZPrefixToOptions };
