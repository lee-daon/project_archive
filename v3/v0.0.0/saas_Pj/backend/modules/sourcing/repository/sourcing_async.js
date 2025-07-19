import { promisePool } from '../../../common/utils/connectDB.js';

/**
 * 소싱 상태를 pending으로 설정합니다
 * @param {number} userid - 사용자 ID
 * @param {number|string} productid - 상품 ID
 * @param {number} commitcode - 그룹 코드
 * @returns {Promise<boolean>} - 성공 여부
 */
export const setSourcingPending = async (userid, productid, commitcode) => {
  try {
    const connection = await promisePool.getConnection();
    
    try {
      // 기존 레코드 확인
      const [rows] = await connection.execute(
        'SELECT * FROM sourcing_status WHERE userid = ? AND productid = ?',
        [userid, productid]
      );
      
      if (rows.length > 0) {
        // 기존 레코드 업데이트
        await connection.execute(
          'UPDATE sourcing_status SET status = ?, commitcode = ?, updated_at = CURRENT_TIMESTAMP WHERE userid = ? AND productid = ?',
          ['pending', commitcode, userid, productid]
        );
      } else {
        // 새 레코드 생성
        await connection.execute(
          'INSERT INTO sourcing_status (userid, productid, status, commitcode) VALUES (?, ?, ?, ?)',
          [userid, productid, 'pending', commitcode]
        );
      }
      
      return true;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(`소싱 상태(pending) 설정 중 오류 [userid: ${userid}, productid: ${productid}]:`, error);
    return false;
  }
};

/**
 * 여러 상품의 소싱 상태를 pending으로 설정합니다
 * @param {number} userid - 사용자 ID
 * @param {Array<number|string>} productids - 상품 ID 배열
 * @param {number} commitCode - 그룹 코드
 * @returns {Promise<{success: boolean, count: number}>} - 성공 여부와 성공한 개수
 */
export const setBatchSourcingPending = async (userid, productids, commitCode) => {
  if (!Array.isArray(productids) || productids.length === 0) {
    return { success: false, count: 0 };
  }
  
  if (commitCode === undefined || commitCode === null) {
    return { success: false, count: 0 };
  }
  
  try {
    const connection = await promisePool.getConnection();
    let successCount = 0;
    
    try {
      // 트랜잭션 시작
      await connection.beginTransaction();
      
      // 각 상품에 대해 상태 설정
      for (const productid of productids) {
        try {
          // 기존 레코드 확인
          const [rows] = await connection.execute(
            'SELECT * FROM sourcing_status WHERE userid = ? AND productid = ?',
            [userid, productid]
          );
          
          if (rows.length > 0) {
            // 기존 레코드 업데이트
            await connection.execute(
              'UPDATE sourcing_status SET status = ?, commitcode = ?, updated_at = CURRENT_TIMESTAMP WHERE userid = ? AND productid = ?',
              ['pending', commitCode, userid, productid]
            );
          } else {
            // 새 레코드 생성
            await connection.execute(
              'INSERT INTO sourcing_status (userid, productid, status, commitcode) VALUES (?, ?, ?, ?)',
              [userid, productid, 'pending', commitCode]
            );
          }
          
          successCount++;
        } catch (err) {
          console.error(`상품 ID ${productid} 상태 설정 중 오류:`, err);
          // 개별 오류는 무시하고 계속 진행
        }
      }
      
      // 트랜잭션 커밋
      await connection.commit();
      
      return { success: true, count: successCount };
    } catch (error) {
      // 오류 발생 시 롤백
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('일괄 소싱 상태 설정 중 오류:', error);
    return { success: false, count: 0 };
  }
};
