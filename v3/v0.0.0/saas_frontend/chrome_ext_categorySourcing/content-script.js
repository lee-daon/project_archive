// CONFIG를 직접 정의 (config.js에서 로드하지 않음)
const CONFIG = {
  urlPatterns: {
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
      sendProductData: 'sendProductData',
      importProducts: 'importProducts'
    }
  },
  errorMessages: {
    webAppNotOpen: 'B 웹앱을 먼저 열어주세요',
    webAppConnectionFailed: 'B 웹앱에 연결할 수 없습니다.',
    sourcingPageRequired: '카테고리 수집 페이지를 열어주세요.'
  }
};

console.log('타오바오 스크래퍼 콘텐츠 스크립트가 로드되었습니다.');

// 이벤트 리스너 설정 함수
function setupEventListeners() {
  // 페이지 로드 완료 후 웹앱에 메시지 리스너 등록
  window.addEventListener('load', () => {
    // 웹앱에서 확장 프로그램으로 오는 메시지 수신을 위한 리스너
    window.addEventListener('message', (event) => {
      // 다른 출처의 메시지는 무시
      if (event.source !== window) return;
      
      // 확장 프로그램으로부터의 메시지 처리
      if (event.data && event.data.source === CONFIG.messaging.responseSource) {
        
      }
    });
    
    // 연결 확인을 위한 테스트 메시지 보내기
    window.postMessage({
      source: CONFIG.messaging.source,
      action: 'connectionTest',
      data: { timestamp: Date.now() }
    }, '*');
  });
}

// 초기화: 이벤트 리스너 설정
setupEventListeners();

// 확장 프로그램에서 수신한 메시지 처리
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 메시지 처리
  return handleMessage(message, sender, sendResponse);
});

// 메시지 처리 함수
function handleMessage(message, sender, sendResponse) {
  if (message.action === CONFIG.messaging.actions.checkConnection) {
    // B 웹앱 연결 확인
    checkWebAppConnection()
      .then(result => {
        sendResponse(result);
      })
      .catch(error => {
        console.error('연결 확인 오류:', error);
        sendResponse({ connected: false, error: error.message });
      });
    
    return true; // 비동기 응답을 위해 true 반환
  }
  
  if (message.action === CONFIG.messaging.actions.sendProductData) {
    // 수집된 상품 데이터를 B 웹앱으로 전송
    sendDataToWebApp(message.data)
      .then(result => {
        sendResponse(result);
      })
      .catch(error => {
        console.error('데이터 전송 오류:', error);
        sendResponse({ success: false, error: error.message });
      });
    
    return true; // 비동기 응답을 위해 true 반환
  }
  
  return false;
}

/**
 * B 웹앱 연결 확인
 */
async function checkWebAppConnection() {
  try {
    // 현재 URL이 localhost:8080인지 확인
    const isLocalhost = window.location.href.includes(CONFIG.urlPatterns.localWebApp) || 
                        window.location.href.includes(CONFIG.urlPatterns.networkWebApp);
    
    if (!isLocalhost) {
      return { 
        connected: false, 
        error: `${CONFIG.errorMessages.webAppNotOpen}` 
      };
    }
    
    // 소싱 카테고리 페이지인지 확인
    const isSourcingPage = window.location.href.includes(CONFIG.urlPatterns.sourcingCategoryPath);
    
    if (!isSourcingPage) {
      return { 
        connected: false, 
        error: `${CONFIG.errorMessages.sourcingPageRequired}` 
      };
    }
    
    // 연결 성공
    return { connected: true };
  } catch (error) {
    console.error('연결 확인 오류:', error);
    return { connected: false, error: CONFIG.errorMessages.webAppConnectionFailed || '웹앱에 연결할 수 없습니다.' };
  }
}

/**
 * B 웹앱으로 데이터 전송
 */
async function sendDataToWebApp(products) {
  try {
    if (!products || !Array.isArray(products) || products.length === 0) {
      throw new Error('유효하지 않은 데이터입니다.');
    }
    
    // postMessage를 사용하여 웹앱으로 데이터 전송
    window.postMessage({
      source: CONFIG.messaging.source,
      action: CONFIG.messaging.actions.importProducts,
      data: products
    }, '*');
    
    // 응답 대기 (실제로는 비동기 처리가 필요할 수 있음)
    return { success: true };
  } catch (error) {
    console.error('데이터 전송 오류:', error);
    throw error;
  }
} 