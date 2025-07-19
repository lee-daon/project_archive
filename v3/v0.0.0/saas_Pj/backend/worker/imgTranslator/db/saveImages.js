import { promisePool } from '../../../common/utils/connectDB.js';

/**
 * 번역된 이미지 저장
 * @param {number} productId - 상품 ID
 * @param {string} orderOrPropPath - 이미지 순서 또는 prop_path (옵션인 경우)
 * @param {string} imageUrl - 번역된 이미지 URL
 * @param {string} imageType - 이미지 타입 (main, detail, option)
 * @returns {Promise<void>}
 */
export const saveTranslatedImage = async (productId, orderOrPropPath, imageUrl, imageType) => {
  try {
    let result;
    
    switch (imageType) {
      case 'main':
        // 순서를 숫자로 변환
        const mainImageOrder = parseInt(orderOrPropPath, 10);
        if (isNaN(mainImageOrder)) {
          throw new Error(`메인 이미지 순서가 올바르지 않습니다: ${orderOrPropPath}`);
        }
        
        // 메인 이미지 저장
        [result] = await promisePool.execute(
          'INSERT INTO item_image_translated (productid, imageorder, imageurl) VALUES (?, ?, ?) ' +
          'ON DUPLICATE KEY UPDATE imageurl = ?',
          [productId, mainImageOrder, imageUrl, imageUrl]
        );
        
        console.log(`메인 이미지 저장 완료 (상품ID: ${productId}, 순서: ${mainImageOrder})`);
        break;
        
      case 'detail':
        // 순서를 숫자로 변환
        const detailImageOrder = parseInt(orderOrPropPath, 10);
        if (isNaN(detailImageOrder)) {
          throw new Error(`상세 이미지 순서가 올바르지 않습니다: ${orderOrPropPath}`);
        }
        
        // 상세 이미지 저장
        [result] = await promisePool.execute(
          'INSERT INTO item_image_des_translated (productid, imageorder, imageurl) VALUES (?, ?, ?) ' +
          'ON DUPLICATE KEY UPDATE imageurl = ?',
          [productId, detailImageOrder, imageUrl, imageUrl]
        );
        
        console.log(`상세 이미지 저장 완료 (상품ID: ${productId}, 순서: ${detailImageOrder})`);
        break;
        
      case 'option':
        // prop_path 그대로 사용 (파싱할 필요 없음)
        
        // 옵션 이미지 저장
        [result] = await promisePool.execute(
          'UPDATE product_options SET imageurl_translated = ? WHERE prop_path = ?',
          [imageUrl, orderOrPropPath]
        );
        
        if (result.affectedRows === 0) {
          throw new Error(`해당 prop_path를 가진 옵션을 찾을 수 없습니다: ${orderOrPropPath}`);
        }
        
        console.log(`옵션 이미지 저장 완료 (상품ID: ${productId}, prop_path: ${orderOrPropPath})`);
        break;
        
      default:
        throw new Error(`지원하지 않는 이미지 타입: ${imageType}`);
    }
    
    return result;
  } catch (error) {
    console.error(`번역된 이미지 저장 중 오류 (${imageType}):`, error);
    throw error;
  }
};

/**
 * 번역된 이미지 일괄 저장
 * @param {Array<{productId: number, orderOrPropPath: string, imageUrl: string, imageType: 'main'|'detail'|'option'}>} images - 저장할 이미지 정보 배열
 */
export const saveTranslatedImagesBulk = async (images) => {
  if (!images || images.length === 0) {
    return;
  }

  const connection = await promisePool.getConnection();
  try {
    await connection.beginTransaction();

    const mainImages = images.filter(img => img.imageType === 'main');
    const detailImages = images.filter(img => img.imageType === 'detail');
    const optionImages = images.filter(img => img.imageType === 'option');

    // 메인 이미지 일괄 저장
    if (mainImages.length > 0) {
      const values = mainImages.map(img => [img.productId, parseInt(img.orderOrPropPath, 10), img.imageUrl]);
      const sql = 'INSERT INTO item_image_translated (productid, imageorder, imageurl) VALUES ? ON DUPLICATE KEY UPDATE imageurl = VALUES(imageurl)';
      await connection.query(sql, [values]);
      console.log(`메인 이미지 ${mainImages.length}개 일괄 저장 완료.`);
    }

    // 상세 이미지 일괄 저장
    if (detailImages.length > 0) {
      const values = detailImages.map(img => [img.productId, parseInt(img.orderOrPropPath, 10), img.imageUrl]);
      const sql = 'INSERT INTO item_image_des_translated (productid, imageorder, imageurl) VALUES ? ON DUPLICATE KEY UPDATE imageurl = VALUES(imageurl)';
      await connection.query(sql, [values]);
      console.log(`상세 이미지 ${detailImages.length}개 일괄 저장 완료.`);
    }

    // 옵션 이미지 일괄 저장 (CASE 문 사용)
    if (optionImages.length > 0) {
      const propPaths = optionImages.map(img => img.orderOrPropPath);
      let sql = 'UPDATE product_options SET imageurl_translated = CASE prop_path ';
      const params = [];
      
      optionImages.forEach(img => {
        sql += 'WHEN ? THEN ? ';
        params.push(img.orderOrPropPath, img.imageUrl);
      });
      
      sql += 'END WHERE prop_path IN (?)';
      params.push(propPaths);
      
      await connection.query(sql, params);
      console.log(`옵션 이미지 ${optionImages.length}개 일괄 저장 완료.`);
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    console.error(`번역된 이미지 일괄 저장 중 오류:`, error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};
