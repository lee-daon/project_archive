/**
 * 11번가 등록용 옵션 선택 및 가격 필터링 모듈
 * optionArrayLogic에 따라 다른 전략으로 옵션을 필터링합니다.
 */

/**
 * 옵션 배열 로직에 따라 옵션을 필터링하고 대표 가격을 결정합니다.
 * @param {object} processedJsonData - InitialJson에서 처리된 JSON 데이터
 * @param {string} optionArrayLogic - 옵션 배열 로직 ('lowest_price' | 'most_products')
 * @param {number} discountRate - 할인율 (0-99)
 * @returns {Promise<{ representativePrice: number, filteredJsonData: object }>} 대표 가격 및 필터링된 데이터
 */
export async function optionChoice(processedJsonData, optionArrayLogic, discountRate) {
    // 입력 유효성 검사
    if (!processedJsonData || !processedJsonData.variants || processedJsonData.variants.length === 0) {
      console.warn('optionChoice: variants 배열이 비어있어 필터링을 수행할 수 없습니다.');
      return {
        representativePrice: 0,
        filteredJsonData: processedJsonData,
      };
    }
  
    // calculatedPrice가 null이거나 유효하지 않은 variants 필터링
    const validVariants = processedJsonData.variants.filter(variant => {
      const isValid = variant.calculatedPrice !== null && 
                     variant.calculatedPrice !== undefined && 
                     !isNaN(variant.calculatedPrice) && 
                     variant.calculatedPrice > 0;
      
      if (!isValid) {
        console.warn('optionChoice: 유효하지 않은 calculatedPrice를 가진 variant 제외:', variant);
      }
      return isValid;
    });
  
    if (validVariants.length === 0) {
      console.warn('optionChoice: 유효한 calculatedPrice를 가진 variants가 없습니다.');
      return {
        representativePrice: 0,
        filteredJsonData: {
          ...processedJsonData,
          variants: []
        },
      };
    }
  
    if (discountRate < 0 || discountRate >= 100) {
      throw new Error('할인율은 0 이상 100 미만이어야 합니다.');
    }
  
    // 유효한 variants로 새로운 processedJsonData 생성
    const filteredProcessedJsonData = {
      ...processedJsonData,
      variants: validVariants
    };
  
    switch (optionArrayLogic) {
      case 'lowest_price':
        return await lowPriceStrategy(filteredProcessedJsonData, discountRate);
      case 'most_products':
        return await manyStrategy(filteredProcessedJsonData, discountRate);
      default:
        throw new Error(`지원하지 않는 옵션 배열 로직입니다: ${optionArrayLogic}`);
    }
  }
  
  /**
   * lowest_price 전략: 가장 낮은 가격 기준으로 +100%까지만 포함
   * @param {object} processedJsonData - 처리된 JSON 데이터
   * @param {number} discountRate - 할인율
   * @returns {Promise<{ representativePrice: number, filteredJsonData: object }>}
   */
  async function lowPriceStrategy(processedJsonData, discountRate) {
    // 1. 각 variant의 할인 전 가격 계산 (10원 단위 반올림)
    const variantsWithPrices = processedJsonData.variants.map((variant) => {
      const originalPrice = discountRate === 0
        ? Math.round(variant.calculatedPrice / 10) * 10
        : Math.round((variant.calculatedPrice / (1 - discountRate / 100)) / 10) * 10;
      return { ...variant, originalPrice };
    });
  
    // 2. 가장 낮은 할인 후 가격 찾기
    const lowestDiscountedPrice = Math.min(...variantsWithPrices.map(v => v.calculatedPrice));
    const lowestVariant = variantsWithPrices.find(v => v.calculatedPrice === lowestDiscountedPrice);
    
    // 3. 대표 가격은 가장 낮은 가격의 할인 전 가격 (10원 단위 반올림)
    const representativePrice = Math.round(lowestVariant.originalPrice / 10) * 10;
    
    // 4. 11번가 정책에 따른 허용 범위 계산 (할인 후 가격 기준 +100%)
    const maxAllowedDiscountedPrice = lowestDiscountedPrice * 2.0; // +100%
    const minAllowedDiscountedPrice = lowestDiscountedPrice; // 최저가 기준 (더 낮을 수 없음)
    
    // 5. 범위 내 옵션만 필터링
    const filteredVariants = variantsWithPrices.filter(variant => 
      variant.calculatedPrice >= minAllowedDiscountedPrice && 
      variant.calculatedPrice <= maxAllowedDiscountedPrice
    );
  
    // 6. 대표 가격의 할인 후 가격 계산 (10원 단위 반올림)
    const representativeDiscountedPrice = Math.round(representativePrice * (1 - discountRate / 100) / 10) * 10;
    
    // 7. 각 variant에 optionPrice 추가 (11번가는 개별 가격 설정 가능)
    const finalVariants = filteredVariants.map(variant => {
      const { originalPrice, ...variantInfo } = variant;
      let optionPrice = Math.round((variant.calculatedPrice - representativeDiscountedPrice) / 10) * 10;
      if (Math.abs(optionPrice) <= 100) {
        optionPrice = 0;
      }
      return { ...variantInfo, optionPrice };
    });
  
    return {
      representativePrice,
      filteredJsonData: {
        ...processedJsonData,
        variants: finalVariants
      }
    };
  }
  
  /**
   * most_products 전략: 가장 많은 옵션이 포함되도록 하는 대표가격 설정
   * @param {object} processedJsonData - 처리된 JSON 데이터
   * @param {number} discountRate - 할인율
   * @returns {Promise<{ representativePrice: number, filteredJsonData: object }>}
   */
  async function manyStrategy(processedJsonData, discountRate) {
    // 1. 각 variant의 할인 전 가격 계산 (10원 단위 반올림)
    const variantsWithPrices = processedJsonData.variants.map((variant) => {
      const originalPrice = discountRate === 0
        ? Math.round(variant.calculatedPrice / 10) * 10
        : Math.round((variant.calculatedPrice / (1 - discountRate / 100)) / 10) * 10;
      return { ...variant, originalPrice };
    });
  
    // 2. 최적의 "기준 옵션" 찾기 (가장 많은 옵션을 포함시키는 기준)
    let bestAnchorVariant = null;
    let maxIncludedCount = -1;
    let finalFilteredVariantsInfo = [];
  
    // 모든 옵션을 순회하며 각 옵션을 "기준 옵션"으로 삼아 테스트
    for (const anchorVariant of variantsWithPrices) {
      const anchorDiscountedPrice = anchorVariant.calculatedPrice; // 할인 후 가격
      
      // 11번가 정책에 따른 허용 범위 계산 (할인 후 가격 기준 +100%, -50%)
      const maxAllowedDiscountedPrice = anchorDiscountedPrice * 2.0; // +100%
      const minAllowedDiscountedPrice = anchorDiscountedPrice * 0.5; // -50%
  
      let currentIncludedVariantsInfo = [];
      let currentIncludedCount = 0;
  
      // 다른 모든 옵션들을 확인하여 범위 내에 있는지 검사
      for (const checkVariant of variantsWithPrices) {
        if (
          checkVariant.calculatedPrice >= minAllowedDiscountedPrice &&
          checkVariant.calculatedPrice <= maxAllowedDiscountedPrice
        ) {
          currentIncludedCount++;
          const { originalPrice, ...variantInfo } = checkVariant;
          currentIncludedVariantsInfo.push(variantInfo);
        }
      }
  
      // 최적 기준 업데이트 조건 확인
      let updateBest = false;
      if (currentIncludedCount > maxIncludedCount) {
        updateBest = true;
      } else if (currentIncludedCount === maxIncludedCount && bestAnchorVariant) {
        // 포함 개수가 같으면, 기준 옵션의 '할인 전 가격'이 더 낮은 것으로 선택
        if (anchorVariant.originalPrice < bestAnchorVariant.originalPrice) {
          updateBest = true;
        }
      }
  
      if (updateBest) {
        maxIncludedCount = currentIncludedCount;
        bestAnchorVariant = anchorVariant;
        finalFilteredVariantsInfo = currentIncludedVariantsInfo;
      }
    }
  
    if (!bestAnchorVariant) {
      console.warn('11번가 most_products 전략: 최적 기준 옵션을 찾을 수 없습니다. 원본 데이터를 반환합니다.');
      return {
        representativePrice: 0,
        filteredJsonData: processedJsonData
      };
    }
  
    const representativePrice = Math.round(bestAnchorVariant.originalPrice / 10) * 10;
    
    // 대표 가격의 할인 후 가격 계산 (10원 단위 반올림)
    const representativeDiscountedPrice = Math.round(representativePrice * (1 - discountRate / 100) / 10) * 10;
    
    // 각 variant에 optionPrice 추가 (11번가는 개별 가격 설정 가능)
    const finalVariants = finalFilteredVariantsInfo.map(variant => {
      let optionPrice = Math.round((variant.calculatedPrice - representativeDiscountedPrice) / 10) * 10;
      if (Math.abs(optionPrice) <= 100) {
        optionPrice = 0;
      }
      return { ...variant, optionPrice };
    });
  
    return {
      representativePrice,
      filteredJsonData: {
        ...processedJsonData,
        variants: finalVariants
      }
    };
  }
  