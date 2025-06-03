// main.js에서 state와 fetchStats 가져오기
import { state, fetchStats } from '../main.js';

/**
 * 금지브랜드 페이지 렌더링 함수
 * @returns {string} 금지브랜드 페이지 HTML
 */
export function renderBrandbanPage() {
  return `
    <div class="main-content">
      <h2>금지브랜드 검수</h2>
      
      <div class="table-container">
        <table id="brandbanTable">
          <thead>
            <tr>
              <th>상품 ID</th>
              <th>브랜드명</th>
              <th>URL</th>
              <th>필터링</th>
            </tr>
          </thead>
          <tbody>
            <!-- JS로 동적 생성 -->
          </tbody>
        </table>
      </div>
      
      <button id="startBrandbanButton" class="btn">처리 시작</button>
    </div>
  `;
}

/**
 * 금지브랜드 데이터 가져오기
 */
export async function fetchBrandbanData() {
  try {
    // '/brandban' 엔드포인트에서 데이터를 받아옴
    const response = await fetch('/prc/brandban');
    const result = await response.json();
    const brandban = result.data;
    
    const tbody = document.querySelector('#brandbanTable tbody');
    tbody.innerHTML = ''; // 기존 테이블 내용 초기화

    // 데이터가 없는 경우 메시지 표시
    if (!brandban || brandban.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = '<td colspan="4" style="text-align: center;">검토할 브랜드가 없습니다.</td>';
      tbody.appendChild(tr);
      return;
    }

    // 브랜드별 행 생성
    brandban.forEach(item => {
      const tr = document.createElement('tr');
      // 데이터 속성에 상품 ID 저장
      tr.dataset.productId = item.productId;

      tr.innerHTML = `
        <td>${item.productId}</td>
        <td>${item.brandName}</td>
        <td><a href="${item.url}" target="_blank">${item.url}</a></td>
        <td><input type="checkbox" class="banCheckbox" checked></td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('브랜드 데이터를 불러오는 중 오류 발생:', err);
    const tbody = document.querySelector('#brandbanTable tbody');
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">데이터를 불러오는 중 오류가 발생했습니다.</td></tr>';
  }
}

/**
 * 금지브랜드 검수 이벤트 핸들러 설정
 */
export function setupBrandbanHandlers() {
  const startButton = document.getElementById('startBrandbanButton');
  if (!startButton) return;
  
  startButton.addEventListener('click', async () => {
    const checkboxes = document.querySelectorAll('.banCheckbox');
    const selectedProductIds = Array.from(checkboxes)
      .filter(checkbox => checkbox.checked)
      .map(checkbox => checkbox.closest('tr').dataset.productId);

    const payload = {
      productIds: selectedProductIds
    };

    try {
      startButton.disabled = true;
      startButton.textContent = '처리 중...';
      
      // 서버에 데이터 전송
      const response = await fetch('/prc/brandfilter2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      console.log(result);
      // 처리 결과 표시
      alert('처리가 완료되었습니다.');
      
      // 통계 데이터 갱신
      fetchStats();
      
    } catch (err) {
      console.error('브랜드 처리 중 오류 발생:', err);
      alert('처리 중 오류가 발생했습니다.');
    } finally {
      startButton.disabled = false;
      startButton.textContent = '처리 시작';
    }
  });
} 