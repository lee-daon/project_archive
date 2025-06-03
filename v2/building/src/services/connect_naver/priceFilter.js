/**
 * 네이버 가격 정책에 맞춰 대표 상품 가격을 결정하고,
 * 유효한 옵션만 포함하는 secondJson을 생성합니다.
 *
 * 네이버 가격 정책 해석 (v3):
 * 1. 각 옵션을 "기준 옵션"으로 삼아본다.
 * 2. "기준 옵션"의 할인 전 가격(`O`)과 할인 후 가격(`D`)을 사용한다.
 * 3. 가격 범위 `Delta = O * 0.5` 를 계산한다.
 * 4. 유효 가격 범위는 `[D - Delta, D + Delta]` 이다.
 * 5. 이 범위 안에 다른 모든 옵션들의 "할인 후 가격"이 몇 개나 포함되는지 센다.
 * 6. 가장 많은 옵션을 포함시키는 "기준 옵션"을 최종 선택한다. (포함 개수 동일 시, 기준 옵션의 "할인 전 가격"이 가장 낮은 것을 선택)
 * 7. 최종 선택된 "기준 옵션"의 "할인 전 가격"을 대표 가격으로 하고, 해당 기준으로 필터링된 옵션 목록을 반환한다.
 *
 * @param {object} initialJson - 초기 상품 정보 JSON 객체 (`assembleInitialJson` 결과)
 * @param {number} discountRate - 할인율 (0-99). `initialJson.discountRate`와 동일.
 * @returns {Promise<{ representativePrice: number, secondJson: object }>} 최적 대표 가격(할인 전) 및 필터링된 상품 정보
 */
async function priceFilter(initialJson, discountRate) {
  // 입력 유효성 검사
  if (!initialJson || !initialJson.variants || initialJson.variants.length === 0) {
    console.warn('priceFilter: variants 배열이 비어있어 필터링을 수행할 수 없습니다.');
    return {
      representativePrice: 0,
      secondJson: initialJson,
    };
  }
  if (discountRate < 0 || discountRate >= 100) {
    throw new Error('할인율은 0 이상 100 미만이어야 합니다.');
  }

  // 1. 각 variant의 할인 전 가격(originalPrice) 계산 (할인 후 가격은 이미 있음)
  const variantsWithPrices = initialJson.variants.map((variant) => {
    const originalPrice = discountRate === 0
        ? variant.calculatedPrice
        : Math.round(variant.calculatedPrice / (1 - discountRate / 100));
    return { ...variant, originalPrice };
  });

  // 2. 최적의 "기준 옵션" 찾기
  let bestAnchorVariant = null;
  let maxIncludedCount = -1;
  let finalFilteredVariantsInfo = []; // 최종 필터링될 variant 정보를 저장할 배열

  // 모든 옵션을 순회하며 각 옵션을 "기준 옵션"(anchor)으로 삼아 테스트
  for (const anchorVariant of variantsWithPrices) {
    const anchorOriginalPrice = anchorVariant.originalPrice;
    const anchorDiscountedPrice = anchorVariant.calculatedPrice;
    const delta = anchorOriginalPrice * 0.5;
    const minAllowedDiscountedPrice = anchorDiscountedPrice - delta;
    const maxAllowedDiscountedPrice = anchorDiscountedPrice + delta;

    let currentIncludedVariantsInfo = []; // 현재 기준 옵션으로 포함되는 variant 정보
    let currentIncludedCount = 0;

    // 다른 모든 옵션(checkVariant)들을 확인하여 범위 내에 있는지 검사
    for (const checkVariant of variantsWithPrices) {
      if (
        checkVariant.calculatedPrice >= minAllowedDiscountedPrice &&
        checkVariant.calculatedPrice <= maxAllowedDiscountedPrice
      ) {
        currentIncludedCount++;
        // 최종 결과에는 originalPrice 제외해야 하므로 미리 처리
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
        if (anchorOriginalPrice < bestAnchorVariant.originalPrice) {
            updateBest = true;
        }
    }

    if (updateBest) {
        maxIncludedCount = currentIncludedCount;
        bestAnchorVariant = anchorVariant;
        finalFilteredVariantsInfo = currentIncludedVariantsInfo;
    }
  }

  // 3. 결과 처리
  if (!bestAnchorVariant) {
    // 이런 경우는 variants 배열이 비어있을 때 뿐이며, 이미 위에서 처리됨.
    // 방어 코드로 남겨둠.
    console.warn('priceFilter: 최적 기준 옵션을 찾을 수 없습니다. 원본 데이터를 반환합니다.');
    return {
        representativePrice: 0, // 또는 적절한 기본값
        secondJson: initialJson
    };
    // 또는 throw new Error('최적 기준 옵션을 찾을 수 없습니다.');
  }

  const representativePrice = bestAnchorVariant.originalPrice;
  console.log(`최종 선정된 기준 옵션의 할인 전 가격(대표 가격): ${representativePrice}`);
  //console.log(`해당 기준 적용 시 포함된 옵션 수: ${maxIncludedCount}`);
  // console.log('포함된 최종 옵션 목록:', finalFilteredVariantsInfo);

  // 4. 대표 가격의 할인 후 가격 계산 (10원 단위 반올림)
  const representativeDiscountedPrice = Math.round(representativePrice * (1 - discountRate / 100) / 10) * 10;
  
  // 5. 각 variant에 priceGap 추가 (10원 단위 반올림)
  finalFilteredVariantsInfo = finalFilteredVariantsInfo.map(variant => {
    // variant의 calculatedPrice와 기준 옵션의 할인 후 가격의 차이 계산
    const priceGap = Math.round((variant.calculatedPrice - representativeDiscountedPrice) / 10) * 10;
    return { ...variant, priceGap };
  });

  // 6. secondJson 생성
  const secondJson = {
    ...initialJson,
    variants: finalFilteredVariantsInfo,
  };

  // 7. 결과 반환
  return {
    representativePrice: representativePrice,
    secondJson: secondJson,
  };
}

/**
 * 대표 가격과 각 옵션의 가격 차이를 계산하여 priceGap을 추가합니다.
 * @param {object} secondJson - 필터링된 상품 정보
 * @param {number} representativePrice - 대표 가격(할인 전)
 * @param {number} discountRate - 할인율 (0-99)
 * @returns {object} priceGap이 추가된 상품 정보
 */
function calculatePriceGaps(secondJson, representativePrice, discountRate) {
  if (!secondJson || !secondJson.variants || secondJson.variants.length === 0) {
    return secondJson;
  }

  // 대표 가격의 할인 후 가격 계산 (10원 단위 반올림)
  const representativeDiscountedPrice = Math.round(representativePrice * (1 - discountRate / 100) / 10) * 10;
  
  // 각 variant에 priceGap 추가
  const updatedVariants = secondJson.variants.map(variant => {
    // variant의 calculatedPrice와 기준 옵션의 할인 후 가격의 차이 계산 (10원 단위 반올림)
    const priceGap = Math.round((variant.calculatedPrice - representativeDiscountedPrice) / 10) * 10;
    return { ...variant, priceGap };
  });

  return {
    ...secondJson,
    variants: updatedVariants
  };
}

export { priceFilter, calculatePriceGaps };
