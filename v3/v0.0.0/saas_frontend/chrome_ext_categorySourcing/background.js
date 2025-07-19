/**
 * 타오바오 스크래퍼 백그라운드 서비스 워커
 */
import { CONFIG } from './config.js';

// 크롤링 상태 관리
let scrapingStatus = {
  isRunning: false,
  targetCount: 0,
  targetType: 'pages',
  currentProgress: 0,
  tabId: null,
  bTabId: null
};

// 메시지 리스너 설정
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 팝업에서 스크래핑 시작 요청
  if (message.action === CONFIG.messaging.actions.startScraping) {
    handleStartScraping(message.data, sendResponse);
    return true; // 비동기 응답을 위해 true 반환
  }
  
  // 크롤러에서 진행 상태 업데이트
  if (message.action === CONFIG.messaging.actions.updateProgress) {
    updateProgress(message.data);
    return false; // 응답 필요 없음
  }
  
  // 크롤링 완료
  if (message.action === CONFIG.messaging.actions.scrapingComplete) {
    handleScrapingComplete(message.data);
    return false; // 응답 필요 없음
  }
  
  // 크롤링 오류
  if (message.action === CONFIG.messaging.actions.scrapingError) {
    handleScrapingError(message.data.error);
    return false; // 응답 필요 없음
  }
  
  // 팝업에서 진행 상태 요청
  if (message.action === CONFIG.messaging.actions.getProgress) {
    sendResponse({
      isRunning: scrapingStatus.isRunning,
      targetCount: scrapingStatus.targetCount,
      targetType: scrapingStatus.targetType,
      currentProgress: scrapingStatus.currentProgress
    });
    return false; // 동기 응답
  }
  
  // 스크래핑 중단 요청
  if (message.action === CONFIG.messaging.actions.stopScraping) {
    handleStopScraping(sendResponse);
    return true; // 비동기 응답을 위해 true 반환
  }
});

/**
 * 스크래핑 시작 처리
 */
async function handleStartScraping(data, sendResponse) {
  try {
    // 이미 실행 중인 경우
    if (scrapingStatus.isRunning) {
      sendResponse({ success: false, error: CONFIG.errorMessages.alreadyRunning });
      return;
    }
    
    // 입력값 검증
    if (!data.targetCount || data.targetCount < 1) {
      sendResponse({ success: false, error: CONFIG.errorMessages.invalidTargetCount });
      return;
    }
    
    // 상태 초기화
    scrapingStatus = {
      isRunning: true,
      targetCount: data.targetCount,
      targetType: data.targetType || 'pages',
      currentProgress: 0,
      tabId: null,
      bTabId: null
    };
    
    // 현재 활성 탭 가져오기
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!activeTab || !activeTab.url || 
        !(activeTab.url.includes(CONFIG.urlPatterns.taobao) || activeTab.url.includes(CONFIG.urlPatterns.tmall))) {
      sendResponse({ success: false, error: CONFIG.errorMessages.notShoppingPage });
      resetStatus();
      return;
    }
    
    scrapingStatus.tabId = activeTab.id;
    
    // 모든 탭 가져오기
    const allTabs = await chrome.tabs.query({});
    
    // 로컬호스트 탭 필터링
    const bTabs = allTabs.filter(tab => 
      (tab.url && (
        tab.url.includes(CONFIG.urlPatterns.localWebApp) || 
        tab.url.includes(CONFIG.urlPatterns.networkWebApp)
      ))
    );
    
    if (!bTabs || bTabs.length === 0) {
      sendResponse({ 
        success: false, 
        error: `${CONFIG.errorMessages.webAppNotOpen} (http://${CONFIG.urlPatterns.localWebApp}${CONFIG.urlPatterns.sourcingCategoryPath})` 
      });
      resetStatus();
      return;
    }
    
    // 소싱 카테고리 페이지가 있는지 확인
    let sourcingTab = bTabs.find(tab => 
      tab.url && tab.url.includes(CONFIG.urlPatterns.sourcingCategoryPath)
    );
    
    // 소싱 페이지가 없으면 첫 번째 탭 사용하고 안내
    if (!sourcingTab) {
      sourcingTab = bTabs[0];
    }
    
    scrapingStatus.bTabId = sourcingTab.id;
    
    // B 웹앱 연결 확인
    try {
      const connectionResult = await chrome.tabs.sendMessage(
        scrapingStatus.bTabId,
        { action: CONFIG.messaging.actions.checkConnection }
      );
      
      if (!connectionResult || !connectionResult.connected) {
        const errorMsg = connectionResult?.error || CONFIG.errorMessages.webAppConnectionFailed;
        sendResponse({ success: false, error: errorMsg });
        resetStatus();
        return;
      }
    } catch (error) {
      sendResponse({ 
        success: false, 
        error: `${CONFIG.errorMessages.webAppConnectionFailed} http://${CONFIG.urlPatterns.localWebApp}${CONFIG.urlPatterns.sourcingCategoryPath} 페이지를 열어주세요.`
      });
      resetStatus();
      return;
    }
    
    // 타오바오 페이지에 직접 스크립트 실행
    try {
      // 타오바오/티몰 페이지에 직접 스크립트 주입
      await chrome.scripting.executeScript({
        target: { tabId: scrapingStatus.tabId },
        func: async function(targetCount, targetType, CONFIG) {
          // 이미 실행 중인지 확인
          if (window.TAOBAO_SCRAPER_RUNNING) {
            return { success: false, error: '이미 실행중입니다.' };
          }
          
          // 전역 변수로 실행 중 표시
          window.TAOBAO_SCRAPER_RUNNING = true;
          
          try {
            // 크롤러 초기화 함수 (crawlers.js 내용을 직접 포함)
            async function initCrawler() {
              // 필요한 유틸리티 함수들
              function sleep(ms) {
                return new Promise(resolve => setTimeout(resolve, ms));
              }
              
              function random(min, max) {
                return Math.floor(Math.random() * (max - min + 1)) + min;
              }
              
              async function smoothScroll(targetPosition, duration = 3000) {
                const startPosition = window.scrollY;
                const distance = targetPosition - startPosition;
                const startTime = performance.now();
                
                function easeInOutQuad(t) {
                  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
                }
                
                return new Promise(resolve => {
                  function step() {
                    const currentTime = performance.now();
                    const elapsed = currentTime - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    
                    window.scrollTo(0, startPosition + distance * easeInOutQuad(progress));
                    
                    if (progress < 1) {
                      requestAnimationFrame(step);
                    } else {
                      resolve();
                    }
                  }
                  requestAnimationFrame(step);
                });
              }
              
              // 상품 ID 추출 함수
              function extractProductId(url) {
                if (!url) return '';
                
                try {
                  let idMatch;
                  if (url.includes('id=')) {
                    idMatch = url.match(/id=(\d+)/);
                  } else if (url.includes('item/')) {
                    idMatch = url.match(/item\/(\d+)/);
                  } else if (url.includes('item_id_')) {
                    idMatch = url.match(/item_id_(\d+)/);
                  }
                  return idMatch ? idMatch[1] : '';
                } catch (error) {
                  return '';
                }
              }
              
              // 이미지 URL 정규화
              function getFullImageUrl(url) {
                if (!url) return '';
                if (url.startsWith('http')) return url;
                if (url.startsWith('//')) return `https:${url}`;
                return url;
              }
              
              // 선택자 결정
              let selectors;
              if (window.location.href.includes('taobao.com')) {
                selectors = {
                  productContainer: '.doubleCardWrapperAdapt--mEcC7olq',
                  productId: '[id^="item_id_"]',
                  productTitle: '.title--qJ7Xg_90',
                  productImage: '.mainPic--Ds3X7I8z',
                  productPrice: '.priceInt--yqqZMJ5a',
                  productSold: '.realSales--XZJiepmt',
                  nextPageButton: '.next-pagination-item.next-next'
                };
              } else {
                selectors = {
                  productContainer: '.doubleCardWrapperAdapt--mEcC7olq',
                  productId: '[id^="item_id_"]',
                  productTitle: '.title--qJ7Xg_90',
                  productImage: '.mainPic--Ds3X7I8z',
                  productPrice: '.priceInt--yqqZMJ5a',
                  productSold: '.realSales--XZJiepmt',
                  nextPageButton: '.next-pagination-item.next-next'
                };
              }
              
              // 상품 파싱
              function parseProducts() {
                const products = [];
                const productElements = document.querySelectorAll(selectors.productContainer);
                
                if (!productElements || productElements.length === 0) {
                  throw new Error('상품 요소를 찾을 수 없습니다.');
                }
                
                productElements.forEach(element => {
                  try {
                    const id = element.id ? extractProductId(element.id) : '';
                    
                    const titleElement = element.querySelector(selectors.productTitle);
                    const title = titleElement ? titleElement.textContent.trim() : '';
                    
                    const imageElement = element.querySelector(selectors.productImage);
                    const image = imageElement ? getFullImageUrl(imageElement.src || imageElement.dataset.src) : '';
                    
                    const priceElement = element.querySelector(selectors.productPrice);
                    const priceText = priceElement ? priceElement.textContent.trim() : '';
                    const price = priceText ? parseFloat(priceText) : 0;
                    
                    const soldElement = element.querySelector(selectors.productSold);
                    const soldText = soldElement ? soldElement.textContent.trim() : '';
                    const sold = soldText;
                    
                    products.push({ id, title, image, price, sold });
                  } catch (error) {
                    console.error('상품 추출 오류:', error);
                  }
                });
                
                return products;
              }
              
              // 페이지 처리
              async function processPage() {
                const pageHeight = document.body.scrollHeight;
                const scrollPositions = [0.2, 0.4, 0.6, 0.8];
                
                for (const position of scrollPositions) {
                  await smoothScroll(pageHeight * position);
                  await sleep(random(1000, 2000));
                }
                
                return parseProducts();
              }
              
              // 다음 페이지로 이동
              async function goToNextPage() {
                try {
                  const nextBtn = document.querySelector(selectors.nextPageButton);
                  
                  if (!nextBtn || 
                      nextBtn.classList.contains('disabled') || 
                      nextBtn.classList.contains('ui-pager-disabled') ||
                      nextBtn.getAttribute('aria-disabled') === 'true') {
                    return false;
                  }
                  
                  nextBtn.click();
                  
                  // 페이지 로드 대기
                  await new Promise(resolve => {
                    const checkLoaded = setInterval(() => {
                      if (document.readyState === 'complete') {
                        clearInterval(checkLoaded);
                        setTimeout(resolve, 1000); // 추가 대기 시간
                      }
                    }, 500);
                  });
                  
                  return true;
                } catch (error) {
                  return false;
                }
              }
              
              // 크롤링 시작
              let currentPage = 1;
              const collectedProducts = [];
              
              try {
                // 목표 달성할 때까지 반복
                while (true) {
                  // 현재 페이지 크롤링
                  const products = await processPage();
                  
                  if (products && products.length > 0) {
                    collectedProducts.push(...products);
                    
                    // 진행 상황 업데이트
                    const current = targetType === 'pages' ? currentPage : collectedProducts.length;
                    const percentage = Math.min(100, Math.round((current / targetCount) * 100));
                    
                    // 백그라운드 스크립트에 메시지 전송
                    chrome.runtime.sendMessage({
                      action: 'updateProgress',
                      data: {
                        current,
                        target: targetCount,
                        percentage,
                        type: targetType
                      }
                    });
                  }
                  
                  // 목표 달성 여부 확인
                  if ((targetType === 'pages' && currentPage >= targetCount) ||
                      (targetType === 'products' && collectedProducts.length >= targetCount)) {
                    break;
                  }
                  
                  // 다음 페이지 이동
                  const hasNextPage = await goToNextPage();
                  if (!hasNextPage) break;
                  
                  currentPage++;
                }
                
                // 목표 초과 수집 시 잘라내기
                if (targetType === 'products' && collectedProducts.length > targetCount) {
                  collectedProducts.splice(targetCount);
                }
                
                // 결과 반환
                chrome.runtime.sendMessage({
                  action: 'scrapingComplete',
                  data: {
                    success: true,
                    productsCount: collectedProducts.length,
                    pagesCount: currentPage,
                    products: collectedProducts
                  }
                });
                
                return { success: true };
              } catch (error) {
                chrome.runtime.sendMessage({
                  action: 'scrapingError',
                  data: { error: error.message || '알 수 없는 오류가 발생했습니다.' }
                });
                
                return { success: false, error: error.message };
              } finally {
                window.TAOBAO_SCRAPER_RUNNING = false;
              }
            }
            
            // 크롤러 초기화 및 실행
            const result = await initCrawler();
            return result;
          } catch (error) {
            window.TAOBAO_SCRAPER_RUNNING = false;
            return { success: false, error: error.message || '알 수 없는 오류가 발생했습니다.' };
          }
        },
        args: [scrapingStatus.targetCount, scrapingStatus.targetType, CONFIG]
      });
      
      // 성공 응답
      sendResponse({ success: true });
      
    } catch (error) {
      sendResponse({ success: false, error: `${CONFIG.errorMessages.scriptExecutionError} ${error.message}` });
      resetStatus();
    }
  } catch (error) {
    sendResponse({ success: false, error: `${CONFIG.errorMessages.unknownError} ${error.message}` });
    resetStatus();
  }
}

/**
 * 진행 상태 업데이트
 */
function updateProgress(progressData) {
  scrapingStatus.currentProgress = progressData.percentage || 0;
  
  // 팝업이 열려 있는 경우 상태 전송
  chrome.runtime.sendMessage({
    action: CONFIG.messaging.actions.progressUpdate,
    data: {
      current: progressData.current,
      target: progressData.target,
      percentage: progressData.percentage,
      type: progressData.type
    }
  }).catch(() => {
    // 팝업이 닫혀 있는 경우 오류 무시
  });
  
  // 배지 업데이트
  updateBadge();
}

/**
 * 배지 업데이트
 */
function updateBadge() {
  if (!scrapingStatus.isRunning) {
    chrome.action.setBadgeText({ text: '' });
    return;
  }
  
  const badgeText = `${scrapingStatus.currentProgress}%`;
  chrome.action.setBadgeText({ text: badgeText });
  chrome.action.setBadgeBackgroundColor({ color: CONFIG.ui.badgeColors.progress });
}

/**
 * 스크래핑 완료 처리
 */
async function handleScrapingComplete(result) {
  try {
    if (!result.success) {
      handleScrapingError(result.error);
      return;
    }
    
    // 상품 데이터를 B 웹앱으로 전송
    if (scrapingStatus.bTabId && result.products && result.products.length > 0) {
      try {
        await chrome.tabs.sendMessage(
          scrapingStatus.bTabId,
          {
            action: CONFIG.messaging.actions.sendProductData,
            data: result.products
          }
        );
        
        // 완료 알림 전송
        chrome.runtime.sendMessage({
          action: CONFIG.messaging.actions.scrapingSuccess,
          data: {
            productsCount: result.productsCount,
            pagesCount: result.pagesCount
          }
        }).catch(() => {
          // 팝업이 닫혀 있는 경우 오류 무시
        });
        
        // B 탭 포커싱
        chrome.tabs.update(scrapingStatus.bTabId, { active: true });
        
      } catch (error) {
        handleScrapingError(`${CONFIG.errorMessages.webAppDataSendError} ${error.message}`);
      }
    } else {
      // 상품이 없는 경우
      handleScrapingError(CONFIG.errorMessages.noProductsCollected);
    }
  } catch (error) {
    handleScrapingError(`${CONFIG.errorMessages.dataProcessingError} ${error.message}`);
  } finally {
    // 상태 초기화
    resetStatus();
  }
}

/**
 * 스크래핑 오류 처리
 */
function handleScrapingError(errorMessage) {
  // 팝업에 오류 전송
  chrome.runtime.sendMessage({
    action: CONFIG.messaging.actions.scrapingError,
    data: {
      error: errorMessage || CONFIG.errorMessages.unknownError
    }
  }).catch(() => {
    // 팝업이 닫혀 있는 경우 오류 무시
  });
  
  // 상태 초기화
  resetStatus();
  
  // 오류 배지 표시
  chrome.action.setBadgeText({ text: 'ERR' });
  chrome.action.setBadgeBackgroundColor({ color: CONFIG.ui.badgeColors.error });
}

/**
 * 스크래핑 중단 처리
 */
async function handleStopScraping(sendResponse) {
  try {
    if (!scrapingStatus.isRunning || !scrapingStatus.tabId) {
      sendResponse({ success: false, error: CONFIG.errorMessages.noRunningTask });
      return;
    }
    
    // 크롤러에 중단 메시지 전송
    try {
      await chrome.tabs.sendMessage(
        scrapingStatus.tabId,
        { action: CONFIG.messaging.actions.stopScraping }
      );
      
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({ success: false, error: `${CONFIG.errorMessages.stopError} ${error.message}` });
    }
    
    // 상태 초기화
    resetStatus();
  } catch (error) {
    sendResponse({ success: false, error: `${CONFIG.errorMessages.unknownError} ${error.message}` });
    resetStatus();
  }
}

/**
 * 상태 초기화
 */
function resetStatus() {
  scrapingStatus = {
    isRunning: false,
    targetCount: 0,
    targetType: 'pages',
    currentProgress: 0,
    tabId: null,
    bTabId: null
  };
  
  // 배지 초기화
  chrome.action.setBadgeText({ text: '' });
} 