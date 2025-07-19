import { promisePool } from '../../../common/utils/connectDB.js';

/**
 * 상품의 현재 마진과 최소 마진을 조회
 * @param {number} userid - 사용자 ID
 * @param {string} productid - 상품 ID
 * @param {string} platform - 플랫폼 (coopang, naver, elevenstore)
 * @returns {Promise<Object>} 마진 정보
 */
export async function getMarginInfo(userid, productid, platform) {
  try {
    let tableName, productNumberField, priceField;
    
    if (platform === 'coopang') {
      tableName = 'coopang_register_management';
      productNumberField = 'registered_product_number';
      priceField = 'NULL as currentPrice';
    } else if (platform === 'naver') {
      tableName = 'naver_register_management';
      productNumberField = 'originProductNo';
      priceField = 'NULL as currentPrice';
    } else if (platform === 'elevenstore') {
      tableName = 'elevenstore_register_management';
      productNumberField = 'originProductNo';
      priceField = 'final_main_price as currentPrice, discount_rate as currentDiscountRate';
    } else {
      throw new Error(`지원하지 않는 플랫폼입니다: ${platform}`);
    }
    
    const [rows] = await promisePool.execute(
      `SELECT 
         current_margin,
         minimum_profit_margin,
         ${productNumberField} as productNumber,
         ${priceField}
       FROM ${tableName}
       WHERE userid = ? AND productid = ?`,
      [userid, productid]
    );

    if (rows.length === 0) {
      return {
        success: false,
        message: `${platform} 등록 정보를 찾을 수 없습니다.`,
        error: `No registration info found for userid: ${userid}, productid: ${productid}`
      };
    }

    const marginInfo = rows[0];
    
    return {
      success: true,
      data: {
        currentMargin: marginInfo.current_margin || 0,
        minimumMargin: marginInfo.minimum_profit_margin || 0,
        productNumber: marginInfo.productNumber,
        currentPrice: marginInfo.currentPrice || null,
        currentDiscountRate: marginInfo.currentDiscountRate || 0
      }
    };

  } catch (error) {
    console.error('마진 정보 조회 오류:', error);
    return {
      success: false,
      message: '마진 정보 조회 중 오류가 발생했습니다.',
      error: error.message
    };
  }
}

/**
 * 상품의 현재 마진 업데이트
 * @param {number} userid - 사용자 ID
 * @param {string} productid - 상품 ID
 * @param {string} platform - 플랫폼 (coopang, naver, elevenstore)
 * @param {number} newMargin - 새로운 마진 (퍼센트)
 * @returns {Promise<Object>} 업데이트 결과
 */
export async function updateCurrentMargin(userid, productid, platform, newMargin) {
  try {
    let tableName;
    
    if (platform === 'coopang') {
      tableName = 'coopang_register_management';
    } else if (platform === 'naver') {
      tableName = 'naver_register_management';
    } else if (platform === 'elevenstore') {
      tableName = 'elevenstore_register_management';
    } else {
      throw new Error(`지원하지 않는 플랫폼입니다: ${platform}`);
    }
    
    const [result] = await promisePool.execute(
      `UPDATE ${tableName} 
       SET current_margin = ?, updated_at = NOW()
       WHERE userid = ? AND productid = ?`,
      [newMargin, userid, productid]
    );

    if (result.affectedRows === 0) {
      return {
        success: false,
        message: `${platform} 등록 정보를 찾을 수 없어 마진 업데이트에 실패했습니다.`,
        error: `No rows affected for userid: ${userid}, productid: ${productid}`
      };
    }

    return {
      success: true,
      message: '마진 정보가 성공적으로 업데이트되었습니다.',
      data: {
        newMargin,
        affectedRows: result.affectedRows
      }
    };

  } catch (error) {
    console.error('마진 업데이트 오류:', error);
    return {
      success: false,
      message: '마진 업데이트 중 오류가 발생했습니다.',
      error: error.message
    };
  }
}

/**
 * 여러 상품의 마진 정보를 일괄 조회
 * @param {number} userid - 사용자 ID
 * @param {string[]} productIds - 상품 ID 배열
 * @param {string} platform - 플랫폼 (coopang, naver, elevenstore)
 * @returns {Promise<Object>} 마진 정보 배열
 */
export async function getMultipleMarginInfo(userid, productIds, platform) {
  try {
    if (!productIds || productIds.length === 0) {
      return {
        success: true,
        data: []
      };
    }

    let tableName, productNumberField, priceField;
    
    if (platform === 'coopang') {
      tableName = 'coopang_register_management';
      productNumberField = 'registered_product_number';
      priceField = 'NULL as currentPrice';
    } else if (platform === 'naver') {
      tableName = 'naver_register_management';
      productNumberField = 'originProductNo';
      priceField = 'NULL as currentPrice';
    } else if (platform === 'elevenstore') {
      tableName = 'elevenstore_register_management';
      productNumberField = 'originProductNo';
      priceField = 'final_main_price as currentPrice, discount_rate as currentDiscountRate';
    } else {
      throw new Error(`지원하지 않는 플랫폼입니다: ${platform}`);
    }
    
    const placeholders = productIds.map(() => '?').join(',');
    
    const [rows] = await promisePool.execute(
      `SELECT 
         productid,
         current_margin,
         minimum_profit_margin,
         ${productNumberField} as productNumber,
         ${priceField}
       FROM ${tableName}
       WHERE userid = ? AND productid IN (${placeholders})`,
      [userid, ...productIds]
    );

    const marginInfos = rows.map(row => ({
      productid: row.productid,
      currentMargin: row.current_margin || 0,
      minimumMargin: row.minimum_profit_margin || 0,
      productNumber: row.productNumber,
      currentPrice: row.currentPrice || null,
      currentDiscountRate: row.currentDiscountRate || 0
    }));

    return {
      success: true,
      data: marginInfos
    };

  } catch (error) {
    console.error('여러 마진 정보 조회 오류:', error);
    return {
      success: false,
      message: '마진 정보 일괄 조회 중 오류가 발생했습니다.',
      error: error.message
    };
  }
}

/**
 * 11번가 상품의 할인율 업데이트
 * @param {number} userid - 사용자 ID
 * @param {string} productid - 상품 ID
 * @param {number} newDiscountRate - 새로운 할인율 (%)
 * @returns {Promise<Object>} 업데이트 결과
 */
export async function updateElevenstoreDiscountRate(userid, productid, newDiscountRate) {
  try {
    const [result] = await promisePool.execute(
      `UPDATE elevenstore_register_management 
       SET discount_rate = ?, updated_at = NOW()
       WHERE userid = ? AND productid = ?`,
      [newDiscountRate, userid, productid]
    );

    if (result.affectedRows === 0) {
      return {
        success: false,
        message: '11번가 등록 정보를 찾을 수 없어 할인율 업데이트에 실패했습니다.',
        error: `No rows affected for userid: ${userid}, productid: ${productid}`
      };
    }

    console.log(`11번가 할인율 업데이트 완료 - userid: ${userid}, productid: ${productid}, newDiscountRate: ${newDiscountRate}%`);

    return {
      success: true,
      message: '11번가 할인율이 성공적으로 업데이트되었습니다.',
      data: {
        newDiscountRate,
        affectedRows: result.affectedRows
      }
    };

  } catch (error) {
    console.error('11번가 할인율 업데이트 오류:', error);
    return {
      success: false,
      message: '11번가 할인율 업데이트 중 오류가 발생했습니다.',
      error: error.message
    };
  }
}
