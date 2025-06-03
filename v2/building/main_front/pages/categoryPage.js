/**
 * @fileoverview 카테고리 매핑 클라이언트 화면
 * @module pages/categoryPage
 * @description 카테고리 매핑을 관리하는 UI 컴포넌트 및 관련 함수 모음
 */

/**
 * 카테고리 매핑 페이지 렌더링 함수
 * @function renderCategoryPage
 * @returns {string} 카테고리 페이지 HTML
 */
export function renderCategoryPage() {
  return `
    <div class="main-content">
      <div class="page-header">
        <h2>카테고리 매핑</h2>
        <p class="header-description">상품 카테고리의 네이버/쿠팡 매핑을 관리합니다</p>
      </div>
      <div id="category-mapping-container">
        <div class="loading">
          <div class="spinner"></div>
          <p>데이터를 불러오는 중... (각 카테고리당 최대 2개 샘플)</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * 카테고리 페이지 초기화 함수
 * @async
 * @function initCategoryPage
 * @description 페이지 상태를 초기화하고 카테고리 데이터를 로드합니다
 */
export async function initCategoryPage() {
  // 현재 페이지 상태 초기화
  window.categoryPage = {
    currentPage: 0,
    hasMore: false,
    data: []
  };
  
  // 카테고리 데이터 로드
  await loadCategoryData();
  
  // 이벤트 리스너 등록
  document.addEventListener('click', handleCategoryPageEvents);
}

/**
 * 카테고리 데이터 로드 함수
 * @async
 * @function loadCategoryData
 * @param {boolean} [append=false] - 기존 데이터에 추가할지 여부
 * @description 서버에서 카테고리 데이터를 로드하고 화면에 표시합니다
 */
export async function loadCategoryData(append = false) {
  try {
    const container = document.getElementById('category-mapping-container');
    
    if (!append) {
      container.innerHTML = `
        <div class="loading">
          <div class="spinner"></div>
          <p>데이터를 불러오는 중... (각 카테고리당 최대 2개 샘플)</p>
        </div>
      `;
    } else {
      const loadMoreBtn = document.getElementById('load-more-btn');
      if (loadMoreBtn) {
        loadMoreBtn.disabled = true;
        loadMoreBtn.innerHTML = '<span class="spinner-small"></span> 불러오는 중...';
      }
    }
    
    const response = await fetch(`/reg/category?page=${window.categoryPage.currentPage}`);
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || '데이터를 불러오는데 실패했습니다.');
    }
    
    // 다음 페이지 업데이트
    window.categoryPage.currentPage = result.metadata.page + 1;
    window.categoryPage.hasMore = result.metadata.hasMore;
    
    // 데이터 업데이트
    if (append) {
      window.categoryPage.data = [...window.categoryPage.data, ...result.data];
      appendCategoryRows(result.data);
    } else {
      window.categoryPage.data = result.data;
      renderCategoryTable(result.data, result.metadata.hasMore);
    }
  } catch (error) {
    console.error('카테고리 데이터 로드 오류:', error);
    
    if (!append) {
      document.getElementById('category-mapping-container').innerHTML = `
        <div class="error-container">
          <div class="error-icon">!</div>
          <p>데이터 로드 중 오류가 발생했습니다.</p>
          <button id="retry-load-btn" class="btn btn-primary">다시 시도</button>
        </div>
      `;
    } else {
      const loadMoreBtn = document.getElementById('load-more-btn');
      if (loadMoreBtn) {
        loadMoreBtn.disabled = false;
        loadMoreBtn.textContent = '다시 시도';
      }
    }
  }
}

/**
 * 카테고리 테이블 렌더링 함수
 * @function renderCategoryTable
 * @param {Array} categories - 카테고리 데이터 배열
 * @param {boolean} hasMore - 더 불러올 데이터가 있는지 여부
 * @description 카테고리 데이터로 테이블을 생성하여 화면에 표시합니다
 */
export function renderCategoryTable(categories, hasMore) {
  const container = document.getElementById('category-mapping-container');
  
  if (!categories || categories.length === 0) {
    container.innerHTML = '<p>매핑이 필요한 카테고리가 없습니다.</p>';
    return;
  }
  
  let html = `
    <table class="category-table">
      <thead>
        <tr>
          <th>카테고리 ID</th>
          <th>카테고리명</th>
          <th>상품 샘플</th>
          <th>이미지 샘플</th>
          <th>네이버 카테고리 ID</th>
          <th>쿠팡 카테고리 ID</th>
          <th>네이버 카테고리명</th>
          <th>쿠팡 카테고리명</th>
          <th>작업</th>
        </tr>
      </thead>
      <tbody id="category-table-body">
  `;
  
  categories.forEach((category) => {
    html += getCategoryRowHtml(category);
  });
  
  html += `
      </tbody>
    </table>
    <div class="category-actions">
      <button id="load-more-btn" class="btn btn-secondary" ${!hasMore ? 'disabled' : ''}>
        ${hasMore ? '더 불러오기' : '더 이상 데이터가 없습니다'}
      </button>
    </div>
  `;
  
  container.innerHTML = html;
}

/**
 * 카테고리 행 HTML 생성 함수
 * @function getCategoryRowHtml
 * @param {Object} category - 카테고리 데이터
 * @returns {string} 카테고리 행 HTML
 * @description 카테고리 데이터를 기반으로 테이블 행 HTML을 생성합니다
 */
export function getCategoryRowHtml(category) {
  const productTitles = category.products.map(p => `<div class="product-title-item">${p.title || '상품명 없음'}</div>`).join('');
  const productImages = category.products.map(p => 
    p.imageurl ? `<div class="product-image-container"><img src="${p.imageurl}" alt="상품이미지" /></div>` : '<div class="no-image">이미지 없음</div>'
  ).join('');
  
  return `
    <tr data-catid="${category.catid}">
      <td><span class="cat-id">${category.catid}</span></td>
      <td><span class="cat-name">${category.catname || ''}</span></td>
      <td class="product-titles">${productTitles}</td>
      <td class="product-images">${productImages}</td>
      <td>
        <input type="text" class="form-input naver-cat-id" value="${category.naver_cat_id || ''}" placeholder="네이버 카테고리 ID" />
      </td>
      <td>
        <input type="text" class="form-input coopang-cat-id" value="${category.coopang_cat_id || ''}" placeholder="쿠팡 카테고리 ID" />
      </td>
      <td>
        <input type="text" class="form-input naver-cat-name" value="${category.naver_cat_name || ''}" placeholder="네이버 카테고리명" />
      </td>
      <td>
        <input type="text" class="form-input coopang-cat-name" value="${category.coopang_cat_name || ''}" placeholder="쿠팡 카테고리명" />
      </td>
      <td>
        <button class="save-btn btn-primary" data-catid="${category.catid}">저장</button>
      </td>
    </tr>
  `;
}

/**
 * 카테고리 행 추가 함수
 * @function appendCategoryRows
 * @param {Array} categories - 추가할 카테고리 데이터 배열
 * @description 기존 테이블에 추가 카테고리 행을 추가합니다
 */
export function appendCategoryRows(categories) {
  const tableBody = document.getElementById('category-table-body');
  if (!tableBody) return;
  
  let rowsHtml = '';
  categories.forEach(category => {
    rowsHtml += getCategoryRowHtml(category);
  });
  
  tableBody.insertAdjacentHTML('beforeend', rowsHtml);
  
  // 더 불러오기 버튼 상태 업데이트
  const loadMoreBtn = document.getElementById('load-more-btn');
  if (loadMoreBtn) {
    loadMoreBtn.disabled = !window.categoryPage.hasMore;
    loadMoreBtn.textContent = window.categoryPage.hasMore ? 
      '더 불러오기' : '더 이상 데이터가 없습니다';
  }
}

/**
 * 카테고리 페이지 이벤트 핸들러
 * @async
 * @function handleCategoryPageEvents
 * @param {Event} event - 이벤트 객체
 * @description 페이지 내 버튼 클릭 이벤트를 처리합니다
 */
export async function handleCategoryPageEvents(event) {
  const target = event.target;
  
  // 저장 버튼 클릭
  if (target.classList.contains('save-btn')) {
    const catid = target.dataset.catid;
    const row = document.querySelector(`tr[data-catid="${catid}"]`);
    
    if (!row) return;
    
    const naverCatId = row.querySelector('.naver-cat-id').value.trim();
    const coopangCatId = row.querySelector('.coopang-cat-id').value.trim();
    const naverCatName = row.querySelector('.naver-cat-name').value.trim();
    const coopangCatName = row.querySelector('.coopang-cat-name').value.trim();
    
    await saveCategory({
      catid,
      naver_cat_id: naverCatId,
      coopang_cat_id: coopangCatId,
      naver_cat_name: naverCatName,
      coopang_cat_name: coopangCatName
    });
  }
  
  // 다시 시도 버튼 클릭
  if (target.id === 'retry-load-btn') {
    window.categoryPage.currentPage = 0;
    await loadCategoryData();
  }
  
  // 더 불러오기 버튼 클릭
  if (target.id === 'load-more-btn') {
    await loadCategoryData(true);
  }
}

/**
 * 카테고리 저장 함수
 * @async
 * @function saveCategory
 * @param {Object} categoryData - 저장할 카테고리 데이터
 * @param {number|string} categoryData.catid - 카테고리 ID
 * @param {string} [categoryData.naver_cat_id] - 네이버 카테고리 ID
 * @param {string} [categoryData.coopang_cat_id] - 쿠팡 카테고리 ID
 * @param {string} [categoryData.naver_cat_name] - 네이버 카테고리명
 * @param {string} [categoryData.coopang_cat_name] - 쿠팡 카테고리명
 * @description 카테고리 매핑 정보를 서버에 저장하고 화면을 갱신합니다
 */
export async function saveCategory(categoryData) {
  try {
    const saveButton = document.querySelector(`.save-btn[data-catid="${categoryData.catid}"]`);
    if (saveButton) {
      saveButton.disabled = true;
      saveButton.innerHTML = '<span class="spinner-small"></span> 저장 중...';
    }
    
    const response = await fetch('/reg/category', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(categoryData)
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || '저장에 실패했습니다.');
    }
    
    // 성공 메시지 표시
    showNotification('카테고리가 성공적으로 저장되었습니다.', 'success');
    
    // 페이지 리셋 후 처음 10개 데이터 다시 로드
    window.categoryPage.currentPage = 0;
    await loadCategoryData();
  } catch (error) {
    console.error('카테고리 저장 오류:', error);
    showNotification(`저장 중 오류가 발생했습니다: ${error.message}`, 'error');
    
    // 버튼 상태 복원
    const saveButton = document.querySelector(`.save-btn[data-catid="${categoryData.catid}"]`);
    if (saveButton) {
      saveButton.disabled = false;
      saveButton.textContent = '저장';
    }
  }
}

/**
 * 알림 표시 함수
 * @function showNotification
 * @param {string} message - 알림 메시지
 * @param {string} [type=success] - 알림 타입 (success, error)
 * @description 화면에 알림 메시지를 표시합니다
 */
export function showNotification(message, type = 'success') {
  // 기존 알림 제거
  const existingNotification = document.querySelector('.notification');
  if (existingNotification) {
    existingNotification.remove();
  }
  
  // 새 알림 생성
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-icon">${type === 'success' ? '✓' : '!'}</span>
      <span class="notification-message">${message}</span>
    </div>
    <button class="notification-close">×</button>
  `;
  
  document.body.appendChild(notification);
  
  // 닫기 버튼에 이벤트 리스너 추가
  notification.querySelector('.notification-close').addEventListener('click', () => {
    notification.remove();
  });
  
  // 3초 후 자동으로 알림 숨기기
  setTimeout(() => {
    notification.classList.add('hiding');
    setTimeout(() => notification.remove(), 500);
  }, 3000);
}

/**
 * 카테고리 페이지 스타일
 * @constant {string} categoryPageStyles
 * @description 카테고리 페이지에 적용되는 CSS 스타일
 */
export const categoryPageStyles = `
  /* 페이지 기본 스타일 */
  .main-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }
  
  .page-header {
    margin-bottom: 30px;
    border-bottom: 1px solid #eaeaea;
    padding-bottom: 15px;
  }
  
  .page-header h2 {
    margin: 0 0 10px 0;
    color: #333;
    font-weight: 500;
  }
  
  .header-description {
    color: #666;
    margin: 0;
  }
  
  /* 테이블 스타일 */
  .category-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    margin-bottom: 30px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    border-radius: 8px;
    overflow: hidden;
  }
  
  .category-table th, .category-table td {
    padding: 15px 18px;
    text-align: left;
    border-bottom: 1px solid #eaeaea;
  }
  
  .category-table th {
    background-color: #f8f9fa;
    color: #495057;
    font-weight: 500;
    position: sticky;
    top: 0;
    z-index: 10;
  }
  
  .category-table tr:last-child td {
    border-bottom: none;
  }
  
  .category-table tr:hover {
    background-color: #f5f9ff;
  }
  
  /* 카테고리 ID와 이름 스타일 */
  .cat-id {
    display: inline-block;
    padding: 2px 6px;
    background: #e9ecef;
    border-radius: 4px;
    font-size: 0.9em;
    color: #495057;
  }
  
  .cat-name {
    font-weight: 500;
    color: #343a40;
  }
  
  /* 입력 필드 스타일 */
  .form-input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #ced4da;
    border-radius: 4px;
    font-size: 14px;
    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
  }
  
  .form-input:focus {
    border-color: #80bdff;
    outline: 0;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
  }
  
  /* 상품 제목과 이미지 스타일 */
  .product-titles, .product-images {
    max-width: 350px;
    max-height: 300px;
    overflow-y: auto;
    border-radius: 4px;
    background: #fafafa;
  }
  
  .product-title-item {
    padding: 10px 12px;
    border-bottom: 1px solid #eee;
    font-size: 13px;
    line-height: 1.4;
  }
  
  .product-title-item:last-child {
    border-bottom: none;
  }
  
  .product-image-container {
    text-align: center;
    padding: 2px;
    background: white;
    margin-bottom: 2px;
    border-radius: 6px;
    border: 1px solid #eee;
  }
  
  .product-image-container img {
    max-width: 100%;
    height: auto;
    max-height: 260px;
    object-fit: contain;
    border-radius: 3px;
  }
  
  .no-image {
    padding: 60px;
    text-align: center;
    color: #aaa;
    background: #f5f5f5;
    font-size: 12px;
  }
  
  /* 버튼 스타일 */
  .btn {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  
  .btn-primary {
    background-color: #4361ee;
    color: white;
  }
  
  .btn-secondary {
    background-color: #6c757d;
    color: white;
  }
  
  .btn-primary:hover {
    background-color: #3a56de;
  }
  
  .btn-secondary:hover {
    background-color: #5a6268;
  }
  
  .btn:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
  
  /* 액션 영역 스타일 */
  .category-actions {
    margin-top: 30px;
    text-align: center;
  }
  
  .save-btn {
    min-width: 80px;
  }
  
  /* 로딩 스타일 */
  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    text-align: center;
  }
  
  .spinner {
    border: 4px solid rgba(0, 0, 0, 0.1);
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border-left-color: #4361ee;
    animation: spin 1s linear infinite;
    margin-bottom: 15px;
  }
  
  .spinner-small {
    display: inline-block;
    width: 12px;
    height: 12px;
    border: 2px solid rgba(255, 255, 255, 0.5);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 1s linear infinite;
    margin-right: 6px;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  /* 에러 스타일 */
  .error-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    text-align: center;
    background-color: #fff4f4;
    border-radius: 8px;
    border: 1px solid #ffdddd;
  }
  
  .error-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 50px;
    height: 50px;
    background-color: #ff6b6b;
    color: white;
    border-radius: 50%;
    font-size: 24px;
    margin-bottom: 15px;
  }
  
  /* 알림 스타일 */
  .notification {
    position: fixed;
    top: 20px;
    right: 20px;
    max-width: 400px;
    background: white;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    overflow: hidden;
    display: flex;
    z-index: 1000;
    animation: slideIn 0.3s ease-out;
  }
  
  .notification.hiding {
    animation: slideOut 0.5s ease-out forwards;
  }
  
  .notification-content {
    flex: 1;
    padding: 15px;
    display: flex;
    align-items: center;
  }
  
  .notification-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    margin-right: 12px;
    font-weight: bold;
  }
  
  .notification.success .notification-icon {
    background-color: #34c759;
    color: white;
  }
  
  .notification.error .notification-icon {
    background-color: #ff3b30;
    color: white;
  }
  
  .notification-message {
    color: #333;
    font-size: 14px;
  }
  
  .notification-close {
    background: none;
    border: none;
    color: #999;
    font-size: 18px;
    cursor: pointer;
    padding: 0 10px;
  }
  
  .notification-close:hover {
    color: #333;
  }
  
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`; 