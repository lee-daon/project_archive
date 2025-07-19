import { promisePool } from '../../../common/utils/connectDB.js';

/**
 * pre_register 테이블에서 상품 데이터 조회
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @returns {Object} - 조회 결과
 */
export async function getProductData(userid, productid) {
  try {
    const [rows] = await promisePool.execute(
      'SELECT json_data FROM pre_register WHERE userid = ? AND productid = ?',
      [userid, productid]
    );

    if (rows.length === 0) {
      return {
        success: false,
        message: '해당 상품을 찾을 수 없습니다.',
        data: null
      };
    }

    return {
      success: true,
      message: '상품 데이터를 성공적으로 조회했습니다.',
      data: rows[0].json_data
    };

  } catch (error) {
    console.error('DB 조회 오류:', error);
    return {
      success: false,
      message: '데이터베이스 조회 중 오류가 발생했습니다.',
      data: null
    };
  }
}

/**
 * pre_register 테이블에서 상품 리스트 조회
 * @param {number} userid - 사용자 ID
 * @param {boolean} allowDuplicates - 중복 허용 여부
 * @param {string} groupCode - 그룹 코드 (선택사항)
 * @returns {Object} - 조회 결과
 */
export async function getProductList(userid, allowDuplicates = false, groupCode = null) {
  try {
    let query = 'SELECT productid FROM pre_register WHERE userid = ?';
    const params = [userid];

    // allowDuplicates = false인 경우 api_requested = false 조건 추가
    if (!allowDuplicates) {
      query += ' AND api_requested = FALSE';
    }

    // 그룹 코드 조건 추가
    if (groupCode) {
      query += ' AND product_group_code = ?';
      params.push(groupCode);
    }

    // 중복 제거 (allowDuplicates가 false인 경우)
    if (!allowDuplicates) {
      query += ' GROUP BY productid';
    }

    // ORDER BY와 LIMIT는 allowDuplicates=true이고 groupCode가 없을 때만 적용
    if (allowDuplicates && !groupCode) {
      query += ' ORDER BY created_at DESC LIMIT 10';
    } else {
      // 다른 경우에는 LIMIT만 적용
      query += ' LIMIT 10';
    }

    const [rows] = await promisePool.query(query, params);

    const productIds = rows.map(row => row.productid);

    // allowDuplicates = false인 경우 조회된 상품들의 api_requested를 true로 업데이트
    if (!allowDuplicates && productIds.length > 0) {
      const updateQuery = 'UPDATE pre_register SET api_requested = TRUE WHERE userid = ? AND productid IN (' + 
                          productIds.map(() => '?').join(',') + ')';
      const updateParams = [userid, ...productIds];
      
      await promisePool.query(updateQuery, updateParams);
      console.log(`사용자 ${userid}의 ${productIds.length}개 상품 api_requested를 true로 업데이트`);
    }

    return {
      success: true,
      message: `${productIds.length}개의 상품을 조회했습니다.`,
      data: productIds
    };

  } catch (error) {
    console.error('상품 리스트 조회 오류:', error);
    return {
      success: false,
      message: '상품 리스트 조회 중 오류가 발생했습니다.',
      data: []
    };
  }
}
