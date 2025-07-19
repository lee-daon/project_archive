import { generateDetailContent } from './assist/generateDetailContents.js';
import { calculatePrices, generateRandomDiscount } from './assist/priceCalculator.js';
import { limitOptionsData } from './assist/limitOptions.js';
import { cleanImageUrl, cleanImageArray, cleanOptionName } from '../../../common/utils/Validator.js';
import { addAZPrefixToOptions } from './assist/A_Zoption.js';



/**
 * 쿠팡 등록을 위한 초기 JSON 데이터를 생성하는 함수
 * @param {Object} jsonData - JSON 형태의 상품 데이터
 * @param {number} coopangCatId - 쿠팡 카테고리 ID
 * @param {Object} priceConfig - 가격 설정 데이터
 * @param {Object} coopangConfig - 쿠팡 설정 데이터
 * @param {Object} detailPageConfig - 상세페이지 설정 데이터
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @param {string} productGroupCode - 상품 그룹 코드
 * @returns {Object} 처리된 초기 JSON 데이터
 */
export async function createInitialJson(jsonData, coopangCatId, priceConfig, coopangConfig, detailPageConfig, userid, productid, productGroupCode) {
    try {

        let jsonDataWithAz = jsonData;
        if (detailPageConfig.useAzOption) {
            jsonDataWithAz = addAZPrefixToOptions(jsonData);
        }

        // 0. variants와 옵션을 maxOptionCount만큼 제한
        const limitedJsonData = limitOptionsData(jsonDataWithAz, coopangConfig.maxOptionCount);


        // 1. 제한된 데이터를 처리 데이터로 사용
        const processedJsonData = limitedJsonData;

        // 2. 옵션 이미지와 이름 매핑 생성 (처리된 optionSchema 구조 사용)
        const optionNamesWithImages = [];
        if (processedJsonData.optionSchema && Array.isArray(processedJsonData.optionSchema)) {
            processedJsonData.optionSchema.forEach(option => {
                if (option.optionValues && Array.isArray(option.optionValues)) {
                    option.optionValues.forEach(value => {
                        if (value.imageUrl) {
                            optionNamesWithImages.push({
                                name: cleanOptionName(value.valueName), // 옵션명 정리 적용
                                image: value.imageUrl
                            });
                        }
                    });
                }
            });
        }

        // 2.1. 옵션 이미지 URL 정리 (generateDetailContent에 전달하기 전)
        const cleanedOptionNamesWithImages = optionNamesWithImages.map(option => ({
            ...option,
            image: cleanImageUrl(option.image) || option.image
        }));

        // 3. 트래킹 URL 생성
        const trackingUrl = `https://an.loopton.com/cou/${userid}/${productid}/${productGroupCode}`;

        // 4. generateDetailContent로 상세페이지 HTML 생성
        const detailContent = generateDetailContent(
            processedJsonData.productInfo?.descriptionImages || [], // 상세 이미지 (이미 호스팅됨)
            detailPageConfig.includeProperties ? (processedJsonData.productInfo?.attributes || []) : [], // 상품 속성 (설정에 따라)
            detailPageConfig.includeOptions ? cleanedOptionNamesWithImages : [], // 옵션명과 이미지 매핑 (설정에 따라) - URL 정리됨
            detailPageConfig.topImages || [], // 상단 이미지
            detailPageConfig.bottomImages || [], // 하단 이미지
            trackingUrl // 트래킹 URL
        );

        // 5. priceCalculator로 가격 계산
        const priceCalculationResult = await calculatePrices(
            processedJsonData.variants || [],
            priceConfig,
            processedJsonData.productInfo?.productId
        );

        // 6. 랜덤 할인율 생성
        const discountRate = generateRandomDiscount(priceConfig, processedJsonData.productInfo?.productId);

        // 7. 옵션 이미지 정리
        const cleanedOptionSchema = (processedJsonData.optionSchema || []).map(option => {
            if (option.optionValues) {
                option.optionValues = option.optionValues.map(value => ({
                    ...value,
                    valueName: cleanOptionName(value.valueName), // 옵션명 정리 적용
                    imageUrl: value.imageUrl ? cleanImageUrl(value.imageUrl) : value.imageUrl
                }));
            }
            return {
                ...option,
                optionName: cleanOptionName(option.optionName) // 옵션명 정리 적용
            };
        });

        // 8. 최종 JSON 구조 생성 (쿠팡 등록용) - 모든 이미지 정리됨
        const initialJson = {
            productId: processedJsonData.productInfo?.productId,
            productName: processedJsonData.productInfo?.productName,
            coopangCatId: coopangCatId,
            brandName: processedJsonData.productInfo?.brandName,
            keywords: processedJsonData.productInfo?.keywords || [],
            representativeImage: cleanImageUrl(processedJsonData.productInfo?.representativeImage),
            images: cleanImageArray(processedJsonData.productInfo?.images || []),
            contents: detailContent,
            optionSchema: cleanedOptionSchema,
            variants: priceCalculationResult.variants, // 가격 계산된 variants
            deliveryInfo: priceCalculationResult.deliveryInfo,
            discountRate: discountRate
        };


        // 최종 반환값
        return {
            success: true,
            message: 'createInitialJson 함수 모든 단계 완료 - 최종 JSON 생성됨',
            initialJson: initialJson
        };

    } catch (error) {
        console.error('createInitialJson 함수에서 오류 발생:', error);
        throw error;
    }
}
