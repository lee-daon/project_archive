import { createProductSchema } from './baseSchema.js';
import { 
  getPreRegisterProducts, 
  discardProducts, 
  getProductCategoryId, 
  getCategoryMapping,
  stageProduct
} from '../../db/pre_register/preRegisterDb.js';

/**
 * 등록 대기 상품 목록을 조회하는 서비스 함수
 * 클라이언트에 반환할 형식으로 데이터를 가공합니다.
 * 
 * @param {Object} params - 조회 파라미터
 * @param {string} [params.sortBy='desc'] - 정렬 방식 ('desc': 최신순, 'asc': 과거순)
 * @param {string} [params.viewMode='individual'] - 조회 모드 ('individual': 개별 목록, 'grouped': testcode 그룹별)
 * @param {string|null} [params.testCode=null] - 조회할 특정 testcode (viewMode가 'grouped'이고 특정 testcode 조회 시 사용)
 * @returns {Promise<Object>} 조회 결과 객체
 * @returns {boolean} result.success - 처리 성공 여부
 * @returns {string} result.viewMode - 조회 모드
 * @returns {string} result.sortBy - 정렬 방식
 * @returns {string|null} [result.testCode] - 조회한 testcode (있는 경우)
 * @returns {Array<Object>} [result.products] - 상품 목록 (viewMode에 따라 포함 여부 결정)
 * @returns {Array<Object>} [result.testCodeGroups] - testcode 그룹 목록 (viewMode에 따라 포함 여부 결정)
 * @throws {Error} DB 조회 중 오류 발생 시
 */
export async function getPreRegisterProductsService(params) {
  try {
    const result = await getPreRegisterProducts(params);
    
    return {
      success: true,
      viewMode: params.viewMode,
      sortBy: params.sortBy,
      testCode: params.testCode,
      ...result
    };
  } catch (error) {
    console.error('등록 대기 상품 조회 오류:', error);
    throw new Error('등록 대기 상품 조회 중 오류가 발생했습니다.');
  }
} //getPreRegisterProducts라우터

/**
 * 상품 폐기 처리 서비스 함수
 * 선택한 상품들의 상태를 폐기 처리합니다.
 * 
 * @param {Array<string|number>} productIds - 폐기 처리할 상품 ID 배열
 * @returns {Promise<Object>} 폐기 처리 결과
 * @returns {boolean} result.success - 처리 성공 여부
 * @returns {string} result.message - 결과 메시지
 * @returns {number} result.productCount - 요청한 폐기 처리 상품 수
 * @returns {number} result.updatedCount - 실제로 업데이트된 상품 수
 * @throws {Error} 상품 ID 배열이 비어있거나 유효하지 않은 경우 또는 DB 오류 발생 시
 */
export async function discardProductsService(productIds) {
  try {
    const result = await discardProducts(productIds);
    
    return {
      success: true,
      message: `${result.productCount}개 상품이 폐기 처리되었습니다.`,
      ...result
    };
  } catch (error) {
    console.error('상품 폐기 처리 오류:', error);
    throw error;
  }
} //discardProducts라우터

/**
 * 스테이징 처리 서비스 함수
 * 선택한 상품들을 스테이징 처리하고 필요한 데이터를 생성합니다.
 * 각 상품의 카테고리 매핑 여부 확인 및 데이터 생성을 수행합니다.
 * 
 * @param {Array<string|number>} productIds - 스테이징 처리할 상품 ID 배열
 * @param {string} marketNumber - 마켓 번호(상품군 단위 코드)
 * @param {string|null} [memo=null] - 상품 그룹 메모
 * @returns {Promise<Object>} 스테이징 처리 결과
 * @returns {boolean} result.success - 처리 성공 여부
 * @returns {string} result.message - 결과 메시지
 * @returns {Array<Object>} result.results - 각 상품별 처리 결과 배열
 * @returns {number} result.productCount - 처리된 상품 수
 * @throws {Error} 상품 ID 배열이 비어있거나 마켓 번호가 없는 경우 또는 처리 중 오류 발생 시
 */
export async function stageProductsService(productIds, marketNumber, memo) {
  if (!Array.isArray(productIds) || productIds.length === 0) {
    throw new Error('유효한 상품 ID 배열을 제공해야 합니다.');
  }
  
  if (!marketNumber) {
    throw new Error('마켓 번호(상품군 단위 코드)를 제공해야 합니다.');
  }
  
  // 카테고리 ID 조회 및 매핑 검사
  const categoryMap = {};
  const unmappedCategories = new Set();
  
  for (const productId of productIds) {
    const catId = await getProductCategoryId(productId);
    if (catId) {
      categoryMap[productId] = catId;
      
      const { isMapped } = await getCategoryMapping(catId);
      if (!isMapped) {
        unmappedCategories.add(catId);
      }
    }
  }
  
  // 각 상품 처리
  const results = [];
  
  for (const productId of productIds) {
    let processingError = false;
    let categoryMappingRequired = false;
    let productData = null;
    
    // 카테고리 매핑 필요 여부 확인
    const catId = categoryMap[productId];
    if (!catId || unmappedCategories.has(catId)) {
      categoryMappingRequired = true;
    }
    
    // 상품 데이터 생성 시도
    try {
      const schemaResult = await createProductSchema(productId);
      if (schemaResult.success) {
        productData = schemaResult;  // 전체 결과 객체를 사용
        
      } else {
        console.log(`상품 ${productId} 데이터 생성 실패:`, schemaResult.message);
        processingError = true;
      }
    } catch (error) {
      console.error(`상품 ${productId} 데이터 생성 오류:`, error);
      processingError = true;
    }
    
    // 상품 스테이징 처리
    try {
      await stageProduct({
        productId,
        marketNumber,
        memo,
        jsonData: productData,
        processingError,
        categoryMappingRequired
      });
      
      results.push({
        productId,
        success: true,
        processingError,
        categoryMappingRequired
      });
    } catch (error) {
      console.error(`상품 ${productId} 등록 전 처리 저장 오류:`, error);
      results.push({
        productId,
        success: false,
        error: error.message
      });
    }
  }
  
  return {
    success: true,
    message: `${productIds.length}개 상품의 등록 전 처리가 완료되었습니다.`,
    results,
    productCount: productIds.length
  };
} //stageProducts라우터