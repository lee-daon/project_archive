// processPage.js
// 외부에서 호출하는 함수들을 정의한 파일
// helpers.js의 함수들을 import 합니다.

/**
 * 페이지 완전 로드를 대기하는 함수
 * (processPage 실행 전에 호출)
 */
async function waitForPageLoad() {
  while (document.readyState !== 'complete') {
    await sleep(random(1000, 2000));
  }
}

/**
 * 페이지 처리 함수: 스크롤, 상품 데이터 추출, 다음 페이지 이동 처리
 * @returns {Object|null} { items, now_url } 또는 오류 발생 시 null 반환
 */
async function processPage() {
  const now_url = window.location.href;
  const pageHeight = document.body.scrollHeight;

  // 자연스러운 스크롤: 페이지의 여러 지점으로 이동
  await smoothScroll(getRandomOffset(pageHeight / 5));
  await sleep(random(1000, 2000));

  await smoothScroll(getRandomOffset(pageHeight * 2 / 5));
  await sleep(random(1000, 2000));

  await smoothScroll(getRandomOffset(pageHeight * 3 / 5));
  await sleep(random(1000, 2000));

  await smoothScroll(getRandomOffset(pageHeight * 4 / 5));
  await sleep(random(1000, 2000));

  // 현재 페이지의 상품 데이터 추출
  const items = taobaoListParse();

  if (!items || items.length === 0) {
    alert("오류 감지되었습니다. 수동 에러처리 후 재시도 버튼을 눌러 진행해주세요.");
    return null;
  } else {
    console.log('추출된 items:', items);
  }

  // 다음 페이지로 이동: 다음 페이지 버튼에 대해 마우스 이벤트 시뮬레이션 적용
  const nextBtn = document.querySelector("button.next-btn.next-medium.next-btn-normal.next-pagination-item.next-next");

  if (nextBtn) {
    await simulateMouseEvents(nextBtn);
    await sleep(random(1000, 2000));
  } else {
    console.log('다음 페이지 버튼을 찾지 못했습니다.');
    return null;
  }

  return { items };
}

/**
 * 데이터 전송 함수: 추출한 데이터를 서버에 전송
 */
function sendData(data) {
  chrome.runtime.sendMessage({ command: "sendData", data: data }, (response) => {
    console.log("Background 응답:", response);
  });
}

/**
 * 지정한 횟수(targetCount)만큼 페이지 처리를 반복 실행하여
 * 각 페이지에서 추출한 상품 데이터(items)를 누적하는 함수
 * @param {number} targetCount - 반복 실행할 횟수 (예: 페이지 수)
 * @returns {Array} 누적된 상품 데이터 배열
 */
async function runProcess(targetCount) {
  const accumulatedItems = [];

  for (let i = 0; i < targetCount; i++) {
    console.log(`--- ${i + 1}번째 페이지 처리 시작 ---`);

    // 각 반복마다 페이지 완전 로드 대기
    await waitForPageLoad();

    // 페이지 처리 실행
    const result = await processPage();

    if (result === null) {
      console.log(`페이지 처리 도중 오류가 발생하여 ${i + 1}번째 반복에서 중단합니다.`);
      break;
    }

    // 누적: 현재 페이지의 items 배열을 누적 배열에 추가
    accumulatedItems.push(...result.items);
    console.log(`누적 item 개수: ${accumulatedItems.length}`);
  }

  return accumulatedItems;
}
