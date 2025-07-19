/**
 * 중앙집권화된 Rate Limit 설정
 * 실제 사용하는 API 호출 간격 및 타임아웃 설정만 관리
 */

// API 호출 간격 설정 (밀리초)
const API_RATE_LIMITS = {
  // 쿠팡 API 관련
  COUPANG: {
    PRICE_CHANGE_DELAY: 500       // 가격 변경 시 대기 시간
  },

  // 11번가 API 관련
  ELEVENSTORE: {
    PRICE_CHANGE_DELAY: 500       // 가격 변경 시 대기 시간
  },

  // 공통 처리 지연
  DELETE_PRODUCT_DELAY: 1000       // 상품 삭제 시 대기 시간 (모든 플랫폼)
};

// 타임아웃 설정 (밀리초)
const API_TIMEOUTS = {
  // 트래킹 API 관련
  TRACKING_API: {
    DELETE_VIEWS_TIMEOUT: 30000,  // 조회 데이터 삭제 API 타임아웃
    GENERAL_TIMEOUT: 30000        // 일반 트래킹 API 타임아웃
  },

  // 일반 API 타임아웃
  GENERAL: {
    SHORT_TIMEOUT: 5000           // 짧은 타임아웃
  }
};

// 지연 함수
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export {
  API_RATE_LIMITS,
  API_TIMEOUTS,
  delay
};
