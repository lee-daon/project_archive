/**
 * priceCalculation.js
 * 상품 가격 계산 및 옵션 처리 관련 함수 모듈
 */

import { register_margin_setting, exchangeRate, random_discount_percentage } from '../../../config/register_setting.js';
import { getMarginInfo, saveDiscountRate } from '../../../db/register/naverRegisterInfo.js';

/**
 * 가격 계산 함수 - 환율, 각종 수수료, 관부가세, 마진을 고려한 가격 계산
 * @param {Array} variants - 상품 옵션 배열 (variant.price는 위안화 기준)
 * @param {number} defaultDeliveryFee - 기본 배송비 (원화)
 * @param {string} productId - 상품 ID
 * @returns {Promise<Array>} 계산된 가격 정보(calculatedPrice)와 총 비용(cost)이 포함된 옵션 배열
 */
async function calculatePrices(variants, defaultDeliveryFee, productId) {
  try {
    // --- 1. 필요한 설정값 및 정보 가져오기 ---
    const marginInfo = await getMarginInfo(productId);
    // DB 조회값 또는 기본값 사용 ( profitMargin은 % 단위)
    const profitMarginPercent = marginInfo ? marginInfo.profitMargin : register_margin_setting.basic_margin_percentage;
    // DB 조회값 또는 함수 인자값 사용 (deliveryFee는 원화)
    const deliveryFeeKRW = marginInfo ? marginInfo.deliveryFee : defaultDeliveryFee;

    const {
      buyingFee,          // 구매처 수수료 (%)
      naver_sellingFee,   // 판매처 수수료 (%)
      importDuty,         // 관세율 (%)
      importVat,          // 부가세율 (%)
      importvatlimit,     // 관/부가세 기준 금액 (USD)
      minimum_margin      // 최소 마진 금액 (원화)
    } = register_margin_setting;
    const { china: chinaRate, usa: usaRate } = exchangeRate; // 환율 정보

    // --- 2-7. 옵션별 가격 계산 ---
    const calculatedVariants = variants.map(variant => {
      const itemPriceCNY = parseFloat(variant.price);
      // 가격 정보가 유효하지 않은 경우 처리
      if (isNaN(itemPriceCNY)) {
        console.warn(`[가격 계산] 상품 ID ${productId}의 옵션 가격이 유효하지 않습니다:`, variant);
        // cost와 calculatedPrice를 0으로 설정하거나 다른 방식으로 처리
        return { ...variant, calculatedPrice: 0, cost: 0 };
      }

      // --- 2. 원가 계산 (원화, 관/부가세 전) ---
      // 상품가(위안) * (1 + 구매수수료%) * 환율(중국)
      const costBeforeDutyKRW = itemPriceCNY * (1 + buyingFee / 100) * chinaRate;

      // --- 3. 관/부가세 계산 ---
      const costBeforeDutyUSD = costBeforeDutyKRW / usaRate; // USD 기준 금액 계산
      let dutyKRW = 0;
      let vatKRW = 0;

      // USD 기준 금액이 제한 금액 초과 시 관/부가세 계산
      if (costBeforeDutyUSD > importvatlimit) {
        dutyKRW = costBeforeDutyKRW * (importDuty / 100);          // 관세 = 원가(원화) * 관세율
        vatKRW = (costBeforeDutyKRW + dutyKRW) * (importVat / 100); // 부가세 = (원가(원화) + 관세) * 부가세율
      }

      // --- 4. 총 비용 계산 (원화) ---
      // 총비용 = 원가(원화) + 관세 + 부가세 + 배송비(원화)
      // deliveryFeeKRW가 null/undefined일 경우 0으로 처리
      const totalCostKRW = costBeforeDutyKRW + dutyKRW + vatKRW + Number(deliveryFeeKRW || 0);

      // --- 5. 목표 판매가 계산 (판매처 수수료 및 마진 고려) ---
      const profitMarginRate = profitMarginPercent / 100; // 마진율 (0.xx 형식)
      const sellingFeeRate = naver_sellingFee / 100;      // 판매수수료율 (0.xx 형식)
      // 목표 판매가 = (총 비용 * (1 + 마진율)) / (1 - 판매수수료율)
      let targetPriceKRW = (totalCostKRW * (1 + profitMarginRate)) / (1 - sellingFeeRate);

      // --- 6. 최소 마진 보장 ---
      // 예상 수익 = (목표 판매가 * (1 - 판매수수료율)) - 총 비용
      const earnedMargin = (targetPriceKRW * (1 - sellingFeeRate)) - totalCostKRW;
      // 예상 수익이 최소 마진보다 작으면, 최소 마진을 보장하도록 목표 판매가 재계산
      if (earnedMargin < minimum_margin) {
        targetPriceKRW = (totalCostKRW + minimum_margin) / (1 - sellingFeeRate);
      }

      // --- 7. 최종 판매가 결정 (10원 단위 올림) ---
      const finalPrice = Math.ceil(targetPriceKRW / 10) * 10;

      // 결과 반환 (cost는 원화 기준 총 비용으로 업데이트)
      return {
        ...variant,
        calculatedPrice: finalPrice, // 계산된 최종 판매가
        cost: totalCostKRW           // 원화 기준 총 비용
      };
    });

    return calculatedVariants;

  } catch (error) {
    console.error(`[가격 계산] 상품 ID ${productId} 처리 중 오류 발생:`, error);
    // 에러 발생 시, 빈 배열이나 다른 적절한 값을 반환하거나 에러를 다시 던짐
    // throw error; // 필요에 따라 에러를 상위로 전파
     return variants.map(v => ({ ...v, calculatedPrice: 0, cost: 0 })); // 예시: 에러 시 가격 0 처리
  }
}

/**
 * 랜덤 할인율 생성 함수
 * @param {string} productId - 상품 ID
 * @returns {Promise<number>} 생성된 할인율
 */
async function generateRandomDiscount(productId) {
  try {
    // 랜덤 할인율 설정값 가져오기
    const { min, max } = random_discount_percentage; // 설정 객체 이름 수정
    const discountRate = Math.floor(Math.random() * (max - min + 1)) + min;

    // DB에 저장
    await saveDiscountRate(productId, discountRate);

    return discountRate;
  } catch (error) {
    console.error('할인율 생성 오류:', error);
    throw error;
  }
}

/**
 * 옵션 경로(propPaths)를 실제 옵션 이름으로 변환하고 필요한 필드만 남김
 * @param {Array} variants - 상품 옵션 배열
 * @param {Object} optionValueNames - 옵션 경로와 이름 매핑 객체
 * @returns {Array} 필요한 필드만 포함된 variants 배열
 */
function convertPropPathsToOptionNames(variants, optionValueNames) {
  if (!variants || !optionValueNames) {
    return variants;
  }

  return variants.map(variant => {
    // 필요한 필드만 추출 (cost 필드 포함 유지)
    const { stockQuantity, calculatedPrice, cost } = variant;

    let optionNames = [];

    // propPaths가 존재하고 배열이면 옵션 이름으로 변환
    if (variant.propPaths && Array.isArray(variant.propPaths)) {
      optionNames = variant.propPaths.map(path => {
        return optionValueNames[path] || path; // 매핑이 없으면 원래 경로 유지
      });
    }

    // 필요한 필드만 포함하여 반환
    return {
      stockQuantity,
      calculatedPrice,
      cost, // cost 필드 유지
      optionNames
    };
  });
}

export { calculatePrices, generateRandomDiscount, convertPropPathsToOptionNames }; 