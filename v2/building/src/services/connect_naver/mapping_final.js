/**
 * 네이버 커머스 API용 상품 데이터 매핑 모듈
 * secondJson 데이터를 네이버 API 형식으로 변환
 */
import { assembleInitialJson, getPreRegisterJsonAndAssemble } from './assembleInitialJson.js';
import { priceFilter, calculatePriceGaps } from './priceFilter.js';
import { naver_register_config_extra_info } from '../../config/register_setting.js';
import { saveFinalMainPrice } from '../../db/register/naverRegisterInfo.js';

/**
 * 상품 옵션 정보를 네이버 API 형식으로 변환
 * @param {object} secondJson - priceFilter 결과의 secondJson
 * @returns {object} 네이버 API 형식의 옵션 정보
 */
function createOptionInfo(secondJson) {
  // 옵션 스키마에서 옵션 그룹명 추출
  const optionGroupNames = {};
  const optionSchemaEntries = Object.entries(secondJson.optionSchema);
  
  // 옵션 그룹명 설정
  if (optionSchemaEntries.length > 0) {
    optionGroupNames.optionGroupName1 = optionSchemaEntries[0][1];
    if (optionSchemaEntries.length > 1) {
      optionGroupNames.optionGroupName2 = optionSchemaEntries[1][1];
    }
    if (optionSchemaEntries.length > 2) {
      optionGroupNames.optionGroupName3 = optionSchemaEntries[2][1];
    }
  }

  // 옵션 조합 생성
  const optionCombinations = secondJson.variants.map((variant, index) => {
    // 옵션명 분리 (최대 3개)
    const [optionName1, optionName2, optionName3 = ""] = variant.optionNames;
    
    return {
      stockQuantity: variant.stockQuantity,
      price: variant.priceGap || 0, // priceGap을 옵션 가격으로 설정 (없으면 0)
      usable: true,
      optionName1: optionName1 || "",
      optionName2: optionName2 || "",
      optionName3: optionName3 || "",
      sellerManagerCode: `${secondJson.productId}-${index + 1}` // 판매자 관리 코드 생성
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
 * 상품 정보를 네이버 API 형식으로 매핑
 * @param {object} result - priceFilter 함수의 결과 (representativePrice, secondJson)
 * @param {object} configExtraInfo - 추가 정보 (배송, AS 등)
 * @returns {object} 네이버 API 요청용 데이터
 */
async function mapToNaverProductData(result, configExtraInfo) {
  const { representativePrice, secondJson } = result;
  
  // 판매가를 100원 단위로 올림 처리
  const roundedPrice = Math.ceil(representativePrice / 100) * 100;
  
  // 옵션별 priceGap 계산을 위한 처리
  const secondJsonWithPriceGaps = calculatePriceGaps(secondJson, representativePrice, secondJson.discountRate);

  // 기준 가격 저장
  await saveFinalMainPrice(secondJson.productId, roundedPrice);
  
  // 옵션 정보 생성
  const optionInfo = createOptionInfo(secondJsonWithPriceGaps);
  
  // 키워드 포맷 변환
  const formattedTags = formatKeywords(secondJson.keywords || []);
  
  // 네이버 API 요청 데이터 구성
  return {
    originProduct: {
      statusType: "SALE", 
      saleType: "NEW", 
      leafCategoryId: secondJson.naverCategoryId,
      name: secondJson.productName,
      detailContent: secondJson.contents,
      images: secondJson.images,
      salePrice: roundedPrice,
      stockQuantity: 0, // 옵션 상품은 원상품 재고 0
      
      deliveryInfo: {
        deliveryType: "DELIVERY",
        deliveryAttributeType: "NORMAL",
        deliveryCompany: configExtraInfo.deliveryCompany,
        deliveryBundleGroupUsable: false,
        deliveryFee: {
          deliveryFeeType: "FREE",
          delivertFeePayType: "PREPAID",
          deliveryFeeByArea: {
            deliveryAreaType: "AREA_2",
            area2extraFee: 3000,
            area3extraFee: 3000,
          },
        },
        claimDeliveryInfo: configExtraInfo.claimDeliveryInfo,
        businessCustomsClearanceSaleYn: true,
      },

      detailAttribute: {
        afterServiceInfo: {
          afterServiceTelephoneNumber: configExtraInfo.afterServiceTelephoneNumber,
          afterServiceGuideContent: configExtraInfo.afterServiceGuideContent
        },
        originAreaInfo: {
          originAreaCode: '03',
          content: '중국',
          plural: false
        },
        sellerCodeInfo: {
          sellerManagementCode: secondJson.productId,
        },
        optionInfo: optionInfo,
        taxType: 'TAX',
        minorPurchasable: true,
        productInfoProvidedNotice: {
          productInfoProvidedNoticeType: "ETC",
          etc: {
            returnCostReason: "상세설명참조",
            noRefundReason: "상세설명참조",
            qualityAssuranceStandard: "상세설명참조",
            compensationProcedure: "상세설명참조",
            troubleShootingContents: "상세설명참조",
            itemName: "상세설명참조",
            modelName: "상세설명참조",
            certificateDetails: "상세설명참조",
            manufacturer: "상세설명참조",
            customerServicePhoneNumber: configExtraInfo.afterServiceTelephoneNumber
          }
        },
        seoInfo: {
          pageTitle: secondJson.productName,
          metaDescription: secondJson.productName,//이건 나중에 수정하자.
          sellerTags: formattedTags.slice(0, 10) // 최대 10개 태그만 사용
        }
      },

      customerBenefit: {
        immediateDiscountPolicy: {
          discountMethod: {
            value: secondJson.discountRate,
            unitType: 'PERCENT',
          }
        },
        purchasePointPolicy: configExtraInfo.purchasePoint ? {
          value: configExtraInfo.purchasePoint,
          unitType: 'WON'
        } : undefined,
        reviewPointPolicy: configExtraInfo.reviewPointPolicy
      }
    },
    smartstoreChannelProduct: {
      naverShoppingRegistration: true,
      channelProductDisplayStatusType: "ON"
    }
  };
}

/**
 * 상품 매핑 및 네이버 API 요청 준비
 * @param {string} productId - 상품 ID
 * @returns {Promise<object>} 네이버 API 요청 데이터
 */
async function prepareNaverProductData(productId) {
  try {
    // 1. 상품 정보 조회
    const initialJson = await getPreRegisterJsonAndAssemble(productId);
    
    // 2. 가격 필터링 수행
    const result = await priceFilter(initialJson, initialJson.discountRate);
    
    // 3. 네이버 API 형식으로 매핑
    const naverProductData = await mapToNaverProductData(result, naver_register_config_extra_info);
    
    return naverProductData;
  } catch (error) {
    console.error('상품 데이터 준비 중 오류 발생:', error);
    throw error;
  }
}

export { prepareNaverProductData, mapToNaverProductData, createOptionInfo, formatKeywords };


