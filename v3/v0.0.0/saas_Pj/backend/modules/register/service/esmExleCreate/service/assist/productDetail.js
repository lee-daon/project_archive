/**
 * generateDetailContent.js
 * 상품 상세 페이지 HTML 생성 모듈
 */

/**
 * 이미지 섹션 HTML 생성 함수
 * @param {string[]} images - 이미지 URL 배열
 * @param {string} className - 섹션 div에 추가할 클래스 이름
 * @returns {string} 이미지 섹션 HTML
 */
function generateImageSection(images, className) {
    if (!images || images.length === 0) {
      return '';
    }
    let imagesHtml = `<div class="${className}" style="margin: 0; text-align: center;">`;
    images.forEach(image => {
      imagesHtml += `<div style="margin: 0; font-size: 0; line-height: 0;"><img src="${image}" style="max-width:100%; display: block; margin: 0 auto;" /></div>`;
    });
    imagesHtml += '</div>';
    return imagesHtml;
  }
  
  /**
   * 속성 정보 HTML 생성 함수 (테이블 대신 div/p 태그 사용)
   * @param {Array} attributes - 상품 속성 배열 [{name: string, value: string}]
   * @returns {string} 속성 정보 HTML
   */
  function generateAttributeTable(attributes) {
    if (!attributes || attributes.length === 0) {
      return '';
    }
    let attributesHtml = '<div class="product-attributes" style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: left;">';
    attributesHtml += '<h3 style="font-size: 1.3em; margin-bottom: 20px; text-align: center;">상품 정보</h3>';
    
    attributes.forEach(attr => {
      attributesHtml += `<div style="margin-bottom: 10px; padding: 10px; background-color: #f9f9f9; border-radius: 5px;">`;
      attributesHtml += `<p style="margin: 0; font-weight: bold; color: #333;">${attr.name}</p>`;
      attributesHtml += `<p style="margin: 5px 0 0; color: #555;">${attr.value}</p>`;
      attributesHtml += `</div>`;
    });
  
    attributesHtml += '</div>';
    return attributesHtml;
  }
  
  /**
   * 상세 페이지 HTML 생성 함수
   * @param {string[]} detailImages - 호스팅된 상세 이미지 URL 배열
   * @param {Array} attributes - 상품 속성 배열
   * @param {string[]} firstImages - 상단에 위치할 이미지 URL 배열
   * @param {string[]} lastImages - 하단에 위치할 이미지 URL 배열
   * @param {string} trackingUrl - 추적 URL (빈 문자열이 아닌 경우 1px 투명 이미지로 추가)
   * @returns {string} 상세 페이지 HTML
   */
  function generateDetailContent(detailImages, attributes, firstImages, lastImages, trackingUrl = "") {
    // 1. firstImages 섹션 생성
    const firstImagesHtml = generateImageSection(firstImages, 'first-images');
  
    // 2. detailImages 섹션 생성
    const detailImagesHtml = generateImageSection(detailImages, 'product-detail-images');
  
    // 3. attributes 테이블 생성
    const attributesHtml = generateAttributeTable(attributes);
  
    // 4. lastImages 섹션 생성
    const lastImagesHtml = generateImageSection(lastImages, 'last-images');
  
    // 5. 추적 div 생성 (trackingUrl이 있는 경우)
    const trackingDivHtml = trackingUrl && trackingUrl.trim() !== "" 
      ? `<div style="visibility:hidden;height:0px;margin:0px;background-image:url(${trackingUrl})"></div>` 
      : "";
  
    // 전체 HTML 조합
    return `
    <div class="product-detail-container" style="font-family: 'Noto Sans KR', sans-serif; max-width: 860px; margin: 0 auto; text-align: center; position: relative;">
      ${firstImagesHtml}
      <div class="product-description" style="margin: 30px 0;">
        <h3 style="text-align: center; font-size: 1.5em; margin-bottom: 15px;">상품 상세 정보</h3>
        <p style="text-align: center; color: #555;">상품에 대한 자세한 정보는 아래 이미지를 참고해주세요.</p>
      </div>
      ${detailImagesHtml}
      ${attributesHtml}
      ${lastImagesHtml}
      ${trackingDivHtml}
    </div>`;
  }
  
  // export default generateDetailContent; // 기존 export 방식 주석 처리 또는 삭제
  export { generateDetailContent }; // ES 모듈 방식으로 export
  