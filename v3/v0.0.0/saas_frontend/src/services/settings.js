import httpClient from './httpClient';

// 공통 정책 설정 API
export const getCommonPolicy = async () => {
  try {
    const response = await httpClient.get('/setting/commonpolicy/');
    return response.data;
  } catch (error) {
    console.error('공통 정책 조회 실패:', error);
    throw error;
  }
};

export const updateCommonPolicy = async (policyData) => {
  try {
    const response = await httpClient.put('/setting/commonpolicy/', policyData);
    return response.data;
  } catch (error) {
    console.error('공통 정책 업데이트 실패:', error);
    throw error;
  }
};

// 네이버 정책 설정 API
export const getNaverPolicy = async () => {
  try {
    const response = await httpClient.get('/setting/naverpolicy/');
    return response.data;
  } catch (error) {
    console.error('네이버 정책 조회 실패:', error);
    throw error;
  }
};

export const updateNaverPolicy = async (policyData) => {
  try {
    const response = await httpClient.put('/setting/naverpolicy/', policyData);
    return response.data;
  } catch (error) {
    console.error('네이버 정책 업데이트 실패:', error);
    throw error;
  }
};

// 마켓 설정 API
export const getMarketSettings = async (market) => {
  try {
    const response = await httpClient.get(`/setting/marketsetting/?market=${market}`);
    return response.data;
  } catch (error) {
    console.error('마켓 설정 조회 실패:', error);
    throw error;
  }
};

export const createMarketSetting = async (market, marketData) => {
  try {
    const response = await httpClient.post(`/setting/marketsetting/?market=${market}`, marketData);
    return response.data;
  } catch (error) {
    console.error('마켓 설정 생성 실패:', error);
    throw error;
  }
};

export const updateMarketSetting = async (shopid, market, marketData) => {
  try {
    const response = await httpClient.put(`/setting/marketsetting/${shopid}?market=${market}`, marketData);
    return response.data;
  } catch (error) {
    console.error('마켓 설정 업데이트 실패:', error);
    throw error;
  }
};

export const deleteMarketSetting = async (shopid, market) => {
  try {
    const response = await httpClient.delete(`/setting/marketsetting/${shopid}?market=${market}`);
    return response.data;
  } catch (error) {
    console.error('마켓 설정 삭제 실패:', error);
    throw error;
  }
};

// 네이버 주소록 조회 API
export const getNaverAddressBook = async (clientId, clientSecret) => {
  try {
    const response = await httpClient.post('/setting/naver-address-book', {
      client_id: clientId,
      client_secret: clientSecret
    });
    return response.data;
  } catch (error) {
    console.error('네이버 주소록 조회 실패:', error);
    throw error;
  }
};

// 쿠팡 배송지 조회 API
export const getCoupangShippingPlaces = async (accessKey, secretKey, vendorId) => {
  try {
    const response = await httpClient.post('/setting/coupang-shipping/', {
      accessKey,
      secretKey,
      vendorId
    });
    return response.data;
  } catch (error) {
    console.error('쿠팡 배송지 조회 실패:', error);
    throw error;
  }
};

// 쿠팡 정책 설정 API
export const getCoupangPolicy = async () => {
  try {
    const response = await httpClient.get('/setting/coopangpolicy/');
    return response.data;
  } catch (error) {
    console.error('쿠팡 정책 조회 실패:', error);
    throw error;
  }
};

export const updateCoupangPolicy = async (policyData) => {
  try {
    const response = await httpClient.put('/setting/coopangpolicy/', policyData);
    return response.data;
  } catch (error) {
    console.error('쿠팡 정책 업데이트 실패:', error);
    throw error;
  }
};

// 사용자 금지어 설정 API
export const getBanWords = async () => {
  try {
    const response = await httpClient.get('/setting/banwords');
    return response.data;
  } catch (error) {
    console.error('사용자 금지어 조회 실패:', error);
    throw error;
  }
};

export const updateBanWords = async (bannedWords) => {
  try {
    const response = await httpClient.put('/setting/banwords', {
      bannedWords
    });
    return response.data;
  } catch (error) {
    console.error('사용자 금지어 업데이트 실패:', error);
    throw error;
  }
};

// 상세페이지 설정 API
export const getDetailPageSetting = async () => {
  try {
    const response = await httpClient.get('/setting/detail-page/');
    return response.data;
  } catch (error) {
    console.error('상세페이지 설정 조회 실패:', error);
    throw error;
  }
};

export const updateDetailPageSetting = async (settingData) => {
  try {
    // 이미지가 포함된 경우 FormData로 전송
    const hasImages = settingData.top_images || settingData.bottom_images;
    
    if (hasImages) {
      const formData = new FormData();
      
      // 기본 설정 추가 (boolean을 숫자로 변환)
      formData.append('include_properties', settingData.include_properties ? 1 : 0);
      formData.append('include_options', settingData.include_options ? 1 : 0);
      
      // 변경된 이미지 인덱스 정보 추가 (삭제 및 업로드 구분용)
      const changedTopIndexes = [];
      const changedBottomIndexes = [];
      const deletedTopIndexes = [];
      const deletedBottomIndexes = [];
      
      // 변경된 상단 이미지 추가
      if (settingData.top_images) {
        settingData.top_images.forEach((image, index) => {
          if (image.changed) {
            changedTopIndexes.push(index);
            if (image.file) {
              // 새로 업로드된 이미지
              formData.append(`top_images[${index}]`, image.file);
            } else if (!image.url || image.url === '') {
              // 삭제된 이미지 표시
              deletedTopIndexes.push(index);
              formData.append(`deleted_top_images[${index}]`, 'true');
            }
          }
        });
      }
      
      // 변경된 하단 이미지 추가
      if (settingData.bottom_images) {
        settingData.bottom_images.forEach((image, index) => {
          if (image.changed) {
            changedBottomIndexes.push(index);
            if (image.file) {
              // 새로 업로드된 이미지
              formData.append(`bottom_images[${index}]`, image.file);
            } else if (!image.url || image.url === '') {
              // 삭제된 이미지 표시
              deletedBottomIndexes.push(index);
              formData.append(`deleted_bottom_images[${index}]`, 'true');
            }
          }
        });
      }
      
      // 변경 및 삭제 정보를 JSON으로 전송
      const changeInfo = {
        top_changed: changedTopIndexes,
        bottom_changed: changedBottomIndexes,
        top_deleted: deletedTopIndexes,
        bottom_deleted: deletedBottomIndexes
      };
      
      if (changedTopIndexes.length > 0 || changedBottomIndexes.length > 0) {
        formData.append('changed_images', JSON.stringify(changeInfo));
      }
      
      const response = await httpClient.post('/setting/detail-page/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } else {
      // 기본 설정만 변경하는 경우 (boolean을 숫자로 변환)
      const response = await httpClient.post('/setting/detail-page/', {
        include_properties: settingData.include_properties ? 1 : 0,
        include_options: settingData.include_options ? 1 : 0
      });
      return response.data;
    }
  } catch (error) {
    console.error('상세페이지 설정 업데이트 실패:', error);
    throw error;
  }
};

// 기타 설정 API
export const getProcessSetting = async () => {
  try {
    const response = await httpClient.get('/setting/extra/');
    return response.data;
  } catch (error) {
    console.error('기타 설정 조회 실패:', error);
    throw error;
  }
};

export const updateProcessSetting = async (settingData) => {
  try {
    const response = await httpClient.put('/setting/extra/', {
      use_deep_ban: settingData.use_deep_ban ? 1 : 0,
      allow_keyword_spacing: settingData.allow_keyword_spacing ? 1 : 0
    });
    return response.data;
  } catch (error) {
    console.error('기타 설정 업데이트 실패:', error);
    throw error;
  }
};

// 마켓번호 목록 조회 API
export const getMarketNumbers = async (market) => {
  try {
    const response = await httpClient.get(`/setting/extra/market-numbers/?market=${market}`);
    return response.data;
  } catch (error) {
    console.error('마켓번호 목록 조회 실패:', error);
    throw error;
  }
};

// 상품개수 조회 API
export const getProductCount = async (params) => {
  try {
    const response = await httpClient.get('/setting/extra/product-count/', {
      params: params
    });
    return response.data;
  } catch (error) {
    console.error('상품개수 조회 실패:', error);
    throw error;
  }
};

// 상품개수 수정 API
export const updateProductCount = async (countData) => {
  try {
    const response = await httpClient.put('/setting/extra/product-count/', countData);
    return response.data;
  } catch (error) {
    console.error('상품개수 수정 실패:', error);
    throw error;
  }
};

// 11번가 정책 설정 API
export const getElevenStorePolicy = async () => {
  try {
    const response = await httpClient.get('/setting/elevenstorepolicy');
    return response.data;
  } catch (error) {
    console.error('11번가 정책 조회 실패:', error);
    throw error;
  }
};

export const updateElevenStorePolicy = async (policyData) => {
  try {
    const response = await httpClient.put('/setting/elevenstorepolicy', policyData);
    return response.data;
  } catch (error) {
    console.error('11번가 정책 업데이트 실패:', error);
    throw error;
  }
};

// 판매자 차단 API
export const banSellerByProductId = async (productId) => {
  try {
    const response = await httpClient.post('/setting/ban-seller/', {
      product_id: productId
    });
    return response.data;
  } catch (error) {
    console.error('판매자 차단 실패:', error);
    throw error;
  }
};

// 11번가 주소 조회 API
export const getElevenStoreAddress = async (apiKey) => {
  try {
    const response = await httpClient.post('/setting/elevenstore-address/', {
      apiKey
    });
    return response.data;
  } catch (error) {
    console.error('11번가 주소 조회 실패:', error);
    
    // 서버에서 에러 응답이 있는 경우 해당 메시지 반환
    if (error.response && error.response.data) {
      return error.response.data;
    }
    
    // 네트워크 오류 등 다른 에러의 경우
    return {
      success: false,
      message: '서버와의 연결에 실패했습니다. 잠시 후 다시 시도해주세요.',
      data: null
    };
  }
}; 

// ESM 정책 설정 API
export const getEsmPolicy = async () => {
  try {
    const response = await httpClient.get('/setting/esm-policy');
    return response.data;
  } catch (error) {
    console.error('ESM 정책 조회 실패:', error);
    throw error;
  }
};

export const updateEsmPolicy = async (policyData) => {
  try {
    const response = await httpClient.put('/setting/esm-policy', policyData);
    return response.data;
  } catch (error) {
    console.error('ESM 정책 업데이트 실패:', error);
    throw error;
  }
}; 