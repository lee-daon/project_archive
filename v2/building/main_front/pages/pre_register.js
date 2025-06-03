/**
 * @fileoverview 사전 등록 관리 페이지
 * 
 * 가공이 완료된 상품들을 스테이징 또는 폐기 처리하는 인터페이스를 제공합니다.
 * - 개별 상품 목록 또는 테스트코드별 묶음 보기 기능
 * - 최신순/과거순 정렬 기능
 * - 상품 선택 및 스테이징/폐기 처리 기능
 * 
 * @author 관리 시스템 개발팀
 * @version 1.0.0
 */

import { fetchWrapper } from '../main.js';

/**
 * 사전 등록 페이지 렌더링
 * @returns {string} 사전 등록 페이지 HTML
 */
export function renderPreRegisterPage() {
  return `
    <div class="pre-register-page">
      <div class="page-header">
        <h2>사전 등록 관리</h2>
        <p>가공 완료된 상품들을 스테이징 또는 폐기 처리합니다.</p>
      </div>
      
      <!-- 메모와 액션 컨트롤 영역 -->
      <div class="action-controls">
        <div class="action-memo">
          <div class="memo-form">
            <div class="form-group">
              <label for="marketNumber">상품군 번호:</label>
              <input type="number" id="marketNumber" min="1" value="1" class="form-control">
            </div>
            <div class="form-group">
              <label for="stagingMemo">메모:</label>
              <input type="text" id="stagingMemo" placeholder="메모(선택사항)" class="form-control">
            </div>
          </div>
          <div class="action-buttons">
            <button id="stageBtn" class="btn btn-primary" disabled>스테이징</button>
            <button id="discardBtn" class="btn btn-danger" disabled>상품 폐기</button>
            <div class="selected-info">
              <span id="selectedCount" class="selected-count">0</span>개 선택됨
            </div>
          </div>
        </div>
        
        <div class="selection-controls">
          <button id="selectAll" class="btn btn-secondary">전체 선택</button>
          <div class="top-n-select">
            <button id="selectTopN" class="btn btn-secondary">
              위에서 <input type="number" id="topNCount" min="1" value="10" class="number-input"> 개 선택
            </button>
          </div>
        </div>
      </div>
      
      <!-- 보기 방식 컨트롤 영역 -->
      <div class="view-controls">
        <div class="view-mode">
          <label for="viewMode">보기 방식:</label>
          <select id="viewMode" class="form-control">
            <option value="individual">개별 상품 목록</option>
            <option value="grouped">테스트코드별 묶음</option>
          </select>
        </div>
        
        <div class="sort-controls individual-controls">
          <label for="sortBy">정렬:</label>
          <select id="sortBy" class="form-control">
            <option value="desc">최신순</option>
            <option value="asc">과거순</option>
          </select>
        </div>
      </div>
      
      <!-- 상품 목록 영역 -->
      <div id="productList" class="product-list">
        <div class="loading">상품 목록을 불러오는 중...</div>
      </div>
    </div>
    
    <style>
      /* 기본 레이아웃 스타일 */
      .pre-register-page {
        padding: 20px;
        max-width: 1200px;
        margin: 0 auto;
        font-family: 'Noto Sans KR', sans-serif;
      }
      
      .pre-register-page .page-header {
        margin-bottom: 24px;
        border-bottom: 2px solid #f0f0f0;
        padding-bottom: 12px;
      }
      
      .pre-register-page .page-header h2 {
        margin-bottom: 8px;
        color: #333;
      }
      
      .pre-register-page .page-header p {
        color: #666;
        margin: 0;
      }
      
      /* 폼 요소 스타일 */
      .pre-register-page .form-control {
        display: inline-block;
        width: auto;
        padding: 6px 10px;
        border: 1px solid #ced4da;
        border-radius: 4px;
        font-size: 14px;
      }
      
      .pre-register-page .number-input {
        width: 50px;
        padding: 4px;
        text-align: center;
        border: 1px solid #ced4da;
        border-radius: 4px;
      }
      
      /* 액션 컨트롤 영역 스타일 */
      .pre-register-page .action-controls {
        background-color: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 24px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      }
      
      .pre-register-page .action-memo {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }
      
      @media (max-width: 768px) {
        .pre-register-page .action-memo {
          flex-direction: column;
          align-items: flex-start;
        }
        
        .pre-register-page .action-buttons {
          margin-top: 16px;
        }
      }
      
      .pre-register-page .memo-form {
        display: flex;
        gap: 16px;
        align-items: center;
        flex-wrap: wrap;
      }
      
      .pre-register-page .form-group {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .pre-register-page .action-buttons {
        display: flex;
        gap: 12px;
        align-items: center;
      }
      
      .pre-register-page .btn {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
        transition: background-color 0.2s;
      }
      
      .pre-register-page .btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      
      .pre-register-page .btn-primary {
        background-color: #007bff;
        color: white;
      }
      
      .pre-register-page .btn-primary:hover:not(:disabled) {
        background-color: #0069d9;
      }
      
      .pre-register-page .btn-danger {
        background-color: #dc3545;
        color: white;
      }
      
      .pre-register-page .btn-danger:hover:not(:disabled) {
        background-color: #c82333;
      }
      
      .pre-register-page .btn-secondary {
        background-color: #6c757d;
        color: white;
      }
      
      .pre-register-page .btn-secondary:hover {
        background-color: #5a6268;
      }
      
      .pre-register-page .selected-info {
        margin-left: 16px;
        padding: 6px 12px;
        background-color: #e9ecef;
        border-radius: 16px;
        font-size: 14px;
      }
      
      .pre-register-page .selected-count {
        font-weight: bold;
        color: #495057;
      }
      
      .pre-register-page .selection-controls {
        display: flex;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
      }
      
      .pre-register-page .top-n-select {
        display: flex;
        align-items: center;
      }
      
      /* 보기 방식 컨트롤 영역 스타일 */
      .pre-register-page .view-controls {
        display: flex;
        gap: 24px;
        margin-bottom: 20px;
        flex-wrap: wrap;
        align-items: center;
        background-color: #fff;
        padding: 12px;
        border-radius: 6px;
        border: 1px solid #e9ecef;
      }
      
      /* 상품 목록 영역 스타일 */
      .pre-register-page .product-list {
        min-height: 300px;
        margin-bottom: 20px;
        background-color: #fff;
        border-radius: 6px;
        border: 1px solid #e9ecef;
        overflow: hidden;
      }
      
      .pre-register-page .loading {
        text-align: center;
        padding: 50px;
        color: #6c757d;
        font-style: italic;
      }
      
      .pre-register-page .error, 
      .pre-register-page .no-data {
        text-align: center;
        padding: 40px;
        color: #6c757d;
        background-color: #f8f9fa;
        border-radius: 6px;
      }
      
      .pre-register-page .error {
        color: #721c24;
        background-color: #f8d7da;
      }
      
      /* 개별 상품 아이템 스타일 */
      .pre-register-page .product-item {
        padding: 16px;
        border-bottom: 1px solid #e9ecef;
      }
      
      .pre-register-page .product-item:last-child {
        border-bottom: none;
      }
      
      .pre-register-page .product-item:hover {
        background-color: #f8f9fa;
      }
      
      .pre-register-page .product-checkbox-wrapper {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }
      
      .pre-register-page .product-checkbox-wrapper label {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
      }
      
      .pre-register-page .test-code {
        color: #6c757d;
        font-size: 0.9em;
        margin-left: 8px;
      }
      
      .pre-register-page .processing-status {
        margin-top: 8px;
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      
      .pre-register-page .status-label {
        display: inline-block;
        padding: 3px 8px;
        border-radius: 16px;
        font-size: 0.85em;
        background-color: #e9ecef;
      }
      
      .pre-register-page .status-true {
        background-color: #d4edda;
        color: #155724;
      }
      
      .pre-register-page .status-false {
        background-color: #f8d7da;
        color: #721c24;
      }
      
      /* 테이블 스타일 */
      .pre-register-page .group-table {
        width: 100%;
        border-collapse: collapse;
      }
      
      .pre-register-page .group-table th, 
      .pre-register-page .group-table td {
        border: 1px solid #dee2e6;
        padding: 12px;
        text-align: left;
      }
      
      .pre-register-page .group-table th {
        background-color: #f8f9fa;
        font-weight: 500;
        color: #495057;
      }
      
      .pre-register-page .group-table tr:nth-child(even) {
        background-color: #f8f9fa;
      }
      
      .pre-register-page .group-table tr:hover {
        background-color: #e9ecef;
      }
      
      .pre-register-page .group-table .select-btn {
        padding: 6px 12px;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
        transition: background-color 0.2s;
      }
      
      .pre-register-page .group-table .select-btn:hover {
        background-color: #0069d9;
      }
    </style>
  `;
}

/**
 * 사전 등록 페이지 초기화 및 이벤트 핸들러 설정
 * DOM이 로드된 후 호출되어 이벤트 핸들러를 등록하고 초기 상품 목록을 로드합니다.
 */
export function setupPreRegisterHandlers() {
  // 보기 방식 변경 이벤트 리스너 등록
  setupViewControlListeners();
  
  // 상품 선택 컨트롤 이벤트 리스너 등록
  setupSelectionControlListeners();
  
  // 액션 버튼 이벤트 리스너 등록
  setupActionButtonListeners();
  
  // 초기 상품 목록 로드
  loadProducts();
}

/**
 * 보기 방식 컨트롤 이벤트 리스너 설정
 * 보기 방식(개별/그룹) 및 정렬 방식 변경 이벤트를 처리합니다.
 * @private
 */
function setupViewControlListeners() {
  // 뷰 모드 변경 이벤트
  const viewModeSelect = document.getElementById('viewMode');
  viewModeSelect.addEventListener('change', () => {
    loadProducts();
  });
  
  // 정렬 방식 변경 이벤트
  const sortBySelect = document.getElementById('sortBy');
  sortBySelect.addEventListener('change', () => {
    loadProducts();
  });
}

/**
 * 상품 선택 컨트롤 이벤트 리스너 설정
 * 전체 선택 및 N개 선택 기능을 처리합니다.
 * @private
 */
function setupSelectionControlListeners() {
  // 전체 선택 버튼
  document.getElementById('selectAll').addEventListener('click', () => {
    const checkboxes = document.querySelectorAll('.product-checkbox');
    const isAllChecked = Array.from(checkboxes).every(cb => cb.checked);
    
    checkboxes.forEach(checkbox => {
      checkbox.checked = !isAllChecked;
    });
    
    updateSelectedCount();
  });
  
  // 위에서 N개 선택 버튼
  document.getElementById('selectTopN').addEventListener('click', () => {
    const n = parseInt(document.getElementById('topNCount').value);
    const checkboxes = document.querySelectorAll('.product-checkbox');
    
    checkboxes.forEach((checkbox, index) => {
      checkbox.checked = index < n;
    });
    
    updateSelectedCount();
  });
}

/**
 * 액션 버튼 이벤트 리스너 설정
 * 스테이징 및 폐기 버튼 클릭 이벤트를 처리합니다.
 * @private
 */
function setupActionButtonListeners() {
  // 스테이징 버튼 이벤트
  document.getElementById('stageBtn').addEventListener('click', handleStagingAction);
  
  // 상품 폐기 버튼 이벤트
  document.getElementById('discardBtn').addEventListener('click', handleDiscardAction);
}

/**
 * 스테이징 액션 처리
 * 선택된 상품들을 스테이징 처리합니다.
 * @private
 * @async
 */
async function handleStagingAction() {
  const selectedIds = getSelectedProductIds();
  const marketNumber = document.getElementById('marketNumber').value;
  const memo = document.getElementById('stagingMemo').value;
  
  if (!selectedIds.length) {
    alert('선택된 상품이 없습니다.');
    return;
  }
  
  if (!marketNumber) {
    alert('상품군 번호를 입력해주세요.');
    return;
  }
  
  if (confirm(`선택된 ${selectedIds.length}개 상품을 스테이징하시겠습니까?`)) {
    try {
      const response = await fetchWrapper('/reg/stage_products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productIds: selectedIds,
          marketNumber: parseInt(marketNumber),
          memo
        })
      });
      
      if (response && response.success) {
        alert(`${response.productCount}개 상품이 스테이징 처리되었습니다.`);
        loadProducts();
      } else {
        alert('스테이징 처리 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('스테이징 처리 오류:', error);
      alert('스테이징 처리 중 오류가 발생했습니다.');
    }
  }
}

/**
 * 폐기 액션 처리
 * 선택된 상품들을 폐기 처리합니다.
 * @private
 * @async
 */
async function handleDiscardAction() {
  const selectedIds = getSelectedProductIds();
  
  if (!selectedIds.length) {
    alert('선택된 상품이 없습니다.');
    return;
  }
  
  if (confirm(`선택된 ${selectedIds.length}개 상품을 폐기하시겠습니까?`)) {
    try {
      const response = await fetchWrapper('/reg/product_discard/individual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productIds: selectedIds
        })
      });
      
      if (response && response.success) {
        alert(`${response.productCount}개 상품이 폐기 처리되었습니다.`);
        loadProducts();
      } else {
        alert('폐기 처리 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('폐기 처리 오류:', error);
      alert('폐기 처리 중 오류가 발생했습니다.');
    }
  }
}

/**
 * 선택된 상품 ID 배열 반환
 * 체크된 체크박스에서 상품 ID를 추출하여 배열로 반환합니다.
 * @returns {Array<string>} 선택된 상품 ID 배열
 * @private
 */
function getSelectedProductIds() {
  const selectedCheckboxes = document.querySelectorAll('.product-checkbox:checked');
  return Array.from(selectedCheckboxes).map(checkbox => checkbox.value);
}

/**
 * 선택된 상품 개수 업데이트
 * 선택된 상품 개수를 표시하고 버튼 활성화 상태를 업데이트합니다.
 * @private
 */
function updateSelectedCount() {
  const selectedCount = document.querySelectorAll('.product-checkbox:checked').length;
  document.getElementById('selectedCount').textContent = selectedCount;
  
  // 선택된 상품이 있으면 버튼 활성화
  const stageBtn = document.getElementById('stageBtn');
  const discardBtn = document.getElementById('discardBtn');
  
  stageBtn.disabled = selectedCount === 0;
  discardBtn.disabled = selectedCount === 0;
}

/**
 * 상품 목록 로드
 * API를 통해 상품 목록을 로드하고 화면에 렌더링합니다.
 * @private
 * @async
 */
async function loadProducts() {
  const productListElement = document.getElementById('productList');
  productListElement.innerHTML = '<div class="loading">상품 목록을 불러오는 중...</div>';
  
  const viewMode = document.getElementById('viewMode').value;
  const sortBy = document.getElementById('sortBy').value;
  
  try {
    const response = await fetchWrapper(`/reg/pre_register?viewMode=${viewMode}&sortBy=${sortBy}`);
    
    if (!response || !response.success) {
      productListElement.innerHTML = '<div class="error">상품 목록을 불러오는데 실패했습니다.</div>';
      return;
    }
    
    // 보기 모드에 따라 다른 렌더링 함수 호출
    if (viewMode === 'individual') {
      renderIndividualProducts(response.products);
    } else {
      renderGroupedProducts(response.testCodeGroups);
    }
    
  } catch (error) {
    console.error('상품 목록 로드 오류:', error);
    productListElement.innerHTML = '<div class="error">상품 목록을 불러오는데 실패했습니다.</div>';
  }
}

/**
 * 개별 상품 목록 렌더링
 * 상품 목록을 개별 아이템으로 렌더링합니다.
 * @param {Array} products - 상품 목록
 * @private
 */
function renderIndividualProducts(products) {
  const productListElement = document.getElementById('productList');
  
  if (!products || products.length === 0) {
    productListElement.innerHTML = '<div class="no-data">사전 등록 대기 중인 상품이 없습니다.</div>';
    return;
  }
  
  let html = '';
  
  products.forEach(product => {
    html += `
      <div class="product-item">
        <div class="product-info">
          <div class="product-checkbox-wrapper">
            <input type="checkbox" class="product-checkbox" value="${product.productid}" id="product-${product.productid}">
            <label for="product-${product.productid}">
              <strong>${product.productid}</strong> - ${product.product_name}
              ${product.testcode ? `<span class="test-code">(테스트코드: ${product.testcode})</span>` : ''}
            </label>
          </div>
          <div class="processing-status">
            <span class="status-label ${product.brand_checked ? 'status-true' : 'status-false'}">브랜드 검사: ${product.brand_checked ? '완료' : '미완료'}</span>
            <span class="status-label ${product.name_translated ? 'status-true' : 'status-false'}">상품명 번역: ${product.name_translated ? '완료' : '미완료'}</span>
            <span class="status-label ${product.image_translated ? 'status-true' : 'status-false'}">이미지 번역: ${product.image_translated ? '완료' : '미완료'}</span>
            <span class="status-label ${product.attribute_translated ? 'status-true' : 'status-false'}">속성 번역: ${product.attribute_translated ? '완료' : '미완료'}</span>
            <span class="status-label ${product.keyword_generated ? 'status-true' : 'status-false'}">키워드 생성: ${product.keyword_generated ? '완료' : '미완료'}</span>
            <span class="status-label ${product.nukki_created ? 'status-true' : 'status-false'}">누끼 생성: ${product.nukki_created ? '완료' : '미완료'}</span>
          </div>
        </div>
      </div>
    `;
  });
  
  productListElement.innerHTML = html;
  
  // 체크박스 변경 이벤트 설정
  document.querySelectorAll('.product-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', updateSelectedCount);
  });
  
  // 선택 상태 초기화
  updateSelectedCount();
}

/**
 * 테스트코드별 묶음 상품 목록 테이블 형태로 렌더링
 * 테스트코드별로 그룹화된 상품 목록을 테이블 형태로 렌더링합니다.
 * @param {Array} testCodeGroups - 테스트코드별 그룹 목록
 * @private
 */
function renderGroupedProducts(testCodeGroups) {
  const productListElement = document.getElementById('productList');
  
  if (!testCodeGroups || testCodeGroups.length === 0) {
    productListElement.innerHTML = '<div class="no-data">사전 등록 대기 중인 상품이 없습니다.</div>';
    return;
  }
  
  // 테이블 형태로 렌더링
  let html = `
    <table class="group-table">
      <thead>
        <tr>
          <th>테스트코드</th>
          <th>상품 수</th>
          <th>가공 현황 (샘플)</th>
          <th>액션</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  testCodeGroups.forEach(group => {
    const testCode = group.testcode !== null ? group.testcode : '미지정';
    const sample = group.sample || {};
    
    // 가공 현황 HTML 생성
    const processingStatusHtml = `
      <span class="status-label ${sample.brand_checked ? 'status-true' : 'status-false'}">브랜드</span>
      <span class="status-label ${sample.name_translated ? 'status-true' : 'status-false'}">상품명</span>
      <span class="status-label ${sample.image_translated ? 'status-true' : 'status-false'}">이미지</span>
      <span class="status-label ${sample.attribute_translated ? 'status-true' : 'status-false'}">속성</span>
      <span class="status-label ${sample.keyword_generated ? 'status-true' : 'status-false'}">키워드</span>
      <span class="status-label ${sample.nukki_created ? 'status-true' : 'status-false'}">누끼</span>
    `;
    
    html += `
      <tr>
        <td>${testCode}</td>
        <td>${group.product_count}개</td>
        <td>${processingStatusHtml}</td>
        <td><button class="select-btn" data-testcode="${group.testcode}">선택</button></td>
      </tr>
    `;
  });
  
  html += `
      </tbody>
    </table>
  `;
  
  productListElement.innerHTML = html;
  
  // 그룹 선택 버튼 이벤트 설정
  setupGroupSelectionButtons();
}

/**
 * 그룹 선택 버튼 이벤트 설정
 * 테스트코드 그룹 선택 버튼의 클릭 이벤트를 처리합니다.
 * @private
 */
function setupGroupSelectionButtons() {
  document.querySelectorAll('.select-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
      const testCode = e.target.getAttribute('data-testcode');
      
      try {
        const response = await fetchWrapper(`/reg/pre_register?viewMode=grouped&testCode=${testCode}`);
        
        if (response && response.success && response.products) {
          // 개별 보기로 전환
          document.getElementById('viewMode').value = 'individual';
          
          // 상품 목록 렌더링
          renderIndividualProducts(response.products);
          
          // 모든 상품 선택
          document.querySelectorAll('.product-checkbox').forEach(checkbox => {
            checkbox.checked = true;
          });
          
          updateSelectedCount();
        }
      } catch (error) {
        console.error('그룹 상품 조회 오류:', error);
        alert('상품 그룹을 불러오는데 실패했습니다.');
      }
    });
  });
}
