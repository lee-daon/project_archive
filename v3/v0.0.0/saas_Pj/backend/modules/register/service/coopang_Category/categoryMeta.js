import { createCoupangAuthHeaders } from '../../../../common/utils/coopang_auth.js';
import { proxyGet } from '../../../../common/utils/proxy.js';

/**
 * 쿠팡 카테고리 메타데이터 조회 (특정 카테고리 코드)
 * @param {string} accessKey - 쿠팡 액세스 키
 * @param {string} secretKey - 쿠팡 시크릿 키
 * @param {number} displayCategoryCode - 노출 카테고리 코드
 * @returns {Promise<object>} 카테고리 메타데이터 응답
 */
export const getCoupangCategoryMeta = async (accessKey, secretKey, displayCategoryCode) => {
    try {
      // 입력값 검증
      if (!accessKey || typeof accessKey !== 'string') {
        throw new Error('유효한 액세스 키가 필요합니다.');
      }
  
      if (!secretKey || typeof secretKey !== 'string') {
        throw new Error('유효한 시크릿 키가 필요합니다.');
      }
  
      if (!displayCategoryCode || typeof displayCategoryCode !== 'number') {
        throw new Error('유효한 카테고리 코드가 필요합니다.');
      }
  
      const method = 'GET';
      const path = `/v2/providers/seller_api/apis/api/v1/marketplace/meta/category-related-metas/display-category-codes/${displayCategoryCode}`;
      const query = ''; // 쿼리 파라미터 없음
      
      // 인증 헤더 생성
      const headers = createCoupangAuthHeaders(accessKey, secretKey, method, path, query);
      
      // 프록시를 통한 요청
      const url = `api-gateway.coupang.com${path}`;
      
      console.log(`쿠팡 카테고리 메타데이터 조회 요청: ${url}`);
      const response = await proxyGet(url, {}, headers);
      
      return {
        success: true,
        data: response.data,
        message: `카테고리 ${displayCategoryCode} 메타데이터 조회 성공`
      };
    } catch (error) {
      console.error(`카테고리 ${displayCategoryCode} 메타데이터 조회 실패:`, error.message);
      return {
        success: false,
        error: error.message,
        data: null,
        message: `카테고리 ${displayCategoryCode} 메타데이터 조회 실패`
      };
    }
  };

/**
 * 카테고리 메타데이터에서 필요한 attributes만 필터링하는 함수
 * - exposed가 "EXPOSED"인 것만 선택
 * - groupNumber가 정수이면서 동일한 것 중에서는 1가지만 선택
 * - groupNumber가 "NONE"인 것들은 모두 포함
 * - 최대 3개까지만 선택
 * 
 * @param {Object} categoryMetaData - 쿠팡 카테고리 메타데이터 응답 객체
 * @returns {Array} 필터링된 attributes 배열
 */
const filterCategoryAttributes = (categoryMetaData) => {
  try {
    // 디버깅: 전달받은 데이터 구조 확인
    console.log('=== filterCategoryAttributes 디버깅 정보 ===');
    console.log('categoryMetaData 타입:', typeof categoryMetaData);
    console.log('categoryMetaData 존재 여부:', !!categoryMetaData);
    console.log('categoryMetaData.data 존재 여부:', !!categoryMetaData?.data);
    console.log('categoryMetaData.data.attributes 존재 여부:', !!categoryMetaData?.data?.attributes);
    
    // 전체 데이터 구조 출력 (깊이 제한)
    if (categoryMetaData) {
      console.log('categoryMetaData 구조:');
      console.log('- 최상위 키들:', Object.keys(categoryMetaData));
      if (categoryMetaData.data) {
        console.log('- data 레벨 키들:', Object.keys(categoryMetaData.data));
        if (categoryMetaData.data.attributes) {
          console.log('- attributes 배열 길이:', categoryMetaData.data.attributes.length);
        }
      }
    }
    console.log('=======================================');

    // 입력 데이터 검증
    if (!categoryMetaData?.data?.attributes) {
      console.warn('카테고리 메타데이터 구조가 올바르지 않습니다.');
      console.warn('예상 구조: categoryMetaData.data.attributes');
      return [];
    }

    const attributes = categoryMetaData.data.attributes;
    
    // 1단계: exposed가 "EXPOSED"인 것만 필터링
    const exposedAttributes = attributes.filter(attr => attr.exposed === "EXPOSED");
    
    // 2단계: groupNumber 처리
    const groupedAttributes = new Map(); // 정수 groupNumber만 중복 제거
    const noneGroupAttributes = []; // "NONE" groupNumber는 모두 포함
    
    exposedAttributes.forEach(attr => {
      const groupNumber = attr.groupNumber;
      
      if (groupNumber === "NONE") {
        // groupNumber가 "NONE"인 경우 모두 포함
        noneGroupAttributes.push(attr);
      } else if (!isNaN(Number(groupNumber))) {
        // groupNumber가 정수인 경우 중복 제거
        if (!groupedAttributes.has(groupNumber)) {
          groupedAttributes.set(groupNumber, attr);
        }
      }
      // 그 외의 경우는 제외
    });
    
    // 3단계: 결과 배열 생성 및 개수 제한 (최대 3개)
    const result = [
      ...Array.from(groupedAttributes.values()),
      ...noneGroupAttributes
    ].slice(0, 3);
    
    console.log(`카테고리 속성 필터링: 전체 ${attributes.length}개 → exposed 조건 ${exposedAttributes.length}개 → 최종 ${result.length}개`);
    
    return result;
    
  } catch (error) {
    console.error('카테고리 속성 필터링 중 오류:', error);
    return [];
  }
};

/**
 * 필터링된 attributes를 간소화된 형태로 변환하는 함수
 * @param {Array} filteredAttributes - 필터링된 attributes 배열
 * @returns {Array} 간소화된 속성 정보 배열
 */
const simplifyAttributes = (filteredAttributes) => {
  return filteredAttributes.map(attr => {
    const simplified = {
      name: attr.attributeTypeName,
      dataType: attr.dataType,
      inputType: attr.inputType,
      required: attr.required
    };

    // inputType에 따른 조건부 필드 추가
    if (attr.inputType === "SELECT") {
      // SELECT 타입은 inputValues만 포함
      simplified.inputValues = attr.inputValues || [];
    } else if (attr.inputType === "INPUT") {
      // INPUT 타입은 basicUnit만 포함, inputValues 제외
      simplified.basicUnit = attr.basicUnit;
    } else {
      // 기타 타입은 모든 정보 포함
      simplified.basicUnit = attr.basicUnit;
      simplified.usableUnits = attr.usableUnits || [];
      simplified.inputValues = attr.inputValues || [];
    }

    return simplified;
  });
};

/**
 * 쿠팡 카테고리 메타데이터를 조회하고 필요한 정보만 추출하는 통합 함수
 * @param {string} accessKey - 쿠팡 액세스 키
 * @param {string} secretKey - 쿠팡 시크릿 키
 * @param {number} displayCategoryCode - 노출 카테고리 코드
 * @returns {Promise<object>} 처리된 카테고리 정보
 */
export const getCoupangCategoryEssentials = async (accessKey, secretKey, displayCategoryCode) => {
  try {
    // 1단계: 카테고리 메타데이터 조회
    const metaResult = await getCoupangCategoryMeta(accessKey, secretKey, displayCategoryCode);
    
    // 디버깅: metaResult 구조 확인
    console.log('=== getCoupangCategoryEssentials 디버깅 정보 ===');
    console.log('metaResult.success:', metaResult.success);
    if (metaResult.success && metaResult.data) {
      console.log('metaResult.data 구조:');
      console.log('- 최상위 키들:', Object.keys(metaResult.data));
      if (metaResult.data.data) {
        console.log('- data 레벨 키들:', Object.keys(metaResult.data.data));
      }
    }
    console.log('=======================================');
    
    if (!metaResult.success) {
      return {
        success: false,
        error: metaResult.error,
        message: metaResult.message,
        data: null
      };
    }

    // 2단계: attributes 필터링 및 간소화
    const filteredAttributes = filterCategoryAttributes(metaResult.data);
    const simplifiedAttributes = simplifyAttributes(filteredAttributes);

    // 3단계: 필요한 정보만 반환
    return {
      success: true,
      data: {
        attributes: simplifiedAttributes
      },
      message: `카테고리 ${displayCategoryCode} 속성 추출 성공`
    };
    
  } catch (error) {
    console.error(`카테고리 ${displayCategoryCode} 속성 추출 실패:`, error);
    return {
      success: false,
      error: error.message,
      message: `카테고리 ${displayCategoryCode} 속성 추출 실패`,
      data: null
    };
  }
};
