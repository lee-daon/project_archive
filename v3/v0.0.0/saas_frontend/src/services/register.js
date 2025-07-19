import httpClient from './httpClient.js';

// 초기 데이터 로딩 (상품배열, 그룹코드, 쿠팡/네이버 마켓 정보)
export const getInitialData = async () => {
  try {
    const response = await httpClient.get('reg/initial');
    return response.data;
  } catch (error) {
    console.error('초기 데이터 로딩 실패:', error);
    throw error;
  }
};

// 탭과 그룹코드로 상품 검색
export const searchProducts = async (tabInfo, groupCode = null) => {
  try {
    const params = { tabInfo };
    if (groupCode) params.groupCode = groupCode;
    
    const response = await httpClient.get('reg/search', { params });
    return response.data;
  } catch (error) {
    console.error('상품 검색 실패:', error);
    throw error;
  }
};

// 상품 이미지 URL 가져오기
export const getProductImage = async (productId) => {
  try {
    const response = await httpClient.get(`reg/image/${productId}`);
    return response.data;
  } catch (error) {
    console.error('상품 이미지 로딩 실패:', error);
    throw error;
  }
};

// 상품 등록
export const registerProducts = async (data) => {
  try {
    const response = await httpClient.post('reg/register', data);
    return response.data;
  } catch (error) {
    console.error('상품 등록 실패:', error);
    throw error;
  }
};

// 상품 폐기
export const discardProducts = async (data) => {
  try {
    const response = await httpClient.post('reg/discard', data);
    return response.data;
  } catch (error) {
    console.error('상품 폐기 실패:', error);
    throw error;
  }
};

// 쿠팡 매핑 필요 상품 목록 조회
export const getCoopangMappingProducts = async () => {
  try {
    const response = await httpClient.get('reg/coopangmapping/products');
    return response.data;
  } catch (error) {
    console.error('쿠팡 매핑 상품 목록 조회 실패:', error);
    throw error;
  }
};

// 특정 상품의 매핑 데이터 조회
export const getProductMappingData = async (productId) => {
  try {
    const response = await httpClient.get(`reg/coopangmapping/product/${productId}`);
    return response.data;
  } catch (error) {
    console.error('상품 매핑 데이터 조회 실패:', error);
    throw error;
  }
};

// 수동 옵션 매핑 저장
export const saveManualMapping = async (productId, mappedJson) => {
  try {
    const response = await httpClient.post(`reg/coopangmapping/manual/${productId}`, {
      mappedJson
    });
    return response.data;
  } catch (error) {
    console.error('수동 옵션 매핑 저장 실패:', error);
    throw error;
  }
};

// 자동 옵션 매핑 처리
export const processAutoMapping = async (productIds) => {
  try {
    const response = await httpClient.post('reg/coopangmapping/auto', {
      productIds
    });
    return response.data;
  } catch (error) {
    console.error('자동 옵션 매핑 처리 실패:', error);
    throw error;
  }
};

// 쿠팡 매핑 상품 폐기
export const discardCoopangMapping = async (productId) => {
  try {
    const response = await httpClient.post('reg/coopangmapping/discard', {
      productId
    });
    return response.data;
  } catch (error) {
    console.error('쿠팡 매핑 폐기 실패:', error);
    throw error;
  }
};

// ESM 엑셀 파일 다운로드
export const downloadExcelFile = async (fileName) => {
  try {
    const response = await httpClient.get(`reg/download/excel/${fileName}`, {
      responseType: 'blob'
    });
    
    // Blob URL 생성
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    
    // 다운로드 처리
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // 메모리 정리
    window.URL.revokeObjectURL(url);
    
    return { success: true };
  } catch (error) {
    console.error('엑셀 파일 다운로드 실패:', error);
    throw error;
  }
};

