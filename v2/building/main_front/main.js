/**
 * 메인 프론트엔드 애플리케이션
 * 전역 상태 관리 및 라우팅을 담당하는 메인 JavaScript 파일
 */

// 전역 상태 관리 객체
const state = {
  activeMenu: 'main',  // 현재 활성화된 메뉴
  stats: {            // 애플리케이션 통계 정보
    sourcingCompleted: 0,    // 소싱 완료된 항목 수
    preprocessingCompleted: 0, // 전처리 완료된 항목 수
    isRegistrable: 0,        // 등록 가능한 항목 수
    registered: 0,           // 등록된 항목 수
    categoryMappingRequired: 0, // 카테고리 매핑 필요한 항목 수
    discarded: 0             // 폐기/오류 항목 수
  }
};

/**
 * API 요청을 처리하는 래퍼 함수
 * @param {string} url - 요청할 URL
 * @param {Object} options - fetch 옵션
 * @returns {Promise<Object>} 응답 데이터
 */
async function fetchWrapper(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json();
  
  // 리다이렉션 처리
  if (data.redirectUrl) {
    window.location.href = data.redirectUrl;
    return null;
  }
  
  return data;
}

// 페이지 컴포넌트 모듈 임포트
import { renderMainPage } from './pages/mainPage.js';
import { renderShopPage, setupShopHandlers } from './pages/getbyshop.js';
import { renderSourcingPage, setupSourcingPage } from './pages/sourcingPage.js';
import { renderProcessingPage, setupProcessingHandlers, fetchProcessingStats } from './pages/processingPage.js';
import { renderCategoryPage, initCategoryPage, categoryPageStyles } from './pages/categoryPage.js';
import { renderBrandbanPage, fetchBrandbanData, setupBrandbanHandlers } from './pages/brandbanPage.js';
import { renderLogsPage } from './pages/logsPage.js';
import { renderListPage, setupListHandlers } from './pages/listPage.js';
import { renderPreRegisterPage, setupPreRegisterHandlers } from './pages/pre_register.js';
import { renderRegisterPage, setupRegisterHandlers } from './pages/register.js';
import { renderCategoryAdviserPage, setupCategoryAdviserHandlers, categoryAdviserPageStyles } from './pages/categoryAdviserPage.js';


/**
 * DOM 로드 완료 후 초기화
 * - URL 파라미터 기반 메뉴 상태 설정
 * - 초기 콘텐츠 렌더링
 * - 메뉴 이벤트 리스너 설정
 * - 통계 데이터 로드
 */
document.addEventListener('DOMContentLoaded', () => {
  // 카테고리 페이지 스타일 추가
  const styleElement = document.createElement('style');
  styleElement.textContent = categoryPageStyles + categoryAdviserPageStyles;
  document.head.appendChild(styleElement);

  // URL 파라미터에서 메뉴 상태 확인
  const urlParams = new URLSearchParams(window.location.search);
  const menuParam = urlParams.get('menu');
  
  // 유효한 메뉴 파라미터가 있는 경우 상태 업데이트
  if (menuParam && ['main', 'sourcing', 'processing', 'category', 'categoryadviser', 'brandban', 'logs', 'list', 'getbyshop', 'pre_register', 'register'].includes(menuParam)) {
    state.activeMenu = menuParam;
    updateSidebarMenu(menuParam);
  } else {
    // URL에 메뉴 파라미터가 없는 경우(예: 새로고침 시), 현재 활성 메뉴를 URL에 반영
    updateUrlWithCurrentMenu();
  }
  
  // 초기화 실행
  renderContent();
  setupMenuListeners();
  fetchStats();
});

/**
 * 현재 활성화된 메뉴를 URL에 반영
 * @private
 */
function updateUrlWithCurrentMenu() {
  const url = new URL(window.location.href);
  url.searchParams.set('menu', state.activeMenu);
  window.history.replaceState({}, '', url);
}

/**
 * 사이드바 메뉴 활성화 상태 업데이트
 * @param {string} activeMenu - 활성화할 메뉴 ID
 */
function updateSidebarMenu(activeMenu) {
  document.querySelectorAll('.sidebar-menu li').forEach(item => {
    item.classList.toggle('active', item.getAttribute('data-menu') === activeMenu);
  });
}

/**
 * 메뉴 클릭 이벤트 리스너 설정
 * - 메뉴 클릭 시 활성 상태 변경
 * - 해당 메뉴의 콘텐츠 렌더링
 * - URL 업데이트
 */
function setupMenuListeners() {
  const menuItems = document.querySelectorAll('.sidebar-menu li');
  
  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      menuItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      state.activeMenu = item.getAttribute('data-menu');
      
      // URL 업데이트
      updateUrlWithCurrentMenu();
      
      renderContent();
    });
  });
}

/**
 * 통계 데이터 가져오기
 * - API를 통해 최신 통계 정보 업데이트
 * - 메인 페이지가 활성화된 경우에만 콘텐츠 갱신
 */
async function fetchStats() {
  try {
    const response = await fetch('/api/stats');
    const data = await response.json();
    state.stats = data;
    
    if (state.activeMenu === 'main') {
      renderContent();
    }
  } catch (error) {
    console.error('통계 정보를 가져오는 중 오류 발생:', error);
    
    if (state.activeMenu === 'main') {
      renderContent();
    }
  }
}

/**
 * 현재 활성화된 메뉴에 따른 콘텐츠 렌더링
 * - 각 페이지 컴포넌트의 렌더링 함수 호출
 * - 필요한 경우 페이지별 이벤트 핸들러 설정
 */
function renderContent() {
  const contentContainer = document.getElementById('content');
  let contentHTML = '';
  
  // 메뉴별 콘텐츠 렌더링
  switch (state.activeMenu) {
    case 'main':
      contentHTML = renderMainPage(state.stats);
      break;
    case 'getbyshop':
      contentHTML = renderShopPage();
      setTimeout(() => setupShopHandlers(), 100);
      break;
    case 'sourcing':
      contentHTML = renderSourcingPage();
      break;
    case 'processing':
      contentHTML = renderProcessingPage();
      break;
    case 'category':
      contentHTML = renderCategoryPage();
      setTimeout(() => initCategoryPage(), 100);
      break;
    case 'categoryadviser':
      contentHTML = renderCategoryAdviserPage();
      setTimeout(() => setupCategoryAdviserHandlers(), 100);
      break;
    case 'brandban':
      contentHTML = renderBrandbanPage();
      fetchBrandbanData();
      setTimeout(() => setupBrandbanHandlers(), 100);
      break;
    case 'logs':
      contentHTML = renderLogsPage();
      break;
    case 'list':
      contentHTML = renderListPage();
      setTimeout(() => setupListHandlers(), 100);
      break;
    case 'pre_register':
      contentHTML = renderPreRegisterPage();
      setTimeout(() => setupPreRegisterHandlers(), 100);
      break;
    case 'register':
      contentHTML = renderRegisterPage();
      setTimeout(() => setupRegisterHandlers(), 100);
      break;
    default:
      contentHTML = `<div>컨텐츠를 찾을 수 없습니다.</div>`;
  }
  
  contentContainer.innerHTML = contentHTML;
  
  // 페이지별 추가 설정
  if (state.activeMenu === 'processing') {
    setupProcessingHandlers();
    fetchProcessingStats();
  }

  if (state.activeMenu === 'sourcing') {
    setupSourcingPage();
  }
}

// 외부 모듈에서 사용할 수 있도록 내보내기
export { state, fetchStats, fetchWrapper };

