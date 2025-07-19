import { promisePool } from '../../../common/utils/connectDB.js';
import { DB_SETTINGS } from '../../../common/config/settings.js';

/**
 * 기존에 저장된 상품 데이터가 있는지 확인하고, 있다면 해당 데이터를 현재 사용자에게 복사
 * @param {string|number} productId - 상품 ID
 * @param {number} userid - 현재 사용자 ID
 * @param {string} productName - 상품명 (job에서 전달받은 이름)
 * @param {string|null} sameCategoryId - 동일 카테고리 ID
 * @returns {Promise<Object>} - 복사 결과 객체
 */
export async function copyExistingProductData(productId, userid, productName, sameCategoryId = null) {
  const connection = await promisePool.getConnection();
  
  try {
    // 1. 기존 데이터 존재 여부 확인 (설정된 기간 내)
    const [existingData] = await connection.execute(
      `SELECT pd.*, cm.catname
       FROM products_detail pd
       JOIN categorymapping cm ON pd.catid = cm.catid
       WHERE pd.productid = ? 
       AND pd.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       LIMIT 1`,
      [productId, DB_SETTINGS.PRODUCT_DATA_REUSE_DAYS]
    );

    if (existingData.length === 0) {
      return { canReuse: false, message: '재사용 가능한 기존 데이터가 없습니다.' };
    }

    const sourceData = existingData[0];
    console.log(`상품 ${productId}에 대한 기존 데이터 발견, 복사 시작 [userid: ${userid}]`);

    await connection.beginTransaction();

    // 복사 시 사용할 카테고리 ID 결정
    let targetCatId;
    if (sameCategoryId) {
      // 1. 요청 시 동일 카테고리 ID가 제공된 경우, 해당 ID를 사용
      targetCatId = sameCategoryId;
    } else if (sourceData.catid && String(sourceData.catid).length === 12) {
      // 2. 동일 ID가 없고, 원본 데이터의 catid가 12자리(사용자 지정 그룹)인 경우,
      //    그룹에 속하지 않는 단일 상품이므로 새로운 15자리 임시 ID 생성
      const min = 100000000000000; // 10^14
      const max = 999999999999999; // 10^15 - 1
      targetCatId = String(Math.floor(Math.random() * (max - min + 1)) + min);
    } else {
      // 3. 그 외의 경우(일반 catid 또는 15자리 임시 catid), 원본 데이터의 catid를 그대로 사용
      targetCatId = sourceData.catid;
    }

    // 2. insert ignore은 기존에 있으면 무시, 새로운 데이터만 추가
    await connection.execute(
      `INSERT IGNORE INTO categorymapping (userid, catid, catname, coopang_cat_id, naver_cat_id)
       VALUES (?, ?, ?, NULL, NULL)`,
      [userid, targetCatId, sourceData.catname]
    );

    // 3. products_detail 테이블 복사 (사용자별, productName으로 title_translated 업데이트)
    await connection.execute(
      `INSERT INTO products_detail 
       (userid, productid, title_raw, title_translated, catid, brand_name, 
        brand_name_translated, detail_url, delivery_fee, sellerid, shopid, video, video_thumbnail)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
       title_raw = VALUES(title_raw),
       title_translated = VALUES(title_translated)`,
      [
        userid, 
        productId, 
        sourceData.title_raw,
        productName || sourceData.title_translated,
        targetCatId,
        sourceData.brand_name,
        sourceData.brand_name_translated, 
        sourceData.detail_url, 
        sourceData.delivery_fee,
        sourceData.sellerid, 
        sourceData.shopid, 
        sourceData.video, 
        sourceData.video_thumbnail
      ]
    );

    // 4. ban_seller 테이블 복사 (사용자별) - INSERT IGNORE로 중복시 기존값 유지
    if (sourceData.sellerid) {
      await connection.execute(
        `INSERT IGNORE INTO ban_seller (userid, sellerid, ban)
         VALUES (?, ?, ?)`,
        [userid, sourceData.sellerid, false]
      );
    }

    // 5. ban_shop 테이블 복사 (사용자별) - INSERT IGNORE로 중복시 기존값 유지
    if (sourceData.shopid) {
      await connection.execute(
        `INSERT IGNORE INTO ban_shop (userid, shopid, ban)
         VALUES (?, ?, ?)`,
        [userid, sourceData.shopid, false]
      );
    }

    // 6. 공통 테이블들은 이미 존재하므로 추가 작업 불필요
    // - item_images_raw: 원본 이미지 (공통 테이블)
    // - item_images_des_raw: 상세 이미지 (공통 테이블)  
    // - properties: 상품 속성 (공통 테이블)
    // - skus: SKU 정보 (공통 테이블)
    // - product_options: 옵션 정보 (공통 테이블)

    await connection.commit();
    console.log(`상품 ${productId} 기존 데이터 복사 완료 [userid: ${userid}]`);

    return {
      canReuse: true,
      success: true,
      message: '기존 데이터를 성공적으로 복사했습니다.',
      data: {
        productId,
        productName: productName || sourceData.title_translated,
        sellerId: sourceData.sellerid,
        shopId: sourceData.shopid,
        sourceCreatedAt: sourceData.created_at
      }
    };

  } catch (error) {
    await connection.rollback();
    console.error(`상품 ${productId} 기존 데이터 복사 중 오류 [userid: ${userid}]:`, error);
    
    return {
      canReuse: false,
      success: false,
      message: `기존 데이터 복사 중 오류가 발생했습니다: ${error.message}`
    };
  } finally {
    connection.release();
  }
}

/**
 * 상품이 기존에 처리된 적이 있는지만 확인 (복사는 하지 않음)
 * @param {string|number} productId - 상품 ID
 * @returns {Promise<boolean>} - 재사용 가능 여부
 */
export async function checkExistingProductData(productId) {
  const connection = await promisePool.getConnection();
  
  try {
    const [result] = await connection.execute(
      `SELECT 1 FROM products_detail 
       WHERE productid = ? 
       AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       LIMIT 1`,
      [productId, DB_SETTINGS.PRODUCT_DATA_REUSE_DAYS]
    );

    return result.length > 0;
  } catch (error) {
    console.error(`상품 ${productId} 기존 데이터 확인 중 오류:`, error);
    return false;
  } finally {
    connection.release();
  }
} 