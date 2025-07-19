import express from 'express';
import { promisePool } from '../utils/connectDB.js';
import logger from '../utils/logger.js';
const router = express.Router();

/**
 * 사용자 통계 및 정보 조회 API
 * GET /qtuslm/getinfo
 */
router.get('/getinfo', async (req, res) => {
  try {
    // JWT에서 userid 가져오기
    const userid = req.user.userid;
    
    if (!userid) {
      return res.status(401).json({
        success: false,
        message: '인증된 사용자 정보를 찾을 수 없습니다.'
      });
    }
    
    // user_statistics와 user_info JOIN 쿼리
    const [results] = await promisePool.execute(`
      SELECT 
        -- user_info 정보
        ui.id,
        ui.plan,
        ui.email,
        ui.expired_at,
        
        -- user_statistics 정보
        us.daily_sourcing_remaining,
        us.daily_image_processing_remaining,
        us.image_processing_allinone_count,
        us.image_processing_single_count,
        us.deep_brand_filter_count,
        us.total_sourced_products,
        us.duplicate_filtered_products,
        us.total_filtered_products,
        us.total_collected_products,
        us.total_processed_products,
        us.total_translated_images,
        us.total_registered_products
      FROM user_info ui
      LEFT JOIN user_statistics us ON ui.userid = us.userid
      WHERE ui.userid = ? AND ui.is_active = TRUE
    `, [userid]);
    
    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      });
    }
    
    const userData = results[0];
    
    // 응답 데이터 구성
    const responseData = {
      success: true,
      data: {
        // 사용자 기본 정보 (id, plan, email만)
        userInfo: {
          id: userData.id,
          plan: userData.plan,
          email: userData.email,
          expired_at: userData.expired_at
        },
        
        // 할당량 정보
        quota: {
          dailySourcingRemaining: userData.daily_sourcing_remaining || 0,
          dailyImageProcessingRemaining: userData.daily_image_processing_remaining || 0,
          imageProcessingAllinoneCount: userData.image_processing_allinone_count || 0,
          imageProcessingSingleCount: userData.image_processing_single_count || 0,
          deepBrandFilterCount: userData.deep_brand_filter_count || 0
        },
        
        // 누적 통계
        statistics: {
          totalSourcedProducts: userData.total_sourced_products || 0,
          duplicateFilteredProducts: userData.duplicate_filtered_products || 0,
          totalFilteredProducts: userData.total_filtered_products || 0,
          totalCollectedProducts: userData.total_collected_products || 0,
          totalProcessedProducts: userData.total_processed_products || 0,
          totalTranslatedImages: userData.total_translated_images || 0,
          totalRegisteredProducts: userData.total_registered_products || 0
        }
      }
    };
    
    res.json(responseData);
    
  } catch (error) {
    logger.error(error, { userid:req.user.userid });
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
