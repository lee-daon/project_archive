import { promisePool } from '../../../common/utils/connectDB.js';

/**
 * pre_register 테이블에 JSON 데이터를 저장하고 processing_status를 ended로 업데이트하는 함수
 * 
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @param {Object} jsonData - 저장할 JSON 데이터
 * @returns {Promise<Object>} 저장 결과 객체
 */
export const saveProductJsonAndUpdateStatus = async (userid, productid, jsonData) => {
  const connection = await promisePool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // 1. pre_register 테이블에 JSON 데이터만 업데이트 (기존 product_group_code, product_group_memo는 유지)
    await connection.query(
      `UPDATE pre_register 
       SET json_data = ?
       WHERE userid = ? AND productid = ?`,
      [JSON.stringify(jsonData), userid, productid]
    );
    
    // 2. processing_status 테이블의 status를 'ended'로 업데이트
    await connection.query(
      `UPDATE processing_status 
       SET status = 'ended' 
       WHERE userid = ? AND productid = ?`,
      [userid, productid]
    );
    
    await connection.commit();
    
    return {
      success: true,
      message: '상품 JSON 데이터가 성공적으로 저장되고 상태가 업데이트되었습니다.'
    };
  } catch (error) {
    await connection.rollback();
    console.error(`JSON 저장 및 상태 업데이트 실패 (userid: ${userid}, productid: ${productid}):`, error);
    
    return {
      success: false,
      message: `JSON 저장 중 오류가 발생했습니다: ${error.message}`,
      error
    };
  } finally {
    connection.release();
  }
};

/**
 * 여러 상품의 JSON 데이터를 배치로 저장하는 함수
 * 
 * @param {number} userid - 사용자 ID
 * @param {Array} productDataList - 상품 데이터 배열 [{productid, jsonData}]
 * @returns {Promise<Object>} 배치 저장 결과 객체
 */
export const batchSaveProductJsonAndUpdateStatus = async (userid, productDataList) => {
  const connection = await promisePool.getConnection();
  let successCount = 0;
  let failedCount = 0;
  const failedProducts = [];
  
  try {
    await connection.beginTransaction();
    
    for (const productData of productDataList) {
      try {
        const { productid, jsonData } = productData;
        
        // pre_register 테이블에 JSON 데이터만 업데이트
        await connection.query(
          `UPDATE pre_register 
           SET json_data = ?
           WHERE userid = ? AND productid = ?`,
          [JSON.stringify(jsonData), userid, productid]
        );
        
        // processing_status 업데이트
        await connection.query(
          `UPDATE processing_status 
           SET status = 'ended' 
           WHERE userid = ? AND productid = ?`,
          [userid, productid]
        );
        
        successCount++;
      } catch (productError) {
        console.error(`상품 ${productData.productid} 저장 실패:`, productError);
        failedCount++;
        failedProducts.push(productData.productid);
      }
    }
    
    await connection.commit();
    
    return {
      success: true,
      message: `배치 저장 완료: 성공 ${successCount}개, 실패 ${failedCount}개`,
      successCount,
      failedCount,
      failedProducts
    };
  } catch (error) {
    await connection.rollback();
    console.error('배치 저장 중 오류:', error);
    
    return {
      success: false,
      message: `배치 저장 중 오류가 발생했습니다: ${error.message}`,
      error,
      successCount,
      failedCount,
      failedProducts
    };
  } finally {
    connection.release();
  }
};
