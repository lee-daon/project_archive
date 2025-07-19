

// 필요한 CONFIG 상수 직접 정의
const CONFIG = {
  messaging: {
    actions: {
      startScraping: 'startScraping',
      stopScraping: 'stopScraping',
      getProgress: 'getProgress',
      progressUpdate: 'progressUpdate',
      scrapingSuccess: 'scrapingSuccess',
      scrapingError: 'scrapingError'
    }
  }
};

// DOM 요소
const inputSection = document.getElementById('input-section');
const progressSection = document.getElementById('progress-section');
const errorSection = document.getElementById('error-section');
const successSection = document.getElementById('success-section');

const targetCountInput = document.getElementById('target-count');
const startButton = document.getElementById('start-button');
const stopButton = document.getElementById('stop-button');
const retryButton = document.getElementById('retry-button');

const statusText = document.getElementById('status-text');
const progressFill = document.getElementById('progress-fill');
const progressCount = document.getElementById('progress-count');
const errorMessage = document.getElementById('error-message');
const successMessage = document.getElementById('success-message');

// 초기화
document.addEventListener('DOMContentLoaded', () => {
  // 팝업 초기화
  initializePopup();
  
  // 이벤트 리스너 등록
  startButton.addEventListener('click', handleStartClick);
  stopButton.addEventListener('click', handleStopClick);
  retryButton.addEventListener('click', handleRetryClick);
  
  // 입력 필드 유효성 검사
  targetCountInput.addEventListener('input', validateInput);
});

/**
 * 입력 유효성 검사
 */
function validateInput() {
  const value = targetCountInput.value.trim();
  
  if (!value || isNaN(value) || parseInt(value) < 1) {
    startButton.disabled = true;
  } else {
    startButton.disabled = false;
  }
}

/**
 * 팝업 초기화
 */
async function initializePopup() {
  try {
    // 현재 진행 상태 가져오기
    const status = await chrome.runtime.sendMessage({ action: CONFIG.messaging.actions.getProgress });
    
    if (status && status.isRunning) {
      // 진행 중인 작업이 있는 경우
      showProgressUI(status);
    } else {
      // 대기 상태인 경우
      showInputUI();
    }
  } catch (error) {
    // 오류 발생 시 입력 UI 표시
    showInputUI();
  }
}

/**
 * 시작 버튼 클릭 처리
 */
async function handleStartClick() {
  try {
    // 입력값 가져오기
    const targetCount = parseInt(targetCountInput.value.trim());
    const targetType = document.querySelector('input[name="target-type"]:checked').value;
    
    if (!targetCount || targetCount < 1) {
      showError('유효한 목표 수를 입력해주세요.');
      return;
    }
    
    // 시작 UI 표시
    showProgressUI({
      isRunning: true,
      targetCount,
      targetType,
      currentProgress: 0
    });
    
    // 백그라운드에 시작 요청
    const response = await chrome.runtime.sendMessage({
      action: CONFIG.messaging.actions.startScraping,
      data: {
        targetCount,
        targetType
      }
    });
    
    if (!response || !response.success) {
      throw new Error(response?.error || '시작할 수 없습니다.');
    }
  } catch (error) {
    showError(error.message || '알 수 없는 오류가 발생했습니다.');
  }
}

/**
 * 중지 버튼 클릭 처리
 */
async function handleStopClick() {
  try {
    // 백그라운드에 중지 요청
    await chrome.runtime.sendMessage({ action: CONFIG.messaging.actions.stopScraping });
    
    // 입력 UI 표시
    showInputUI();
  } catch (error) {
    showError(error.message || '중지할 수 없습니다.');
  }
}

/**
 * 재시도 버튼 클릭 처리
 */
function handleRetryClick() {
  // 입력 UI 표시
  showInputUI();
}

/**
 * 입력 UI 표시
 */
function showInputUI() {
  inputSection.classList.remove('hidden');
  progressSection.classList.add('hidden');
  errorSection.classList.add('hidden');
  successSection.classList.add('hidden');
}

/**
 * 진행 UI 표시
 */
function showProgressUI(status) {
  inputSection.classList.add('hidden');
  progressSection.classList.remove('hidden');
  errorSection.classList.add('hidden');
  successSection.classList.add('hidden');
  
  // 상태 업데이트
  updateProgressUI(status);
}

/**
 * 오류 UI 표시
 */
function showError(message) {
  inputSection.classList.add('hidden');
  progressSection.classList.add('hidden');
  errorSection.classList.remove('hidden');
  successSection.classList.add('hidden');
  
  // 오류 메시지 표시
  errorMessage.textContent = message || '오류가 발생했습니다.';
}

/**
 * 성공 UI 표시
 */
function showSuccess(message) {
  inputSection.classList.add('hidden');
  progressSection.classList.add('hidden');
  errorSection.classList.add('hidden');
  successSection.classList.remove('hidden');
  
  // 성공 메시지 표시
  successMessage.textContent = message || '수집이 완료되었습니다.';
}

/**
 * 진행 UI 업데이트
 */
function updateProgressUI(status) {
  const { currentProgress, targetCount, targetType } = status;
  
  // 진행률 표시
  statusText.textContent = `${targetType === 'pages' ? '페이지' : '상품'} 수집 중...`;
  progressFill.style.width = `${currentProgress}%`;
  
  // 현재/목표 수 표시
  const current = Math.round((targetCount * currentProgress) / 100);
  progressCount.textContent = `${current} / ${targetCount} ${targetType === 'pages' ? '페이지' : '상품'}`;
}

// 메시지 리스너 설정
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 진행 상태 업데이트
  if (message.action === CONFIG.messaging.actions.progressUpdate) {
    const { current, target, percentage, type } = message.data;
    
    updateProgressUI({
      currentProgress: percentage,
      targetCount: target,
      targetType: type
    });
    
    return false;
  }
  
  // 스크래핑 성공
  if (message.action === CONFIG.messaging.actions.scrapingSuccess) {
    const { productsCount, pagesCount } = message.data;
    
    const successMsg = `수집 완료: ${pagesCount}페이지, ${productsCount}개 상품`;
    showSuccess(successMsg);
    
    return false;
  }
  
  // 스크래핑 오류
  if (message.action === CONFIG.messaging.actions.scrapingError) {
    showError(message.data.error);
    return false;
  }
});
