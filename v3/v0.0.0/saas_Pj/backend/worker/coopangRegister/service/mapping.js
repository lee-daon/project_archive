import fs from 'fs';
import path from 'path';
import { getCoupangCategoryNotices } from './assist/categoryMeta.js';

/**
 * 쿠팡 카테고리 JSON에서 특정 카테고리 코드의 이름을 찾는 함수
 * @param {number} categoryCode - 찾을 카테고리 코드
 * @returns {string} 카테고리 이름
 */
function findCategoryName(categoryCode) {
    try {
        const categoryPath = path.join(process.cwd(), 'backend/worker/coopangRegister/db/coupang-categories.json');
        const categoryData = JSON.parse(fs.readFileSync(categoryPath, 'utf8'));
        
        function searchCategory(node) {
            if (node.displayItemCategoryCode === categoryCode) {
                return node.name;
            }
            
            if (node.child && Array.isArray(node.child)) {
                for (const child of node.child) {
                    const result = searchCategory(child);
                    if (result) return result;
                }
            }
            
            return null;
        }
        
        return searchCategory(categoryData) || "기타";
    } catch (error) {
        console.error('카테고리 이름 찾기 실패:', error);
        return "기타";
    }
}

/**
 * 할인률을 역산하여 원가를 계산하는 함수
 * @param {number} salePrice - 판매가
 * @param {number} discountRate - 할인률 (%)
 * @returns {number} 원가 (10원 단위로 올림)
 */
function calculateOriginalPrice(salePrice, discountRate) {
    if (!discountRate || discountRate <= 0) {
        const price = salePrice * 1.1; // 기본 10% 할인 적용
        return Math.ceil(price / 10) * 10; // 10원 단위로 올림
    }
    
    // 할인률을 역산: 원가 = 판매가 / (1 - 할인률/100)
    const originalPrice = salePrice / (1 - discountRate / 100);
    return Math.ceil(originalPrice / 10) * 10; // 10원 단위로 올림
}

/**
 * 옵션 조합으로부터 itemName을 생성하는 함수
 * @param {Array} optionCombination - 옵션 조합 배열
 * @param {Array} optionSchema - 옵션 스키마 배열
 * @returns {string} 아이템명
 */
function generateItemName(optionCombination, optionSchema) {
    const optionNames = [];
    
    optionCombination.forEach(combo => {
        const option = optionSchema.find(opt => opt.optionId === combo.optionId);
        if (option) {
            const value = option.optionValues.find(val => val.valueId === combo.valueId);
            if (value) {
                optionNames.push(value.valueName);
            }
        }
    });
    
    return optionNames.join('_') || '기본';
}

/**
 * 옵션 조합으로부터 attributes 생성하는 함수
 * @param {Array} optionCombination - 옵션 조합 배열
 * @param {Array} optionSchema - 옵션 스키마 배열
 * @returns {Array} attributes 배열
 */
function generateAttributes(optionCombination, optionSchema) {
    const attributes = [];
    
    optionCombination.forEach(combo => {
        const option = optionSchema.find(opt => opt.optionId === combo.optionId);
        if (option) {
            const value = option.optionValues.find(val => val.valueId === combo.valueId);
            if (value) {
                attributes.push({
                    attributeTypeName: option.optionName,
                    attributeValueName: value.valueName
                });
            }
        }
    });
    
    return attributes;
}

/**
 * 이미지 URL 정리 함수 (mapping.js용)
 * @param {string} imageUrl - 정리할 이미지 URL
 * @returns {string|null} 정리된 이미지 URL
 */
function cleanImageUrlForMapping(imageUrl) {
    if (!imageUrl || typeof imageUrl !== 'string') {
        return null;
    }
    
    let cleanedUrl = imageUrl.trim();
    
    // 프로토콜이 없는 경우 https:// 추가
    if (cleanedUrl.startsWith('//')) {
        cleanedUrl = 'https:' + cleanedUrl;
    }
    
    // http://를 https://로 변경
    if (cleanedUrl.startsWith('http://')) {
        cleanedUrl = cleanedUrl.replace('http://', 'https://');
    }
    
    return cleanedUrl;
}

/**
 * 이미지 배열을 쿠팡 형태로 변환하는 함수 (옵션별 이미지 포함)
 * @param {string} representativeImage - 대표 이미지
 * @param {Array} images - 추가 이미지들
 * @param {Array} optionCombination - 옵션 조합
 * @param {Array} optionSchema - 옵션 스키마
 * @returns {Array} 쿠팡 이미지 형태 배열
 */
function generateCoupangImages(representativeImage, images, optionCombination, optionSchema) {
    const coupangImages = [];
    
    // 선택된 옵션의 이미지를 우선적으로 대표 이미지로 사용
    let finalRepresentativeImage = null;
    
    // 옵션 조합에서 이미지 찾기
    if (optionCombination && optionSchema) {
        for (const combo of optionCombination) {
            const option = optionSchema.find(opt => opt.optionId === combo.optionId);
            if (option) {
                const value = option.optionValues.find(val => val.valueId === combo.valueId);
                if (value && value.imageUrl) {
                    finalRepresentativeImage = cleanImageUrlForMapping(value.imageUrl);
                    break; // 첫 번째 옵션 이미지를 대표 이미지로 사용
                }
            }
        }
    }
    
    // 옵션 이미지가 없으면 원래 대표 이미지 사용
    if (!finalRepresentativeImage) {
        finalRepresentativeImage = cleanImageUrlForMapping(representativeImage);
    }
    
    // 대표 이미지 추가
    if (finalRepresentativeImage) {
        coupangImages.push({
            imageOrder: 0,
            imageType: "REPRESENTATION",
            vendorPath: finalRepresentativeImage
        });
    }
    
    // 나머지 이미지들을 DETAIL로 (URL 정리)
    if (images && Array.isArray(images)) {
        images.forEach((image, index) => {
            const cleanedImage = cleanImageUrlForMapping(image);
            if (cleanedImage) {
                coupangImages.push({
                    imageOrder: index + 1,
                    imageType: "DETAIL",
                    vendorPath: cleanedImage
                });
            }
        });
    }
    
    return coupangImages;
}

/**
 * initialJsonResult와 config를 쿠팡 등록용 데이터로 매핑하는 메인 함수
 * @param {Object} initialJsonResult - createInitialJson의 결과
 * @param {Object} config - 설정 데이터
 * @returns {Object} 매핑 결과
 */
export async function mapToCoupangFormat(initialJsonResult, config) {
    try {
        console.log('쿠팡 형태로 데이터 매핑 시작');
        
        const { initialJson } = initialJsonResult;
        const { coopangConfig, priceConfig, coopangApiAuth } = config;
        
        // 키워드 필터링 (중국어, 특수문자 제거)
        const filteredKeywords = (initialJson.keywords || [])
            .map(keyword => keyword.replace(/[^a-zA-Z0-9ㄱ-ㅎㅏ-ㅣ가-힣]/g, ''))
            .filter(keyword => keyword.length > 0);

        // 카테고리 이름 조회
        const productGroup = findCategoryName(initialJson.coopangCatId);
        console.log(`카테고리 ${initialJson.coopangCatId} -> ${productGroup}`);
        
        // 배송 정보 설정
        const isFreeShipping = initialJson.deliveryInfo.deliveryFee === 0;
        const deliveryChargeType = isFreeShipping ? "FREE" : "NOT_FREE";
        const deliveryCharge = isFreeShipping ? 0 : initialJson.deliveryInfo.deliveryFee;
        
        // 공지사항 조회
        const noticesResult = await getCoupangCategoryNotices(
            coopangApiAuth.accessKey,
            coopangApiAuth.secretKey,
            initialJson.coopangCatId,
            coopangConfig.afterServiceTelephone
        );
        
        const notices = noticesResult.success ? noticesResult.data.notices : [];
        
        // 기본 상품 데이터 구성
        const baseProductData = {
            displayCategoryCode: initialJson.coopangCatId,
            sellerProductName: initialJson.productName,
            vendorId: coopangApiAuth.vendorId,
            saleStartedAt: new Date().toISOString().slice(0, 19),
            saleEndedAt: "2099-01-01T23:59:59",
            displayProductName: initialJson.productName,
            generalProductName: initialJson.productName,
            productGroup: productGroup,
            deliveryMethod: "AGENT_BUY",
            deliveryCompanyCode: coopangConfig.deliveryCompanyCode,
            deliveryChargeType: deliveryChargeType,
            deliveryCharge: deliveryCharge,
            freeShipOverAmount: 500000,
            deliveryChargeOnReturn: isFreeShipping ? coopangConfig.returnInfo.returnDeliveryFee : 2500,
            remoteAreaDeliverable: "Y",
            unionDeliveryType: "NOT_UNION_DELIVERY",
            returnCenterCode: coopangConfig.returnInfo.returnCenterCode,
            returnChargeName: coopangConfig.returnInfo.returnChargeName,
            companyContactNumber: coopangConfig.returnInfo.companyContactNumber,
            returnZipCode: coopangConfig.returnInfo.returnZipCode,
            returnAddress: coopangConfig.returnInfo.returnAddress,
            returnAddressDetail: coopangConfig.returnInfo.returnAddressDetail,
            returnCharge: coopangConfig.returnInfo.returnDeliveryFee,
            outboundShippingPlaceCode: coopangConfig.returnInfo.outboundShippingPlaceCode,
            vendorUserId: coopangApiAuth.vendorUserId,
            requested: true
        };
        
        // variants를 items로 변환
        const items = [];
        
        if (initialJson.variants && Array.isArray(initialJson.variants)) {
            initialJson.variants.forEach((variant, index) => {
                const itemName = generateItemName(variant.optionCombination, initialJson.optionSchema);
                const salePrice = variant.calculatedPrice;
                const originalPrice = calculateOriginalPrice(salePrice, initialJson.discountRate);
                
                // externalVendorSku를 productId로 대체합니다.
                // 참고: 여러 옵션이 하나의 상품으로 등록될 경우, 각 item의 SKU가 동일하여 문제가 발생할 수 있습니다.
                const externalVendorSku = initialJson.productId;

                const attributes = generateAttributes(variant.optionCombination, initialJson.optionSchema);
                const images = generateCoupangImages(
                    initialJson.representativeImage, 
                    initialJson.images, 
                    variant.optionCombination, 
                    initialJson.optionSchema
                );
                
                
                const item = {
                    itemName: itemName,
                    originalPrice: originalPrice,
                    salePrice: salePrice,
                    maximumBuyCount: variant.stockQuantity || 9999,
                    maximumBuyForPerson: 0,
                    outboundShippingTimeDay: 3,
                    maximumBuyForPersonPeriod: 1,
                    unitCount: 1,
                    adultOnly: "EVERYONE",
                    taxType: "TAX",
                    parallelImported: "NOT_PARALLEL_IMPORTED",
                    overseasPurchased: "OVERSEAS_PURCHASED",
                    pccNeeded: "true",
                    externalVendorSku: externalVendorSku,
                    emptyBarcode: true,
                    emptyBarcodeReason: "구매대행상품",
                    certifications: [
                        {
                            certificationType: "NOT_REQUIRED",
                            certificationCode: ""
                        }
                    ],
                    searchTags: filteredKeywords,
                    images: images,
                    notices: notices,
                    attributes: attributes,
                    contents: [
                        {
                            contentsType: "TEXT",
                            contentDetails: [
                                {
                                    content: `<html>${initialJson.contents}</html>`,
                                    detailType: "TEXT"
                                }
                            ]
                        }
                    ],
                    offerCondition: "NEW",
                    offerDescription: ""
                };
                
                items.push(item);
            });
        }
        
        // 최종 데이터 구성
        const coupangData = {
            ...baseProductData,
            items: items,
            requiredDocuments: [
                {
                    templateName: "인보이스영수증(해외구매대행 선택시)",
                    vendorDocumentPath: "http://image11.coupangcdn.com/image/product/content/vendorItem/2018/07/02/41579010/eebc0c30-8f35-4a51-8ffd-808953414dc1.jpg"
                }
            ]
        };
        
        
        return {
            success: true,
            totalItems: items.length,
            data: coupangData,
            message: `쿠팡 등록용 데이터 매핑 완료 - ${items.length}개 아이템`
        };
        
    } catch (error) {
        console.error('쿠팡 매핑 중 오류 발생:', error);
        return {
            success: false,
            totalItems: 0,
            data: null,
            message: `매핑 실패: ${error.message}`
        };
    }
}
