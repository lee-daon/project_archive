/**
 * 등록 관리 페이지 컴포넌트
 * 상품 등록 관리 기능을 제공하는 페이지
 * @module RegisterPage
 */

/**
 * 등록 관리 페이지 렌더링 함수
 * @returns {string} 등록 관리 페이지 HTML
 */
export function renderRegisterPage() {
  return `
    <div class="register-page">
      <h1 class="page-title"><i class="fas fa-shopping-cart"></i> 상품 등록 관리</h1>
      
      <div class="register-tabs">
        <button class="tab-button active" data-tab="common"><i class="fas fa-layer-group"></i> 공통 등록 관리</button>
        <button class="tab-button" data-tab="coopang"><i class="fas fa-box"></i> 쿠팡 등록 관리</button>
        <button class="tab-button" data-tab="naver"><i class="fas fa-store"></i> 스마트스토어 등록 관리</button>
      </div>
      
      <div class="filter-container">
        <div class="search-container">
          <i class="fas fa-search search-icon"></i>
          <input type="text" id="group-search" placeholder="그룹 코드 또는 메모 검색...">
          <button id="search-button"><i class="fas fa-search"></i></button>
        </div>
      </div>
      
      <div class="register-container">
        <div class="groups-container">
          <h2><i class="fas fa-list-alt"></i> 상품 그룹 목록</h2>
          <div id="product-groups" class="product-groups">
            <div class="loading">데이터를 불러오는 중...</div>
          </div>
        </div>
        
        <div class="product-details-container">
          <h2><i class="fas fa-info-circle"></i> 상품 상세 정보</h2>
          <div id="product-details" class="product-details">
            <div class="empty-state">왼쪽에서 상품 그룹을 선택하세요</div>
          </div>
          
          <div id="registration-form" class="registration-form hidden">
            <h3><i class="fas fa-cog"></i> 등록 설정</h3>
            
            <div class="form-group">
              <label><i class="fas fa-tags"></i> 등록 마켓 선택</label>
              <div class="checkbox-group">
                <label><input type="checkbox" name="market" value="coopang"> <i class="fas fa-box"></i> 쿠팡</label>
                <label><input type="checkbox" name="market" value="naver"> <i class="fas fa-store"></i> 스마트스토어</label>
              </div>
            </div>
            
            <div id="coopang-settings" class="market-settings hidden">
              <div class="form-group">
                <label for="coopang-market-number"><i class="fas fa-hashtag"></i> 쿠팡 마켓 번호</label>
                <select id="coopang-market-number" name="coopang-market-number">
                  <option value="">마켓 선택</option>
                </select>
                <div id="coopang-market-info" class="market-info"></div>
              </div>
            </div>
            
            <div id="naver-settings" class="market-settings hidden">
              <div class="form-group">
                <label for="naver-market-number"><i class="fas fa-hashtag"></i> 스마트스토어 마켓 번호</label>
                <select id="naver-market-number" name="naver-market-number">
                  <option value="">마켓 선택</option>
                </select>
                <div id="naver-market-info" class="market-info"></div>
              </div>
            </div>
            
            <div class="form-group">
              <label for="delivery-fee"><i class="fas fa-truck"></i> 배송비</label>
              <input type="number" id="delivery-fee" name="delivery-fee" min="0" step="100" value="3000">
            </div>
            
            <div class="form-group">
              <label for="profit-margin"><i class="fas fa-percentage"></i> 마진률 (%)</label>
              <input type="number" id="profit-margin" name="profit-margin" min="0" max="100" value="30">
            </div>
            
            <div class="form-group">
              <label for="min-profit-margin"><i class="fas fa-chart-line"></i> 최저 마진률 (%)</label>
              <input type="number" id="min-profit-margin" name="min-profit-margin" min="0" max="100" value="15">
            </div>
            
            <div class="form-actions">
              <button id="register-products" class="action-button register"><i class="fas fa-upload"></i> 등록</button>
              <button id="discard-products" class="action-button discard"><i class="fas fa-trash-alt"></i> 폐기</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <style>
      /* 등록 관리 페이지 스타일 */
      .register-page {
        padding: 20px;
      }
      
      .register-page .page-title {
        margin-bottom: 20px;
        font-size: 24px;
        color: #333;
      }
      
      .register-page .page-title i,
      .register-page h2 i,
      .register-page h3 i,
      .register-page label i {
        margin-right: 8px;
        color: #007bff;
      }
      
      .register-page .register-tabs {
        display: flex;
        border-bottom: 1px solid #ddd;
        margin-bottom: 20px;
      }
      
      .register-page .tab-button {
        padding: 10px 20px;
        margin-right: 5px;
        border: 1px solid #ddd;
        border-bottom: none;
        border-radius: 5px 5px 0 0;
        background-color: #f8f8f8;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;
      }
      
      .register-page .tab-button i {
        margin-right: 5px;
      }
      
      .register-page .tab-button.active {
        background-color: #fff;
        border-bottom: 2px solid #007bff;
        color: #007bff;
      }
      
      .register-page .filter-container {
        margin-bottom: 20px;
      }
      
      .register-page .search-container {
        display: flex;
        max-width: 500px;
        position: relative;
      }
      
      .register-page .search-container .search-icon {
        position: absolute;
        left: 10px;
        top: 50%;
        transform: translateY(-50%);
        color: #aaa;
      }
      
      .register-page .search-container input {
        flex: 1;
        padding: 8px 12px 8px 35px;
        border: 1px solid #ddd;
        border-radius: 4px 0 0 4px;
      }
      
      .register-page .search-container button {
        padding: 8px 15px;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 0 4px 4px 0;
        cursor: pointer;
      }
      
      .register-page .search-container button:hover {
        background-color: #0069d9;
      }
      
      .register-page .register-container {
        display: flex;
        gap: 20px;
      }
      
      .register-page .groups-container,
      .register-page .product-details-container {
        flex: 1;
        padding: 15px;
        background-color: #fff;
        border-radius: 5px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
      
      .register-page .product-groups {
        max-height: 500px;
        overflow-y: auto;
      }
      
      .register-page .product-group {
        padding: 12px;
        border: 1px solid #eee;
        border-radius: 4px;
        margin-bottom: 10px;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .register-page .product-group:hover {
        background-color: #f5f5f5;
      }
      
      .register-page .product-group.selected {
        background-color: #e6f3ff;
        border-color: #b3d7ff;
      }
      
      .register-page .group-code {
        font-weight: bold;
        margin-bottom: 5px;
      }
      
      .register-page .group-memo {
        font-size: 14px;
        color: #666;
        margin-bottom: 5px;
      }
      
      .register-page .group-count {
        font-size: 12px;
        color: #888;
      }
      
      .register-page .product-details {
        max-height: 400px;
        overflow-y: auto;
        margin-bottom: 20px;
        border: 1px solid #eee;
        border-radius: 4px;
      }
      
      .register-page .products-list-header {
        display: grid;
        grid-template-columns: 1fr 2fr 1fr 1fr;
        padding: 10px;
        background-color: #f5f5f5;
        font-weight: bold;
        border-bottom: 1px solid #ddd;
        position: sticky;
        top: 0;
        z-index: 1;
      }
      
      .register-page .products-list {
        max-height: 100%;
        overflow-y: auto;
      }
      
      .register-page .product-item {
        display: grid;
        grid-template-columns: 1fr 2fr 1fr 1fr;
        padding: 10px;
        border-bottom: 1px solid #eee;
      }
      
      .register-page .product-item:hover {
        background-color: #f9f9f9;
      }
      
      .register-page .product-id {
        font-size: 14px;
        font-family: monospace;
      }
      
      .register-page .product-name {
        font-size: 14px;
      }
      
      .register-page .register-attempt {
        text-align: center;
        font-size: 14px;
        color: #666;
      }
      
      .register-page .registration-form {
        padding: 15px;
        border-top: 1px solid #eee;
      }
      
      .register-page .registration-form.hidden {
        display: none;
      }
      
      .register-page .form-group {
        margin-bottom: 15px;
      }
      
      .register-page .form-group label {
        display: block;
        margin-bottom: 5px;
        font-weight: 500;
      }
      
      .register-page .checkbox-group {
        display: flex;
        gap: 15px;
      }
      
      .register-page .checkbox-group label {
        display: flex;
        align-items: center;
        margin-right: 15px;
      }
      
      .register-page .checkbox-group label i {
        margin: 0 5px;
      }
      
      .register-page .checkbox-group input[type="checkbox"] {
        margin-right: 5px;
      }
      
      .register-page .market-settings {
        margin: 10px 0;
        padding: 10px;
        border: 1px solid #eee;
        border-radius: 4px;
        background-color: #fafafa;
      }
      
      .register-page .market-settings.hidden {
        display: none;
      }
      
      .register-page .market-info {
        margin-top: 10px;
        padding: 8px;
        background-color: #f8f9fa;
        border-radius: 4px;
        font-size: 14px;
      }
      
      .register-page .market-info-item {
        margin-bottom: 5px;
      }
      
      .register-page .market-warning {
        margin-top: 5px;
        padding: 8px;
        background-color: #fff3cd;
        color: #856404;
        border-radius: 4px;
        font-size: 14px;
      }
      
      .register-page .selected-product-count {
        margin-top: 5px;
        font-size: 14px;
        color: #495057;
      }
      
      .register-page select,
      .register-page input[type="number"] {
        width: 100%;
        padding: 8px 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
      }
      
      .register-page .form-actions {
        display: flex;
        gap: 10px;
        margin-top: 20px;
      }
      
      .register-page .action-button {
        padding: 10px 20px;
        border: none;
        border-radius: 4px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .register-page .action-button.register {
        background-color: #28a745;
        color: white;
      }
      
      .register-page .action-button.register:hover {
        background-color: #218838;
      }
      
      .register-page .action-button.discard {
        background-color: #dc3545;
        color: white;
      }
      
      .register-page .action-button.discard:hover {
        background-color: #c82333;
      }
      
      .register-page .loading {
        text-align: center;
        padding: 20px;
        color: #666;
      }
      
      .register-page .empty-state {
        text-align: center;
        padding: 30px;
        color: #888;
        font-style: italic;
      }
      
      .register-page .error-state {
        text-align: center;
        padding: 20px;
        color: #dc3545;
      }
      
      .register-page .hidden {
        display: none !important;
      }
      
      /* 스크롤바 스타일 개선 */
      .register-page .product-details::-webkit-scrollbar {
        width: 8px;
      }
      
      .register-page .product-details::-webkit-scrollbar-track {
        background: #f1f1f1;
      }
      
      .register-page .product-details::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 4px;
      }
      
      .register-page .product-details::-webkit-scrollbar-thumb:hover {
        background: #a1a1a1;
      }
      
      /* 많은 상품이 로드될 때 로딩 표시 */
      .register-page .products-loading-more {
        text-align: center;
        padding: 10px;
        background-color: #f8f9fa;
        margin-top: 5px;
        font-size: 14px;
        color: #6c757d;
      }
      
      /* 스크롤이 필요할 때 안내 메시지 */
      .register-page .scroll-indicator {
        text-align: center;
        padding: 5px;
        background-color: #e9ecef;
        font-size: 12px;
        color: #6c757d;
        margin-top: 10px;
        border-radius: 2px;
        display: none;
      }
      
      /* 많은 항목일 때 표시 */
      .register-page .many-items .scroll-indicator {
        display: block;
      }
    </style>
  `;
}

/**
 * 등록 관리 페이지 이벤트 핸들러 설정
 * 페이지 로드 후 호출되어 모든 이벤트 핸들러를 등록함
 */
export function setupRegisterHandlers() {
  // 탭 전환 핸들러
  const tabButtons = document.querySelectorAll('.tab-button');
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabType = button.getAttribute('data-tab');
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      loadProductGroups(tabType);
      
      // 마켓 설정 UI 조정
      adjustMarketSettingsForTab(tabType);
    });
  });
  
  // 초기 데이터 로드 (공통 등록 관리)
  loadProductGroups('common');
  adjustMarketSettingsForTab('common');
  
  // 마켓 선택 이벤트 핸들러
  const marketCheckboxes = document.querySelectorAll('input[name="market"]');
  marketCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      const marketType = checkbox.value;
      const settingsContainer = document.getElementById(`${marketType}-settings`);
      settingsContainer.classList.toggle('hidden', !checkbox.checked);
      
      if (checkbox.checked) {
        loadMarketNumbers(marketType);
      }
    });
  });
  
  // 등록 및 폐기 버튼 이벤트 핸들러
  document.getElementById('register-products').addEventListener('click', registerProducts);
  document.getElementById('discard-products').addEventListener('click', discardProducts);
  
  // 검색 기능 이벤트 핸들러
  document.getElementById('search-button').addEventListener('click', function() {
    const searchText = document.getElementById('group-search').value;
    const activeTab = document.querySelector('.tab-button.active').getAttribute('data-tab');
    loadProductGroups(activeTab, searchText);
  });
  
  document.getElementById('group-search').addEventListener('keyup', function(event) {
    if (event.key === 'Enter') {
      const searchText = this.value;
      const activeTab = document.querySelector('.tab-button.active').getAttribute('data-tab');
      loadProductGroups(activeTab, searchText);
    }
  });
}

/**
 * 탭 유형에 따라 마켓 설정 UI 조정
 * @param {string} tabType - 탭 타입 (common, coopang, naver)
 */
function adjustMarketSettingsForTab(tabType) {
  const marketCheckboxGroup = document.querySelector('.form-group .checkbox-group');
  const coopangCheckbox = document.querySelector('input[name="market"][value="coopang"]');
  const naverCheckbox = document.querySelector('input[name="market"][value="naver"]');
  const coopangSettings = document.getElementById('coopang-settings');
  const naverSettings = document.getElementById('naver-settings');
  
  // 모든 마켓 설정 초기화
  coopangSettings.classList.add('hidden');
  naverSettings.classList.add('hidden');
  
  if (tabType === 'common') {
    // 공통 탭: 체크박스 표시 및 초기화
    marketCheckboxGroup.classList.remove('hidden');
    coopangCheckbox.checked = false;
    naverCheckbox.checked = false;
  } else if (tabType === 'coopang') {
    // 쿠팡 탭: 쿠팡만 자동 선택
    marketCheckboxGroup.classList.add('hidden');
    coopangCheckbox.checked = true;
    naverCheckbox.checked = false;
    coopangSettings.classList.remove('hidden');
    loadMarketNumbers('coopang');
  } else if (tabType === 'naver') {
    // 네이버 탭: 네이버만 자동 선택
    marketCheckboxGroup.classList.add('hidden');
    coopangCheckbox.checked = false;
    naverCheckbox.checked = true;
    naverSettings.classList.remove('hidden');
    loadMarketNumbers('naver');
  }
}

/**
 * 상품 그룹 목록 로드 함수
 * @param {string} tabType - 탭 타입 (common, coopang, naver)
 * @param {string} searchText - 검색 텍스트 (선택적)
 * @returns {Promise<void>}
 */
async function loadProductGroups(tabType, searchText = '') {
  const groupsContainer = document.getElementById('product-groups');
  groupsContainer.innerHTML = '<div class="loading">데이터를 불러오는 중...</div>';
  
  try {
    // API 요청 파라미터 설정
    const params = new URLSearchParams();
    params.append('type', tabType);
    if (searchText) {
      params.append('search', searchText);
    }
    
    const response = await fetch(`/reg/register/groups?${params.toString()}`);
    if (!response.ok) {
      throw new Error('상품 그룹을 불러오는데 실패했습니다.');
    }
    
    const data = await response.json();
    
    if (data.groups.length === 0) {
      groupsContainer.innerHTML = '<div class="empty-state">등록 가능한 상품 그룹이 없습니다.</div>';
      return;
    }
    
    // 그룹 목록 렌더링
    let html = '';
    data.groups.forEach(group => {
      const groupMemo = group.product_group_memo || '메모 없음';
      html += `
        <div class="product-group" data-group-code="${group.product_group_code}" data-group-memo="${groupMemo}">
          <div class="group-code">${group.product_group_code}</div>
          <div class="group-memo">${groupMemo}</div>
          <div class="group-count">상품 ${group.product_count}개</div>
        </div>
      `;
    });
    
    groupsContainer.innerHTML = html;
    
    // 그룹 클릭 이벤트 핸들러
    const groupElements = document.querySelectorAll('.product-group');
    groupElements.forEach(element => {
      element.addEventListener('click', function() {
        groupElements.forEach(el => el.classList.remove('selected'));
        this.classList.add('selected');
        
        const groupCode = this.getAttribute('data-group-code');
        const groupMemo = this.getAttribute('data-group-memo');
        loadProductDetails(groupCode, groupMemo, tabType);
      });
    });
    
  } catch (error) {
    console.error('상품 그룹 로딩 오류:', error);
    groupsContainer.innerHTML = `<div class="error-state">오류 발생: ${error.message}</div>`;
  }
}

/**
 * 상품 상세 정보 로드 함수
 * @param {string} groupCode - 상품 그룹 코드
 * @param {string} groupMemo - 상품 그룹 메모
 * @param {string} tabType - 탭 타입 (common, coopang, naver)
 * @returns {Promise<void>}
 */
async function loadProductDetails(groupCode, groupMemo, tabType) {
  const detailsContainer = document.getElementById('product-details');
  const registrationForm = document.getElementById('registration-form');
  
  detailsContainer.innerHTML = '<div class="loading">상품 정보를 불러오는 중...</div>';
  registrationForm.classList.add('hidden');
  
  try {
    // 메모가 '메모 없음'인 경우 파라미터에 null 전송
    const memoParam = (groupMemo === '메모 없음') ? null : groupMemo;
    const response = await fetch(`/reg/register/products?group=${groupCode}&memo=${memoParam}&type=${tabType}`);
    if (!response.ok) {
      throw new Error('상품 정보를 불러오는데 실패했습니다.');
    }
    
    const data = await response.json();
    
    if (data.products.length === 0) {
      detailsContainer.innerHTML = '<div class="empty-state">상품 정보가 없습니다.</div>';
      return;
    }
    
    // 상품 목록 렌더링
    let html = `
      <div class="products-list-header">
        <div class="product-id-header">상품 ID</div>
        <div class="product-name-header">상품명</div>
        <div class="register-attempt-header">쿠팡 시도</div>
        <div class="register-attempt-header">네이버 시도</div>
      </div>
      <div class="products-list">
    `;
    
    data.products.forEach(product => {
      html += `
        <div class="product-item" data-product-id="${product.productid}">
          <div class="product-id">${product.productid}</div>
          <div class="product-name">${product.product_name || '-'}</div>
          <div class="register-attempt">${product.coopang_registration_attempt_time || 0}회</div>
          <div class="register-attempt">${product.naver_registration_attempt_time || 0}회</div>
        </div>
      `;
    });
    
    html += '</div>';
    
    // 많은 상품일 경우 스크롤 안내 추가
    if (data.products.length > 20) {
      html += '<div class="scroll-indicator">아래로 스크롤하여 더 많은 상품 보기</div>';
      detailsContainer.classList.add('many-items');
    } else {
      detailsContainer.classList.remove('many-items');
    }
    
    detailsContainer.innerHTML = html;
    
    // 등록 폼 표시
    registrationForm.classList.remove('hidden');
    
    // 선택된 그룹 코드와 메모를 등록 폼에 저장
    registrationForm.setAttribute('data-group-code', groupCode);
    registrationForm.setAttribute('data-group-memo', groupMemo);
    registrationForm.setAttribute('data-tab-type', tabType);
    
    // 선택된 마켓 타입에 따라 제한 확인
    if (tabType === 'coopang' || document.querySelector('input[name="market"][value="coopang"]').checked) {
      const marketNumber = document.getElementById('coopang-market-number').value;
      if (marketNumber) {
        checkProductLimit('coopang');
      }
    }
    
    if (tabType === 'naver' || document.querySelector('input[name="market"][value="naver"]').checked) {
      const marketNumber = document.getElementById('naver-market-number').value;
      if (marketNumber) {
        checkProductLimit('naver');
      }
    }
    
    // 상품 목록 스크롤 이벤트 리스너 추가
    const productDetails = document.getElementById('product-details');
    productDetails.addEventListener('scroll', function() {
      // 스크롤을 내리면 스크롤 안내 숨기기
      if (productDetails.scrollTop > 50) {
        const indicator = document.querySelector('.scroll-indicator');
        if (indicator) {
          indicator.style.display = 'none';
        }
      }
    });
    
    // 상품 수 표시
    const countInfo = document.createElement('div');
    countInfo.className = 'product-count-info';
    countInfo.innerHTML = `총 <strong>${data.products.length}</strong>개 상품`;
    productDetails.insertBefore(countInfo, productDetails.firstChild);
    
  } catch (error) {
    console.error('상품 상세 정보 로딩 오류:', error);
    detailsContainer.innerHTML = `<div class="error-state">오류 발생: ${error.message}</div>`;
  }
}

/**
 * 마켓 번호 목록 로드 함수
 * @param {string} marketType - 마켓 타입 (coopang, naver)
 * @returns {Promise<void>}
 */
async function loadMarketNumbers(marketType) {
  const selectElement = document.getElementById(`${marketType}-market-number`);
  
  try {
    const response = await fetch(`/reg/register/markets?type=${marketType}`);
    if (!response.ok) {
      throw new Error(`${marketType === 'coopang' ? '쿠팡' : '스마트스토어'} 마켓 정보를 불러오는데 실패했습니다.`);
    }
    
    const data = await response.json();
    
    // 옵션 목록 초기화
    selectElement.innerHTML = '<option value="">마켓 선택</option>';
    
    // 각 마켓 번호마다 메모 정보도 함께 가져오기
    for (const market of data.markets) {
      const marketNumber = market[`${marketType}_market_number`];
      
      try {
        const memoResponse = await fetch(`/reg/register/market-memo?type=${marketType}&number=${marketNumber}`);
        if (memoResponse.ok) {
          const memoData = await memoResponse.json();
          const memo = memoData.memo || '';
          
          const optionElement = document.createElement('option');
          optionElement.value = marketNumber;
          optionElement.textContent = memo ? `${marketNumber} - ${memo}` : `${marketNumber}`;
          optionElement.setAttribute('data-memo', memo);
          selectElement.appendChild(optionElement);
        }
      } catch (memoError) {
        console.error(`메모 로딩 오류 (${marketNumber}):`, memoError);
        
        // 메모 로딩에 실패해도 옵션은 추가
        const optionElement = document.createElement('option');
        optionElement.value = marketNumber;
        optionElement.textContent = `${marketNumber}`;
        selectElement.appendChild(optionElement);
      }
    }
    
    // 마켓 번호 선택 시 마켓 정보 표시
    selectElement.onchange = async function() {
      const marketNumber = this.value;
      if (!marketNumber) {
        document.getElementById(`${marketType}-market-info`).innerHTML = '';
        return;
      }
      
      await loadMarketInfo(marketType, marketNumber);
      checkProductLimit(marketType);
    };
    
  } catch (error) {
    console.error(`${marketType} 마켓 번호 로딩 오류:`, error);
    selectElement.innerHTML = '<option value="">로딩 오류</option>';
  }
}

/**
 * 마켓 정보 로드 함수
 * @param {string} marketType - 마켓 타입 (coopang, naver)
 * @param {string} marketNumber - 마켓 번호
 * @returns {Promise<void>}
 */
async function loadMarketInfo(marketType, marketNumber) {
  if (!marketNumber) {
    document.getElementById(`${marketType}-market-info`).innerHTML = '';
    return;
  }
  
  const infoElement = document.getElementById(`${marketType}-market-info`);
  infoElement.innerHTML = '정보를 불러오는 중...';
  
  try {
    const response = await fetch(`/reg/register/market-info?type=${marketType}&number=${marketNumber}`);
    if (!response.ok) {
      throw new Error('마켓 정보를 불러오는데 실패했습니다.');
    }
    
    const data = await response.json();
    
    infoElement.innerHTML = `
      <div class="market-info-item">최대 등록 가능 개수: <strong>${data.max_sku_count}</strong>개</div>
      <div class="market-info-item">현재 등록된 개수: <strong>${data.current_count}</strong>개</div>
      <div class="market-info-item">남은 등록 가능 개수: <strong>${data.available_count}</strong>개</div>
    `;
    
    // 데이터 저장
    infoElement.setAttribute('data-available', data.available_count);
    
  } catch (error) {
    console.error(`${marketType} 마켓 정보 로딩 오류:`, error);
    infoElement.innerHTML = '마켓 정보 로딩 실패';
  }
}

/**
 * 상품 제한 확인 함수
 * 선택된 상품 수와 마켓의 등록 가능 개수를 비교하여 경고 메시지를 표시
 * @param {string} marketType - 마켓 타입 (coopang, naver)
 */
function checkProductLimit(marketType) {
  const form = document.getElementById('registration-form');
  const groupCode = form.getAttribute('data-group-code');
  const groupMemo = form.getAttribute('data-group-memo');
  const productItems = document.querySelectorAll('.product-item');
  const selectedCount = productItems.length;
  const infoElement = document.getElementById(`${marketType}-market-info`);
  const availableCount = parseInt(infoElement.getAttribute('data-available') || '0');
  
  // 선택된 상품 개수 표시
  const countElement = document.getElementById(`${marketType}-selected-count`);
  if (!countElement) {
    const countDiv = document.createElement('div');
    countDiv.id = `${marketType}-selected-count`;
    countDiv.className = 'selected-product-count';
    countDiv.innerHTML = `선택된 상품 개수: <strong>${selectedCount}</strong>개`;
    infoElement.parentNode.insertBefore(countDiv, infoElement.nextSibling);
  } else {
    countElement.innerHTML = `선택된 상품 개수: <strong>${selectedCount}</strong>개`;
  }
  
  // 경고 메시지 표시
  const warningElement = document.getElementById(`${marketType}-warning`);
  if (selectedCount > availableCount) {
    if (!warningElement) {
      const warningDiv = document.createElement('div');
      warningDiv.id = `${marketType}-warning`;
      warningDiv.className = 'market-warning';
      warningDiv.innerHTML = `<strong>경고:</strong> 선택한 상품 수(${selectedCount}개)가 등록 가능 개수(${availableCount}개)를 초과합니다.`;
      infoElement.parentNode.insertBefore(warningDiv, infoElement.nextSibling);
    } else {
      warningElement.innerHTML = `<strong>경고:</strong> 선택한 상품 수(${selectedCount}개)가 등록 가능 개수(${availableCount}개)를 초과합니다.`;
      warningElement.style.display = 'block';
    }
  } else if (warningElement) {
    warningElement.style.display = 'none';
  }
}

// 처리 중 상태를 추적하기 위한 전역 변수
let isProcessing = false;

/**
 * 상품 등록 함수
 * 선택된 마켓에 상품 등록 요청을 보냄
 * @returns {Promise<void>}
 */
export function registerProducts() {
  // 이미 처리 중인지 확인 - 전역 변수와 버튼 상태 둘 다 확인
  const registerButton = document.getElementById('register-products');
  if (isProcessing || registerButton.disabled) {
    console.log('이미 처리 중입니다. 요청이 무시됩니다.');
    return;
  }
  
  // 전역 상태 및 버튼 비활성화
  isProcessing = true;
  registerButton.disabled = true;
  registerButton.classList.add('processing');
  registerButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 처리중...';
  
  const form = document.getElementById('registration-form');
  const groupCode = form.getAttribute('data-group-code');
  const groupMemo = form.getAttribute('data-group-memo');
  const tabType = form.getAttribute('data-tab-type');
  
  // 메모가 '메모 없음'인 경우 null로 처리
  const memoValue = (groupMemo === '메모 없음') ? null : groupMemo;
  
  // 설정 값 가져오기
  const deliveryFee = document.getElementById('delivery-fee').value;
  const profitMargin = document.getElementById('profit-margin').value;
  const minProfitMargin = document.getElementById('min-profit-margin').value;
  
  if (!deliveryFee || !profitMargin || !minProfitMargin) {
    alert('배송비, 마진률, 최저 마진률을 모두 입력해주세요.');
    resetRegisterButton();
    return;
  }
  
  // 마켓 선택 확인 (탭에 따라 자동 선택)
  const coopangCheckbox = document.querySelector('input[name="market"][value="coopang"]');
  const naverCheckbox = document.querySelector('input[name="market"][value="naver"]');
  
  let successCount = 0;
  let promiseArr = [];
  
  // 쿠팡 마켓 등록 처리
  if (coopangCheckbox.checked) {
    const coopangMarketNumber = document.getElementById('coopang-market-number').value;
    if (!coopangMarketNumber) {
      alert('쿠팡 마켓 번호를 선택해주세요.');
      resetRegisterButton();
      return;
    }
    
    // 등록 가능 개수 확인
    const infoElement = document.getElementById('coopang-market-info');
    const availableCount = parseInt(infoElement.getAttribute('data-available') || '0');
    const productItems = document.querySelectorAll('.product-item');
    
    if (productItems.length > availableCount) {
      if (!confirm(`선택한 상품 수(${productItems.length}개)가 등록 가능 개수(${availableCount}개)를 초과합니다. 계속 진행하시겠습니까?`)) {
        resetRegisterButton();
        return;
      }
    }
    
    const coopangPromise = fetch('/reg/register/registInCoopang', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        groupCode,
        groupMemo: memoValue,
        tabType,
        marketNumber: coopangMarketNumber,
        deliveryFee: parseInt(deliveryFee),
        profitMargin: parseInt(profitMargin),
        minProfitMargin: parseInt(minProfitMargin)
      })
    })
    .then(response => {
      if (response.ok) return response.json();
      return response.json().then(data => Promise.reject(new Error(data.message || '쿠팡 상품 등록에 실패했습니다.')));
    })
    .then(data => {
      successCount += data.successCount || 0;
    })
    .catch(error => {
      console.error('쿠팡 상품 등록 오류:', error);
      alert(`쿠팡 등록 오류: ${error.message}`);
    });
    
    promiseArr.push(coopangPromise);
  }
  
  // 네이버 마켓 등록 처리
  if (naverCheckbox.checked) {
    const naverMarketNumber = document.getElementById('naver-market-number').value;
    if (!naverMarketNumber) {
      alert('네이버 마켓 번호를 선택해주세요.');
      resetRegisterButton();
      return;
    }
    
    // 등록 가능 개수 확인
    const infoElement = document.getElementById('naver-market-info');
    const availableCount = parseInt(infoElement.getAttribute('data-available') || '0');
    const productItems = document.querySelectorAll('.product-item');
    
    if (productItems.length > availableCount) {
      if (!confirm(`선택한 상품 수(${productItems.length}개)가 등록 가능 개수(${availableCount}개)를 초과합니다. 계속 진행하시겠습니까?`)) {
        resetRegisterButton();
        return;
      }
    }
    
    const naverPromise = fetch('/reg/register/registInNaver', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        groupCode,
        groupMemo: memoValue,
        tabType,
        marketNumber: naverMarketNumber,
        deliveryFee: parseInt(deliveryFee),
        profitMargin: parseInt(profitMargin),
        minProfitMargin: parseInt(minProfitMargin)
      })
    })
    .then(response => {
      if (response.ok) return response.json();
      return response.json().then(data => Promise.reject(new Error(data.message || '네이버 상품 등록에 실패했습니다.')));
    })
    .then(data => {
      successCount += data.successCount || 0;
    })
    .catch(error => {
      console.error('네이버 상품 등록 오류:', error);
      alert(`네이버 등록 오류: ${error.message}`);
    });
    
    promiseArr.push(naverPromise);
  }
  
  // 모든 등록 처리 완료 후 메시지 표시 및 버튼 상태 복원
  Promise.all(promiseArr)
    .finally(() => {
      if (successCount > 0) {
        alert(`상품 등록이 요청되었습니다. ${successCount}개 상품 등록 요청 성공`);
        // 등록 후 목록 새로고침
        loadProductGroups(tabType);
      }
      resetRegisterButton();
    });

  // 버튼 상태 복원 함수
  function resetRegisterButton() {
    isProcessing = false;
    registerButton.disabled = false;
    registerButton.classList.remove('processing');
    registerButton.innerHTML = '<i class="fas fa-upload"></i> 등록';
  }
}

/**
 * 상품 폐기 함수
 * 선택된 상품 그룹을 폐기 처리함
 * @returns {Promise<void>}
 */
async function discardProducts() {
  const form = document.getElementById('registration-form');
  const groupCode = form.getAttribute('data-group-code');
  const groupMemo = form.getAttribute('data-group-memo');
  const tabType = form.getAttribute('data-tab-type');
  
  // 메모가 '메모 없음'인 경우 null로 처리
  const memoValue = (groupMemo === '메모 없음') ? null : groupMemo;
  
  if (!confirm('선택한 상품 그룹을 정말 폐기하시겠습니까?')) {
    return;
  }
  
  try {
    const response = await fetch('/reg/product_discard/group', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        groupCode, 
        groupMemo: memoValue, 
        tabType 
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '상품 폐기에 실패했습니다.');
    }
    
    const data = await response.json();
    alert(`상품 폐기가 완료되었습니다. ${data.count}개 상품 폐기됨`);
    
    // 폐기 후 목록 새로고침
    loadProductGroups(tabType);
    
  } catch (error) {
    console.error('상품 폐기 오류:', error);
    alert(`오류 발생: ${error.message}`);
  }
}
