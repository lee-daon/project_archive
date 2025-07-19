import bannedWords from '../../../common/config/bannedWords.js';
import { identifyBrandFromInfo } from '../../../common/utils/gemini.js';
import { getBrandNames, updateBrandFilterStatus, updateBrandNamesTranslatedBulk } from '../repository/brandchecker.js';

/**
 * userId와 productIds 배열을 받아서, products_detail 테이블에서 해당 userId와 productid의 brand_name이 존재하는 경우
 * 금지어가 포함되어 있는지 확인하고, title_raw에서도 브랜드명을 추출하여 처리함
 * 포함된 경우 bannedItems 배열(각 항목: { userId, productId, brandName, url })에,
 * 포함되지 않은 경우 nonBannedItems 배열(각 항목: { userId, productId })에 담아 객체로 반환하는 함수
 * 금지어가 포함된 경우 brandbancheck로 상태 업데이트
 */
export async function filterBannedBrands(userId, productIds) {
  try {
    const results = await getBrandNames(userId, productIds);

    // 브랜드명 식별이 필요한 상품과 이미 처리된 상품 분리
    const productsToIdentify = [];
    const processedResults = [];

    for (const row of results) {
      if (row.brand_name_translated) {
        processedResults.push({
          ...row,
          effective_brand_name: row.brand_name_translated
        });
      } else if (row.title_raw) {
        productsToIdentify.push(row);
      } else {
        processedResults.push({ ...row, effective_brand_name: '' });
      }
    }

    // 브랜드명 병렬 식별
    const brandIdentificationPromises = productsToIdentify.map(row =>
      identifyBrandFromInfo(row.title_raw, row.brand_name || '')
        .then(identifiedBrand => {
          const finalBrand = (identifiedBrand && identifiedBrand.trim() !== '' && identifiedBrand !== '없음') ? identifiedBrand : '';
          return {
            ...row,
            effective_brand_name: finalBrand
          };
        })
        .catch(error => {
          console.error(`브랜드 식별 오류: ${row.productid}`, error);
          return { ...row, effective_brand_name: '' }; // 오류 발생 시 빈 브랜드명으로 처리
        })
    );

    const identifiedResults = await Promise.all(brandIdentificationPromises);

    // 식별된 브랜드명 DB 일괄 업데이트
    const brandUpdates = identifiedResults
      .filter(row => row.effective_brand_name)
      .map(row => ({
        productId: row.productid,
        identifiedBrand: row.effective_brand_name
      }));

    if (brandUpdates.length > 0) {
      await updateBrandNamesTranslatedBulk(userId, brandUpdates);
    }
    
    // 모든 결과를 합침
    const allResults = [...processedResults, ...identifiedResults];

    // 금지어 포함 상품 필터링
    const bannedItems = allResults
      .filter(row => row.effective_brand_name && bannedWords.some(word => row.effective_brand_name.includes(word)))
      .map(row => ({
        userId,
        productId: row.productid,
        brandName: row.effective_brand_name,
        url: row.detail_url
      }));

    // 금지어 미포함 상품
    const nonBannedItems = allResults
      .filter(row => !(row.effective_brand_name && bannedWords.some(word => row.effective_brand_name.includes(word))))
      .map(row => ({
        userId,
        productId: row.productid
      }));

    // 금지어 포함 상품 상태 업데이트
    if (bannedItems.length > 0) {
      const bannedProductIds = bannedItems.map(item => item.productId);
      await updateBrandFilterStatus(userId, bannedProductIds);
    }

    return {
      bannedItems,
      nonBannedItems
    };
  } catch (error) {
    throw error;
  }
}