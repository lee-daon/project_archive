import express from 'express';
import { getOptionMappingRequiredProducts, getProductPreRegisterData, getProductCoupangCategoryId, getUserMaxOptionCount } from '../repository/coopangMapdata.js';
import { getCoupangCategoryEssentials } from '../service/coopang_Category/categoryMeta.js';
import { updateMappedJsonData } from '../repository/updateMappedInfo.js';
import { mapOptionsForCoupang } from '../service/coopang_Category/AIcategoryMapper.js';
import { updateCoopangRegisterFailStatus } from '../repository/discard.js';

const router = express.Router();

/**
 * 옵션 매핑 필요 상품 목록 조회 라우터
 * GET /reg/coopangmapping/products
 * 
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 * @returns {Promise<void>}
 */
router.get('/products', async (req, res) => {
  try {
    const userid = req.user.userid;
    
    if (!userid) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.'
      });
    }
    
    const products = await getOptionMappingRequiredProducts(userid);
    
    return res.status(200).json({
      success: true,
      message: '옵션 매핑 필요 상품 목록 조회 성공',
      count: products.length,
      products: products
    });
  } catch (error) {
    console.error('쿠팡 매핑 상품 목록 API 오류:', error);
    
    return res.status(500).json({
      success: false,
      message: '상품 목록 조회 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 특정 상품의 매핑 데이터 조회 라우터
 * GET /reg/coopangmapping/product/:productid
 * 
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 * @returns {Promise<void>}
 */
router.get('/product/:productid', async (req, res) => {
  try {
    const userid = req.user.userid;
    const { productid } = req.params;
    
    if (!userid) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.'
      });
    }
    
    if (!productid) {
      return res.status(400).json({
        success: false,
        message: '상품 ID가 필요합니다.'
      });
    }
    
    // 상품 정보 조회
    const productInfo = await getProductPreRegisterData(userid, productid);
    
    if (!productInfo) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다.'
      });
    }
    
    // 쿠팡 카테고리 ID 조회
    const coupangCategoryId = await getProductCoupangCategoryId(userid, productid);
    
    if (!coupangCategoryId) {
      return res.status(400).json({
        success: false,
        message: '상품의 쿠팡 카테고리 정보를 찾을 수 없습니다.'
      });
    }
    
    // 카테고리 속성 정보 조회
    const categoryAttributes = await getCoupangCategoryEssentials(
      process.env.COOPANG_ACCESS_KEY,
      process.env.COOPANG_SECRET_KEY, 
      coupangCategoryId
    );
    
    return res.status(200).json({
      success: true,
      message: '상품 매핑 데이터 조회 성공',
      data: {
        productInfo: productInfo,
        categoryAttributes: categoryAttributes.success ? categoryAttributes.data : null
      }
    });
  } catch (error) {
    console.error('쿠팡 매핑 상품 상세 API 오류:', error);
    
    return res.status(500).json({
      success: false,
      message: '상품 매핑 데이터 조회 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 수동 옵션 매핑 저장 라우터
 * POST /reg/coopangmapping/manual/:productid
 * 
 * @param {Object} req - 요청 객체 (body에 mappedJson 포함)
 * @param {Object} res - 응답 객체
 * @returns {Promise<void>}
 */
router.post('/manual/:productid', async (req, res) => {
  try {
    const userid = req.user.userid;
    const { productid } = req.params;
    const { mappedJson } = req.body;
    
    if (!userid) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.'
      });
    }
    
    if (!productid) {
      return res.status(400).json({
        success: false,
        message: '상품 ID가 필요합니다.'
      });
    }
    
    if (!mappedJson) {
      return res.status(400).json({
        success: false,
        message: '매핑된 JSON 데이터가 필요합니다.'
      });
    }
    
    // 매핑 정보 업데이트
    const updateSuccess = await updateMappedJsonData(userid, productid, mappedJson);
    
    if (!updateSuccess) {
      return res.status(500).json({
        success: false,
        message: '매핑 정보 저장에 실패했습니다.'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: '수동 옵션 매핑이 저장되었습니다.'
    });
  } catch (error) {
    console.error('수동 옵션 매핑 저장 API 오류:', error);
    
    return res.status(500).json({
      success: false,
      message: '수동 옵션 매핑 저장 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 자동 옵션 매핑 처리 라우터
 * POST /reg/coopangmapping/auto
 * 
 * @param {Object} req - 요청 객체 (body에 productIds 배열 포함)
 * @param {Object} res - 응답 객체
 * @returns {Promise<void>}
 */
router.post('/auto', async (req, res) => {
  try {
    const userid = req.user.userid;
    const { productIds } = req.body;
    
    if (!userid) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.'
      });
    }
    
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '상품 ID 배열이 필요합니다.'
      });
    }
    
    // 0.1초 간격으로 병렬 처리
    const processProduct = async (productid, index) => {
      // 0.1초 간격으로 처리
      await new Promise(resolve => setTimeout(resolve, index * 100));
      
      try {
        // 상품 정보 조회
        const productInfo = await getProductPreRegisterData(userid, productid);
        if (!productInfo || !productInfo.json_data) {
          return {
            productid,
            success: false,
            error: '상품 정보를 찾을 수 없습니다.'
          };
        }
        
        // 쿠팡 카테고리 ID 조회
        const coupangCategoryId = await getProductCoupangCategoryId(userid, productid);
        if (!coupangCategoryId) {
          return {
            productid,
            success: false,
            error: '쿠팡 카테고리 정보를 찾을 수 없습니다.'
          };
        }
        
        // 사용자의 최대 옵션 개수 설정 조회
        const maxOptionCount = await getUserMaxOptionCount(userid);
        
        // AI 매핑 처리
        const mappingResult = await mapOptionsForCoupang(
          productInfo.json_data,
          process.env.COOPANG_ACCESS_KEY,
          process.env.COOPANG_SECRET_KEY,
          coupangCategoryId,
          maxOptionCount
        );
        
        if (!mappingResult.success) {
          return {
            productid,
            success: false,
            error: mappingResult.message
          };
        }
        
        // 매핑 정보 저장
        const updateSuccess = await updateMappedJsonData(
          userid, 
          productid, 
          mappingResult.data.updatedProductData
        );
        
        if (updateSuccess) {
          return {
            productid,
            success: true,
            message: '자동 옵션 매핑이 완료되었습니다.'
          };
        } else {
          return {
            productid,
            success: false,
            error: '매핑 정보 저장에 실패했습니다.'
          };
        }
      } catch (error) {
        console.error(`상품 ${productid} 자동 매핑 오류:`, error);
        return {
          productid,
          success: false,
          error: error.message
        };
      }
    };
    
    // 모든 상품을 병렬로 처리
    const results = await Promise.allSettled(
      productIds.map((productid, index) => processProduct(productid, index))
    );
    
    // Promise.allSettled 결과를 변환
    const processedResults = results.map(result => 
      result.status === 'fulfilled' ? result.value : {
        productid: 'unknown',
        success: false,
        error: result.reason?.message || '처리 중 오류 발생'
      }
    );
    
    const successCount = processedResults.filter(r => r.success).length;
    
    return res.status(200).json({
      success: true,
      message: `자동 옵션 매핑 완료: ${successCount}/${productIds.length}개 성공`,
      totalProcessed: productIds.length,
      successCount: successCount,
      results: processedResults
    });
  } catch (error) {
    console.error('자동 옵션 매핑 API 오류:', error);
    
    return res.status(500).json({
      success: false,
      message: '자동 옵션 매핑 처리 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 상품 등록 포기 처리 라우터
 * POST /reg/coopangmapping/discard
 * 
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 * @returns {Promise<void>}
 */
router.post('/discard', async (req, res) => {
  try {
    const userid = req.user.userid;
    const { productId } = req.body;
    
    if (!userid) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.'
      });
    }
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: '상품 ID가 필요합니다.'
      });
    }
    
    // 등록 실패 상태로 업데이트
    const result = await updateCoopangRegisterFailStatus(userid, productId);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: '상품 등록 포기 처리에 실패했습니다.'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: "상품을 성공적으로 폐기했습니다."
    });
  } catch (error) {
    console.error('상품 등록 포기 처리 API 오류:', error);
    
    return res.status(500).json({
      success: false,
      message: '상품 등록 포기 처리 중 오류가 발생했습니다.'
    });
  }
});

export default router;
