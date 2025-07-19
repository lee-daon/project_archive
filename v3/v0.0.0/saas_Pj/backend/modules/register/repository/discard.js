import { promisePool } from '../../../common/utils/connectDB.js';

// 상품들을 폐기 상태로 변경
export const updateDiscardStatus = async (userid, productIds) => {
  if (productIds.length === 0) {
    return {
      success: true,
      discardedCount: 0,
      results: []
    };
  }
  
  const placeholders = productIds.map(() => '?').join(',');
  const connection = await promisePool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // 1. status 테이블에서 discarded를 true로 변경
    const statusQuery = `
      UPDATE status 
      SET discarded = true
      WHERE userid = ? AND productid IN (${placeholders})
    `;
    const [statusResult] = await connection.execute(statusQuery, [userid, ...productIds]);
    
    // 2. coopang_register_management 테이블에서 해당 상품 삭제
    const coopangDeleteQuery = `
      DELETE FROM coopang_register_management
      WHERE userid = ? AND productid IN (${placeholders})
    `;
    await connection.execute(coopangDeleteQuery, [userid, ...productIds]);
    
    // 3. naver_register_management 테이블에서 해당 상품 삭제
    const naverDeleteQuery = `
      DELETE FROM naver_register_management
      WHERE userid = ? AND productid IN (${placeholders})
    `;
    await connection.execute(naverDeleteQuery, [userid, ...productIds]);
    
    // 4. elevenstore_register_management 테이블에서 해당 상품 삭제
    const elevenstoreDeleteQuery = `
      DELETE FROM elevenstore_register_management
      WHERE userid = ? AND productid IN (${placeholders})
    `;
    await connection.execute(elevenstoreDeleteQuery, [userid, ...productIds]);
    
    // 5. esm_register_management 테이블에서 해당 상품 삭제
    const esmDeleteQuery = `
      DELETE FROM esm_register_management
      WHERE userid = ? AND productid IN (${placeholders})
    `;
    await connection.execute(esmDeleteQuery, [userid, ...productIds]);
    
    await connection.commit();
    
    // 각 상품별 결과 생성
    const results = productIds.map(productId => ({
      productId: productId,
      success: true,
      message: '폐기 완료'
    }));
    
    return {
      success: true,
      discardedCount: statusResult.affectedRows,
      results: results
    };
  } catch (error) {
    await connection.rollback();
    console.error('상품 폐기 처리 중 오류:', error);
    throw error;
  } finally {
    connection.release();
  }
};

// 쿠팡 등록 실패 상태로 변경
export const updateCoopangRegisterFailStatus = async (userid, productid) => {
  const connection = await promisePool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // 1. coopang_register_management 테이블의 status를 fail로 변경
    await connection.execute(`
      UPDATE coopang_register_management 
      SET status = 'fail'
      WHERE userid = ? AND productid = ?
    `, [userid, productid]);
    
    // 2. status 테이블의 coopang_register_failed를 true로 변경
    await connection.execute(`
      UPDATE status 
      SET coopang_register_failed = TRUE
      WHERE userid = ? AND productid = ?
    `, [userid, productid]);
    
    await connection.commit();
    
    return {
      success: true,
      message: '쿠팡 등록 실패 상태 업데이트 완료'
    };
  } catch (error) {
    await connection.rollback();
    console.error('쿠팡 등록 실패 상태 업데이트 중 오류:', error);
    throw error;
  } finally {
    connection.release();
  }
};
