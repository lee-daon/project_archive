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
 * 옵션 섹션 HTML 생성 함수 (2열 flexbox 레이아웃)
 * @param {Array} optionNamesWithImages - 옵션명과 이미지 URL 배열 {name: string, image: string}[]
 * @returns {string} 옵션 섹션 HTML
 */
function generateOptionSection(optionNamesWithImages) {
  if (!optionNamesWithImages || optionNamesWithImages.length === 0) {
    return '';
  }
  
  let optionsHtml = '<div class="product-options" style="display: flex; flex-wrap: wrap; justify-content: space-between; margin: 20px 0; padding: 15px; border: 1px solid #eee; border-radius: 8px;">';
  optionsHtml += '<h3 style="width: 100%; text-align: center; margin-bottom: 15px; font-size: 1.3em;">옵션 정보</h3>';

  // 두 개씩 묶어서 처리
  for(let i = 0; i < optionNamesWithImages.length; i += 2) {
    optionsHtml += '<div style="display: flex; width: 100%; justify-content: space-between; margin-bottom: 15px;">';
    
    // 첫 번째 옵션
    optionsHtml += `
      <div class="option-item" style="width: 48%; text-align: center; border: 1px solid #ddd; padding: 10px; border-radius: 5px;">
        <img src="${optionNamesWithImages[i].image}" alt="${optionNamesWithImages[i].name}" style="max-width: 100%; height: auto; margin-bottom: 10px;">
        <p style="font-weight: bold; margin: 0;">${optionNamesWithImages[i].name}</p>
      </div>
    `;
    
    // 두 번째 옵션 (있는 경우에만)
    if(i + 1 < optionNamesWithImages.length) {
      optionsHtml += `
        <div class="option-item" style="width: 48%; text-align: center; border: 1px solid #ddd; padding: 10px; border-radius: 5px;">
          <img src="${optionNamesWithImages[i + 1].image}" alt="${optionNamesWithImages[i + 1].name}" style="max-width: 100%; height: auto; margin-bottom: 10px;">
          <p style="font-weight: bold; margin: 0;">${optionNamesWithImages[i + 1].name}</p>
        </div>
      `;
    } else {
      // 마지막 항목이 홀수 번째일 경우 빈 div로 균형 맞춤
      optionsHtml += '<div style="width: 48%;"></div>';
    }
    
    optionsHtml += '</div>';
  }

  optionsHtml += '</div>';
  return optionsHtml;
}

/**
 * 속성 테이블 HTML 생성 함수
 * @param {Array} attributes - 상품 속성 배열 [{name: string, value: string}]
 * @returns {string} 속성 테이블 HTML
 */
function generateAttributeTable(attributes) {
  if (!attributes || attributes.length === 0) {
    return '';
  }
  let attributesHtml = '<div class="product-attributes" style="margin: 20px 0;">';
  attributesHtml += '<h3 style="text-align: center; font-size: 1.3em; margin-bottom: 15px;">상품 정보</h3>';
  attributesHtml += '<table style="width:100%; border-collapse: collapse; margin-top: 10px; border: 1px solid #ddd;">';
  attributesHtml += '<tbody>';

  attributes.forEach(attr => {
    attributesHtml += `
      <tr>
        <th style="padding: 10px; text-align: left; border: 1px solid #ddd; background-color: #f8f8f8; width: 30%;">${attr.name}</th>
        <td style="padding: 10px; text-align: left; border: 1px solid #ddd;">${attr.value}</td>
      </tr>
    `;
  });

  attributesHtml += '</tbody></table></div>';
  return attributesHtml;
}

/**
 * 상세 페이지 HTML 생성 함수
 * @param {string[]} detailImages - 호스팅된 상세 이미지 URL 배열
 * @param {Array} attributes - 상품 속성 배열
 * @param {Array} optionNamesWithImages - 옵션명과 이미지 URL 배열 {name: string, image: string}[]
 * @param {string[]} firstImages - 상단에 위치할 이미지 URL 배열
 * @param {string[]} lastImages - 하단에 위치할 이미지 URL 배열
 * @returns {string} 상세 페이지 HTML
 */
function generateDetailContent(detailImages, attributes, optionNamesWithImages, firstImages , lastImages) {
  // 1. firstImages 섹션 생성
  const firstImagesHtml = generateImageSection(firstImages, 'first-images');

  // 2. optionNamesWithImages 섹션 생성 (표 또는 flexbox 레이아웃)
  const optionsHtml = generateOptionSection(optionNamesWithImages);

  // 3. detailImages 섹션 생성
  const detailImagesHtml = generateImageSection(detailImages, 'product-detail-images');

  // 4. attributes 테이블 생성
  const attributesHtml = generateAttributeTable(attributes);

  // 5. lastImages 섹션 생성
  const lastImagesHtml = generateImageSection(lastImages, 'last-images');

  // 전체 HTML 조합
  return `
  <div class="product-detail-container" style="font-family: 'Noto Sans KR', sans-serif; max-width: 860px; margin: 0 auto; text-align: center;">
    ${firstImagesHtml}
    ${optionsHtml}
    <div class="product-description" style="margin: 20px 0;">
      <h3 style="text-align: center; font-size: 1.5em; margin-bottom: 15px;">상품 상세 정보</h3>
      <p style="text-align: center; color: #555;">상품에 대한 자세한 정보는 아래 이미지를 참고해주세요.</p>
    </div>
    ${detailImagesHtml}
    ${attributesHtml}
    ${lastImagesHtml}
  </div>`;
}

// export default generateDetailContent; // 기존 export 방식 주석 처리 또는 삭제
export { generateDetailContent }; // ES 모듈 방식으로 export
