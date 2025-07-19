import { promisePool } from '../../../common/utils/connectDB.js';

/**
 * 쿠팡 등록 관리 테이블의 매핑 정보 업데이트
 * @param {number} userid - 사용자 ID
 * @param {string} productid - 상품 ID
 * @param {Object} mappedJson - 매핑된 JSON 데이터
 * @returns {Promise<boolean>} 성공 여부
 */
export const updateMappedJsonData = async (userid, productid, mappedJson) => {
  try {
    const query = `
      UPDATE coopang_register_management 
      SET 
        status = 'retry',
        mapped_json = ?,
        use_mapped_json = true
      WHERE userid = ? AND productid = ?
    `;
    
    const [result] = await promisePool.execute(query, [
      JSON.stringify(mappedJson),
      userid,
      productid
    ]);
    
    return result.affectedRows > 0;
  } catch (error) {
    console.error('매핑 정보 업데이트 오류:', error);
    throw new Error('매핑 정보 업데이트 중 오류가 발생했습니다.');
  }
};

/**
 * 쿠팡 등록 관리 테이블에 레코드가 존재하는지 확인
 * @param {number} userid - 사용자 ID
 * @param {string} productid - 상품 ID
 * @returns {Promise<boolean>} 존재 여부
 */
export const checkCoupangRegisterExists = async (userid, productid) => {
  try {
    const query = `
      SELECT COUNT(*) as count 
      FROM coopang_register_management 
      WHERE userid = ? AND productid = ?
    `;
    
    const [rows] = await promisePool.execute(query, [userid, productid]);
    
    return rows[0].count > 0;
  } catch (error) {
    console.error('쿠팡 등록 정보 확인 오류:', error);
    throw new Error('쿠팡 등록 정보 확인 중 오류가 발생했습니다.');
  }
};
