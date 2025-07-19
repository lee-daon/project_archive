/**
 * 애플리케이션 설정 상수
 * 전역적으로 사용되는 설정 값을 한 곳에서 관리하기 위한 파일입니다.
 */

// Redis 큐 이름 설정
export const QUEUE_NAMES = {
  // 타오바오 상품 상세 정보 파싱 큐
  TAOBAO_DETAIL_QUEUE: 'taobao:detail:queue',
  
  // 텍스트 번역 큐
  TEXT_TRANSLATION_QUEUE: 'text:translation:queue',
  
  // 이미지 번역 큐(메인->워커)
  IMAGE_TRANSLATION_QUEUE: 'image:translation:queue',
  
  // 누끼 이미지 큐
  NUKKI_IMAGE_QUEUE: 'nukki:image:queue',
  
  // 네이버 상품 등록 큐
  NAVER_REGISTER: 'naver:register:queue',
  
  // 쿠팡 상품 등록 큐
  COOPANG_REGISTER: 'coopang:register:queue',
  
  // 11번가 상품 등록 큐
  ELEVENSTORE_REGISTER: 'elevenstore:register:queue',
  
  // 가격 변경 큐
  PRICE_CHANGE_QUEUE: 'product:price_change:queue',

  // 마켓에서 상품 내리기/삭제 큐
  MARKET_PRODUCT_REMOVAL_QUEUE: 'product:market_removal:queue',

  // 이미지 번역 파이프라인 큐 (이미지→이미지 번역)
  IMG_TRANSLATE_TASK_QUEUE: 'img:translate:tasks',
  IMG_TRANSLATE_SUCCESS_QUEUE: 'img:translate:success', 
  IMG_TRANSLATE_ERROR_QUEUE: 'img:translate:error',
  
  // 이미지 다운로드 큐 (핫링크 차단 방지용)
  IMAGE_DOWNLOAD_QUEUE: 'image:download:queue',
  
  // 추가적인 큐 이름들을 여기에 정의할 수 있습니다.
  // ANOTHER_QUEUE: 'another:queue:name'
};

// API 호출 관련 설정
export const API_SETTINGS = {
  // 타오바오 API 호출 간격 (밀리초) - 추후 200ms로 변경 예정
  TAOBAO_API_DELAY_MS: 300,
  // 타오바오 디테일 워커의 작업 간격 (밀리초)
  TAOBAO_WORKER_DELAY_MS: 200,
  
  // 번역 워커의 작업 간격 (밀리초)
  TRANSLATOR_WORKER_DELAY_MS: 30,
  
  // URL 소싱 API 호출 간격 (밀리초) - 10/s 제한을 위해 널널하게 150ms 간격
  URL_SOURCING_API_DELAY_MS: 150,
  
  // Gemini API 호출 간격 (밀리초) - 2000 rpms 제한을 위해 40ms 간격
  GEMINI_API_DELAY_MS: 40,
  
  // 이미지 번역 워커의 요청 간격 (밀리초)-과부하 방지만, redis로 보내서 브레이킹 함 
  IMAGE_REQUEST_RATE_LIMIT: 20,
  
  // 누끼워커 루프 휴식기간
  NUKKI_PROCESS_INTERVAL: 100,
  
  // 쿠팡 등록 관련 설정
  COOPANG_USER_RATE_LIMIT_MS: 1000,  // 유저별 rate limit 간격 (1초)
  COOPANG_WORKER_DELAY_MS: 200,      // 워커 대기 시간 (0.2초)
  
  // 네이버 등록 관련 설정
  NAVER_USER_RATE_LIMIT_MS: 1000,    // 유저별 rate limit 간격 (1초)
  NAVER_WORKER_DELAY_MS: 200,        // 워커 대기 시간 (0.2초)
  
  // 11번가 등록 관련 설정
  ELEVENSTORE_USER_RATE_LIMIT_MS: 1000,  // 유저별 rate limit 간격 (1초)
  ELEVENSTORE_WORKER_DELAY_MS: 200,     // 워커 대기 시간 (0.2초)
  
  // 워커별 동시 실행 제한 설정 (p-limit) - 과부하 방지용 보험
  CONCURRENCY_LIMITS: {
    TAOBAO_WORKER: 50,       // 타오바오 상세 정보 워커 (과부하 방지용 안전망)
    TRANSLATOR_WORKER: 50,   // 번역 워커 (과부하 방지용 안전망)
    COOPANG_WORKER: 50,      // 쿠팡 등록 워커 (과부하 방지용 안전망)
    NAVER_WORKER: 50,        // 네이버 등록 워커 (과부하 방지용 안전망)
    ELEVENSTORE_WORKER: 2,   // 11번가 등록 워커 (과부하 방지용 안전망)
    IMAGE_DOWNLOAD_WORKER: 50, // 네트워크 바운드 작업, 동시 처리 수 제한
    PRICE_CHANGE_WORKER: 10,      // 가격 변경 워커
    MARKET_PRODUCT_REMOVER_WORKER: 10,   // 마켓 상품 관리 워커
  },
  
  // 큐 타임아웃 설정 (초)
  QUEUE_TIMEOUT: 30,
  
  // 재시도 지연 시간 (밀리초)
  RETRY_DELAY_MS: 5000
};

// 데이터베이스 관련 설정
export const DB_SETTINGS = {
  // 임시 데이터 타입 번호
  TEMP_TYPE_UPLOAD_RESULT: 1,
  
  // 상품 데이터 재사용 기간 설정 (일 단위)
  PRODUCT_DATA_REUSE_DAYS: 60,
  
  // 기타 DB 관련 설정들...
};


// 소싱 상태 관련 상수
export const SOURCING_STATUS = {
  // 처리 상태
  PENDING: 'pending',     // 요청
  UNCOMMIT: 'uncommit',   // 성공
  COMMIT: 'commit',       // 승인
  
  // 오류 상태
  FAIL_API: 'failapi',    // API 오류
  FAIL_SAVE: 'failsave',  // 저장 실패
  
  // 금지 상태
  BAN_SHOP: 'banshop',    // 금지 상점
  BAN_SELLER: 'banseller' // 금지 판매자
};

// 삭제 대상 상태 배열
export const DELETE_TARGET_STATUSES = [
  'banshop',
  'banseller',
  'failsave',
  'failapi'
];


// Redis 캐시 키 설정
export const CACHE_KEYS = {
  // 키워드 뛰어쓰기 허용 여부
  SPACING_SETTING: (userid) => `spacing_setting:${userid}`
};

// 캐시 TTL 설정 (초 단위)
export const CACHE_TTL = {
  // 뛰어쓰기 설정 TTL (24시간)
  SPACING_SETTING: 86400
};

// 기본 설정값 내보내기
export default {
  QUEUE_NAMES,
  API_SETTINGS,
  DB_SETTINGS,
  SOURCING_STATUS,
  DELETE_TARGET_STATUSES,
  CACHE_KEYS,
  CACHE_TTL,
  userBanWords: { // redis가 아니라 map으로 관리함
    cacheLimit: 100, // 최근 조회한 사용자 수 제한
    cacheExpireTime: 30 * 60 * 1000, // 캐시 만료 시간 (30분, 밀리초)
  }
};
