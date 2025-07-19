import { promisePool } from '../../../common/utils/connectDB.js';

/**
 * 상세페이지 설정 조회
 * @param {number} userid - 사용자 ID
 * @returns {Object|null} 상세페이지 설정 데이터
 */
export const getDetailPageSetting = async (userid) => {
  try {
    const [rows] = await promisePool.execute(
      `SELECT userid, top_image_1, top_image_2, top_image_3, 
              bottom_image_1, bottom_image_2, bottom_image_3,
              include_properties, include_options,
              created_at, updated_at 
       FROM common_setting 
       WHERE userid = ?`,
      [userid]
    );
    
    return rows[0] || null;
  } catch (error) {
    console.error('상세페이지 설정 조회 오류:', error);
    throw error;
  }
};

/**
 * 상세페이지 설정 생성 (기본값으로)
 * @param {number} userid - 사용자 ID
 * @returns {boolean} 생성 성공 여부
 */
export const createDetailPageSetting = async (userid) => {
  try {
    await promisePool.execute(
      `INSERT INTO common_setting (userid) VALUES (?)
       ON DUPLICATE KEY UPDATE userid = userid`,
      [userid]
    );
    
    return true;
  } catch (error) {
    console.error('상세페이지 설정 생성 오류:', error);
    throw error;
  }
};

/**
 * 상세페이지 설정 업데이트
 * @param {number} userid - 사용자 ID
 * @param {Object} settingData - 업데이트할 설정 데이터
 * @returns {boolean} 업데이트 성공 여부
 */
export const updateDetailPageSetting = async (userid, settingData) => {
  try {
    const updateFields = [];
    const values = [];
    
    // 동적으로 업데이트할 필드 생성
    const allowedFields = [
      'top_image_1', 'top_image_2', 'top_image_3',
      'bottom_image_1', 'bottom_image_2', 'bottom_image_3', 
      'include_properties', 'include_options'
    ];
    
    allowedFields.forEach(field => {
      if (settingData[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        // Boolean 필드는 0 또는 1로 변환
        if (field === 'include_properties' || field === 'include_options') {
          values.push(settingData[field] ? 1 : 0);
        } else {
          values.push(settingData[field]);
        }
      }
    });
    
    if (updateFields.length === 0) {
      return true; // 업데이트할 필드가 없으면 성공으로 처리
    }
    
    values.push(userid);
    
    const query = `UPDATE common_setting SET ${updateFields.join(', ')}, updated_at = NOW() WHERE userid = ?`;
    
    await promisePool.execute(query, values);
    
    return true;
  } catch (error) {
    console.error('상세페이지 설정 업데이트 오류:', error);
    throw error;
  }
};

/**
 * 사용자의 모든 마켓 계정 정보 조회
 * @param {number} userid - 사용자 ID
 * @returns {Object} 마켓별 계정 정보 배열
 */
export const getAllMarketAccounts = async (userid) => {
  try {
    // 쿠팡 계정들
    const [coopangRows] = await promisePool.execute(
      `SELECT shopid, coopang_market_number FROM coopang_account_info WHERE userid = ?`,
      [userid]
    );
    
    // 네이버 계정들
    const [naverRows] = await promisePool.execute(
      `SELECT shopid, naver_market_number FROM naver_account_info WHERE userid = ?`,
      [userid]
    );
    
    // 11번가 계정들
    const [elevenstoreRows] = await promisePool.execute(
      `SELECT shopid, elevenstore_market_number FROM elevenstore_account_info WHERE userid = ?`,
      [userid]
    );
    
    // ESM 계정들
    const [esmRows] = await promisePool.execute(
      `SELECT shopid, esm_market_number FROM esm_account_info WHERE userid = ?`,
      [userid]
    );
    
    return {
      coopang: coopangRows,
      naver: naverRows,
      elevenstore: elevenstoreRows,
      esm: esmRows
    };
  } catch (error) {
    console.error('마켓 계정 정보 조회 오류:', error);
    throw error;
  }
};

/**
 * 각 마켓별 계정 정보 테이블에 이미지 URL 업데이트
 * @param {number} userid - 사용자 ID
 * @param {string} imageField - 이미지 필드명 (top_image_1, bottom_image_2 등)
 * @param {Array} uploadedImages - 업로드된 이미지 정보 배열
 * @returns {boolean} 업데이트 성공 여부
 */
export const updateAllMarketDetailImages = async (userid, imageField, uploadedImages) => {
  try {
    // 각 계정별로 독립된 이미지 URL 업데이트
    for (const imageInfo of uploadedImages) {
      const { type, shopid, url } = imageInfo;
      
      if (type === 'coopang') {
        await promisePool.execute(
          `UPDATE coopang_account_info SET ${imageField} = ?, updated_at = NOW() WHERE userid = ? AND shopid = ?`,
          [url, userid, shopid]
        );
      } else if (type === 'naver') {
        await promisePool.execute(
          `UPDATE naver_account_info SET ${imageField} = ?, updated_at = NOW() WHERE userid = ? AND shopid = ?`,
          [url, userid, shopid]
        );
      } else if (type === 'elevenstore') {
        await promisePool.execute(
          `UPDATE elevenstore_account_info SET ${imageField} = ?, updated_at = NOW() WHERE userid = ? AND shopid = ?`,
          [url, userid, shopid]
        );
      } else if (type === 'esm') {
        await promisePool.execute(
          `UPDATE esm_account_info SET ${imageField} = ?, updated_at = NOW() WHERE userid = ? AND shopid = ?`,
          [url, userid, shopid]
        );
      }
    }
    
    return true;
  } catch (error) {
    console.error('마켓별 이미지 업데이트 오류:', error);
    throw error;
  }
};

/**
 * 사용하지 않는 이미지들을 not_used_image 테이블에 저장
 * @param {number} userid - 사용자 ID
 * @param {Array} imageUrls - 사용하지 않는 이미지 URL 배열
 * @param {string} code - 폐기 코드
 * @param {string} reason - 폐기 사유
 * @returns {boolean} 저장 성공 여부
 */
export const saveNotUsedImages = async (userid, imageUrls, code, reason) => {
  try {
    const connection = await promisePool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 각 이미지 URL에 대해 not_used_image 테이블에 저장
      for (const imageUrl of imageUrls) {
        if (imageUrl && imageUrl.trim() !== '') {
          await connection.execute(
            `INSERT INTO not_used_image (userid, code, image_url, reason) VALUES (?, ?, ?, ?)`,
            [userid, code, imageUrl, reason]
          );
        }
      }
      
      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('사용하지 않는 이미지 저장 오류:', error);
    throw error;
  }
};

/**
 * common_setting에서 이미지 URL들만 조회
 * @param {number} userid - 사용자 ID
 * @returns {Object|null} 이미지 URL 데이터
 */
export const getCommonImageUrls = async (userid) => {
  try {
    const [rows] = await promisePool.execute(
      `SELECT top_image_1, top_image_2, top_image_3, 
              bottom_image_1, bottom_image_2, bottom_image_3
       FROM common_setting 
       WHERE userid = ?`,
      [userid]
    );
    
    return rows[0] || null;
  } catch (error) {
    console.error('공통 이미지 URL 조회 오류:', error);
    throw error;
  }
};
