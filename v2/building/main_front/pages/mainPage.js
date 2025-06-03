/**
 * 메인 페이지 렌더링 함수
 * @param {Object} stats - 통계 데이터
 * @returns {string} 메인 페이지 HTML
 */
export function renderMainPage(stats) {
  return `
    <div class="main-content">
      <h2>메인 대시보드</h2>
      <div class="stats-container">
        <div class="stat-box">
          <h3>소싱 완료</h3>
          <p class="stat-number">${stats.sourcingCompleted}</p>
        </div>
        <div class="stat-box">
          <h3>가공 완료</h3>
          <p class="stat-number">${stats.preprocessingCompleted}</p>
        </div>
        <div class="stat-box">
          <h3>판매 가능</h3>
          <p class="stat-number">${stats.isRegistrable}</p>
        </div>
        <div class="stat-box">
          <h3>판매중</h3>
          <p class="stat-number">${stats.registered}</p>
        </div>
        <div class="stat-box">
          <h3>카테고리 매핑 대기중</h3>
          <p class="stat-number">${stats.categoryMappingRequired}</p>
        </div>
        <div class="stat-box">
          <h3>판매전 폐기/오류</h3>
          <p class="stat-number">${stats.discarded}</p>
        </div>
      </div>
      <style>
        /* 기존 CSS를 확장하여 5번째와 6번째 박스 스타일 추가 */
        .stats-container {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-top: 20px;
        }
        .stat-box {
          padding: 25px;
        }
        .stat-box:nth-child(5) {
          border-top: 4px solid #9C27B0; /* 카테고리 매핑 대기중 - 보라색 */
        }
        .stat-box:nth-child(6) {
          border-top: 4px solid #607D8B; /* 판매전 폐기/오류 - 회색 */
        }
      </style>
    </div>
  `;
} 