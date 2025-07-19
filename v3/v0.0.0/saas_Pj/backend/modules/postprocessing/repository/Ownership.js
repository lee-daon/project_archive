import { promisePool } from '../../../common/utils/connectDB.js';
import { saveErrorLog } from '../../../common/utils/assistDb/error_log.js';

/**
 * processing_status 테이블에서 가공 상태 정보를 조회하는 함수
 * 
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @returns {Promise<Object>} - 가공 상태 정보 객체
 */
export const getProcessingStatus = async (userid, productid) => {
  try {
    const [rows] = await promisePool.query(
      `SELECT * FROM processing_status 
       WHERE userid = ? AND productid = ?`,
      [userid, productid]
    );
    
    if (rows.length === 0) {
      return {
        success: false, 
        message: '가공 상태 정보를 찾을 수 없습니다.'
      };
    }
    
    return {
      success: true,
      data: rows[0]
    };
  } catch (error) {
    console.error(`가공 상태 정보 조회 중 오류:`, error);
    return {
      success: false,
      message: '가공 상태 정보 조회 중 오류가 발생했습니다.',
      error: error.message
    };
  }
};



/**
 * private_main_image 테이블에 데이터를 복사하는 함수
 * 
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @param {boolean} useTranslated - 번역된 이미지 사용 여부
 * @returns {Promise<Object>} - 처리 결과 객체
 */
export const copyToPrivateMainImage = async (userid, productid, useTranslated) => {
  try {
    // 기존 데이터 삭제
    await promisePool.query(
      'DELETE FROM private_main_image WHERE userid = ? AND productid = ?',
      [userid, productid]
    );
    
    let sourceTable = useTranslated ? 'item_image_translated' : 'item_images_raw';
    let fallbackUsed = false;
    
    // 번역된 이미지를 사용하려는 경우 데이터 존재 여부 확인
    if (useTranslated) {
      const [checkRows] = await promisePool.query(
        'SELECT COUNT(*) as count FROM item_image_translated WHERE productid = ?',
        [productid]
      );
      
      if (checkRows[0].count === 0) {
        // 번역된 이미지가 없으면 에러 로그 저장
        await saveErrorLog(userid, productid, 
          `번역된 메인 이미지가 없어서 원본 이미지를 사용합니다. (item_image_translated → item_images_raw)`);
        
        sourceTable = 'item_images_raw';
        fallbackUsed = true;
      }
    }
    
    const [result] = await promisePool.query(
      `INSERT INTO private_main_image (userid, productid, imageurl, imageorder)
       SELECT ?, productid, imageurl, imageorder
       FROM ${sourceTable}
       WHERE productid = ?
       ORDER BY imageorder ASC`,
      [userid, productid]
    );
    
    return {
      success: true,
      message: `${result.affectedRows}개의 메인 이미지가 복사되었습니다.${fallbackUsed ? ' (원본 이미지 사용)' : ''}`,
      affectedRows: result.affectedRows,
      fallbackUsed
    };
  } catch (error) {
    console.error('private_main_image 복사 중 오류:', error);
    await saveErrorLog(userid, productid, `private_main_image 복사 실패: ${error.message}`);
    return {
      success: false,
      message: 'private_main_image 복사 중 오류가 발생했습니다.',
      error: error.message
    };
  }
};

/**
 * private_description_image 테이블에 데이터를 복사하는 함수
 * 
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @param {boolean} useTranslated - 번역된 이미지 사용 여부
 * @returns {Promise<Object>} - 처리 결과 객체
 */
export const copyToPrivateDescriptionImage = async (userid, productid, useTranslated) => {
  try {
    // 기존 데이터 삭제
    await promisePool.query(
      'DELETE FROM private_description_image WHERE userid = ? AND productid = ?',
      [userid, productid]
    );
    
    let sourceTable = useTranslated ? 'item_image_des_translated' : 'item_images_des_raw';
    let fallbackUsed = false;
    
    // 번역된 이미지를 사용하려는 경우 데이터 존재 여부 확인
    if (useTranslated) {
      const [checkRows] = await promisePool.query(
        'SELECT COUNT(*) as count FROM item_image_des_translated WHERE productid = ?',
        [productid]
      );
      
      if (checkRows[0].count === 0) {
        // 번역된 상세 이미지가 없으면 에러 로그 저장
        await saveErrorLog(userid, productid, 
          `번역된 상세 이미지가 없어서 원본 이미지를 사용합니다. (item_image_des_translated → item_images_des_raw)`);
        
        sourceTable = 'item_images_des_raw';
        fallbackUsed = true;
      }
    }
    
    const [result] = await promisePool.query(
      `INSERT INTO private_description_image (userid, productid, imageurl, imageorder)
       SELECT ?, productid, imageurl, imageorder
       FROM ${sourceTable}
       WHERE productid = ?
       ORDER BY imageorder ASC`,
      [userid, productid]
    );
    
    return {
      success: true,
      message: `${result.affectedRows}개의 상세 이미지가 복사되었습니다.${fallbackUsed ? ' (원본 이미지 사용)' : ''}`,
      affectedRows: result.affectedRows,
      fallbackUsed
    };
  } catch (error) {
    console.error('private_description_image 복사 중 오류:', error);
    await saveErrorLog(userid, productid, `private_description_image 복사 실패: ${error.message}`);
    return {
      success: false,
      message: 'private_description_image 복사 중 오류가 발생했습니다.',
      error: error.message
    };
  }
};

/**
 * private_nukki_image 테이블에 데이터를 복사하는 함수
 * 
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @param {boolean} nukkiCreated - 누키 이미지 생성 여부
 * @param {number} nukkiImageOrder - 누키 이미지 순서 번호
 * @returns {Promise<Object>} - 처리 결과 객체
 */
export const copyToPrivateNukkiImage = async (userid, productid, nukkiCreated, nukkiImageOrder) => {
  try {
    // 기존 데이터 삭제
    await promisePool.query(
      'DELETE FROM private_nukki_image WHERE userid = ? AND productid = ?',
      [userid, productid]
    );
    
    if (!nukkiCreated) {
      await saveErrorLog(userid, productid, '누키 이미지가 생성되지 않았습니다.');
      return {
        success: false,
        message: '누키 이미지가 생성되지 않았습니다.'
      };
    }
    
    // nukki_image_order가 0이거나 없으면 기본값으로 1 사용
    const targetOrder = nukkiImageOrder || 1;
    
    // 지정된 순서의 누키 이미지 존재 여부 확인
    const [checkRows] = await promisePool.query(
      'SELECT COUNT(*) as count FROM nukki_image WHERE productid = ? AND image_order = ?',
      [productid, targetOrder]
    );
    
    if (checkRows[0].count === 0) {
      await saveErrorLog(userid, productid, `nukki_image 테이블에 해당 상품의 ${targetOrder}번째 누키 이미지가 없습니다.`);
      return {
        success: false,
        message: `nukki_image 테이블에 해당 상품의 ${targetOrder}번째 누키 이미지가 없습니다.`
      };
    }
    
    const [result] = await promisePool.query(
      `INSERT INTO private_nukki_image (userid, productid, image_url, image_order)
       SELECT ?, productid, image_url, image_order
       FROM nukki_image
       WHERE productid = ? AND image_order = ?`,
      [userid, productid, targetOrder]
    );
    
    return {
      success: true,
      message: `${targetOrder}번째 누키 이미지가 복사되었습니다.`,
      affectedRows: result.affectedRows,
      nukkiImageOrder: targetOrder
    };
  } catch (error) {
    console.error('private_nukki_image 복사 중 오류:', error);
    await saveErrorLog(userid, productid, `private_nukki_image 복사 실패: ${error.message}`);
    return {
      success: false,
      message: 'private_nukki_image 복사 중 오류가 발생했습니다.',
      error: error.message
    };
  }
};

/**
 * private_properties 테이블에 데이터를 복사하는 함수
 * 
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @param {boolean} useTranslated - 번역된 속성 사용 여부
 * @returns {Promise<Object>} - 처리 결과 객체
 */
export const copyToPrivateProperties = async (userid, productid, useTranslated) => {
  try {
    // 기존 데이터 삭제
    await promisePool.query(
      'DELETE FROM private_properties WHERE userid = ? AND productid = ?',
      [userid, productid]
    );
    
    let nameField = useTranslated ? 'name_translated' : 'name_raw';
    let valueField = useTranslated ? 'value_translated' : 'value_raw';
    let fallbackUsed = false;
    
    // 번역된 속성을 사용하려는 경우 데이터 존재 여부 확인
    if (useTranslated) {
      const [checkRows] = await promisePool.query(
        'SELECT COUNT(*) as count FROM properties WHERE productid = ? AND name_translated IS NOT NULL AND name_translated != ""',
        [productid]
      );
      
      if (checkRows[0].count === 0) {
        // 번역된 속성이 없으면 에러 로그 저장
        await saveErrorLog(userid, productid, 
          `번역된 속성이 없어서 원본 속성을 사용합니다. (name_translated/value_translated → name_raw/value_raw)`);
        
        nameField = 'name_raw';
        valueField = 'value_raw';
        fallbackUsed = true;
      }
    }
    
    const [result] = await promisePool.query(
      `INSERT INTO private_properties (userid, productid, property_name, property_value, property_order)
       SELECT ?, productid, ${nameField}, ${valueField}, prop_order
       FROM properties
       WHERE productid = ?
       ORDER BY prop_order ASC`,
      [userid, productid]
    );
    
    return {
      success: true,
      message: `${result.affectedRows}개의 속성이 복사되었습니다.${fallbackUsed ? ' (원본 속성 사용)' : ''}`,
      affectedRows: result.affectedRows,
      fallbackUsed
    };
  } catch (error) {
    console.error('private_properties 복사 중 오류:', error);
    await saveErrorLog(userid, productid, `private_properties 복사 실패: ${error.message}`);
    return {
      success: false,
      message: 'private_properties 복사 중 오류가 발생했습니다.',
      error: error.message
    };
  }
};

/**
 * private_options 테이블에 데이터를 복사하는 함수
 * 
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @param {boolean} useOptimizedOptions - 최적화된 옵션 사용 여부
 * @param {boolean} useTranslatedImages - 번역된 옵션 이미지 사용 여부
 * @returns {Promise<Object>} - 처리 결과 객체
 */
export const copyToPrivateOptions = async (userid, productid, useOptimizedOptions, useTranslatedImages) => {
  try {
    // 기존 데이터 삭제
    await promisePool.query(
      'DELETE FROM private_options WHERE userid = ? AND productid = ?',
      [userid, productid]
    );
    
    // 상품의 prop_path 목록 조회 - skus 테이블의 prop_path를 세미콜론으로 분리하여 처리
    const [skuRows] = await promisePool.query(
      'SELECT prop_path FROM skus WHERE productid = ? AND prop_path IS NOT NULL AND prop_path != "" ORDER BY skus_order ASC',
      [productid]
    );
    
    if (skuRows.length === 0) {
      return {
        success: true,
        message: '복사할 옵션이 없습니다.',
        affectedRows: 0
      };
    }
    
    // 모든 prop_path를 세미콜론으로 분리하고 중복 제거
    const allPropPaths = new Set();
    
    skuRows.forEach(row => {
      if (row.prop_path) {
        // 세미콜론으로 분리하여 개별 prop_path 추출
        const individualPaths = row.prop_path.split(';');
        individualPaths.forEach(path => {
          const trimmedPath = path.trim();
          if (trimmedPath) {
            allPropPaths.add(trimmedPath);
          }
        });
      }
    });
    
    if (allPropPaths.size === 0) {
      return {
        success: true,
        message: '복사할 옵션이 없습니다.',
        affectedRows: 0
      };
    }
    
    let optionNameField = useOptimizedOptions ? 'translated_optionname' : 'optionname';
    let optionValueField = useOptimizedOptions ? 'translated_optionvalue' : 'optionvalue';
    let imageField = useTranslatedImages ? 'imageurl_translated' : 'imageurl';
    let optionFallbackUsed = false;
    let imageFallbackUsed = false;
    
    const propPaths = Array.from(allPropPaths);
    const placeholders = propPaths.map(() => '?').join(',');
    
    // 최적화된 옵션을 사용하려는 경우 데이터 존재 여부 확인
    if (useOptimizedOptions) {
      const [checkRows] = await promisePool.query(
        `SELECT COUNT(*) as count FROM product_options 
         WHERE prop_path IN (${placeholders}) 
         AND translated_optionname IS NOT NULL AND translated_optionname != ""`,
        propPaths
      );
      
      if (checkRows[0].count === 0) {
        await saveErrorLog(userid, productid, 
          `번역된 옵션명/값이 없어서 원본 옵션을 사용합니다. (translated_optionname/translated_optionvalue → optionname/optionvalue)`);
        
        optionNameField = 'optionname';
        optionValueField = 'optionvalue';
        optionFallbackUsed = true;
      }
    }
    
    // 번역된 옵션 이미지를 사용하려는 경우 데이터 존재 여부 확인
    if (useTranslatedImages) {
      const [checkRows] = await promisePool.query(
        `SELECT COUNT(*) as count FROM product_options 
         WHERE prop_path IN (${placeholders}) 
         AND imageurl_translated IS NOT NULL AND imageurl_translated != ""`,
        propPaths
      );
      
      if (checkRows[0].count === 0) {
        await saveErrorLog(userid, productid, 
          `번역된 옵션 이미지가 없어서 원본 이미지를 사용합니다. (imageurl_translated → imageurl)`);
        
        imageField = 'imageurl';
        imageFallbackUsed = true;
      }
    }
    
    const [result] = await promisePool.query(
      `INSERT INTO private_options (userid, productid, prop_path, private_optionname, private_optionvalue, private_imageurl)
       SELECT ?, ?, prop_path, ${optionNameField}, ${optionValueField}, ${imageField}
       FROM product_options
       WHERE prop_path IN (${placeholders})`,
      [userid, productid, ...propPaths]
    );
    
    let fallbackMessage = '';
    if (optionFallbackUsed && imageFallbackUsed) {
      fallbackMessage = ' (원본 옵션명/값 및 원본 이미지 사용)';
    } else if (optionFallbackUsed) {
      fallbackMessage = ' (원본 옵션명/값 사용)';
    } else if (imageFallbackUsed) {
      fallbackMessage = ' (원본 이미지 사용)';
    }
    
    return {
      success: true,
      message: `${result.affectedRows}개의 옵션이 복사되었습니다.${fallbackMessage}`,
      affectedRows: result.affectedRows,
      optionFallbackUsed,
      imageFallbackUsed
    };
  } catch (error) {
    console.error('private_options 복사 중 오류:', error);
    await saveErrorLog(userid, productid, `private_options 복사 실패: ${error.message}`);
    return {
      success: false,
      message: 'private_options 복사 중 오류가 발생했습니다.',
      error: error.message
    };
  }
};
