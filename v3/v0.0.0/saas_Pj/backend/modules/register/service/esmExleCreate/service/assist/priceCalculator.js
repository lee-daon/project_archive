/**
 * 쿠팡 등록용 가격 계산 모듈
 * @module priceCalculation
 */

/**
 * 가격 계산 함수 - priceConfig를 사용한 조건부 계산
 * @param {Array} variants - 상품 옵션 배열 (variant.price는 위안화 기준)
 * @param {Object} priceConfig - 가격 설정 데이터
 * @param {string} productId - 상품 ID
 * @returns {Object} 계산된 가격 정보와 배송비가 포함된 결과
 */
async function calculatePrices(variants, priceConfig, productId) {
    try {
        // priceConfig에서 설정값 추출
        const {
            minimumMargin,              // 최소 마진 (원화)
            minimumProfitMargin,        // 최소 수익률 (%)
            profitMargin,               // 수익률 (%)
            deliveryFee,                // 배송비 (원화)
            buyingFee,                  // 구매 수수료 (%)
            importDuty,                 // 관세율 (%)
            importVat,                  // 부가세율 (%)
            chinaExchangeRate,          // 중국 환율
            usaExchangeRate,            // 미국 환율
            includeDeliveryFee,         // 배송비 포함 여부 (getConfig에서 include_delivery_fee로 전달됨)
            includeImportDuty           // 관부가세 포함 여부
        } = priceConfig;

        // includeDeliveryFee가 true면 배송비를 상품가격에 포함 (소비자에게는 무료배송 표시)

        // 11번가 판매 수수료 
        const elevenstoreSellingFee = 13; // 13% (11번가 기본 수수료)
        // 옵션별 가격 계산
        const calculatedVariants = variants.map(variant => {
            
            // variant.price에서 위안화 가격 추출 (간단하고 명확하게)
            let itemPriceCNY = 0;
            
            if (variant.price !== undefined && variant.price !== null) {
                if (typeof variant.price === 'string') {
                    // "3000.00" 형태의 문자열에서 숫자 추출
                    const priceMatch = variant.price.match(/[\d.]+/);
                    if (priceMatch) {
                        itemPriceCNY = parseFloat(priceMatch[0]);
                    }
                } else if (typeof variant.price === 'number') {
                    itemPriceCNY = variant.price;
                }
            }
            
            
            // 가격 정보가 유효하지 않은 경우 에러 발생
            if (isNaN(itemPriceCNY) || itemPriceCNY <= 0) {
                console.error(`[가격 계산] 상품 ID ${productId}의 옵션 가격이 유효하지 않습니다:`, variant);
                throw new Error(`상품 ID ${productId}의 옵션 가격이 유효하지 않습니다. variant: ${JSON.stringify(variant)}`);
            }

            // 1. 원가 계산 (원화, 관/부가세 전)
            // 상품가(위안) * (1 + 구매수수료%) * 환율(중국)
            const costBeforeDutyKRW = itemPriceCNY * (1 + buyingFee / 100) * chinaExchangeRate;

            // 2. 관/부가세 계산 (includeImportDuty가 true인 경우만)
            let dutyKRW = 0;
            let vatKRW = 0;

            if (includeImportDuty) {
                // USD 기준 금액 계산 (관부가세 기준 확인용)
                const costBeforeDutyUSD = costBeforeDutyKRW / usaExchangeRate;
                const importVatLimit = 150; // USD 기준 관부가세 면제 한도

                // USD 기준 금액이 제한 금액 초과 시 관/부가세 계산
                if (costBeforeDutyUSD > importVatLimit) {
                    dutyKRW = costBeforeDutyKRW * (importDuty / 100);          // 관세
                    vatKRW = (costBeforeDutyKRW + dutyKRW) * (importVat / 100); // 부가세
                }
            }

            // 3. 총 비용 계산 (관세 및 배송비 포함 여부에 따라)
            let totalCostKRW = costBeforeDutyKRW;
            
            // 관세 포함 여부에 따른 처리
            if (includeImportDuty) {
                totalCostKRW += dutyKRW + vatKRW;
            }
            
            // 배송비 포함 여부에 따른 처리
            if (includeDeliveryFee) {
                totalCostKRW += parseFloat(deliveryFee);
            }

            // 4. 목표 판매가 계산 (판매처 수수료 및 마진 고려)
            const profitMarginRate = profitMargin / 100; // 마진율
            const sellingFeeRate = elevenstoreSellingFee / 100; // 쿠팡 판매수수료율
            
            // 목표 판매가 = (총 비용 * (1 + 마진율)) / (1 - 판매수수료율)
            let targetPriceKRW = (totalCostKRW * (1 + profitMarginRate)) / (1 - sellingFeeRate);

            // 5. 최소 마진 보장
            const earnedMargin = (targetPriceKRW * (1 - sellingFeeRate)) - totalCostKRW;
            if (earnedMargin < minimumMargin) {
                targetPriceKRW = (totalCostKRW + minimumMargin) / (1 - sellingFeeRate);
            }

            // 6. 최종 판매가 결정 (10원 단위 올림)
            const finalPrice = Math.ceil(targetPriceKRW / 10) * 10;


            // 결과 반환 (optionCombination 구조 유지)
            return {
                stockQuantity: variant.stockQuantity || 0,
                calculatedPrice: finalPrice,
                cost: Math.round(totalCostKRW), // 정수로 반올림
                optionCombination: variant.optionCombination || []
            };
        });

        // 배송비 정보 (독립적으로 반환)
        const deliveryInfo = {
            deliveryFee: includeDeliveryFee ? 0 : parseFloat(deliveryFee), // 포함이면 0원 표시
            freeShipping: includeDeliveryFee // 포함이면 무료배송으로 표시
        };

        return {
            variants: calculatedVariants,
            deliveryInfo: deliveryInfo
        };

    } catch (error) {
        console.error(`[가격 계산] 상품 ID ${productId} 처리 중 오류 발생:`, error);
        // 에러 발생 시 기본값 반환
        return {
            variants: variants.map(v => ({ 
                stockQuantity: v.stockQuantity || 0,
                calculatedPrice: 50000, // 기본 판매가 5만원
                cost: 30000, // 기본 원가 3만원
                optionCombination: v.optionCombination || []
            })),
            deliveryInfo: {
                deliveryFee: priceConfig.includeDeliveryFee ? 0 : (parseFloat(priceConfig.deliveryFee) || 0),
                freeShipping: priceConfig.includeDeliveryFee
            }
        };
    }
}

/**
 * 랜덤 할인율 생성 함수
 * @param {Object} priceConfig - 가격 설정 데이터
 * @param {string} productId - 상품 ID
 * @returns {number} 생성된 할인율
 */
function generateRandomDiscount(priceConfig, productId) {
    try {
        
        // priceConfig에서 할인율 범위 가져오기
        const minPercentage = priceConfig.minPercentage || 10;
        const maxPercentage = priceConfig.maxPercentage || 30;
        
        const discountRate = Math.floor(Math.random() * (maxPercentage - minPercentage + 1)) + minPercentage;
        
        return discountRate;
        
    } catch (error) {
        console.error(`[${productId}] 할인율 생성 오류:`, error);
        return 15; // 기본값 15%
    }
}

export { calculatePrices, generateRandomDiscount }; 