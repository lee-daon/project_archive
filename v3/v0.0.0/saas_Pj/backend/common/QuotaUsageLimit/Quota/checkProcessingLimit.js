import { promisePool } from '../../utils/connectDB.js';
import { updateTotalTranslatedImages } from '../Usage/updateUsage.js';
import logger from '../../utils/logger.js';
/**
 * 사용 로그 기록 함수
 * @param {number} userId - 사용자 ID
 * @param {string} usageType - 사용 유형
 * @param {number} usageAmount - 사용 수량
 * @param {string} comment - 사용 내용 설명
 */
async function logUsage(userId, usageType, usageAmount, comment = null) {
  try {
    await promisePool.execute(
      `INSERT INTO usage_log (userid, usage_type, usage_amount, usage_time, comment) VALUES (?, ?, ?, NOW(), ?)`,
      [userId, usageType, usageAmount, comment]
    );
  } catch (error) {
    logger.error(error, { userId });
  }
}

/**
 * 가공 제한 검사 및 할당량 차감 함수
 * @param {Object} params - 파라미터 객체
 * @param {number} params.userId - 유저 ID
 * @param {number} params.productCount - 상품 개수
 * @param {boolean} params.brandFiltering - 브랜드 필터링 여부
 * @param {boolean} params.mainImageTranslation - 메인 이미지 번역 여부
 * @param {boolean} params.optionImageTranslation - 옵션 이미지 번역 여부
 * @param {boolean} params.detailImageTranslation - 상세 이미지 번역 여부
 * @param {boolean} params.nukkiImages - 누끼 이미지 여부
 * @returns {Promise<Object>} 성공 시 { success: true }, 실패 시 { success: false, error: string, statusCode: number }
 */
export async function checkProcessingLimit({
  userId,
  productCount,
  brandFiltering,
  mainImageTranslation,
  optionImageTranslation,
  detailImageTranslation,
  nukkiImages
}) {
  const connection = await promisePool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // 사용자 통계 및 설정 조회
    const [userStats] = await connection.execute(
      `SELECT daily_image_processing_remaining, image_processing_allinone_count, 
              image_processing_single_count, deep_brand_filter_count
       FROM user_statistics 
       WHERE userid = ?`,
      [userId]
    );
    
    const [extraSettings] = await connection.execute(
      `SELECT use_deep_ban 
       FROM extra_setting 
       WHERE userid = ?`,
      [userId]
    );
    
    if (userStats.length === 0) {
      await connection.rollback();
      return { success: false, error: '사용자 통계를 찾을 수 없습니다.', statusCode: 404 };
    }
    
    const stats = userStats[0];
    const useDeepBan = extraSettings.length > 0 ? extraSettings[0].use_deep_ban : false;
    
    // 1. 딥브랜드 필터링 검사
    if (brandFiltering && useDeepBan) {
      if (stats.deep_brand_filter_count < productCount) {
        await connection.rollback();
        return { 
          success: false, 
          error: '딥필터링 이용권을 모두 사용하셨습니다', 
          statusCode: 429 
        };
      }
    }
    
    // 2. 이미지 번역 할당량 검사 (daily -> allinone -> single 순)
    let remainingProducts = productCount;
    let usedDaily = 0;
    let usedAllinone = 0;
    let usedSingle = 0;
    
    // daily 사용 (상품수만큼)
    if (remainingProducts > 0 && stats.daily_image_processing_remaining > 0) {
      usedDaily = Math.min(remainingProducts, stats.daily_image_processing_remaining);
      remainingProducts -= usedDaily;
    }
    
    // allinone 사용 (상품수만큼)
    if (remainingProducts > 0 && stats.image_processing_allinone_count > 0) {
      usedAllinone = Math.min(remainingProducts, stats.image_processing_allinone_count);
      remainingProducts -= usedAllinone;
    }
    
    // 3. 남은 상품에 대해 single에서 이미지 개수 계산
    let totalSingleImages = 0;
    if (remainingProducts > 0) {
      for (let i = 0; i < remainingProducts; i++) {
        let productImageCount = 0;
        
        if (mainImageTranslation) {
          // 메인 이미지: 4~5장 랜덤
          const mainImageCount = Math.floor(Math.random() * 2) + 4; // 4 또는 5
          productImageCount += mainImageCount;
        }
        
        if (optionImageTranslation) {
          // 옵션 이미지: 12~22장 랜덤
          const optionImageCount = Math.floor(Math.random() * 11) + 12; // 12~22
          productImageCount += optionImageCount;
        }
        
        if (detailImageTranslation) {
          // 상세 이미지: 3~7장 랜덤
          const detailImageCount = Math.floor(Math.random() * 5) + 3; // 3~7
          productImageCount += detailImageCount;
        }
        
        if (nukkiImages) {
          // 누끼 이미지: 1장
          productImageCount += 1;
        }
        
        totalSingleImages += productImageCount;
      }
      
      // single 할당량 검사
      if (stats.image_processing_single_count < totalSingleImages) {
        await connection.rollback();
        return { 
          success: false, 
          error: '이미지 번역을 모두 사용했습니다', 
          statusCode: 429 
        };
      }
      usedSingle = totalSingleImages;
    }
    
    // 4. 할당량 차감
    const updates = [];
    
    // 딥브랜드 필터링 차감
    if (brandFiltering && useDeepBan) {
      updates.push(`deep_brand_filter_count = deep_brand_filter_count - ${productCount}`);
    }
    
    // 이미지 번역 차감
    if (usedDaily > 0) {
      updates.push(`daily_image_processing_remaining = daily_image_processing_remaining - ${usedDaily}`);
    }
    if (usedAllinone > 0) {
      updates.push(`image_processing_allinone_count = image_processing_allinone_count - ${usedAllinone}`);
    }
    if (usedSingle > 0) {
      updates.push(`image_processing_single_count = image_processing_single_count - ${usedSingle}`);
    }
    
    if (updates.length > 0) {
      await connection.execute(
        `UPDATE user_statistics SET ${updates.join(', ')} WHERE userid = ?`,
        [userId]
      );
    }
    
    await connection.commit();
    
    // 5. 사용 로그 기록 (트랜잭션 외부에서 실행)
    if (brandFiltering && useDeepBan) {
      await logUsage(userId, 'deep_brand_filter', productCount, `딥브랜드 필터링 - ${productCount}개 상품 처리`);
    }
    
    // 실제 이미지 장수 계산
    let imagesPerProduct = 0;
    let imageTypes = [];
    if (mainImageTranslation) {
      imagesPerProduct += 5;
      imageTypes.push('메인이미지(5장)');
    }
    if (optionImageTranslation) {
      imagesPerProduct += 5;
      imageTypes.push('옵션이미지(5장)');
    }
    if (detailImageTranslation) {
      imagesPerProduct += 17;
      imageTypes.push('상세이미지(17장)');
    }
    if (nukkiImages) {
      imagesPerProduct += 1;
      imageTypes.push('누끼이미지(1장)');
    }
    
    const totalImageUsage = (usedDaily * imagesPerProduct) + (usedAllinone * imagesPerProduct) + usedSingle;
    if (totalImageUsage > 0) {
      const usageComment = `이미지 처리 - ${imageTypes.join(', ')} | Daily:${usedDaily}개 Allinone:${usedAllinone}개 Single:${usedSingle}장`;
      await logUsage(userId, 'image_processing', totalImageUsage, usageComment);
      
      // 누적 이미지 번역수 업데이트
      await updateTotalTranslatedImages(userId, totalImageUsage);
    }
    
    return { 
      success: true,
      usedQuota: {
        deepBrandFilter: brandFiltering && useDeepBan ? productCount : 0,
        dailyImage: usedDaily,
        allinoneImage: usedAllinone,
        singleImage: usedSingle
      }
    };
    
  } catch (error) {
    await connection.rollback();
    logger.error(error, { userId });
    return { 
      success: false, 
      error: '가공 제한 검사 중 오류가 발생했습니다', 
      statusCode: 500 
    };
  } finally {
    connection.release();
  }
}
