import { filterRestrictedTags } from './1st_Assist/keywordFilter.js';
import { processAndUploadImages } from './1st_Assist/imageProcessing.js';
import { addAZPrefixToOptions } from './1st_Assist/A_Zoption.js';
import { calculatePrices, generateRandomDiscount } from './1st_Assist/priceCalculation.js';
import { generateDetailContent } from './1st_Assist/generateDetailContent.js';
import { cleanImageUrl, cleanImageArray, cleanOptionName } from '../../../common/utils/Validator.js';

/**
 * 네이버 등록을 위한 초기 JSON 데이터를 생성하는 함수
 * @param {Object} commonSchema - JSON 형태의 상품 데이터
 * @param {number} naverCatId - 네이버 카테고리 ID
 * @param {Object} clientInfo - 네이버 API 인증 정보 (naverApiAuth)
 * @param {boolean} azOption - 옵션 설정 (기본값: true)
 * @param {Object} priceInfo - 가격 설정 데이터 (priceConfig)
 * @param {Object} detailPageConfig - 상세페이지 설정 데이터
 * @param {boolean} includeDeliveryFee - 배송비 포함 여부
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @param {string} productGroupCode - 상품 그룹 코드
 * @returns {Object} 처리된 초기 JSON 데이터
 */
export async function InitialJson(
    commonSchema,
    naverCatId,
    clientInfo,
    azOption = true,
    priceInfo,
    detailPageConfig,
    includeDeliveryFee,
    userid,
    productid,
    productGroupCode
) {
    try {
        // 파라미터 변수 할당
        const jsonData = commonSchema; // JSON 형태의 상품 데이터
        const naverCategoryId = naverCatId; // 네이버 카테고리 ID
        const naverApiAuth = clientInfo; // 네이버 API 인증 정보
        const useAzOption = azOption; // 옵션 설정 (a-z 옵션)
        const priceConfig = priceInfo; // 가격 설정 데이터
        const useDeliveryFee = includeDeliveryFee; // 배송비 포함 여부
        
        // 트래킹 URL 생성 (네이버는 "nav" 사용)
        const productTrackingUrl = `https://an.loopton.com/nav/${userid}/${productid}/${productGroupCode}`;

        // 1. 키워드 필터링
        const filteredKeywords = await filterRestrictedTags(jsonData.productInfo.keywords, naverApiAuth);

        // 2. 이미지 처리 및 네이버 CDN 업로드
        const imageData = await processAndUploadImages(
            jsonData.productInfo.representativeImage,
            jsonData.productInfo.images,
            jsonData.productInfo.productId,
            naverApiAuth
        );

        // 3. A-Z 옵션 처리 (useAzOption이 true인 경우)
        let processedJsonData = jsonData;
        if (useAzOption) {
            processedJsonData = addAZPrefixToOptions(jsonData);
        }

        // 4. 가격 계산
        const priceCalculationResult = await calculatePrices(
            processedJsonData.variants,
            priceConfig,
            processedJsonData.productInfo.productId
        );

        // 5. 랜덤 할인율 생성
        const discountRate = generateRandomDiscount(priceConfig, processedJsonData.productInfo.productId);

        // 6. 상세페이지 HTML 생성
        // 옵션 이미지와 이름 매핑 생성 (새로운 optionSchema 구조 사용)
        const optionNamesWithImages = [];
        if (processedJsonData.optionSchema && Array.isArray(processedJsonData.optionSchema)) {
            processedJsonData.optionSchema.forEach(option => {
                if (option.optionValues && Array.isArray(option.optionValues)) {
                    option.optionValues.forEach(value => {
                        if (value.imageUrl) {
                            // 옵션 이미지 URL 정리 및 검증
                            const cleanedImageUrl = cleanImageUrl(value.imageUrl);
                            if (cleanedImageUrl) {
                                optionNamesWithImages.push({
                                    name: cleanOptionName(value.valueName), // 옵션명 정리 적용 (A-Z 처리된 이름)
                                    image: cleanedImageUrl
                                });
                            }
                        }
                    });
                }
            });
        }
        
        // schema.md를 참고하여 파라미터 매핑
        // 상세 이미지와 상단/하단 이미지 URL 정리
        const cleanedDescriptionImages = cleanImageArray(processedJsonData.productInfo.descriptionImages || []);
        const cleanedTopImages = cleanImageArray(detailPageConfig.topImages || []);
        const cleanedBottomImages = cleanImageArray(detailPageConfig.bottomImages || []);
        
        const detailContent = generateDetailContent(
            cleanedDescriptionImages, // 정리된 상세 이미지 (이미 호스팅됨)
            detailPageConfig.includeProperties ? (processedJsonData.productInfo.attributes || []) : [], // 상품 속성 (설정에 따라)
            detailPageConfig.includeOptions ? optionNamesWithImages : [], // 옵션명과 이미지 매핑 (A-Z 처리됨, 설정에 따라)
            cleanedTopImages, // 정리된 상단 이미지
            cleanedBottomImages, // 정리된 하단 이미지
            productTrackingUrl // 추적 URL
        );

        // 7. 최종 JSON 구조 생성
        const initialJson = {
            productId: processedJsonData.productInfo.productId,
            productName: processedJsonData.productInfo.productName,
            naverCategoryId: naverCategoryId,
            brandName: processedJsonData.productInfo.brandName,
            keywords: filteredKeywords,
            deliveryFee: priceCalculationResult.deliveryInfo.deliveryFee, // 배송비 필드 추가
            images: imageData,
            contents: detailContent,
            optionSchema: processedJsonData.optionSchema.map(option => ({
                ...option,
                optionName: cleanOptionName(option.optionName), // 옵션명 정리 적용
                optionValues: option.optionValues ? option.optionValues.map(value => ({
                    ...value,
                    valueName: cleanOptionName(value.valueName) // 옵션값명 정리 적용
                })) : []
            })),
            variants: priceCalculationResult.variants, // 가격 계산된 variants (optionCombination 구조 유지)
            discountRate: discountRate
        };

        // 최종 반환값 (schema.md의 1stAssembleSchema 구조 참고)
        return {
            success: true,
            message: 'InitialJson 함수 모든 단계 완료 - 최종 JSON 생성됨',
            initialJson: initialJson,
        };

    } catch (error) {
        console.error('InitialJson 함수에서 오류 발생:', error);
        throw error;
    }
}
