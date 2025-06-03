/**
 * @fileoverview 상품 정보 처리 서비스 모듈
 * 
 * 이 모듈은 상품 데이터를 가공하고 비즈니스 로직을 처리하는 서비스 계층입니다.
 * DB 계층에서 가져온 원시 데이터를 가공하여 클라이언트에서 사용할 수 있는 포맷으로 변환합니다.
 * 여러 DB 테이블에서 상품 관련 정보를 가져와 최종적인 상품 스키마 객체를 생성하는 역할을 합니다.
 */

import {
  fetchProductBasicInfo,
  fetchNukkiImages,
  fetchTranslatedImages,
  fetchRawImages,
  fetchTranslatedDescImages,
  fetchRawDescImages,
  fetchProperties,
  fetchSkuData,
  fetchAllOptions
} from '../../db/pre_register/getitemdata.js';

/**
 * 상품 데이터를 최종 스키마 구조로 변환합니다.
 * 
 * @param {string} productid - 조회할 상품의 ID
 * @returns {Promise<Object>} 상품 정보 처리 결과 객체. 성공 시 최종 스키마 데이터를 포함하고, 실패 시 에러 메시지를 포함합니다.
 * @description
 * 주어진 상품 ID를 사용하여 관련된 모든 정보(기본 정보, 이미지, 속성, 옵션, SKU 등)를 데이터베이스에서 가져옵니다.
 * 가져온 데이터를 가공하고 조합하여 최종적인 상품 정보 스키마 객체를 생성합니다.
 * 이 과정에서 최적화된 제목 사용, 키워드 배열화, 대표 이미지 선정, 이미지 중복 제거, 속성 포맷팅,
 * 가격 기반 SKU 필터링, 관련 옵션 매핑, 최종 변형(variants) 데이터 생성 등의 로직을 수행합니다.
 */
export async function createProductSchema(productid) {
  try {
    // 1. 기본 상품 정보 가져오기: 상품명, 카테고리 ID, 브랜드명 등 기본적인 정보를 조회합니다.
    const basicInfo = await fetchProductBasicInfo(productid);
    if (!basicInfo) {
      return { success: false, message: '상품을 찾을 수 없습니다.' };
    }

    // productName 결정
    const productName = basicInfo.title_optimized || basicInfo.title_translated || basicInfo.productNameOrigin;
    
    // keywords 배열 처리
    const keywordsArray = basicInfo.keywords ? 
      basicInfo.keywords.replace(/[\[\]]/g, '').split(',').map(item => item.trim()) : [];

    // 2. 이미지 정보 처리: 상품과 관련된 다양한 종류의 이미지를 가져옵니다.
    // (누끼 이미지, 번역된 이미지, 원본 이미지, 번역된 상세 이미지, 원본 상세 이미지)
    const nukkiImage = await fetchNukkiImages(productid); // 누끼 이미지
    const translatedImages = await fetchTranslatedImages(productid); // 번역된 일반 이미지
    const rawImages = await fetchRawImages(productid); // 원본 일반 이미지
    const translatedDesImages = await fetchTranslatedDescImages(productid); // 번역된 상세 이미지
    const rawDesImages = await fetchRawDescImages(productid); // 원본 상세 이미지

    // 대표 이미지 선정: 누끼 > 번역된 이미지 > 원본 이미지 순서로 첫 번째 이미지를 대표 이미지로 사용합니다.
    let representativeImage = null;
    if (nukkiImage.length > 0) representativeImage = nukkiImage[0].image_url;
    else if (translatedImages.length > 0) representativeImage = translatedImages[0].imageurl;
    else if (rawImages.length > 0) representativeImage = rawImages[0].imageurl;

    // 일반 이미지 목록 생성: 번역된 이미지가 있으면 사용하고, 없으면 원본 이미지를 사용합니다.
    let imagesArr = translatedImages.length > 0 ? 
      translatedImages.map(img => img.imageurl) : 
      rawImages.map(img => img.imageurl);
    
    // 대표 이미지가 일반 이미지 목록의 첫 번째와 동일하면 중복이므로 제거합니다.
    if (imagesArr.length > 0 && representativeImage === imagesArr[0]) {
      imagesArr = imagesArr.slice(1);
    }

    // 상세 이미지 목록 생성: 번역된 상세 이미지가 있으면 사용하고, 없으면 원본 상세 이미지를 사용합니다.
    const descImagesArr = translatedDesImages.length > 0 ? 
      translatedDesImages.map(img => img.imageurl) : 
      rawDesImages.map(img => img.imageurl);

    // 3. 속성 정보 처리: 상품의 속성 정보를 가져와 가공합니다.
    const properties = await fetchProperties(productid);
    // 속성 배열 생성: 번역된 이름/값 > 원본 이름/값 순서로 사용하며, 유효한 속성만 필터링합니다.
    const attributesArr = properties.map(prop => ({
      name: prop.name_translated || prop.name_raw,
      value: prop.value_translated || prop.value_raw
    })).filter(prop => prop.name && prop.value && prop.name !== "null" && prop.value !== "null");

    // 요약 속성 문자열 생성: 속성 이름들을 ' / '로 연결하여 요약 정보를 만듭니다.
    const attributes_cut = attributesArr.map(attr => attr.name).join(' / ');

    // 4. 옵션 정보 처리 (수정된 로직)
    // SKU(Stock Keeping Unit) 데이터와 모든 관련 옵션 정보를 가져옵니다.
    const skus = await fetchSkuData(productid); // SKU 정보 (가격, 재고, 옵션 조합 등)
    const allOptions = await fetchAllOptions(productid); // 상품에 연결된 모든 옵션 정보 (이름, 값, 이미지 등)

    // 가격 필터링 먼저 수행: 비정상적으로 낮은 가격의 SKU를 제외하기 위한 필터링입니다.
    // 모든 SKU의 가격(할인가 우선)을 오름차순으로 정렬합니다.
    const prices = skus.map(sku => parseFloat(sku.promotionprice || sku.price)).sort((a, b) => a - b);
    // 가격 중앙값을 계산합니다.
    const medianPrice = prices.length > 0 ? prices[Math.floor(prices.length / 2)] : 0;
    // 중앙값의 1/3을 임계값으로 설정합니다.
    const thresholdPrice = medianPrice / 3;
    // 임계값보다 높은 가격의 SKU만 필터링합니다.
    const filteredSkus = skus.filter(sku => parseFloat(sku.promotionprice || sku.price) > thresholdPrice);

    // filteredSkus에 사용된 고유한 prop_path 수집: 필터링된 SKU들이 실제로 사용하는 옵션 조합(prop_path)만 추려냅니다.
    const relevantPropPathsSet = new Set();
    filteredSkus.forEach(sku => {
      sku.prop_path.split(';').forEach(p => {
        if (p) { // 빈 문자열이 아닌 유효한 prop_path만 추가
           relevantPropPathsSet.add(p);
        }
      });
    });

    // allOptions를 필터링하여 filteredSkus와 관련된 것만 남김: 전체 옵션 정보 중에서 실제로 유효한 SKU와 연결된 옵션들만 선별합니다.
    const relevantOptions = allOptions.filter(opt => relevantPropPathsSet.has(opt.prop_path));

    // 필터링된 relevantOptions를 사용하여 최종 스키마에 필요한 매핑 데이터 생성
    const optionSchema = {}; // 옵션 ID(pid)를 키로, 옵션 이름(optionName)을 값으로 가짐. 예: { '1627207': 'Color' }
    const optionImages = {}; // 옵션 조합(prop_path)을 키로, 해당 옵션의 이미지 URL을 값으로 가짐. 예: { '1627207:28329': 'image_url' }
    const optionValueNames = {}; // 옵션 조합(prop_path)을 키로, 해당 옵션 값의 이름(optionValueName)을 값으로 가짐. 예: { '1627207:28329': 'Red' }

    // 관련 옵션 정보를 순회하며 위의 매핑 객체들을 채웁니다.
    relevantOptions.forEach(opt => {
      const [pid, vid] = opt.prop_path.split(':'); // prop_path를 ':' 기준으로 분리하여 옵션 ID(pid)와 값 ID(vid)를 얻음
      if (!pid || !vid) return; // 유효하지 않은 prop_path는 건너뜁니다.

      // 옵션 스키마 (pid: optionName): pid가 아직 등록되지 않았다면, 번역된 이름 > 원본 이름 순으로 등록합니다.
      if (!optionSchema[pid]) {
        optionSchema[pid] = opt.translated_optionname || opt.optionname;
      }

      // 옵션 값 이름 (prop_path: optionValueName): 번역된 값 이름 > 원본 값 이름 순으로 등록합니다.
      optionValueNames[opt.prop_path] = opt.translated_optionvalue || opt.optionvalue;

      // 옵션 이미지 (prop_path: imageUrl): 번역된 이미지 URL > 원본 이미지 URL 순으로 등록합니다. 이미지가 있는 경우에만.
      if (opt.imageurl || opt.imageurl_translated) {
        optionImages[opt.prop_path] = opt.imageurl_translated || opt.imageurl;
      }
    });

    // Variants(상품 변형) 생성: 필터링된 SKU(filteredSkus) 정보를 기반으로 최종 variants 배열을 만듭니다.
    const variants = [];
    filteredSkus.forEach(sku => {
      // 최대 50개의 variants만 생성하도록 제한합니다.
      if (variants.length >= 50) return;

      const propPathsArray = sku.prop_path.split(';'); // SKU의 옵션 조합 문자열을 배열로 변환
      // 유효성 검사: SKU의 각 prop_path가 `optionValueNames`에 존재하는지 확인합니다.
      // 이 검사는 `relevantOptions` 필터링으로 인해 이론상 항상 통과해야 하지만, 데이터 무결성을 위한 안전장치입니다.
      if (propPathsArray.some(p => !optionValueNames[p])) {
         console.warn(`SKU ${sku.prop_path} contains prop_path not found in relevant options, skipping variant. This might indicate an issue.`);
         return; // 유효하지 않은 prop_path가 포함된 SKU는 건너뜁니다.
      }

      // 유효한 SKU 정보를 사용하여 variant 객체를 생성하고 배열에 추가합니다.
      variants.push({
        stockQuantity: sku.quantity, // 재고 수량
        price: parseFloat(sku.promotionprice || sku.price).toFixed(2), // 가격 (소수점 둘째 자리까지)
        propPaths: propPathsArray // 옵션 조합 배열
      });
    });


    // 최종 결과 구성: 위에서 가공한 모든 데이터를 최종 스키마 객체에 담아 반환합니다.
    const finalResult = {
      success: true, // 처리 성공 여부
      productInfo: { // 상품 기본 정보
        productId: productid,
        url: basicInfo.url,
        productName: productName,
        productNameOrigin: basicInfo.productNameOrigin,
        categoryId: basicInfo.categoryId,
        brandName: basicInfo.brand_name_translated || basicInfo.brand_name,
        deliveryFee: basicInfo.deliveryFee,
        video: basicInfo.video,
        keywords: keywordsArray,
        representativeImage: representativeImage, // 대표 이미지 URL
        images: imagesArr, // 일반 이미지 URL 배열 (대표 이미지 제외)
        descriptionImages: descImagesArr, // 상세 이미지 URL 배열
        attributes: attributesArr, // 속성 객체 배열 [{name: '...', value: '...'}]
        attributes_cut: attributes_cut // 요약 속성 문자열
      },
      optionSchema: optionSchema, // 옵션 구조 {pid: optionName}
      optionImages: optionImages, // 옵션별 이미지 {prop_path: imageUrl}
      variants: variants, // 상품 변형(SKU) 배열 [{stockQuantity, price, propPaths}]
      optionValueNames: optionValueNames // 옵션 값 이름 {prop_path: optionValueName}
    };

    return finalResult; // 성공 결과 반환

  } catch (error) {
    // 오류 처리: 함수 실행 중 발생한 예외를 처리합니다.
    console.error('상품 정보 구성 실패:', error);
    // 실패 결과 및 에러 메시지 반환
    return { success: false, message: '상품 정보 구성 중 오류가 발생했습니다.' };
  }
}
