import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';

// ES 모듈에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 카테고리 데이터 로드
const loadCategoryData = () => {
  try {
    // 경로 수정: 상위 디렉토리로 이동하여 config 디렉토리 접근
    const categoryData = fs.readFileSync(path.join(__dirname, '../../config/naver/naver_category.json'), 'utf8');
    return JSON.parse(categoryData);
  } catch (error) {
    console.error('카테고리 데이터를 불러오는 데 실패했습니다:', error);
    return [];
  }
};

// 카테고리 데이터
const categoryData = loadCategoryData();

// API 라우터 생성
const router = express.Router();

// API 라우트
// 모든 카테고리 가져오기
router.get('/categories', (req, res) => {
  res.json(categoryData);
});

// 대분류 카테고리 가져오기
router.get('/categories/main', (req, res) => {
  const mainCategories = categoryData.filter(item => !item.wholeCategoryName.includes('>'));
  res.json(mainCategories);
});

// 서브 카테고리 가져오기
router.get('/categories/sub/:parentId', (req, res) => {
  const { parentId } = req.params;
  const parentCategory = categoryData.find(item => item.id === parentId);
  
  if (!parentCategory) {
    return res.status(404).json({ message: '해당 카테고리를 찾을 수 없습니다.' });
  }

  const parentPath = parentCategory.wholeCategoryName;
  
  const subCategories = categoryData.filter(item => {
    const itemPath = item.wholeCategoryName;
    return itemPath.includes(parentPath + '>') && 
           itemPath.split('>').length === parentPath.split('>').length + 1;
  });

  res.json(subCategories);
});

// 카테고리 검색
router.get('/categories/search', (req, res) => {
  const { keyword } = req.query;
  
  if (!keyword || keyword.trim() === '') {
    return res.status(400).json({ message: '검색어를 입력해주세요.' });
  }

  const searchKeyword = keyword.toLowerCase();
  const results = categoryData.filter(item => 
    item.name.toLowerCase().includes(searchKeyword) || 
    item.wholeCategoryName.toLowerCase().includes(searchKeyword)
  );

  res.json(results);
});

// 카테고리 상세 정보
router.get('/categories/:categoryId', (req, res) => {
  const { categoryId } = req.params;
  const category = categoryData.find(item => item.id === categoryId);
  
  if (!category) {
    return res.status(404).json({ message: '해당 카테고리를 찾을 수 없습니다.' });
  }

  res.json(category);
});

export default router;