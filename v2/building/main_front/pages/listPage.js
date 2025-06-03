/**
 * @file listPage.js
 * @description 상품 목록 페이지 렌더링 및 이벤트, 데이터 로드 등을 처리하는 스크립트.
 */
// fetchWrapper 함수 임포트
import { fetchWrapper } from '../main.js';

/**
 * 상품 목록 페이지의 HTML 구조를 생성합니다.
 * @function renderListPage
 * @returns {string} 상품 목록 페이지의 HTML 문자열
 */
export function renderListPage() {
  return `
    <div style="display: flex; padding: 20px;">
      <!-- 왼쪽 영역: 상품 목록 -->
      <div class="left-container">
        <h2>상품 목록</h2>
        <table id="productTable">
          <thead>
            <tr>
              <th>ID</th>
              <th>이미지</th>
              <th>상품명</th>
              <th>가격</th>
              <th>판매량</th>
              <th>금지어</th>
              <th>금지상태</th>
              <th>URL</th>
            </tr>
          </thead>
          <tbody id="productTbody">
            <!-- JS로 동적 생성 -->
          </tbody>
        </table>
      </div>

      <!-- 오른쪽 영역: 통계 정보 및 버튼 -->
      <div class="right-container">
        <h2>통계 정보</h2>
        <div>
          <span class="stat-label">전체상품</span>
          <span id="totalCount">0</span>
        </div>
        <div>
          <span class="stat-label">중복상품</span>
          <span id="duplicationCount">0</span>
        </div>
        <div>
          <span class="stat-label">금지어포함</span>
          <span id="includeBanCount">0</span>
        </div>
        <div>
          <span class="stat-label">목표개수</span>
          <input type="text" id="targetCount" readonly />
        </div>
        
        <h3>작업 관리</h3>
        <!-- Start와 Restart 버튼을 옆에 배치하기 위한 그룹 -->
        <div class="button-group">
          <button id="startBtn">Start</button>
          <button id="restartBtn">Restart</button>
        </div>
      </div>
    </div>
  `;
}

/**
 * @typedef {Object} ProductItem
 * @property {string} productId - 상품 고유 ID
 * @property {string} productName - 상품명
 * @property {string} [banwords] - 상품에 포함된 금지어 (없을 경우 undefined)
 * @property {boolean} ban - 금지 상태 여부
 * @property {string} [url] - 상품 URL (없을 경우 undefined)
 */

/**
 * 금지 상태가 확인된 상품 목록
 * @type {Array<ProductItem>}
 */
let bancheckedTarget = [];
let finalTargetCount = 0;
let duplicationCount = 0;
let includeBanCount = 0;
let totalCount = 0;


/**
 * 상세페이지 크롤링 대상 목록
 * @type {Array<{productId: string, productName: string}>}
 */
let detailpageparsetarget = [];

let completedCount = 0;
let isProcessing = false;

/**
 * 리스트 핸들러 설정을 수행합니다.
 * 데이터 로드, UI 업데이트, 이벤트 리스너 설정 등을 처리합니다.
 * @async
 * @returns {Promise<void>}
 */
export async function setupListHandlers() {
  try {
    showLoading(true);
    
    // 서버에서 데이터 가져오기 - fetchWrapper 사용
    // fetchWrapper 함수가 정의되어 있지 않다면 이 모듈에서 임포트해야 함
    const data = await fetchWrapper('/src/listcheck');
    
    // data가 null이면 리다이렉션된 것이므로 함수 종료
    if (!data) return;

    // 전역 변수에 데이터 저장
    bancheckedTarget = data.bancheckedTarget || [];
    finalTargetCount = data.finalTargetCount || 0;
    duplicationCount = data.duplicationCount || 0;
    includeBanCount = data.includeBanCount || 0;
    totalCount = data.totalCount || 0;

    // UI 요소 초기화
    updateStatsDisplay();
    renderProductTable();
    setupEventListeners();
    
    showLoading(false);
  } catch (error) {
    console.error('데이터 로드 중 오류 발생:', error);
    showNotification('데이터 로드 중 오류가 발생했습니다.', 'error');
    showLoading(false);
  }
}

/**
 * 로딩 상태 표시를 업데이트 합니다.
 * @param {boolean} show 표시할지 여부
 */
function showLoading(show) {
  // 기존 로딩 요소가 있으면 제거
  const existingLoader = document.getElementById('loader');
  if (existingLoader) {
    existingLoader.remove();
  }
  
  if (show) {
    const loader = document.createElement('div');
    loader.id = 'loader';
    loader.innerHTML = '<div class="spinner"></div><p>로딩 중...</p>';
    document.body.appendChild(loader);
  }
}

/**
 * 알림 메시지를 페이지에 표시합니다.
 * @param {string} message 표시할 메시지
 * @param {string} [type='info'] 알림의 종류 (info, success, warning, error)
 */
function showNotification(message, type = 'info') {
  // 기존 알림이 있으면 제거
  const existingNotification = document.getElementById('notification');
  if (existingNotification) {
    existingNotification.remove();
  }
  
  const notification = document.createElement('div');
  notification.id = 'notification';
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // 3초 후 자동으로 사라짐
  setTimeout(() => {
    notification.classList.add('hide');
    setTimeout(() => notification.remove(), 500);
  }, 3000);
}

/**
 * 통계 정보를 DOM에 업데이트합니다.
 * @function updateStatsDisplay
 */
function updateStatsDisplay() {
  document.getElementById('totalCount').textContent = totalCount;
  document.getElementById('duplicationCount').textContent = duplicationCount;
  document.getElementById('includeBanCount').textContent = includeBanCount;
  document.getElementById('targetCount').value = finalTargetCount;
}

/**
 * 상품 테이블을 렌더링합니다. 데이터를 기반으로 테이블을 동적으로 생성합니다.
 * 체크박스를 통해 금지 상태를 변경할 수 있습니다.(eventListener 사용함)
 */
function renderProductTable() {
  const productTbody = document.getElementById('productTbody');
  productTbody.innerHTML = ''; // 기존 내용 초기화

  if (bancheckedTarget.length === 0) {
    const emptyRow = document.createElement('tr');
    const emptyCell = document.createElement('td');
    emptyCell.colSpan = 5;
    emptyCell.textContent = '데이터가 없습니다.';
    emptyCell.style.textAlign = 'center';
    emptyCell.style.padding = '30px 0';
    emptyRow.appendChild(emptyCell);
    productTbody.appendChild(emptyRow);
    return;
  }

  bancheckedTarget.forEach((item, index) => {
    const row = document.createElement('tr');

    // ID 셀
    const idCell = document.createElement('td');
    idCell.textContent = item.productId;
    row.appendChild(idCell);

    // 이미지 셀
    const imgCell = document.createElement('td');
    if (item.image_url) {
      const img = document.createElement('img');
      img.src = item.image_url;
      img.alt = item.productName;
      img.style.width = '50px';
      img.style.height = '50px';
      img.style.objectFit = 'contain';
      imgCell.appendChild(img);
    } else {
      imgCell.textContent = '이미지 없음';
    }
    row.appendChild(imgCell);

    // 상품명 셀
    const nameCell = document.createElement('td');
    nameCell.textContent = item.productName;
    row.appendChild(nameCell);

    // 가격 셀
    const priceCell = document.createElement('td');
    priceCell.textContent = item.price ? `¥${item.price}` : '-';
    row.appendChild(priceCell);

    // 판매량 셀
    const salesCell = document.createElement('td');
    salesCell.textContent = item.sales_count ? item.sales_count : '0';
    row.appendChild(salesCell);

    // 금지어 셀
    const banwordsCell = document.createElement('td');
    banwordsCell.textContent = item.banwords || '-';
    row.appendChild(banwordsCell);

    // 금지상태 셀 (체크박스)
    const banStatusCell = document.createElement('td');
    const banCheckbox = document.createElement('input');
    banCheckbox.type = 'checkbox';
    banCheckbox.checked = item.ban;
    banCheckbox.addEventListener('change', (e) => {
      bancheckedTarget[index].ban = e.target.checked;
      // 체크박스 상태 변경 시 행 스타일 업데이트!!
      updateRowStyle(row, e.target.checked);
    });
    banStatusCell.appendChild(banCheckbox);
    row.appendChild(banStatusCell);

    // URL 셀
    const urlCell = document.createElement('td');
    if (item.url) {
      const urlLink = document.createElement('a');
      urlLink.href = item.url;
      urlLink.textContent = '링크';
      urlLink.target = '_blank';
      urlCell.appendChild(urlLink);
    } else {
      urlCell.textContent = '-';
    }
    row.appendChild(urlCell);

    // 초기 행 스타일 설정!! 위의 updateRowStyle과 다른 역할임
    updateRowStyle(row, item.ban);
    
    productTbody.appendChild(row);
  });
}

/**
 * 테이블 행의 스타일을 업데이트합니다.
 * @param {HTMLElement} row 업데이트할 테이블 행
 * @param {boolean} isBanned 금지 상태 여부
 */
function updateRowStyle(row, isBanned) {
  if (isBanned) {
    row.classList.add('banned-item');
  } else {
    row.classList.remove('banned-item');
  }
}

/**
 * UI 요소에 이벤트 리스너를 설정합니다.
 */
function setupEventListeners() {
  // Start 버튼 클릭 이벤트
  document.getElementById('startBtn').addEventListener('click', handleStartButtonClick);
  
  // Restart 버튼 클릭 이벤트
  document.getElementById('restartBtn').addEventListener('click', handleRestartButtonClick);
}

/**
 * Start 버튼 클릭 시 처리하는 함수입니다.
 * @async
 */
async function handleStartButtonClick() {
  if (isProcessing) {
    showNotification('이미 처리 중입니다. 잠시만 기다려주세요.', 'warning');
    return;
  }
  
  try {
    isProcessing = true;
    showLoading(true);
    
    // 버튼 상태 업데이트
    const startBtn = document.getElementById('startBtn');
    startBtn.disabled = true;
    startBtn.textContent = '처리 중...';
        
    // 서버로 ban 상태 업데이트 요청 전송 - fetchWrapper 사용
    const updatedData = bancheckedTarget.map(item => ({
      productId: item.productId,
      ban: item.ban
    }));
    console.log("updateban실행됨")
    const result = await fetchWrapper('/src/updateban', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({updatedData})
    });
    
    // ban=false인 상품만 추려냄, 두번째 라우터인 /detailparselist로 전달할 데이터로도 사용됨됨
    const nonBannedItems = bancheckedTarget.filter(item => !item.ban)
    
    console.log('서버 응답:', result);
    
    if (result.message) {
      // 완료 상태 업데이트
      document.getElementById('targetCount').value = nonBannedItems.length;
      showNotification('업데이트가 성공적으로 완료되었습니다.', 'success');
    } else {
      showNotification('업데이트에 실패했습니다.', 'error');
    }
    
    // 상세페이지 api호출 대상 업데이트
    detailpageparsetarget = nonBannedItems.map(({ productId, productName }) => ({
      productId,
      productName,
    }));
    
    // 상세 페이지 파싱 요청 전송 - fetchWrapper 사용
    const detailResult = await fetchWrapper('/src/detailparselist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(detailpageparsetarget)
    });
    
    // detailResult가 null이면 리다이렉션된 것이므로 함수 종료
    if (!detailResult) {
      isProcessing = false;
      return;
    }
    console.log("여기 데이터 옮?")
    if (!detailResult.message) {
      console.error('상세 페이지 파싱 요청 실패');
      showNotification('상세 페이지 파싱 요청에 실패했습니다.', 'error');
    } else {
      console.log('상세 페이지 파싱 요청 성공');
    }
  } catch (error) {
    console.error('Start 버튼 처리 중 오류 발생:', error);
    showNotification('처리 중 오류가 발생했습니다.', 'error');
  } finally {
    resetButtonState();
    showLoading(false);
    isProcessing = false;
  }
}

/**
 * Start 버튼의 상태를 초기화합니다.
 */
function resetButtonState() {
  const startBtn = document.getElementById('startBtn');
  startBtn.disabled = false;
  startBtn.textContent = 'Start';
}

/**
 * Restart 버튼 클릭 시 처리하는 함수입니다.
 * 기존 데이터 로드와 페이지 재설정을 수행합니다.
 */
function handleRestartButtonClick() {
  if (isProcessing) {
    showNotification('이미 처리 중입니다. 잠시만 기다려주세요.', 'warning');
    return;
  }
  
  if (confirm('정말로 다시 시작하시겠습니까? 현재 상태가 초기화됩니다.')) {
    setupListHandlers();
    showNotification('페이지가 새로고침되었습니다.', 'info');
  }
} 