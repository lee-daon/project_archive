/**
 * 쇼핑몰 수집 페이지 관련 함수
 */

// main.js에서 fetchWrapper 임포트
import { fetchWrapper } from '../main.js';

/**
 * 쇼핑몰 수집 페이지 렌더링 함수
 * @returns {string} 쇼핑몰 수집 페이지 HTML
 */
export function renderShopPage() {
  return `
    <div class="main-content">
      <div class="page-header">
        <h2><i class="fas fa-store"></i> 쇼핑몰 수집</h2>
        <p class="subtitle">상품 URL을 입력하여 해당 쇼핑몰의 다른 상품들을 수집하세요</p>
      </div>
      
      <div class="card">
        <div class="card-body">
          <div class="form-container">
            <div class="form-group">
              <label for="shop-url">쇼핑몰 상품 URL</label>
              <input type="url" id="shop-url" class="form-control" placeholder="https://item.taobao.com/item.htm?id=..." required>
              <small>타오바오 또는 알리익스프레스 상품 URL을 입력하세요</small>
            </div>
            
            <div class="form-group">
              <label for="item-count">수집 개수</label>
              <input type="number" id="item-count" class="form-control" min="1" max="200" value="20" required>
              <small>수집할 상품의 개수를 입력하세요 (최대 200개)</small>
            </div>
            
            <div class="form-group checkbox-group">
              <div class="custom-checkbox">
                <input type="checkbox" id="category-check" checked>
                <label for="category-check">동일 카테고리 상품만 수집</label>
                <div class="tooltip">
                  <i class="fas fa-question-circle"></i>
                  <span class="tooltip-text">입력한 상품과 동일한 카테고리의 상품만 수집합니다</span>
                </div>
              </div>
            </div>
            
            <div class="button-container">
              <button id="start-collection" class="primary-button">
                <i class="fas fa-cloud-download-alt"></i> 수집 시작
              </button>
              <button id="reset-form" class="secondary-button">
                <i class="fas fa-redo"></i> 초기화
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div id="status-container" class="status-container hidden">
        <div class="status-card">
          <div id="status-message" class="status-message">
            <div class="loading-spinner"></div>
            <span>상품 수집 중...</span>
          </div>
          <div id="status-progress" class="progress-bar-container hidden">
            <div class="progress-bar">
              <div class="progress-fill" style="width: 0%"></div>
            </div>
            <div class="progress-text">0%</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 경고 모달 -->
    <div id="warning-modal" class="warning-modal hidden">
      <div class="warning-modal-overlay"></div>
      <div class="warning-modal-container">
        <div class="warning-modal-header">
          <h3><i class="fas fa-exclamation-triangle"></i> 경고</h3>
          <button class="close-modal"><i class="fas fa-times"></i></button>
        </div>
        <div class="warning-modal-body">
          <p id="warning-message"></p>
        </div>
        <div class="warning-modal-footer">
          <button id="proceed-anyway" class="warning-button">계속 진행하기</button>
          <button id="cancel-collection" class="secondary-button">다른 상품 소싱하기</button>
        </div>
      </div>
    </div>

  `;
}

/**
 * 쇼핑몰 수집 페이지 이벤트 핸들러 설정
 */
export function setupShopHandlers() {
  const startButton = document.getElementById('start-collection');
  const resetButton = document.getElementById('reset-form');
  const statusContainer = document.getElementById('status-container');
  const statusMessage = document.getElementById('status-message');
  const shopUrlInput = document.getElementById('shop-url');
  const itemCountInput = document.getElementById('item-count');
  const warningModal = document.getElementById('warning-modal');
  const warningMessage = document.getElementById('warning-message');
  const proceedButton = document.getElementById('proceed-anyway');
  const cancelButton = document.getElementById('cancel-collection');
  const closeModal = document.querySelector('.close-modal');
  
  // 현재 소싱 중인 상점/판매자 정보를 저장할 변수
  let currentShopId = null;
  let currentSellerId = null;
  
  // 모달 닫기 버튼 이벤트
  if (closeModal) {
    closeModal.addEventListener('click', () => {
      warningModal.classList.add('hidden');
    });
  }
  
  // 계속 진행 버튼 이벤트
  if (proceedButton) {
    proceedButton.addEventListener('click', async () => {
      // 모달 닫기
      warningModal.classList.add('hidden');
      
      // 경고 무시 플래그를 true로 설정하여 수집 요청 재시도
      await startCollection(true);
    });
  }
  
  // 취소 버튼 이벤트
  if (cancelButton) {
    cancelButton.addEventListener('click', () => {
      // 모달 닫기
      warningModal.classList.add('hidden');
      
      // 상태 메시지 초기화
      statusContainer.classList.add('hidden');
      
      // 시작 버튼 활성화
      startButton.disabled = false;
      startButton.innerHTML = '<i class="fas fa-cloud-download-alt"></i> 수집 시작';
      
      showNotification('수집이 취소되었습니다.', 'info');
    });
  }
  
  // 리셋 버튼 이벤트 핸들러
  if (resetButton) {
    resetButton.addEventListener('click', () => {
      shopUrlInput.value = '';
      itemCountInput.value = '20';
      document.getElementById('category-check').checked = true;
      
      // 상태 메시지 숨기기
      statusContainer.classList.add('hidden');
      
      // 버튼 초기화
      startButton.disabled = false;
      startButton.innerHTML = '<i class="fas fa-cloud-download-alt"></i> 수집 시작';
    });
  }
  
  // 상품 수집 시작 함수
  async function startCollection(ignoreBan = false) {
    const shopUrl = shopUrlInput.value.trim();
    const itemCount = itemCountInput.value;
    const categoryCheck = document.getElementById('category-check').checked;
    
    // 입력값 검증
    if (!shopUrl) {
      showNotification('쇼핑몰 URL을 입력해주세요.', 'error');
      return;
    }
    
    // URL 유효성 검사
    if (!shopUrl.includes('item.taobao.com') && !shopUrl.includes('aliexpress.com') && !shopUrl.includes('tmall.com')) {
      showNotification('유효한 타오바오, 티몰 또는 알리익스프레스 상품 URL을 입력해주세요.', 'error');
      return;
    }
    
    if (!itemCount || itemCount < 1) {
      showNotification('유효한 수집 개수를 입력해주세요.', 'error');
      return;
    }
    
    // 버튼 비활성화 및 상태 메시지 업데이트
    startButton.disabled = true;
    startButton.innerHTML = '<div class="button-spinner"></div> 처리 중...';
    
    // 상태 컨테이너 표시
    statusContainer.classList.remove('hidden');
    statusMessage.innerHTML = '<div class="loading-spinner"></div><span>수집 요청 중...</span>';
    
    try {
      // fetchWrapper를 사용하여 수집 요청 보내기
      const data = await fetchWrapper('/src/getbyshop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: shopUrl,
          count: parseInt(itemCount),
          categoryCheck: categoryCheck,
          ignoreBan: ignoreBan
        })
      });
      
      // fetchWrapper가 null을 반환하면 리다이렉션된 것이므로 함수 종료
      if (!data) {
        return;
      }
      
      // 경고가 있는 경우 모달 표시
      if (data.warning) {
        // 판매자/상점 정보 저장
        currentShopId = data.shopId;
        currentSellerId = data.sellerId;
        
        if (data.warning.banned) {
          // 금지된 판매자/상점인 경우
          warningMessage.textContent = data.warning.message;
          warningModal.classList.remove('hidden');
          
          // 계속 진행 버튼 숨기기 (금지된 경우 계속 진행 불가)
          proceedButton.style.display = 'none';
        } else if (data.needsConfirmation) {
          // 경고만 있는 경우 (계속 진행 가능)
          warningMessage.textContent = data.warning.message;
          warningModal.classList.remove('hidden');
          
          // 계속 진행 버튼 표시
          proceedButton.style.display = 'inline-block';
        }
        
        // 상태 컨테이너 재설정
        statusContainer.classList.add('hidden');
        startButton.disabled = false;
        startButton.innerHTML = '<i class="fas fa-cloud-download-alt"></i> 수집 시작';
        return;
      }
      
      if (data.success) {
        statusMessage.innerHTML = '<i class="fas fa-check-circle success-icon"></i><span>수집이 성공적으로 완료되었습니다.</span>';
        showNotification('상품 수집이 완료되었습니다!', 'success');
        
        // 지정된 시간 후 리다이렉션 처리
        if (data.redirectUrl) {
          setTimeout(() => {
            window.location.href = data.redirectUrl;
          }, 1500);
        }
      } else {
        statusMessage.innerHTML = '<i class="fas fa-exclamation-circle error-icon"></i><span>' + (data.message || '알 수 없는 오류가 발생했습니다.') + '</span>';
        showNotification(data.message || '상품 수집 중 오류가 발생했습니다.', 'error');
        
        // 오류 발생 시 버튼 다시 활성화
        startButton.disabled = false;
        startButton.innerHTML = '<i class="fas fa-cloud-download-alt"></i> 수집 시작';
      }
    } catch (error) {
      console.error('수집 요청 중 오류 발생:', error);
      statusMessage.innerHTML = '<i class="fas fa-exclamation-triangle error-icon"></i><span>서버 연결 오류가 발생했습니다.</span>';
      showNotification('서버 연결 오류가 발생했습니다.', 'error');
      
      // 오류 발생 시 버튼 다시 활성화
      startButton.disabled = false;
      startButton.innerHTML = '<i class="fas fa-cloud-download-alt"></i> 수집 시작';
    }
  }
  
  if (startButton) {
    startButton.addEventListener('click', () => startCollection(false));
  }
}

/**
 * 알림 메시지 표시 함수
 * @param {string} message - 표시할 메시지
 * @param {string} type - 알림 유형 (success, error, warning, info)
 */
function showNotification(message, type = 'info') {
  // 이미 있는 알림 컨테이너 찾기 또는 새로 생성
  let notificationContainer = document.querySelector('.notification-container');
  
  if (!notificationContainer) {
    notificationContainer = document.createElement('div');
    notificationContainer.className = 'notification-container';
    document.body.appendChild(notificationContainer);
  }
  
  // 새 알림 요소 생성
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  
  // 알림 아이콘 설정
  let icon = '';
  switch (type) {
    case 'success':
      icon = '<i class="fas fa-check-circle"></i>';
      break;
    case 'error':
      icon = '<i class="fas fa-exclamation-circle"></i>';
      break;
    case 'warning':
      icon = '<i class="fas fa-exclamation-triangle"></i>';
      break;
    default:
      icon = '<i class="fas fa-info-circle"></i>';
  }
  
  // 알림 내용 설정
  notification.innerHTML = `
    ${icon}
    <span>${message}</span>
    <button class="close-notification"><i class="fas fa-times"></i></button>
  `;
  
  // 알림 컨테이너에 추가
  notificationContainer.appendChild(notification);
  
  // 닫기 버튼 이벤트 리스너
  const closeButton = notification.querySelector('.close-notification');
  closeButton.addEventListener('click', () => {
    notification.classList.add('hide');
    setTimeout(() => {
      notification.remove();
    }, 300);
  });
  
  // 일정 시간 후 자동으로 사라지도록 설정
  setTimeout(() => {
    notification.classList.add('hide');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 5000);
}
