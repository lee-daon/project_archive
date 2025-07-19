import { promisePool } from '../../../common/utils/connectDB.js';

/**
 * 상품 ID를 통해 판매자 차단 처리
 * @param {number} userid - 사용자 ID
 * @param {string} productId - 상품 ID
 * @returns {Object} 처리 결과
 */
export async function banSellerByProductId(userid, productId) {
  const connection = await promisePool.getConnection();
  
  try {
    await connection.beginTransaction();

    // 1. 상품 정보에서 sellerid, shopid 조회
    const [productRows] = await connection.execute(
      `SELECT sellerid, shopid 
       FROM products_detail 
       WHERE userid = ? AND productid = ?`,
      [userid, productId]
    );

    if (productRows.length === 0) {
      return {
        success: false,
        error: 'PRODUCT_NOT_FOUND',
        message: '상품을 찾을 수 없습니다.'
      };
    }

    const { sellerid, shopid } = productRows[0];

    if (!sellerid && !shopid) {
      return {
        success: false,
        error: 'NO_SELLER_INFO',
        message: '판매자 정보가 없습니다.'
      };
    }

    // 2. 이미 차단된 판매자인지 확인
    const [bannedCheck] = await connection.execute(
      `SELECT ban FROM ban_seller WHERE userid = ? AND sellerid = ?`,
      [userid, sellerid]
    );

    if (bannedCheck.length > 0 && bannedCheck[0].ban === 1) {
      return {
        success: false,
        error: 'ALREADY_BANNED',
        message: '이미 차단된 판매자입니다.'
      };
    }

    // 3. ban_seller 테이블에 차단 정보 추가/업데이트
    if (sellerid) {
      await connection.execute(
        `INSERT INTO ban_seller (userid, sellerid, ban) 
         VALUES (?, ?, true) 
         ON DUPLICATE KEY UPDATE 
         ban = true, updated_at = NOW()`,
        [userid, sellerid]
      );
    }

    // 4. ban_shop 테이블에 차단 정보 추가/업데이트
    if (shopid) {
      await connection.execute(
        `INSERT INTO ban_shop (userid, shopid, ban) 
         VALUES (?, ?, true) 
         ON DUPLICATE KEY UPDATE 
         ban = true, updated_at = NOW()`,
        [userid, shopid]
      );
    }

    // 5. 해당 sellerid나 shopid를 가진 모든 상품의 status 업데이트
    let bannedProductsCount = 0;

    if (sellerid) {
      const [sellerProductIds] = await connection.execute(
        `SELECT DISTINCT pd.productid 
         FROM products_detail pd 
         WHERE pd.userid = ? AND pd.sellerid = ?`,
        [userid, sellerid]
      );

      if (sellerProductIds.length > 0) {
        const productIds = sellerProductIds.map(row => row.productid);
        
        // status 테이블에서 seller_banned = true로 업데이트
        await connection.execute(
          `UPDATE status 
           SET seller_banned = true, updated_at = NOW() 
           WHERE userid = ? AND productid IN (${productIds.map(() => '?').join(',')})`,
          [userid, ...productIds]
        );
        
        bannedProductsCount += productIds.length;
      }
    }

    if (shopid) {
      const [shopProductIds] = await connection.execute(
        `SELECT DISTINCT pd.productid 
         FROM products_detail pd 
         WHERE pd.userid = ? AND pd.shopid = ?`,
        [userid, shopid]
      );

      if (shopProductIds.length > 0) {
        const productIds = shopProductIds.map(row => row.productid);
        
        // status 테이블에서 shop_banned = true로 업데이트
        await connection.execute(
          `UPDATE status 
           SET shop_banned = true, updated_at = NOW() 
           WHERE userid = ? AND productid IN (${productIds.map(() => '?').join(',')})`,
          [userid, ...productIds]
        );
      }
    }

    await connection.commit();

    return {
      success: true,
      data: {
        seller_id: sellerid,
        shop_id: shopid,
        banned_products_count: bannedProductsCount
      }
    };

  } catch (error) {
    await connection.rollback();
    console.error('banSellerByProductId 오류:', error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * 사용자별 차단된 판매자 목록 조회
 * @param {number} userid - 사용자 ID
 * @returns {Array} 차단된 판매자 목록
 */
export async function getBannedSellers(userid) {
  try {
    const [rows] = await promisePool.execute(
      `SELECT sellerid, ban, created_at, updated_at 
       FROM ban_seller 
       WHERE userid = ? AND ban = true 
       ORDER BY updated_at DESC`,
      [userid]
    );

    return rows;
  } catch (error) {
    console.error('getBannedSellers 오류:', error);
    throw error;
  }
}

/**
 * 사용자별 차단된 쇼핑몰 목록 조회
 * @param {number} userid - 사용자 ID
 * @returns {Array} 차단된 쇼핑몰 목록
 */
export async function getBannedShops(userid) {
  try {
    const [rows] = await promisePool.execute(
      `SELECT shopid, ban, created_at, updated_at 
       FROM ban_shop 
       WHERE userid = ? AND ban = true 
       ORDER BY updated_at DESC`,
      [userid]
    );

    return rows;
  } catch (error) {
    console.error('getBannedShops 오류:', error);
    throw error;
  }
}
