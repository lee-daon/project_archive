import { promisePool } from '../../../common/utils/connectDB.js';

/**
 * pre_register 테이블에 상품 그룹 정보를 저장하는 함수
 * 
 * @param {number} userid - 사용자 ID
 * @param {Array<number>} productids - 상품 ID 배열
 * @param {string} product_group_code - 상품 그룹 코드
 * @param {string} product_group_memo - 상품 그룹 메모
 * @returns {Promise<Object>} - 처리 결과 객체
 */
export const saveProductGroup = async (userid, productids, product_group_code, product_group_memo) => {
  if (!Array.isArray(productids) || productids.length === 0) {
    return {
      success: false,
      message: '저장할 상품 ID가 제공되지 않았습니다.'
    };
  }

  const connection = await promisePool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    let successCount = 0;
    const errors = [];
    
    // 각 상품에 대해 처리
    for (const productid of productids) {
      try {
        // 기존 데이터 확인
        const [existingRows] = await connection.query(
          'SELECT * FROM pre_register WHERE userid = ? AND productid = ?',
          [userid, productid]
        );
        
        if (existingRows.length > 0) {
          // 기존 데이터 업데이트
          await connection.query(
            `UPDATE pre_register 
             SET product_group_code = ?, product_group_memo = ?
             WHERE userid = ? AND productid = ?`,
            [product_group_code, product_group_memo, userid, productid]
          );
        } else {
          // 새 데이터 생성
          await connection.query(
            `INSERT INTO pre_register 
             (userid, productid, product_group_code, product_group_memo) 
             VALUES (?, ?, ?, ?)`,
            [userid, productid, product_group_code, product_group_memo]
          );
        }
        
        successCount++;
      } catch (error) {
        errors.push({ productid, error: error.message });
        console.error(`상품 ID ${productid} 처리 중 오류:`, error);
      }
    }
    
    await connection.commit();
    
    return {
      success: true,
      message: `${successCount}개 상품의 그룹 정보가 저장되었습니다.`,
      successCount,
      errors: errors.length > 0 ? errors : undefined
    };
  } catch (error) {
    await connection.rollback();
    console.error('상품 그룹 정보 저장 중 오류 발생:', error);
    return {
      success: false,
      message: '상품 그룹 정보 저장 중 오류가 발생했습니다.',
      error: error.message
    };
  } finally {
    connection.release();
  }
};

/**
 * pre_register 테이블에서 상품 그룹 정보를 조회하는 함수
 * 
 * @param {number} userid - 사용자 ID
 * @param {string} product_group_code - 상품 그룹 코드
 * @returns {Promise<Object>} - 조회 결과 객체
 */
export const getProductGroup = async (userid, product_group_code) => {
  try {
    const [rows] = await promisePool.query(
      `SELECT * FROM pre_register 
       WHERE userid = ? AND product_group_code = ?`,
      [userid, product_group_code]
    );
    
    if (rows.length === 0) {
      return {
        success: false,
        message: '상품 그룹 정보를 찾을 수 없습니다.'
      };
    }
    
    // JSON 데이터가 있으면 파싱
    const products = rows.map(row => {
      const result = { ...row };
      if (result.json_data && typeof result.json_data === 'string') {
        try {
          result.json_data = JSON.parse(result.json_data);
        } catch (e) {
          console.warn(`상품 ID ${result.productid}의 JSON 파싱 실패:`, e);
        }
      }
      return result;
    });
    
    return {
      success: true,
      data: products,
      groupInfo: {
        code: product_group_code,
        memo: products[0]?.product_group_memo || '',
        count: products.length
      }
    };
  } catch (error) {
    console.error('상품 그룹 정보 조회 중 오류 발생:', error);
    return {
      success: false,
      message: '상품 그룹 정보 조회 중 오류가 발생했습니다.',
      error: error.message
    };
  }
};
