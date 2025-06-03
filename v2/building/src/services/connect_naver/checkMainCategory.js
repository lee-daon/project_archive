import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * 카테고리 ID를 입력받아 대카테고리 ID를 반환하는 함수
 * @param {string} categoryId - 카테고리 ID (예: '50000810')
 * @returns {string} - 대카테고리 ID (예: '50000000')
 */
function checkMainCategory(categoryId) {
  try {
    // ES 모듈에서 __dirname을 사용하기 위한 대체 방법
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    // naver_category.json 파일 경로
    const categoryFilePath = path.join(__dirname, '../../config/naver/naver_category.json');
    
    // JSON 파일 읽기
    const categoryData = JSON.parse(fs.readFileSync(categoryFilePath, 'utf8'));
    
    // 입력받은 카테고리 ID에 해당하는 카테고리 찾기
    const category = categoryData.find(item => item.id === categoryId);
    
    if (!category) {
      throw new Error(`카테고리 ID ${categoryId}를 찾을 수 없습니다.`);
    }
    
    // 전체 카테고리 이름에서 대카테고리 이름 추출 (첫 번째 '>' 이전의 문자열)
    const mainCategoryName = category.wholeCategoryName.split('>')[0];
    
    // 대카테고리 이름을 사용하여 대카테고리 객체 찾기
    const mainCategory = categoryData.find(item => 
      item.name === mainCategoryName && item.wholeCategoryName === mainCategoryName
    );
    
    if (!mainCategory) {
      throw new Error(`대카테고리 ${mainCategoryName}를 찾을 수 없습니다.`);
    }
    
    return mainCategory.id;
  } catch (error) {
    console.error('대카테고리 ID 조회 중 오류 발생:', error.message);
    throw error;
  }
}

export default checkMainCategory;
