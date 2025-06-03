document.addEventListener('DOMContentLoaded', () => {
  const pageCountInput = document.getElementById('pageCount');
  const sendDataBtn = document.getElementById('sendData');
  const retryBtn = document.getElementById('retryButton');
  const toggleSwitch = document.getElementById('toggleSwitch');
  const errorMessage = document.getElementById('errorMessage');

  function clearError() { errorMessage.textContent = ''; }
  function showError(message) { errorMessage.textContent = message; }
  function flashButton(button) { button.classList.add('active'); setTimeout(() => { button.classList.remove('active'); }, 200); }
  function validateSettings() {
    clearError();
    if (!toggleSwitch.checked) {
      showError('on/off가 off 상태입니다. 기능을 활성화하세요.');
      return false;
    }
    const pageCount = parseInt(pageCountInput.value, 10);
    if (isNaN(pageCount) || pageCount < 1 || pageCount > 100) {
      showError('페이지 개수는 1 이상 100 이하의 숫자여야 합니다.');
      return false;
    }
    return true;
  }
  function executeMainScript() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { command: "executeAction" }, (response) => {
          if (chrome.runtime.lastError) {
            console.error("content script가 다른 웹에서 실행중입니다, 다른 웹을 닫아 주세요");
            return;
          }
          console.log("Response from content script:", response);
        });
      }
    });
  }



  sendDataBtn.addEventListener('click', () => {
    flashButton(sendDataBtn);
    if (!validateSettings()) return;
    const pageCount = parseInt(pageCountInput.value, 10);

    // 크롬 로컬스토리지에 pageCount 상수값 저장 후, 스크립트 실행 함수 호출
    chrome.storage.local.set({ pageCount: pageCount }, () => {
      executeMainScript();
    });
  });


  retryBtn.addEventListener('click', () => {
    flashButton(retryBtn);
    if (!validateSettings()) return;
    executeMainScript();
  });
});
