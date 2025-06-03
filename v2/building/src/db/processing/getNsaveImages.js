import { promisePool } from '../connectDB.js';



/**
 * item_images_raw 테이블에서 최대 5장의 이미지 URL을 이미지 순서대로 조회
 * @param {string} productId - 상품의 고유 ID
 * @returns {Promise<Array<string>>} - 이미지 URL 배열
 */
async function getRawImageUrls(productId) {
  const connection = await promisePool.getConnection();
  const [rows] = await connection.execute(
    'SELECT imageurl FROM item_images_raw WHERE productid = ? ORDER BY imageorder ASC LIMIT 5',
    [productId]
  );
  await connection.release();
  return rows.map(row => row.imageurl);
}

/**
 * item_images_des_raw 테이블에서 이미지 URL을 모두 조회한 후,
 * 마지막 1장의 이미지를 제외한 나머지 URL들을 반환
 * @param {string} productId - 상품의 고유 ID
 * @returns {Promise<Array<string>>} - 이미지 URL 배열 (마지막 이미지 제외)
 */
async function getDesImageUrls(productId) {
  const connection = await promisePool.getConnection();
  const [rows] = await connection.execute(
    'SELECT imageurl FROM item_images_des_raw WHERE productid = ? ORDER BY imageorder ASC',
    [productId]
  );
  await connection.release();
  // 조회된 이미지가 있으면 마지막 이미지를 제거
  if (rows.length > 0) {
    rows.pop();
  }
  return rows.map(row => row.imageurl);
}

/**
 * 번역된 이미지 경로를 DB에 저장
 * @param {string} productId - 상품의 고유 ID
 * @param {Array<string>} rawPaths - 번역된 raw 이미지 경로 배열
 * @param {Array<string>} desPaths - 번역된 description 이미지 경로 배열
 * @returns {Promise<Object>} - 저장 결과
 */
async function saveTranslatedImagePaths(productId, rawPaths, desPaths) {
  const connection = await promisePool.getConnection();
  
  try {
    // 트랜잭션 시작
    await connection.beginTransaction();
    
    // 이전 데이터가 있으면 삭제
    await connection.execute(
      'DELETE FROM item_image_translated WHERE productid = ?',
      [productId]
    );
    
    await connection.execute(
      'DELETE FROM item_image_des_translated WHERE productid = ?',
      [productId]
    );
    
    // raw 이미지 경로 저장
    for (let i = 0; i < rawPaths.length; i++) {
      await connection.execute(
        'INSERT INTO item_image_translated (productid, imageurl, imageorder) VALUES (?, ?, ?)',
        [productId, rawPaths[i], i + 1]
      );
    }
    
    // description 이미지 경로 저장
    for (let i = 0; i < desPaths.length; i++) {
      await connection.execute(
        'INSERT INTO item_image_des_translated (productid, imageurl, imageorder) VALUES (?, ?, ?)',
        [productId, desPaths[i], i + 1]
      );
    }
    
    // 트랜잭션 커밋
    await connection.commit();
    
    return {
      success: true,
      rawCount: rawPaths.length,
      desCount: desPaths.length
    };
  } catch (error) {
    // 오류 발생 시 롤백
    await connection.rollback();
    console.error(`번역된 이미지 경로 저장 중 오류 발생: ${error.message}`);
    throw error;
  } finally {
    // 연결 해제
    await connection.release();
  }
}

/**
 * 특정 순서(order)에 해당하는 이미지 URL을 item_images_raw 테이블에서 조회
 * @param {string} productId - 상품의 고유 ID
 * @param {number} order - 조회할 이미지 순서
 * @returns {Promise<string|null>} - 이미지 URL 또는 해당 순서의 이미지가 없는 경우 null
 */
async function getSpecificRawImage(productId, order) {
  const connection = await promisePool.getConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT imageurl FROM item_images_raw WHERE productid = ? AND imageorder = ?',
      [productId, order]
    );
    
    if (rows.length === 0) {
      return null;
    }
    return rows[0].imageurl;
  } catch (error) {
    console.error(`이미지 조회 중 오류 발생: ${error.message}`);
    throw error;
  } finally {
    await connection.release();
  }
}

/**
 * 누끼 이미지 경로를 nukki_image 테이블에 저장
 * @param {string} productId - 상품의 고유 ID
 * @param {string} imagePath - 누끼 이미지 경로
 * @returns {Promise<Object>} - 저장 결과
 */
async function saveNukkiImage(productId, imagePath) {
  const connection = await promisePool.getConnection();
  
  try {
    // 트랜잭션 시작
    await connection.beginTransaction();
    
    // 이전 데이터가 있으면 삭제
    await connection.execute(
      'DELETE FROM nukki_image WHERE productid = ?',
      [productId]
    );
    
    // 새 누끼 이미지 경로 저장
    await connection.execute(
      'INSERT INTO nukki_image (productid, image_url) VALUES (?, ?)',
      [productId, imagePath]
    );
    
    // 트랜잭션 커밋
    await connection.commit();
    
    return {
      success: true,
      productId: productId
    };
  } catch (error) {
    // 오류 발생 시 롤백
    await connection.rollback();
    console.error(`누끼 이미지 저장 중 오류 발생: ${error.message}`);
    throw error;
  } finally {
    // 연결 해제
    await connection.release();
  }
}

/**
 * product_options 테이블에서 특정 상품의 옵션 이미지 URL을 조회
 * @param {string} productId - 상품의 고유 ID
 * @returns {Promise<Array<Object>>} - 이미지 URL 및 prop_path 정보를 포함한 객체 배열
 */
async function getSkuImageUrls(productId) {
  const connection = await promisePool.getConnection();
  try {
    // 먼저 skus 테이블에서 해당 상품의 prop_path 목록을 가져옴
    const [skusRows] = await connection.execute(
      'SELECT prop_path FROM skus WHERE productid = ?',
      [productId]
    );
    
    // prop_path 목록이 없으면 빈 배열 반환
    if (skusRows.length === 0) {
      return [];
    }
    
    // 세미콜론으로 구분된 prop_path를 분리하고 중복 제거
    const propPaths = new Set();
    skusRows.forEach(row => {
      if (row.prop_path) {
        const paths = row.prop_path.split(';');
        paths.forEach(path => propPaths.add(path.trim()));
      }
    });
    
    // 결과를 저장할 배열
    const results = [];
    
    // 각 prop_path에 대해 product_options 테이블에서 이미지 URL 조회
    for (const propPath of propPaths) {
      const [optionRows] = await connection.execute(
        'SELECT prop_path, imageurl as image_url FROM product_options WHERE prop_path = ?',
        [propPath]
      );
      
      // 결과가 있고 imageurl이 유효한 경우만 추가
      if (optionRows.length > 0 && optionRows[0].image_url && optionRows[0].image_url.trim() !== '') {
        results.push(optionRows[0]);
      }
    }
    
    return results;
  } catch (error) {
    console.error(`SKU 이미지 조회 중 오류 발생: ${error.message}`);
    throw error;
  } finally {
    await connection.release();
  }
}

/**
 * 번역된 SKU 이미지 경로를 DB에 저장
 * @param {string} productId - 상품의 고유 ID
 * @param {string} propPath - 속성 경로
 * @param {string} translatedImageUrl - 번역된 이미지 URL
 * @returns {Promise<boolean>} - 저장 성공 여부
 */
async function saveTranslatedSkuImagePath(productId, propPath, translatedImageUrl) {
  const connection = await promisePool.getConnection();
  try {
    await connection.beginTransaction();
    
    await connection.execute(
      'UPDATE product_options SET imageurl_translated = ? WHERE prop_path = ?',
      [translatedImageUrl, propPath]
    );
    
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    console.error(`번역된 SKU 이미지 경로 저장 중 오류: ${error.message}`);
    return false;
  } finally {
    await connection.release();
  }
}

export { getRawImageUrls, getDesImageUrls, saveTranslatedImagePaths, getSpecificRawImage, saveNukkiImage, getSkuImageUrls, saveTranslatedSkuImagePath };
