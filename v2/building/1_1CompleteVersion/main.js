async function main() {
  // 저장된 페이지 개수를 chrome.storage에서 불러옵니다.
  chrome.storage.local.get("pageCount", async (result) => {
    const count = result.pageCount || 1;
    console.log(`저장된 페이지 개수: ${count}`);
    
    // 지정된 페이지 개수만큼 처리 진행
    const all_items = await runProcess(count);
    if (all_items && all_items.length > 0) {
      sendData(all_items)
      
      
      
      /*await new Promise((resolve) => {
        chrome.storage.local.set({ items }, () => {
          console.log("크롬 로컬 스토리지에 데이터가 저장되었습니다.");
          resolve();
        });
      });*/
    }
    
    // 모든 처리가 완료되면 main.html을 새 탭에서 엽니다.
    window.open(chrome.runtime.getURL("main.html"), '_blank');
  });
}

// content_script.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.command === "executeAction") {
    // 실행할 작업을 여기에 작성합니다.
    console.log("Content script received executeAction command!");
    main();
    
    // 작업 수행 후 응답 전송 (필요에 따라)
    sendResponse({ status: "action executed" });
  }
});

