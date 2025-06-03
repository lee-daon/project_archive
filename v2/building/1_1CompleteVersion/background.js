chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.command === "sendData") {
    fetch('http://localhost:3000/src/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message.data)
    })
      .then(response => {
        sendResponse({ status: "데이터 전송 성공", response });
      })
      .catch(error => {
        console.error('데이터 전송 오류:', error);
        sendResponse({ status: "데이터 전송 실패", error: error.toString() });
      });
    return true; // 비동기 sendResponse 사용을 명시합니다.
  }
}); 