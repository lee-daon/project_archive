
/**
 * 새로운 optionSchema 배열 구조에서 옵션 정보를 네이버 API 형식으로 변환
 * @param {object} filteredJsonData - optionChoice 결과의 filteredJsonData
 * @param {string} productId - 상품 ID
 * @returns {object} 네이버 API 형식의 옵션 정보
 */
function createOptionInfo(filteredJsonData, productId) {
  const { optionSchema, variants } = filteredJsonData;
  
  // 옵션 그룹명 설정 (최대 3개)
  const optionGroupNames = {};
  if (optionSchema.length > 0) {
    optionGroupNames.optionGroupName1 = optionSchema[0].optionName;
    if (optionSchema.length > 1) {
      optionGroupNames.optionGroupName2 = optionSchema[1].optionName;
    }
    if (optionSchema.length > 2) {
      optionGroupNames.optionGroupName3 = optionSchema[2].optionName;
    }
  }

  // 옵션 조합 생성
  const optionCombinations = variants.map((variant, index) => {
    // optionCombination에서 optionSchema 순서에 맞춰 옵션명 추출
    const optionNames = optionSchema.map(option => {
      const combination = variant.optionCombination.find(combo => combo.optionId === option.optionId);
      if (combination) {
        const optionValue = option.optionValues.find(value => value.valueId === combination.valueId);
        return optionValue ? optionValue.valueName : "";
      }
      return "";
    });

    return {
      stockQuantity: variant.stockQuantity,
      price: variant.priceGap || 0, // priceGap을 옵션 가격으로 설정
      usable: true,
      optionName1: optionNames[0] || "",
      optionName2: optionNames[1] || "",
      optionName3: optionNames[2] || "",
      sellerManagerCode: productId
    };
  });

  return {
    optionCombinationSortType: 'LOW_PRICE',
    optionCombinationGroupNames: optionGroupNames,
    optionCombinations: optionCombinations,
    useStockManagement: true
  };
}

/**
 * 키워드를 네이버 API 형식으로 변환
 * @param {string[]} keywords - 키워드 배열
 * @returns {object[]} 네이버 API 형식의 태그 배열
 */
function formatKeywords(keywords) {
  return keywords.map(keyword => ({ text: keyword }));
}

/**
 * 이미지 데이터를 네이버 API 형식으로 변환
 * @param {object} imageData - InitialJson 결과의 imageData
 * @returns {object} 네이버 API 형식의 이미지 정보
 */
function formatImages(imageData) {
  const images = {
    representativeImage: imageData.representativeImage,
    optionalImages: imageData.optionalImages || []
  };
  
  return images;
}

/**
 * 상품 정보를 네이버 API 형식으로 매핑
 * @param {object} initialJsonResult - InitialJson 함수 결과
 * @param {object} optionChoiceResult - optionChoice 함수 결과
 * @param {object} config - getConfig 함수 결과
 * @param {object} categoryDetails - getCategoryDetails 함수 결과
 * @returns {object} 네이버 API 요청용 데이터
 */
export async function createNaverProductMapping(initialJsonResult, optionChoiceResult, config, categoryDetails) {
  // initialJsonResult에서 필요한 데이터 추출
  const initialJson = initialJsonResult.initialJson;
  const filteredKeywords = initialJson.keywords; // keywords는 이미 initialJson에 포함됨
  const imageData = initialJson.images; // images는 이미 initialJson에 포함됨
  const detailContent = initialJson.contents; // contents는 이미 initialJson에 포함됨
  
  const { representativePrice, filteredJsonData } = optionChoiceResult;
  const { naverConfig, naverApiAuth } = config;
  
  // 판매가를 100원 단위로 올림 처리
  const roundedPrice = Math.ceil(representativePrice / 100) * 100;
  
  // 옵션 정보 생성
  const optionInfo = createOptionInfo(filteredJsonData, initialJson.productId);
  
  // 키워드 포맷 변환
  const formattedTags = formatKeywords(filteredKeywords || []);
  
  // 이미지 포맷 변환
  const formattedImages = formatImages(imageData);
  
  // 네이버 API 요청 데이터 구성
  return {
    originProduct: {
      statusType: "SALE", 
      saleType: "NEW", 
      leafCategoryId: initialJson.naverCategoryId,
      name: initialJson.productName,
      detailContent: detailContent,
      images: formattedImages,
      salePrice: roundedPrice,
      stockQuantity: 0, // 옵션 상품은 원상품 재고 0
      
      deliveryInfo: {
        deliveryType: "DELIVERY",
        deliveryAttributeType: "NORMAL",
        deliveryCompany: naverConfig.deliveryCompany,
        deliveryBundleGroupUsable: false,
        deliveryFee: initialJson.deliveryFee > 0 ? {
          deliveryFeeType: "PAID",
          delivertFeePayType: "PREPAID",
          baseFee: initialJson.deliveryFee,
          deliveryFeeByArea: {
            deliveryAreaType: "AREA_2",
            area2extraFee: 3000,
            area3extraFee: 3000,
          },
        } : {
          deliveryFeeType: "FREE",
          delivertFeePayType: "PREPAID",
          deliveryFeeByArea: {
            deliveryAreaType: "AREA_2",
            area2extraFee: 3000,
            area3extraFee: 3000,
          },
        },
        claimDeliveryInfo: naverConfig.claimDeliveryInfo,
        businessCustomsClearanceSaleYn: true,
      },

      detailAttribute: {
        afterServiceInfo: {
          afterServiceTelephoneNumber: naverConfig.afterServiceTelephoneNumber,
          afterServiceGuideContent: naverConfig.afterServiceGuideContent
        },
        originAreaInfo: {
          originAreaCode: '03',
          content: '중국',
          plural: false
        },
        sellerCodeInfo: {
          sellerManagementCode: initialJson.productId,
        },
        optionInfo: optionInfo,
        taxType: 'TAX',
        minorPurchasable: true,
        productInfoProvidedNotice: {
          productInfoProvidedNoticeType: "ETC",
          etc: {
            returnCostReason: 0,
            noRefundReason: 0,
            qualityAssuranceStandard: 0,
            compensationProcedure: 0,
            troubleShootingContents: 0,
            itemName: "상세설명참조",
            modelName: "상세설명참조",
            manufacturer: "상세설명참조",
            customerServicePhoneNumber: naverConfig.afterServiceTelephoneNumber
          }
        },
        seoInfo: {
          pageTitle: initialJson.productName,
          metaDescription: initialJson.productName,
          sellerTags: formattedTags.slice(0, 10) // 최대 10개 태그만 사용
        },
        ...(() => {
          if (categoryDetails && categoryDetails.exceptionalCategories && categoryDetails.exceptionalCategories.length > 0) {
              const excludeContent = {};
              if (categoryDetails.exceptionalCategories.includes('KC_CERTIFICATION')) {
                  excludeContent.kcCertifiedProductExclusionYn = "KC_EXEMPTION_OBJECT";
                  excludeContent.kcExemptionType = "OVERSEAS"; 
              }
              if (categoryDetails.exceptionalCategories.includes('CHILD_CERTIFICATION')) {
                  excludeContent.childCertifiedProductExclusionYn = true;
              }
              if (categoryDetails.exceptionalCategories.includes('GREEN_PRODUCTS')) {
                  excludeContent.greenCertifiedProductExclusionYn = true;
              }
              if (Object.keys(excludeContent).length > 0) {
                  return { certificationTargetExcludeContent: excludeContent };
              }
          }
          return {};
        })()
      },

      customerBenefit: {
        immediateDiscountPolicy: {
          discountMethod: {
            value: initialJson.discountRate,
            unitType: 'PERCENT',
          }
        },
        purchasePointPolicy: naverConfig.purchasePoint ? {
          value: naverConfig.purchasePoint,
          unitType: 'WON'
        } : undefined,
        reviewPointPolicy: naverConfig.reviewPointPolicy,
        naverCashbackPrice: naverConfig.naverCashbackPrice
      }
    },
    smartstoreChannelProduct: {
      naverShoppingRegistration: true,
      channelProductDisplayStatusType: "ON"
    }
  };
}
