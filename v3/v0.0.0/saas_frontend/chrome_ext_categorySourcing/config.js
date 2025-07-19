/**
 * 타오바오 스크래퍼 설정
 * 
 * 참고: 이 파일은 background.js에서만 사용됩니다.
 * content-script.js에서는 직접 정의된 CONFIG를 사용합니다.
 */
export const CONFIG = {
  urlPatterns: {
    taobao: 'taobao.com',
    tmall: 'tmall.com',
    localWebApp: 'localhost:8080',
    networkWebApp: '192.168.0.32:8080',
    sourcingCategoryPath: '/product/sourcing/category'
  },
  
  messaging: {
    source: 'taobao-scraper-extension',
    responseSource: 'b-web-app-response',
    responseTimeout: 10000,
    actions: {
      checkConnection: 'checkConnection',
      startScraping: 'startScraping',
      stopScraping: 'stopScraping',
      updateProgress: 'updateProgress',
      scrapingComplete: 'scrapingComplete',
      scrapingError: 'scrapingError',
      getProgress: 'getProgress',
      progressUpdate: 'progressUpdate',
      scrapingSuccess: 'scrapingSuccess',
      sendProductData: 'sendProductData',
      importProducts: 'importProducts'
    }
  },
  
  ui: {
    badgeColors: {
      progress: '#4285F4',
      error: '#DC3545'
    }
  },
  
  errorMessages: {
    alreadyRunning: '이미 실행중입니다.',
    invalidTargetCount: '유효하지 않은 목표 수입니다.',
    notShoppingPage: '타오바오 또는 티몰 상품 목록 페이지에서 실행해주세요.',
    webAppNotOpen: 'B 웹앱을 먼저 열어주세요',
    webAppConnectionFailed: 'B 웹앱에 연결할 수 없습니다.',
    sourcingPageRequired: '페이지를 열어주세요.',
    scriptExecutionError: '크롤러 스크립트를 실행할 수 없습니다:',
    unknownError: '알 수 없는 오류가 발생했습니다:',
    noProductsCollected: '수집된 상품이 없습니다.',
    dataProcessingError: '데이터 처리 중 오류가 발생했습니다:',
    webAppDataSendError: 'B 웹앱으로 데이터를 전송하는 중 오류가 발생했습니다:',
    noRunningTask: '실행 중인 작업이 없습니다.',
    stopError: '중단 중 오류가 발생했습니다:'
  }
}; 