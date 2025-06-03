// main.js에서 state와 fetchStats 가져오기
import { state } from '../main.js';

/**
 * 가공 페이지의 HTML을 렌더링하는 함수
 * @returns {string} 가공 페이지의 HTML 문자열
 */
export function renderProcessingPage() {
  return `
    <div class="main-content">
      <h2 class="page-title">가공 설정 및 진행</h2>
      
      <div class="processing-stats">
        <div class="stat-box">
          <h3>가공 대상</h3>
          <p class="stat-number" id="processingTarget">0</p>
        </div>
        <div class="stat-box">
          <h3>가공 완료</h3>
          <p class="stat-number" id="processingCompleted">0</p>
        </div>
        <div class="stat-box">
          <h3>밴 상품</h3>
          <p class="stat-number" id="processingBanned">0</p>
        </div>
      </div>

      <div class="processing-options">
        <div class="options-section">
          <h3 class="section-title">가공 대상 선택</h3>
          
          <div class="option-item">
            <input type="radio" id="processAll" name="processTarget" value="all" checked>
            <label for="processAll">전체 진행</label>
          </div>
          
          <div class="option-item">
            <input type="radio" id="processRecent" name="processTarget" value="recent">
            <label for="processRecent">최신순 진행</label>
            <div class="sub-option" id="recentOptions" style="display: none;">
              <input type="number" id="recentCount" min="1" value="10" class="number-input">
              <label for="recentCount">개 진행</label>
              <div class="order-selection">
                <input type="radio" id="orderDesc" name="order" value="desc" checked>
                <label for="orderDesc">최신순</label>
                <input type="radio" id="orderAsc" name="order" value="asc">
                <label for="orderAsc">과거순</label>
              </div>
            </div>
          </div>
          
          <div class="option-item">
            <input type="radio" id="processTestCode" name="processTarget" value="testcode">
            <label for="processTestCode">테스트코드 진행</label>
            <div class="sub-option" id="testCodeOptions" style="display: none;">
              <input type="number" id="testCodeValue" min="1" value="1" class="number-input">
              <label for="testCodeValue">테스트코드</label>
            </div>
          </div>
        </div>

        <div class="options-section">
          <h3 class="section-title">가공 옵션 설정</h3>
          
          <div class="option-item">
            <input type="checkbox" id="toggleBrand" checked>
            <label for="toggleBrand">브랜드 필터링</label>
          </div>
          
          <div class="option-item">
            <input type="checkbox" id="toggleProductOption" checked>
            <label for="toggleProductOption">상품 옵션 번역(V2)(AI)</label>
          </div>
          
          <div class="option-item">
            <input type="checkbox" id="toggleProductAttribute" checked>
            <label for="toggleProductAttribute">상품 속성 번역 (AI)</label>
          </div>
          
          <div class="option-item">
            <input type="checkbox" id="toggleProductImage" checked>
            <label for="toggleProductImage">상품 이미지 번역 </label>
          </div>
          
          <div class="option-item">
            <input type="checkbox" id="toggleOptionImage" checked>
            <label for="toggleOptionImage">옵션 이미지 번역</label>
          </div>
          
          <div class="product-name-translation">
            <p class="option-group-label">상품명 번역 (AI)</p>
            <div class="option-item">
              <input type="radio" id="productNameTranslation" name="productNameOption" value="nameOnly" checked>
              <label for="productNameTranslation">상품명 번역</label>
            </div>
            <div class="option-item">
              <input type="radio" id="productNameWithKeyword" name="productNameOption" value="withKeyword">
              <label for="productNameWithKeyword">키워드 포함 번역</label>
              <div class="sub-option keyword-input-container" id="keywordInputContainer" style="display: none;">
                <input type="text" id="customKeyword" placeholder="키워드 입력 (쉼표로 구분)" class="keyword-input">
              </div>
            </div>
            <div class="option-item">
              <input type="radio" id="productNameNoTranslation" name="productNameOption" value="none">
              <label for="productNameNoTranslation">미번역</label>
            </div>
          </div>
          
          <div class="option-item">
            <input type="checkbox" id="toggleKeyword" checked>
            <label for="toggleKeyword">키워드 생성 (AI)</label>
          </div>
          
          <div class="option-item">
            <input type="checkbox" id="toggleNukkiThumbnail" checked>
            <label for="toggleNukkiThumbnail">누끼 썸네일 생성 (AI)</label>
          </div>
          
          <div class="option-item thumb-number-setting">
            <label for="thumbNumber">썸네일 이미지 선택 (n번째 상품)</label>
            <div class="range-container">
              <input type="range" id="thumbNumber" min="1" max="5" value="1" class="range-slider">
              <span id="thumbNumberValue">1</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="processing-actions">
        <button id="startProcessing" class="btn primary-btn">가공 시작</button>
        <button id="resetProcessing" class="btn secondary-btn">설정 초기화</button>
      </div>
    </div>
    <style>
      .main-content {
        max-width: 900px;
        margin: 0 auto;
        padding: 20px;
      }
      
      .page-title {
        margin-bottom: 25px;
        font-size: 24px;
        color: #333;
        border-bottom: 2px solid #eee;
        padding-bottom: 10px;
      }
      
      .section-title {
        font-size: 18px;
        margin-bottom: 15px;
        color: #444;
        border-left: 3px solid #3498db;
        padding-left: 10px;
      }
      
      .processing-stats {
        display: flex;
        justify-content: space-between;
        margin-bottom: 30px;
        background: #f9f9f9;
        border-radius: 8px;
        padding: 15px;
      }
      
      .stat-box {
        flex: 1;
        text-align: center;
        padding: 15px;
        border-radius: 6px;
        background: white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        margin: 0 8px;
      }
      
      .stat-box h3 {
        font-size: 16px;
        margin-bottom: 10px;
        color: #555;
      }
      
      .stat-number {
        font-size: 24px;
        font-weight: bold;
        color: #3498db;
      }
      
      .processing-options {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
        margin-bottom: 30px;
      }
      
      .options-section {
        flex: 1;
        min-width: 300px;
        background: white;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.05);
      }
      
      .option-item {
        margin-bottom: 12px;
        display: flex;
        align-items: center;
      }
      
      .option-item input[type="checkbox"],
      .option-item input[type="radio"] {
        margin-right: 8px;
        width: 18px;
        height: 18px;
        cursor: pointer;
      }
      
      .option-item label {
        font-size: 14px;
        color: #333;
        cursor: pointer;
      }
      
      .sub-option {
        margin-left: 25px;
        padding: 10px;
        background: #f5f5f5;
        border-radius: 6px;
        margin-top: 5px;
      }
      
      .number-input {
        width: 60px;
        padding: 5px;
        border: 1px solid #ddd;
        border-radius: 4px;
      }
      
      .order-selection {
        margin-top: 8px;
      }
      
      .option-group-label {
        font-weight: bold;
        margin-bottom: 8px;
        color: #333;
        border-bottom: 1px solid #eee;
        padding-bottom: 5px;
      }
      
      .product-name-translation {
        background: #f5f5f5;
        padding: 12px;
        border-radius: 6px;
        margin-bottom: 15px;
      }
      
      .range-container {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      
      .range-slider {
        flex: 1;
      }
      
      .processing-actions {
        display: flex;
        gap: 10px;
        margin-bottom: 30px;
      }
      
      .btn {
        padding: 10px 20px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
        transition: background 0.3s;
      }
      
      .primary-btn {
        background: #3498db;
        color: white;
      }
      
      .primary-btn:hover {
        background: #2980b9;
      }
      
      .secondary-btn {
        background: #f1f1f1;
        color: #333;
      }
      
      .secondary-btn:hover {
        background: #e1e1e1;
      }
      
      .keyword-input-container {
        margin-top: 5px;
        margin-left: 26px;
      }
      
      .keyword-input {
        width: 100%;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
      }
      
      .processing-spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255,255,255,0.3);
        border-radius: 50%;
        border-top-color: #fff;
        animation: spin 1s linear infinite;
        margin-right: 8px;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      .btn.processing {
        background-color: #7f8c8d;
        cursor: not-allowed;
      }
    </style>
  `;
}

/**
 * 가공 페이지의 이벤트 핸들러들을 설정하는 함수
 * - 라디오 버튼 이벤트
 * - 썸네일 번호 슬라이더 이벤트
 * - 가공 시작/초기화 버튼 이벤트
 */
export function setupProcessingHandlers() {
  // 라디오 버튼에 따른 서브 옵션 표시/숨김 처리
  document.getElementById('processRecent').addEventListener('change', function() {
    document.getElementById('recentOptions').style.display = this.checked ? 'block' : 'none';
    document.getElementById('testCodeOptions').style.display = 'none';
  });
  
  document.getElementById('processTestCode').addEventListener('change', function() {
    document.getElementById('testCodeOptions').style.display = this.checked ? 'block' : 'none';
    document.getElementById('recentOptions').style.display = 'none';
  });
  
  document.getElementById('processAll').addEventListener('change', function() {
    document.getElementById('recentOptions').style.display = 'none';
    document.getElementById('testCodeOptions').style.display = 'none';
  });
  
  // 썸네일 번호 슬라이더 이벤트 리스너
  const thumbSlider = document.getElementById('thumbNumber');
  const thumbValue = document.getElementById('thumbNumberValue');
  
  thumbSlider.addEventListener('input', () => {
    thumbValue.textContent = thumbSlider.value;
  });
  
  // 상품명 번역 라디오 버튼 이벤트 리스너
  document.getElementById('productNameWithKeyword').addEventListener('change', function() {
    document.getElementById('keywordInputContainer').style.display = this.checked ? 'block' : 'none';
  });
  
  document.getElementById('productNameTranslation').addEventListener('change', function() {
    document.getElementById('keywordInputContainer').style.display = 'none';
  });
  
  document.getElementById('productNameNoTranslation').addEventListener('change', function() {
    document.getElementById('keywordInputContainer').style.display = 'none';
  });
  
  // 가공 시작 버튼 클릭 이벤트
  document.getElementById('startProcessing').addEventListener('click', startProcessing);
  
  // 설정 초기화 버튼 클릭 이벤트
  document.getElementById('resetProcessing').addEventListener('click', resetProcessingOptions);
}

/**
 * 가공 통계 데이터를 서버에서 가져와 화면에 표시하는 함수
 * @async
 * @returns {Promise<void>}
 */
export async function fetchProcessingStats() {
  try {
    // getstatus.js에 매핑된 경로 사용
    const response = await fetch('/prc/getstatus/stats');
    const data = await response.json();
    
    document.getElementById('processingTarget').textContent = data.target || 0;
    document.getElementById('processingCompleted').textContent = data.completed || 0;
    document.getElementById('processingBanned').textContent = data.banned || 0;
  } catch (error) {
    console.error('가공 통계 정보를 가져오는 중 오류 발생:', error);
  }
}

/**
 * 가공 처리를 시작하는 함수
 * @async
 * @returns {Promise<void>}
 * @throws {Error} 가공 시작 중 오류 발생 시
 */
async function startProcessing() {
  // 버튼 비활성화 및 진행중 표시
  const startButton = document.getElementById('startProcessing');
  startButton.disabled = true;
  startButton.innerHTML = '<span class="processing-spinner"></span> 가공 진행 중...';
  startButton.classList.add('processing');
  
  // 가공 대상 선택 옵션
  let targetOption;
  if (document.getElementById('processAll').checked) {
    targetOption = { type: 'all' };
  } else if (document.getElementById('processRecent').checked) {
    targetOption = { 
      type: 'recent',
      count: parseInt(document.getElementById('recentCount').value),
      order: document.querySelector('input[name="order"]:checked').value
    };
  } else if (document.getElementById('processTestCode').checked) {
    targetOption = { 
      type: 'testcode',
      code: parseInt(document.getElementById('testCodeValue').value)
    };
  }

  // 상품명 번역 옵션 값 가져오기
  const productNameOption = document.querySelector('input[name="productNameOption"]:checked').value;
  
  // 사용자 지정 키워드 가져오기
  let customKeywords = [];
  if (productNameOption === 'withKeyword') {
    const keywordInput = document.getElementById('customKeyword').value.trim();
    if (keywordInput) {
      customKeywords = keywordInput.split(',').map(keyword => keyword.trim()).filter(keyword => keyword.length > 0);
    }
  }

  // 가공 옵션 설정
  const processingOptions = {
    brandFiltering: document.getElementById('toggleBrand').checked,
    productOptionTranslation: document.getElementById('toggleProductOption').checked,
    productAttributeTranslation: document.getElementById('toggleProductAttribute').checked,
    productImageTranslation: document.getElementById('toggleProductImage').checked,
    optionImageTranslation: document.getElementById('toggleOptionImage').checked,
    productNameTranslation: productNameOption !== 'none', // nameOnly 또는 withKeyword일 때 true
    includeKeywordInNameTranslation: productNameOption === 'withKeyword',
    customKeywords: customKeywords.length > 0 ? customKeywords : [],
    keywordGeneration: document.getElementById('toggleKeyword').checked,
    nukki_thumbnail: document.getElementById('toggleNukkiThumbnail').checked,
    thumb_number: parseInt(document.getElementById('thumbNumber').value) - 1
  };

  const payload = {
    target: targetOption,
    options: processingOptions
  };

  try {
    // 가공 시작 API 호출 - getstatus.js에 매핑된 경로 사용
    const response = await fetch('/prc/processing_start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    
    if (result.success) {
      // API 응답에 redirectTo 필드가 있으면 메뉴 전환
      if (result.redirectTo === 'brandban') {
        // 메뉴 전환
        const menuItems = document.querySelectorAll('.sidebar-menu li');
        menuItems.forEach(i => i.classList.remove('active'));
        
        // brandban 메뉴 활성화
        const brandbanMenu = document.querySelector('.sidebar-menu li[data-menu="brandban"]');
        if (brandbanMenu) {
          brandbanMenu.classList.add('active');
          state.activeMenu = 'brandban';
          const contentContainer = document.getElementById('content');
          const brandbanContent = import('./brandbanPage.js').then(module => {
            contentContainer.innerHTML = module.renderBrandbanPage();
            setTimeout(() => module.setupBrandbanHandlers(), 100);
            setTimeout(() => module.fetchBrandbanData(), 100);
          });
          return;
        }
      }
      
      // 진행 시작 알림
      alert('가공이 시작되었습니다.');
      
      // 가공 상태 주기적으로 확인
      checkProcessingStatus();
    } else {
      alert('가공 시작 실패: ' + result.message);
      // 실패 시 버튼 원상복구
      resetStartButton();
    }
  } catch (error) {
    console.error('가공 시작 중 오류 발생:', error);
    alert('가공 시작 중 오류가 발생했습니다.');
    // 오류 시 버튼 원상복구
    resetStartButton();
  }
}

/**
 * 가공 버튼을 원래 상태로 복구하는 함수
 * @private
 * @returns {void}
 */
function resetStartButton() {
  const startButton = document.getElementById('startProcessing');
  startButton.disabled = false;
  startButton.innerHTML = '가공 시작';
  startButton.classList.remove('processing');
}

/**
 * 가공 상태를 주기적으로 확인하는 함수
 * @private
 * @returns {void}
 */
async function checkProcessingStatus() {
  try {
    const response = await fetch('/prc/processing_status');
    const data = await response.json();
    
    if (data.isProcessing) {
      // 진행 중인 경우 5초 후 다시 확인
      setTimeout(checkProcessingStatus, 5000);
    } else {
      // 가공 완료 시 버튼 원상복구
      resetStartButton();
      // 통계 업데이트
      fetchProcessingStats();
      
      // 완료 메시지
      if(data.message) {
        alert(data.message);
      } else {
        alert('가공이 완료되었습니다.');
      }
    }
  } catch (error) {
    console.error('가공 상태 확인 중 오류 발생:', error);
    // 오류 발생 시 버튼 원상복구
    resetStartButton();
  }
}

/**
 * 가공 옵션을 초기 상태로 리셋하는 함수
 * @private
 * @returns {void}
 */
function resetProcessingOptions() {
  // 라디오 버튼 초기화
  document.getElementById('processAll').checked = true;
  document.getElementById('recentOptions').style.display = 'none';
  document.getElementById('testCodeOptions').style.display = 'none';
  
  // 숫자 입력 초기화
  document.getElementById('recentCount').value = 10;
  document.getElementById('testCodeValue').value = 1;
  document.getElementById('orderDesc').checked = false;
  
  // 체크박스 초기화
  document.getElementById('toggleBrand').checked = true;
  document.getElementById('toggleProductOption').checked = false;
  document.getElementById('toggleProductAttribute').checked = false;
  document.getElementById('toggleProductImage').checked = false;
  document.getElementById('toggleOptionImage').checked = false;
  
  // 상품명 번역 라디오 버튼 초기화
  document.getElementById('productNameTranslation').checked = true;
  document.getElementById('keywordInputContainer').style.display = 'none';
  document.getElementById('customKeyword').value = '';
  
  document.getElementById('toggleKeyword').checked = false;
  document.getElementById('toggleNukkiThumbnail').checked = false;
  
  // 슬라이더 초기화
  document.getElementById('thumbNumber').value = 1;
  document.getElementById('thumbNumberValue').textContent = 1;
} 