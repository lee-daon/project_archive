// fetchWrapper 함수 임포트
import { fetchWrapper } from '../main.js';

/**
 * 소싱 페이지의 HTML 구조를 생성하는 함수입니다.
 *
 * 이 함수는 서버로부터 전달받을 소싱 통계 정보를 위한 자리 표시자와 버튼 및 입력 필드를 포함하는 HTML 문자열을 반환합니다.
 *
 * @returns {string} 소싱 페이지의 HTML 문자열. 이 HTML은 소싱 결과, 통계, 테스트 코드 입력 및 업데이트 버튼을 포함합니다.
 */
export function renderSourcingPage() {
  // 서버에서 받아온 정보가 있는지 확인
  let setupInfo = {};
  
  // fetch로 서버에서 setupinfo 가져오기
  return `
    <div class="main-content">
      <h2>소싱 결과</h2>
      
      <div class="sourcing-stats">
        <div class="stat-box">
          <h3>성공</h3>
          <p class="stat-number" id="successCount">0</p>
        </div>
        <div class="stat-box">
          <h3>API 실패</h3>
          <p class="stat-number" id="failApiCount">0</p>
        </div>
        <div class="stat-box">
          <h3>저장 실패</h3>
          <p class="stat-number" id="failSaveCount">0</p>
        </div>
        <div class="stat-box">
          <h3>총 개수</h3>
          <p class="stat-number" id="totalCount">0</p>
        </div>
      </div>

      <div class="testcode-section">
        <h3>테스트 코드 설정</h3>
        <div class="testcode-input">
          <label for="testCodeInput">테스트 코드:</label>
          <input type="number" id="testCodeInput" min="1" value="1">
        </div>
        <button id="updateStatusBtn" class="btn primary-btn">상태 업데이트</button>
      </div>
      
      <div id="updateResult" class="update-result" style="display: none;">
        <p id="updateMessage"></p>
      </div>
    </div>
  `;
} 

/**
 * 소싱 페이지를 초기화하는 함수입니다.
 *
 * 서버로부터 소싱 데이터를 가져오고, 업데이트 버튼에 이벤트 리스너를 등록하여 상태 업데이트가 수행되도록 합니다.
 */
export function setupSourcingPage() {
  // setupinfo 데이터 가져오기
  fetchSourcingData();
  
  // 버튼 이벤트 리스너 등록
  const updateBtn = document.getElementById('updateStatusBtn');
  if (updateBtn) {
    updateBtn.addEventListener('click', updateStatusWithTestCode);
  }
}

/**
 * 서버에서 소싱 데이터를 비동기적으로 가져옵니다.
 *
 * '/api/setupinfo' 엔드포인트에 요청을 보내 서버로부터 소싱 통계 및 관련 데이터를 받아옵니다.
 * 만약 데이터가 반환되지 않으면 (null), 이는 리다이렉션 처리가 되었음을 의미하며 함수는 추가 작업을 수행하지 않습니다.
 * 정상적으로 데이터를 수신한 경우, 데이터 객체의 속성들을 해당 HTML 요소에 반영합니다.
 * 예외 상황 발생 시, 콘솔에 에러 로그를 출력합니다.
 *
 * @returns {Promise<void>} 데이터 로딩 완료 시 반환되는 프로미스.
 */
async function fetchSourcingData() {
  try {
    const data = await fetchWrapper('/src/getstatus/setupinfo');

    // data가 null이면 리다이렉션된 것이므로 함수 종료
    if (!data) return;
    
    if (data) {
      document.getElementById('successCount').textContent = data.successCount || 0;
      document.getElementById('failApiCount').textContent = data.failApiCount || 0;
      document.getElementById('failSaveCount').textContent = data.failSaveCount || 0;
      document.getElementById('totalCount').textContent = data.totalCount || 0;
    }
  } catch (error) {
    console.error('소싱 데이터 가져오기 실패:', error);
  }
}

/**
 * 테스트 코드를 사용하여 상태를 업데이트하는 함수입니다.
 *
 * 입력 필드에서 테스트 코드를 읽어오며, 만약 값이 없으면 업데이트 결과 영역에 에러 메시지를 표시합니다.
 * 값이 있을 경우, '/api/updatestatus' 엔드포인트에 POST 요청을 보내 업데이트 처리를 수행하며,
 * 이때 요청 본문은 테스트 코드와 제품 ID 목록 (getProductIds 함수를 통해 획득한 값)을 포함합니다.
 * 서버로부터 응답을 받으면, 결과 메시지와 성공 여부를 업데이트 결과 영역에 표시합니다.
 * API 요청 중 오류가 발생하면 콘솔에 에러 로그를 출력하고, 오류 메시지를 표시합니다.
 *
 * @returns {Promise<void>} 상태 업데이트 작업이 완료된 후 반환되는 프로미스.
 */
async function updateStatusWithTestCode() {
  const testCode = document.getElementById('testCodeInput').value;
  
  if (!testCode) {
    showUpdateResult('테스트 코드를 입력해주세요.', false);
    return;
  }
  
  try {
    const result = await fetchWrapper('/src/updatestatus', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        testCode: parseInt(testCode, 10),
        productIds: await getProductIds()
      })
    });
    
    // result가 null이면 리다이렉션된 것이므로 함수 종료
    if (!result) return;
    
    showUpdateResult(result.message, result.success);
  } catch (error) {
    console.error('상태 업데이트 실패:', error);
    showUpdateResult('상태 업데이트 중 오류가 발생했습니다.', false);
  }
}

/**
 * 서버로부터 제품 ID 목록을 가져오는 함수입니다.
 *
 * '/api/setupinfo' 엔드포인트에 요청을 보내 소싱 관련 정보를 받아오며,
 * 해당 데이터에서 제품 ID 배열을 추출하여 반환합니다.
 * 만약 데이터가 null이면, 이는 리다이렉션 처리가 되었음을 의미하여 빈 배열을 반환합니다.
 * 네트워크 오류 등 예외 발생 시, 오류 로그를 출력하고 빈 배열을 반환합니다.
 *
 * @returns {Promise<Array>} 서버로부터 가져온 제품 ID 배열.
 */
async function getProductIds() {
  try {
    const data = await fetchWrapper('/src/getstatus/setupinfo');
    
    // data가 null이면 리다이렉션된 것이므로 빈 배열 반환
    if (!data) return [];
    
    return data.productIds || [];
  } catch (error) {
    console.error('제품 ID 가져오기 실패:', error);
    return [];
  }
}

/**
 * 업데이트 결과를 사용자에게 표시합니다.
 *
 * 이 함수는 업데이트 결과를 표시하기 위해 'updateResult' ID를 가진 HTML 요소를 활성화하고,
 * 해당 요소 내 'updateMessage'에 결과 메시지를 설정합니다. 전달된 success 값에 따라서
 * 결과 영역에 'success' 또는 'error' 클래스를 할당하여 시각적으로 구분합니다.
 *
 * @param {string} message - 업데이트 결과 메시지.
 * @param {boolean} success - 업데이트 성공 여부를 나타내는 불리언 값.
 */
function showUpdateResult(message, success) {
  const resultElement = document.getElementById('updateResult');
  const messageElement = document.getElementById('updateMessage');
  
  resultElement.style.display = 'block';
  messageElement.textContent = message;
  
  if (success) {
    resultElement.classList.remove('error');
    resultElement.classList.add('success');
  } else {
    resultElement.classList.remove('success');
    resultElement.classList.add('error');
  }
}

// 소싱 페이지 CSS 스타일 추가
const style = document.createElement('style');
style.textContent = `
  .sourcing-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    margin-bottom: 30px;
  }
  
  .stat-box {
    padding: 15px;
    border-radius: 8px;
    background-color: #f5f5f5;
    flex: 1;
    min-width: 150px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .stat-box h3 {
    margin-top: 0;
    font-size: 16px;
    color: #555;
  }
  
  .stat-number {
    font-size: 24px;
    font-weight: bold;
    margin: 10px 0 0;
    color: #333;
  }
  
  .testcode-section {
    background-color: #f9f9f9;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 20px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .testcode-input {
    margin-bottom: 15px;
    display: flex;
    align-items: center;
  }
  
  .testcode-input label {
    margin-right: 10px;
    font-weight: bold;
  }
  
  .testcode-input input {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
  }
  
  .update-result {
    padding: 10px 15px;
    border-radius: 4px;
    margin-top: 15px;
  }
  
  .update-result.success {
    background-color: #e7f7e7;
    border: 1px solid #c3e6c3;
    color: #2e7d32;
  }
  
  .update-result.error {
    background-color: #fdecea;
    border: 1px solid #f5c2c7;
    color: #842029;
  }
  
  .primary-btn {
    background-color: #4caf50;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    transition: background-color 0.3s;
  }
  
  .primary-btn:hover {
    background-color: #388e3c;
  }
`;

document.head.appendChild(style); 