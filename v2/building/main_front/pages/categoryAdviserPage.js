/**
 * @fileoverview 카테고리 어드바이저 페이지
 * @module pages/categoryAdviserPage
 * @description 카테고리 검색 및 브라우징 기능 제공
 */

// 카테고리 어드바이저 페이지 스타일
export const categoryAdviserPageStyles = `
/* 카테고리 어드바이저 스타일 */
.category-adviser * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

.category-adviser {
    font-family: 'Noto Sans KR', sans-serif;
    color: #333;
    line-height: 1.5;
    background-color: #f5f6f7;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    padding: 20px;
    margin-bottom: 30px;
}

.category-adviser header {
    text-align: center;
    margin-bottom: 30px;
}

.category-adviser header h1 {
    font-size: 24px;
    color: #222;
    font-weight: 700;
}

.category-adviser .main-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
}

/* 검색 섹션 */
.category-adviser .search-section {
    grid-column: 1 / -1;
    background-color: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
}

.category-adviser .search-container {
    display: flex;
    margin-bottom: 15px;
}

.category-adviser #searchInput {
    flex: 1;
    padding: 12px 15px;
    border: 2px solid #03c75a;
    border-right: none;
    border-radius: 4px 0 0 4px;
    font-size: 14px;
    outline: none;
}

.category-adviser #searchButton {
    width: 50px;
    background-color: #03c75a;
    color: white;
    border: none;
    border-radius: 0 4px 4px 0;
    cursor: pointer;
    font-size: 16px;
}

.category-adviser #searchButton:hover {
    background-color: #02b34f;
}

.category-adviser .results {
    max-height: 400px;
    overflow-y: auto;
    border: 1px solid #e5e5e5;
    border-radius: 4px;
}

/* 카테고리 트리 탐색 */
.category-adviser .browse-section {
    background-color: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.category-adviser .browse-section h2 {
    font-size: 18px;
    margin-bottom: 15px;
    font-weight: 700;
    color: #222;
}

.category-adviser .breadcrumbs {
    display: flex;
    flex-wrap: wrap;
    padding: 10px;
    background-color: #f9f9f9;
    border-radius: 4px;
    margin-bottom: 15px;
}

.category-adviser .breadcrumb-item {
    color: #03c75a;
    cursor: pointer;
    margin-right: 10px;
    position: relative;
}

.category-adviser .breadcrumb-item:not(:last-child)::after {
    content: '>';
    color: #888;
    margin-left: 10px;
}

.category-adviser .breadcrumb-item.active {
    color: #333;
    font-weight: 500;
    cursor: default;
}

.category-adviser .category-list {
    border: 1px solid #e5e5e5;
    border-radius: 4px;
    max-height: 400px;
    overflow-y: auto;
}

.category-adviser .category-item {
    padding: 12px 15px;
    border-bottom: 1px solid #e5e5e5;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: background-color 0.1s;
}

.category-adviser .category-item:last-child {
    border-bottom: none;
}

.category-adviser .category-item:hover {
    background-color: #f5f5f5;
}

.category-adviser .category-name {
    flex: 1;
}

.category-adviser .category-id {
    color: #888;
    font-size: 13px;
    margin-left: 8px;
}

.category-adviser .category-final {
    font-size: 12px;
    background-color: #e7f4f0;
    color: #0c9963;
    padding: 2px 6px;
    border-radius: 4px;
    margin-left: 8px;
}

/* 상세 정보 섹션 */
.category-adviser .detail-section {
    background-color: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.category-adviser .detail-section h2 {
    font-size: 18px;
    margin-bottom: 15px;
    font-weight: 700;
    color: #222;
}

.category-adviser .category-detail {
    background-color: #f9f9f9;
    border-radius: 4px;
    padding: 15px;
    margin-bottom: 20px;
}

.category-adviser .category-detail p {
    margin-bottom: 8px;
}

.category-adviser .category-detail .label {
    font-weight: 500;
    margin-right: 5px;
    color: #666;
}

.category-adviser .category-detail .value {
    color: #333;
    word-break: break-all;
}

.category-adviser .copy-buttons {
    display: flex;
    gap: 10px;
}

.category-adviser .copy-btn {
    flex: 1;
    padding: 10px;
    background-color: #f0f0f0;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    transition: background-color 0.2s;
}

.category-adviser .copy-btn:hover {
    background-color: #e5e5e5;
}

.category-adviser .no-selection {
    color: #888;
    text-align: center;
    padding: 20px 0;
}

.category-adviser .no-results {
    color: #888;
    text-align: center;
    padding: 20px 0;
}

/* 토스트 메시지 */
.category-adviser .toast {
    position: fixed;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 12px 20px;
    border-radius: 4px;
    font-size: 14px;
    opacity: 0;
    transition: opacity 0.3s;
    z-index: 1000;
}

.category-adviser .toast.show {
    opacity: 1;
}

/* 반응형 */
@media (max-width: 768px) {
    .category-adviser .main-content {
        grid-template-columns: 1fr;
    }
    
    .category-adviser .copy-buttons {
        flex-direction: column;
    }
}
`;

/**
 * 카테고리 어드바이저 페이지 렌더링 함수
 * @function renderCategoryAdviserPage
 * @returns {string} 카테고리 어드바이저 페이지 HTML
 */
export function renderCategoryAdviserPage() {
  return `
    <div class="main-content">
      <div class="page-header">
        <h2>카테고리 어드바이저</h2>
        <p class="header-description">카테고리 검색 및 브라우징 도구</p>
      </div>
      
      <div class="category-adviser">
        <header>
          <h1>카테고리 어드바이저</h1>
        </header>
        
        <div class="main-content">
          <div class="search-section">
            <div class="search-container">
              <input type="text" id="searchInput" placeholder="카테고리 검색어 입력">
              <button id="searchButton"><i class="fas fa-search"></i></button>
            </div>
            <div id="searchResults" class="results"></div>
          </div>
          
          <div class="browse-section">
            <h2>카테고리 트리 탐색</h2>
            <div class="breadcrumbs" id="breadcrumbs">
              <span class="breadcrumb-item active" data-id="0">홈</span>
            </div>
            <div class="category-list" id="categoryList"></div>
          </div>
          
          <div class="detail-section" id="detailSection">
            <h2>선택된 카테고리 정보</h2>
            <div class="category-detail" id="categoryDetail">
              <p class="no-selection">카테고리를 선택해주세요.</p>
            </div>
            <div class="copy-buttons">
              <button id="copyName" class="copy-btn" disabled>카테고리명 복사</button>
              <button id="copyId" class="copy-btn" disabled>카테고리 ID 복사</button>
              <button id="copyPath" class="copy-btn" disabled>전체 경로 복사</button>
            </div>
          </div>
        </div>
        
        <div id="toast" class="toast">복사되었습니다!</div>
      </div>
    </div>
  `;
}

/**
 * 카테고리 어드바이저 초기화 및 이벤트 핸들러 설정
 * @function setupCategoryAdviserHandlers
 * @description 페이지 내 이벤트 리스너 및 상태 초기화
 */
export function setupCategoryAdviserHandlers() {
  // 카테고리 데이터 관리
  window.categoryAdviser = {
    categoryData: [],
    currentCategoryId: 0,
    navigationHistory: []
  };
  
  // DOM 요소
  const searchInput = document.getElementById('searchInput');
  const searchButton = document.getElementById('searchButton');
  const searchResults = document.getElementById('searchResults');
  const breadcrumbs = document.getElementById('breadcrumbs');
  const categoryList = document.getElementById('categoryList');
  const categoryDetail = document.getElementById('categoryDetail');
  const copyNameButton = document.getElementById('copyName');
  const copyIdButton = document.getElementById('copyId');
  const copyPathButton = document.getElementById('copyPath');
  const toast = document.getElementById('toast');
  
  // 이벤트 리스너 설정
  searchButton.addEventListener('click', () => {
    searchCategories(searchInput.value);
  });
  
  searchInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      searchCategories(searchInput.value);
    }
  });
  
  // 복사 버튼 이벤트
  copyNameButton.addEventListener('click', copyName);
  copyIdButton.addEventListener('click', copyId);
  copyPathButton.addEventListener('click', copyPath);
  
  // 초기 카테고리 데이터 로드
  fetchAllCategories();
  
  // API로부터 모든 카테고리 가져오기
  function fetchAllCategories() {
    fetch('/reg/categories')
      .then(response => {
        if (!response.ok) {
          throw new Error('서버에서 카테고리 데이터를 가져오는데 실패했습니다.');
        }
        return response.json();
      })
      .then(data => {
        window.categoryAdviser.categoryData = data;
        showMainCategories();
      })
      .catch(error => {
        console.error('카테고리 데이터를 불러오는 데 실패했습니다:', error);
        // 에러 발생 시 샘플 데이터 사용 또는 에러 메시지 표시
        categoryList.innerHTML = '<div class="no-results">카테고리 데이터 로딩 오류</div>';
      });
  }
  
  // 대분류 카테고리 표시
  function showMainCategories() {
    window.categoryAdviser.currentCategoryId = 0;
    window.categoryAdviser.navigationHistory = [];
    updateBreadcrumbs('홈');
    
    // API로부터 대분류 카테고리 가져오기
    fetch('/reg/categories/main')
      .then(response => {
        if (!response.ok) {
          throw new Error('서버에서 대분류 카테고리 데이터를 가져오는데 실패했습니다.');
        }
        return response.json();
      })
      .then(data => {
        renderCategoryList(data);
      })
      .catch(error => {
        console.error('대분류 카테고리 데이터를 불러오는 데 실패했습니다:', error);
        
        // 이미 로드된 카테고리 데이터에서 직접 필터링 (대비책)
        const mainCategories = window.categoryAdviser.categoryData.filter(item => !item.wholeCategoryName.includes('>'));
        renderCategoryList(mainCategories);
      });
    
    // 상세 정보 초기화
    categoryDetail.innerHTML = '<p class="no-selection">카테고리를 선택해주세요.</p>';
    copyNameButton.disabled = true;
    copyIdButton.disabled = true;
    copyPathButton.disabled = true;
  }
  
  // 하위 카테고리 표시
  function showSubCategories(parentId) {
    const parentCategory = window.categoryAdviser.categoryData.find(item => item.id === parentId);
    if (!parentCategory) {
      return;
    }
    
    // 현재 카테고리를 히스토리에 추가
    if (window.categoryAdviser.currentCategoryId !== 0) {
      const currentCategory = window.categoryAdviser.categoryData.find(item => item.id === window.categoryAdviser.currentCategoryId);
      if (currentCategory) {
        window.categoryAdviser.navigationHistory.push(currentCategory);
      }
    }
    
    // 현재 카테고리 ID 업데이트
    window.categoryAdviser.currentCategoryId = parentId;
    
    // 브레드크럼 업데이트
    updateBreadcrumbs(parentCategory.wholeCategoryName);
    
    // API로부터 하위 카테고리 가져오기
    fetchSubCategories(parentId);
    
    // 카테고리 상세 정보 표시
    showCategoryDetail(parentId);
  }
  
  // API로부터 하위 카테고리 가져오기
  function fetchSubCategories(parentId) {
    fetch(`/reg/categories/sub/${parentId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('서버에서 하위 카테고리 데이터를 가져오는데 실패했습니다.');
        }
        return response.json();
      })
      .then(data => {
        renderCategoryList(data);
      })
      .catch(error => {
        console.error('하위 카테고리 데이터를 불러오는 데 실패했습니다:', error);
        
        // 이미 로드된 카테고리 데이터에서 직접 필터링 (대비책)
        const parentCategory = window.categoryAdviser.categoryData.find(item => item.id === parentId);
        if (parentCategory) {
          const parentPath = parentCategory.wholeCategoryName;
          const subCategories = window.categoryAdviser.categoryData.filter(item => {
            const itemPath = item.wholeCategoryName;
            return itemPath.includes(parentPath + '>') && 
                   itemPath.split('>').length === parentPath.split('>').length + 1;
          });
          renderCategoryList(subCategories);
        } else {
          renderCategoryList([]);
        }
      });
  }
  
  // 카테고리 검색
  function searchCategories(keyword) {
    if (!keyword || keyword.trim() === '') {
      return;
    }
    
    // API로부터 검색 결과 가져오기
    fetch(`/reg/categories/search?keyword=${encodeURIComponent(keyword.trim())}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('서버에서 검색 결과를 가져오는데 실패했습니다.');
        }
        return response.json();
      })
      .then(data => {
        renderSearchResults(data);
      })
      .catch(error => {
        console.error('검색 결과를 불러오는 데 실패했습니다:', error);
        
        // 이미 로드된 카테고리 데이터에서 직접 검색 (대비책)
        const searchKeyword = keyword.trim().toLowerCase();
        const results = window.categoryAdviser.categoryData.filter(item => 
          item.name.toLowerCase().includes(searchKeyword) || 
          item.wholeCategoryName.toLowerCase().includes(searchKeyword)
        );
        renderSearchResults(results);
      });
  }
  
  // 검색 결과 렌더링
  function renderSearchResults(results) {
    searchResults.innerHTML = '';
    
    if (results.length === 0) {
      searchResults.innerHTML = '<div class="no-results">검색 결과가 없습니다.</div>';
      return;
    }
    
    results.forEach(category => {
      const resultItem = document.createElement('div');
      resultItem.className = 'category-item';
      resultItem.dataset.id = category.id;
      
      resultItem.innerHTML = `
        <div class="category-name">${category.name}</div>
        <div class="category-id">${category.id}</div>
        ${category.last ? '<span class="category-final">최종</span>' : ''}
      `;
      
      resultItem.addEventListener('click', function() {
        // 검색 결과에서 카테고리 선택 시 해당 카테고리 브라우징으로 이동
        navigateToCategory(category);
      });
      
      searchResults.appendChild(resultItem);
    });
  }
  
  // 특정 카테고리로 이동 (검색 결과에서 선택 시)
  function navigateToCategory(category) {
    // 카테고리 경로 분석
    const pathParts = category.wholeCategoryName.split('>');
    
    // 첫 번째 경로(대분류)부터 시작
    window.categoryAdviser.navigationHistory = [];
    window.categoryAdviser.currentCategoryId = 0;
    
    // 최종 대상 경로까지 이동
    let currentPath = '';
    
    // 마지막 카테고리(대상 카테고리)까지의 모든 상위 카테고리 찾기
    for (let i = 0; i < pathParts.length - 1; i++) {
      currentPath = currentPath ? `${currentPath}>${pathParts[i].trim()}` : pathParts[i].trim();
      const parentCategory = window.categoryAdviser.categoryData.find(item => item.wholeCategoryName === currentPath);
      
      if (parentCategory) {
        window.categoryAdviser.navigationHistory.push(parentCategory);
      }
    }
    
    // 최종 카테고리로 이동
    showSubCategories(category.id);
  }
  
  // 카테고리 상세 정보 표시
  function showCategoryDetail(categoryId) {
    // API로부터 카테고리 상세 정보 가져오기
    fetch(`/reg/categories/${categoryId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('서버에서 카테고리 상세 정보를 가져오는데 실패했습니다.');
        }
        return response.json();
      })
      .then(category => {
        displayCategoryDetail(category);
      })
      .catch(error => {
        console.error('카테고리 상세 정보를 불러오는 데 실패했습니다:', error);
        
        // 이미 로드된 카테고리 데이터에서 직접 찾기 (대비책)
        const category = window.categoryAdviser.categoryData.find(item => item.id === categoryId);
        if (category) {
          displayCategoryDetail(category);
        }
      });
  }
  
  // 카테고리 상세 정보 출력
  function displayCategoryDetail(category) {
    if (!category) {
      return;
    }
    
    categoryDetail.innerHTML = `
      <p><span class="label">ID:</span> <span class="value">${category.id}</span></p>
      <p><span class="label">이름:</span> <span class="value">${category.name}</span></p>
      <p><span class="label">전체 경로:</span> <span class="value">${category.wholeCategoryName}</span></p>
      <p><span class="label">최종 카테고리:</span> <span class="value">${category.last ? '예' : '아니오'}</span></p>
    `;
    
    // 복사 버튼 활성화
    copyNameButton.disabled = false;
    copyIdButton.disabled = false;
    copyPathButton.disabled = false;
  }
  
  // 카테고리 목록 렌더링
  function renderCategoryList(categories) {
    categoryList.innerHTML = '';
    
    if (categories.length === 0) {
      categoryList.innerHTML = '<div class="no-results">하위 카테고리가 없습니다.</div>';
      return;
    }
    
    categories.forEach(category => {
      const categoryItem = document.createElement('div');
      categoryItem.className = 'category-item';
      categoryItem.dataset.id = category.id;
      
      categoryItem.innerHTML = `
        <div class="category-name">${category.name}</div>
        <div class="category-id">${category.id}</div>
        ${category.last ? '<span class="category-final">최종</span>' : ''}
      `;
      
      categoryItem.addEventListener('click', function() {
        showSubCategories(category.id);
      });
      
      categoryList.appendChild(categoryItem);
    });
  }
  
  // 브레드크럼 업데이트
  function updateBreadcrumbs(path) {
    breadcrumbs.innerHTML = '';
    
    // 홈 링크 추가
    const homeLink = document.createElement('span');
    homeLink.className = 'breadcrumb-item';
    homeLink.textContent = '홈';
    homeLink.dataset.id = '0';
    homeLink.addEventListener('click', function() {
      showMainCategories();
    });
    
    breadcrumbs.appendChild(homeLink);
    
    if (path === '홈') {
      homeLink.classList.add('active');
      return;
    }
    
    // 경로 파싱 및 링크 생성
    const pathParts = path.split('>');
    let currentPath = '';
    
    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i].trim();
      currentPath = currentPath ? `${currentPath}>${part}` : part;
      
      const breadcrumb = document.createElement('span');
      breadcrumb.className = 'breadcrumb-item';
      breadcrumb.textContent = part;
      
      // 현재 경로의 카테고리 찾기
      const category = window.categoryAdviser.categoryData.find(item => item.wholeCategoryName === currentPath);
      
      if (category) {
        breadcrumb.dataset.id = category.id;
        
        // 마지막 항목이 아닌 경우 클릭 이벤트 추가
        if (i < pathParts.length - 1) {
          breadcrumb.addEventListener('click', function() {
            // 히스토리 조정
            while (window.categoryAdviser.navigationHistory.length > 0 && 
                   window.categoryAdviser.navigationHistory[window.categoryAdviser.navigationHistory.length - 1].wholeCategoryName !== currentPath) {
              window.categoryAdviser.navigationHistory.pop();
            }
            
            showSubCategories(category.id);
          });
        } else {
          breadcrumb.classList.add('active');
        }
      }
      
      breadcrumbs.appendChild(breadcrumb);
    }
  }
  
  // 카테고리명 복사
  function copyName() {
    const category = window.categoryAdviser.categoryData.find(item => item.id === window.categoryAdviser.currentCategoryId);
    if (category) {
      copyToClipboard(category.name);
    }
  }
  
  // 카테고리 ID 복사
  function copyId() {
    const category = window.categoryAdviser.categoryData.find(item => item.id === window.categoryAdviser.currentCategoryId);
    if (category) {
      copyToClipboard(category.id);
    }
  }
  
  // 카테고리 경로 복사
  function copyPath() {
    const category = window.categoryAdviser.categoryData.find(item => item.id === window.categoryAdviser.currentCategoryId);
    if (category) {
      copyToClipboard(category.wholeCategoryName);
    }
  }
  
  // 클립보드에 복사
  function copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    
    // 토스트 메시지 표시
    showToast();
  }
  
  // 토스트 메시지 표시
  function showToast() {
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2000);
  }
} 