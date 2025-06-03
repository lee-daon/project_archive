// helpers.js
// 헬퍼(유틸리티) 함수들을 정의한 파일

/**
 * 지정한 밀리초(ms)만큼 대기하는 함수
 * @param {number} ms - 대기할 시간 (밀리초)
 * @returns {Promise} 지정 시간 후 resolve되는 Promise
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * min과 max(포함) 사이의 정수형 난수를 생성하는 함수
   * @param {number} min - 최소값
   * @param {number} max - 최대값
   * @returns {number} min과 max 사이의 정수 난수
   */
function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  /**
   * 자연스러운 스크롤 애니메이션 함수
   * @param {number} targetPosition - 스크롤 목표 Y 좌표
   * @param {number} [duration=3000] - 애니메이션 지속 시간 (밀리초)
   * @returns {Promise} 애니메이션 완료 시 resolve
   */
async function smoothScroll(targetPosition, duration = 3000) {
    const startPosition = window.scrollY;
    const distance = targetPosition - startPosition;
    const startTime = performance.now();
  
    // easeInOutQuad: 부드러운 가속/감속 효과를 주는 이징 함수
    function easeInOutQuad(t) {
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }
  
    return new Promise(resolve => {
      function step() {
        const currentTime = performance.now();
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
  
        window.scrollTo(0, startPosition + distance * easeInOutQuad(progress));
  
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          resolve();
        }
      }
      requestAnimationFrame(step);
    });
  }
  
  /**
   * 대상 요소에 대해 마우스 이벤트(오버, 다운, 업, 클릭)를 시뮬레이션하는 함수
   * @param {Element} element - 이벤트를 발생시킬 대상 요소
   */
async function simulateMouseEvents(element) {
    if (!element) return;
  
    // 1. 마우스 오버 이벤트
    element.dispatchEvent(new MouseEvent('mouseover', {
      bubbles: true,
      cancelable: true,
      view: window
    }));
  
    await sleep(random(300, 800)); // 자연스러운 지연
  
    // 2. 마우스 다운 이벤트
    element.dispatchEvent(new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      view: window
    }));
  
    await sleep(random(100, 200));
  
    // 3. 마우스 업 이벤트
    element.dispatchEvent(new MouseEvent('mouseup', {
      bubbles: true,
      cancelable: true,
      view: window
    }));
  
    // 4. 클릭 이벤트
    element.dispatchEvent(new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    }));
  }
  
  /**
   * 기준 값에 ±10%의 랜덤 오차를 적용한 값을 반환하는 함수
   * @param {number} baseValue - 기준 값
   * @returns {number} 변동된 값
   */
function getRandomOffset(baseValue) {
    const variation = baseValue * 0.1; // 10% 변동폭
    return baseValue + (Math.random() * variation * 2 - variation);
  }
  
  /**
   * 현재 페이지에서 상품 데이터(아이템)를 파싱하는 함수
   * @returns {Array} 추출한 상품 데이터 배열
   */
function taobaoListParse() {
    const items = [];
  
    // 페이지 내 상품 정보를 담고 있는 링크 요소 선택
    // CSS 셀렉터는 실제 페이지 구조에 따라 조정 필요
    document.querySelectorAll('a.doubleCardWrapperAdapt--mEcC7olq').forEach(link => {
  
      // 링크의 id에서 상품 ID 추출 (예: "item_id_743419570648" → "743419570648")
      const idAttr = link.getAttribute('id') || "";
      const productId = idAttr.replace('item_id_', '');
  
      // 내부 제목 요소에서 상품명 추출 (양쪽 공백 제거)
      const titleElem = link.querySelector('.title--qJ7Xg_90');
      const productName = titleElem ? titleElem.textContent.trim() : "";
  
      // 추출한 데이터를 객체로 items 배열에 추가
      items.push({
        productId,
        productName
      });
    });
  
    return items;
  }
  