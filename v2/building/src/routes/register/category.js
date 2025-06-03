/**
 * @fileoverview 카테고리 매핑 API 라우터
 * @module routes/register/category
 * @description 카테고리 조회 및 업데이트를 위한 API 엔드포인트를 제공합니다.
 */

import express from 'express';
import { 
  getCategoriesWithNullMapping, 
  getTotalCategoriesWithNullMapping,
  getProductsByCategory,
  getProductImage,
  updateCategoryMapping,
  getAllProductIdsByCategory,
  updateProductsStatusAfterCategoryMapping,
  getCategoryMappingById
} from '../../db/pre_register/category.js';

const router = express.Router();

/**
 * @route GET /category
 * @description 매핑이 필요한(NULL이 있는) 카테고리 데이터를 페이지네이션하여 조회
 * @param {Object} req - Express 요청 객체
 * @param {Object} req.query
 * @param {number} [req.query.page=0] - 페이지 번호 (0부터 시작)
 * @param {number} [req.query.limit=10] - 한 페이지에 표시할 항목 수
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 카테고리 및 관련 상품 정보
 */
router.get('/category', async (req, res) => {
  try {
    // 페이징을 위한 파라미터 (기본값 page=0, limit=10)
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 10;
    const offset = page * limit;
    
    // DB에서 카테고리 정보 가져오기
    const [categories] = await getCategoriesWithNullMapping(limit, offset);
    
    // 더 불러올 데이터가 있는지 확인
    const [totalCount] = await getTotalCategoriesWithNullMapping();
    const hasMore = offset + categories.length < totalCount[0].total;
    
    // 각 카테고리에 대한 상품 정보 및 이미지 URL 가져오기
    const result = await Promise.all(categories.map(async (category) => {
      // 해당 카테고리의 상품 조회
      const [products] = await getProductsByCategory(category.catid);
      
      // 상품 이미지 URL 조회
      const productImages = [];
      for (const product of products) {
        const [images] = await getProductImage(product.productid);
        
        if (images.length > 0) {
          productImages.push({
            productid: product.productid,
            title: product.title,
            imageurl: images[0].imageurl
          });
        }
      }
      
      return {
        ...category,
        products: productImages
      };
    }));
    
    res.json({ 
      success: true, 
      data: result,
      metadata: {
        page,
        limit,
        hasMore
      }
    });
  } catch (error) {
    console.error('카테고리 데이터 제공 중 오류:', error);
    res.status(500).json({ success: false, error: '서버 오류가 발생했습니다.' });
  }
});

/**
 * @route POST /category
 * @description 카테고리 매핑 정보 업데이트
 * @param {Object} req - Express 요청 객체
 * @param {Object} req.body - 요청 본문
 * @param {number|string} req.body.catid - 카테고리 ID
 * @param {string} [req.body.naver_cat_id] - 네이버 카테고리 ID
 * @param {string} [req.body.coopang_cat_id] - 쿠팡 카테고리 ID
 * @param {string} [req.body.naver_cat_name] - 네이버 카테고리명
 * @param {string} [req.body.coopang_cat_name] - 쿠팡 카테고리명
 * @param {Object} res - Express 응답 객체
 * @returns {Object} 업데이트 결과
 */
router.post('/category', async (req, res) => {
  const { catid, naver_cat_id, coopang_cat_id, naver_cat_name, coopang_cat_name } = req.body;
  
  // catid 유효성 검사 (필수)
  if (!catid) {
      return res.status(400).json({ success: false, error: 'catid가 필요합니다.' });
  }

  try {
    // 1. 카테고리 매핑 업데이트
    await updateCategoryMapping(catid, naver_cat_id, coopang_cat_id, naver_cat_name, coopang_cat_name);
    console.log(`카테고리 매핑 업데이트 시도 완료 (Cat ID: ${catid})`);

    // 2. 업데이트된 매핑 정보 조회
    const [mappingInfoRows] = await getCategoryMappingById(catid); 
    
    if (!mappingInfoRows || mappingInfoRows.length === 0) {
      console.error(`업데이트 후 카테고리 정보를 찾을 수 없음 (Cat ID: ${catid})`);
      return res.status(404).json({ success: false, error: '카테고리 정보를 찾을 수 없습니다.' });
    }
    
    const updatedMapping = mappingInfoRows[0];
    
    // 3. 네이버 및 쿠팡 ID 유효성 검사 (null, undefined, 빈 문자열이 아닌지 확인)
    const isNaverIdValid = updatedMapping.naver_cat_id !== null && updatedMapping.naver_cat_id !== undefined && String(updatedMapping.naver_cat_id).trim() !== '';
    const isCoopangIdValid = updatedMapping.coopang_cat_id !== null && updatedMapping.coopang_cat_id !== undefined && String(updatedMapping.coopang_cat_id).trim() !== '';

    let updatedProductCount = 0; // 상태 업데이트된 상품 수 추적

    if (isNaverIdValid && isCoopangIdValid) {
      console.log(`네이버(${updatedMapping.naver_cat_id}) 및 쿠팡(${updatedMapping.coopang_cat_id}) 카테고리 ID 유효. 상품 상태 업데이트 시도.`);
      
      // 4. 관련 상품 ID 조회
      const [productRows] = await getAllProductIdsByCategory(catid);
      
      if (productRows && productRows.length > 0) {
          const productIds = productRows.map(row => row.productid);
          
          // 5. 상품 상태 업데이트 (status, pre_register) - 트랜잭션 사용 버전 호출
          const statusUpdateSuccess = await updateProductsStatusAfterCategoryMapping(productIds); 
          if (statusUpdateSuccess) {
             // updateProductsStatusAfterCategoryMapping는 boolean을 반환하므로 실제 영향받은 행 수 대신 ID 개수 사용
             updatedProductCount = productIds.length; 
             console.log(`Cat ID ${catid}에 속한 상품 ${updatedProductCount}개의 상태 업데이트 완료.`);
          } else {
             // 이 경우는 updateProductsStatusAfterCategoryMapping에서 false를 반환할 때 (현재는 오류 throw)
             console.error(`Cat ID ${catid} 상품 상태 업데이트 실패 (함수가 false 반환).`);
             // 필요시 특정 에러 응답 반환 가능
          }
      } else {
         console.log(`Cat ID ${catid}: 상태 업데이트할 상품 없음.`);
      }
    } else {
      console.log(`네이버(${updatedMapping.naver_cat_id}) 또는 쿠팡(${updatedMapping.coopang_cat_id}) 카테고리 ID가 유효하지 않아 상품 상태 업데이트 건너뛰기 (Cat ID: ${catid})`);
    }
    
    // 최종 성공 응답
    res.json({ 
      success: true, 
      message: '카테고리가 성공적으로 업데이트되었습니다.',
      updatedProducts: updatedProductCount // 상태가 업데이트된 상품 수
    });

  } catch (error) {
     console.error('카테고리 업데이트 처리 중 오류:', error);
     
     // 네이버 카테고리 ID 형식 오류 처리 (예시)
     if (error.code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD' && error.sqlMessage && error.sqlMessage.includes('naver_cat_id')) {
       console.log('카테고리번호 형식 오류: 숫자만 입력 가능합니다.');
       return res.status(400).json({ success: false, error: '카테고리번호는 숫자입니다.' });
     }
     
     // updateProductsStatusAfterCategoryMapping에서 던져진 다른 DB 오류 처리
     if (error.sqlMessage) { // DB 오류인지 간단히 확인
        return res.status(500).json({ success: false, error: '데이터베이스 처리 중 오류가 발생했습니다.', detail: error.message });
     }
     
     // 일반적인 서버 오류
     res.status(500).json({ success: false, error: '서버 내부 오류가 발생했습니다.' });
  }
});

export default router; 


