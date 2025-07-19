/**
 * 할인율 계산 유틸리티
 * @module discountUtils
 */

/**
 * 두 할인율을 합성하여 최종 할인율을 계산 (정수 반환)
 * @param {number} currentDiscountRate - 현재 할인율 (%)
 * @param {number} additionalDiscountRate - 추가 할인율 (%)
 * @returns {number} 최종 할인율 (정수 %)
 */
export function calculateFinalDiscountRate(currentDiscountRate, additionalDiscountRate) {
    const curDisc = Number(currentDiscountRate) || 0;
    const addDisc = Number(additionalDiscountRate) || 0;
    
    // 할인율 합성 공식: d0 + dAdd - d0*dAdd/100
    const finalDiscountRate = curDisc + addDisc - (curDisc * addDisc) / 100;
    
    return Math.round(finalDiscountRate);
}

/**
 * 할인율을 적용했을 때의 새로운 마진율 계산 (정수 반환)
 * @param {number} currentMargin - 현재 마진율 (%)
 * @param {number} discountPercent - 할인율 (%)
 * @returns {number} 새로운 마진율 (정수 %)
 */
export function calculateNewMargin(currentMargin, discountPercent) {
    // 마진 공식: margin = (price - cost) / price
    // 새마진 = 1 - (1 - 현재마진/100) / (1 - 할인율/100)
    
    if (currentMargin <= 0 || discountPercent <= 0) {
        return Math.round(currentMargin);
    }
    
    const currentMultiplier = 1 - currentMargin / 100;
    const discountMultiplier = 1 - discountPercent / 100;
    const newMargin = 1 - (currentMultiplier / discountMultiplier);
    
    return Math.round(newMargin * 100);
}

/**
 * 마진율 기반 할인율 계산 (정수 반환)
 * @param {number} currentMargin - 현재 마진율 (%)
 * @param {number} targetMargin - 목표 마진율 (%)
 * @returns {number} 필요한 할인율 (정수 %)
 */
export function calculateDiscountFromMargin(currentMargin, targetMargin) {
    // 마진 공식: margin = (price - cost) / price
    // 할인율 = 1 - (1-currentMargin/100)/(1-targetMargin/100)
    
    const currentMultiplier = 1 - currentMargin / 100;
    const targetMultiplier = 1 - targetMargin / 100;
    const discountRate = 1 - (currentMultiplier / targetMultiplier);
    
    return Math.round(discountRate * 100);
}

