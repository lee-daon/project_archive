import { generateDetailContent } from './assist/productDetail.js';
import { calculatePrices, generateRandomDiscount } from './assist/priceCalculator.js';
import { cleanImageUrl, cleanImageArray, cleanOptionName } from '../../../../../common/utils/Validator.js';
import { addAZPrefixToOptions } from './assist/AZoption.js';

/**
 * ESM 엑셀 생성을 위한 초기 JSON 데이터를 생성하는 함수
 * @param {Object} jsonData - JSON 형태의 상품 데이터
 * @param {string} esmCatId - ESM 카테고리 ID
 * @param {string} gmarketCatId - G마켓 카테고리 ID
 * @param {string} auctionCatId - 옥션 카테고리 ID
 * @param {Object} priceConfig - 가격 설정 데이터
 * @param {Object} esmConfig - ESM 설정 데이터
 * @param {Object} detailPageConfig - 상세페이지 설정 데이터
 * @param {Object} accountInfo - ESM 계정 정보
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @param {string} productGroupCode - 상품 그룹 코드
 * @returns {Object} 처리된 초기 JSON 데이터
 */
export async function createInitialJson(
    jsonData, 
    esmCatId, 
    gmarketCatId, 
    auctionCatId, 
    priceConfig, 
    esmConfig, 
    detailPageConfig, 
    accountInfo,
    userid, 
    productid, 
    productGroupCode
) {
    try {
        // A-Z 옵션 적용
        let processedJsonData = jsonData;
        if (detailPageConfig.useAzOption) {
            processedJsonData = addAZPrefixToOptions(jsonData);
        }

        // 1. 트래킹 URL 생성 (ESM용)
        const trackingUrl = `https://an.loopton.com/gma/${userid}/${productid}/${productGroupCode}`;

        // 2. 상단/하단 이미지 설정 (계정 정보에서 가져오기)
        const topImages = [
            accountInfo.top_image_1,
            accountInfo.top_image_2,
            accountInfo.top_image_3
        ].filter(img => img && img.trim() !== '');

        const bottomImages = [
            accountInfo.bottom_image_1,
            accountInfo.bottom_image_2,
            accountInfo.bottom_image_3
        ].filter(img => img && img.trim() !== '');

        // 3. generateDetailContent로 상세페이지 HTML 생성
        const detailContent = generateDetailContent(
            processedJsonData.productInfo?.descriptionImages || [], // 상세 이미지 (이미 호스팅됨)
            detailPageConfig.includeProperties ? (processedJsonData.productInfo?.attributes || []) : [], // 상품 속성 (설정에 따라)
            topImages, // 계정별 상단 이미지
            bottomImages, // 계정별 하단 이미지
            trackingUrl // 트래킹 URL
        );

        // 4. ESM용 가격 설정 적용 (기본 priceConfig에 ESM 설정 추가)
        const esmPriceConfig = {
            ...priceConfig,
            includeDeliveryFee: esmConfig.includeDeliveryFee,
            includeImportDuty: esmConfig.includeImportDuty
        };

        // 5. priceCalculator로 가격 계산
        const priceCalculationResult = await calculatePrices(
            processedJsonData.variants || [],
            esmPriceConfig,
            processedJsonData.productInfo?.productId
        );

        // 6. 랜덤 할인율 생성
        const discountRate = generateRandomDiscount(esmPriceConfig, processedJsonData.productInfo?.productId);

        // 7. 옵션 이미지 정리
        const cleanedOptionSchema = (processedJsonData.optionSchema || []).map(option => {
            if (option.optionValues) {
                option.optionValues = option.optionValues.map(value => ({
                    ...value,
                    valueName: cleanOptionName(value.valueName), // 옵션값명 정리 적용
                    imageUrl: value.imageUrl ? cleanImageUrl(value.imageUrl) : value.imageUrl
                }));
            }
            return {
                ...option,
                optionName: cleanOptionName(option.optionName) // 옵션명 정리 적용
            };
        });

        // 8. 최종 JSON 구조 생성 (ESM 엑셀 생성용) - 모든 이미지 정리됨
        const initialJson = {
            productId: processedJsonData.productInfo?.productId,
            productName: processedJsonData.productInfo?.productName,
            esmCatId: esmCatId,
            gmarketCatId: gmarketCatId,
            auctionCatId: auctionCatId,
            brandName: processedJsonData.productInfo?.brandName,
            keywords: processedJsonData.productInfo?.keywords || [],
            representativeImage: cleanImageUrl(processedJsonData.productInfo?.representativeImage),
            images: cleanImageArray(processedJsonData.productInfo?.images || []),
            contents: detailContent,
            optionSchema: cleanedOptionSchema,
            variants: priceCalculationResult.variants, // 가격 계산된 variants
            deliveryInfo: priceCalculationResult.deliveryInfo,
            discountRate: discountRate,
            // ESM 전용 필드
            accountInfo: {
                gmarketId: accountInfo.gmarket_id,
                auctionId: accountInfo.auction_id,
                esmMarketNumber: accountInfo.esm_market_number
            }
        };

        // 최종 반환값
        return {
            success: true,
            message: 'ESM createInitialJson 함수 모든 단계 완료 - 최종 JSON 생성됨',
            initialJson: initialJson
        };

    } catch (error) {
        console.error('ESM createInitialJson 함수에서 오류 발생:', error);
        throw error;
    }
}
