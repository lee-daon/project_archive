import { promisePool } from '../../../common/utils/connectDB.js';

// 네이버 마켓 정보 조회 (민감정보 마스킹)
export const getNaverMarkets = async (userid) => {
  try {
    const [rows] = await promisePool.execute(
      'SELECT shopid, naver_market_number, naver_market_memo, naver_maximun_sku_count, naver_client_secret, naver_client_id, shippingAddressId, returnAddressId, created_at, updated_at FROM naver_account_info WHERE userid = ?',
      [userid]
    );
    
    // 필드명 매핑 (마스킹 제거)
    const mappedRows = rows.map(row => ({
      ...row,
      // API 요구사항에 맞게 필드명 추가 매핑
      naver_release_address_no: row.shippingAddressId,
      naver_refund_address_no: row.returnAddressId
    }));
    
    return mappedRows;
  } catch (error) {
    throw new Error(`네이버 마켓 정보 조회 실패: ${error.message}`);
  }
};

// 쿠팡 마켓 정보 조회
export const getCoopangMarkets = async (userid) => {
  try {
    const [rows] = await promisePool.execute(
      `SELECT shopid, coopang_market_number, coopang_market_memo, coopang_maximun_sku_count, 
              access_key, secret_key, vendor_id, return_charge_name, company_contact_number, 
              return_zip_code, return_address, return_address_detail, outbound_shipping_place_code, 
              vendor_user_id, return_center_code, created_at, updated_at 
       FROM coopang_account_info WHERE userid = ?`,
      [userid]
    );
    
    // API 요구사항에 맞게 필드명 매핑
    const mappedRows = rows.map(row => ({
      ...row,
      coopang_vendor_id: row.vendor_id,
      coopang_access_key: row.access_key,
      coopang_secret_key: row.secret_key,
      coopang_return_charge_name: row.return_charge_name,
      coopang_company_contact_number: row.company_contact_number,
      coopang_return_zip_code: row.return_zip_code,
      coopang_return_address: row.return_address,
      coopang_return_address_detail: row.return_address_detail,
      coopang_outbound_shipping_place_code: row.outbound_shipping_place_code,
      coopang_vendor_user_id: row.vendor_user_id,
      coopang_return_center_code: row.return_center_code
    }));
    
    return mappedRows;
  } catch (error) {
    throw new Error(`쿠팡 마켓 정보 조회 실패: ${error.message}`);
  }
};

// 11번가 마켓 정보 조회
export const getElevenstoreMarkets = async (userid) => {
  try {
    const [rows] = await promisePool.execute(
      `SELECT shopid, elevenstore_market_number, elevenstore_market_memo, elevenstore_maximun_sku_count, 
              registered_sku_count, api_key, shippingAddressId, returnAddressId, prdInfoTmpltNo, created_at, updated_at 
       FROM elevenstore_account_info WHERE userid = ?`,
      [userid]
    );
    
    // API 요구사항에 맞게 필드명 매핑
    const mappedRows = rows.map(row => ({
      ...row,
      elevenstore_api_key: row.api_key,
      elevenstore_shipping_address_id: row.shippingAddressId,
      elevenstore_return_address_id: row.returnAddressId,
      elevenstore_template_no: row.prdInfoTmpltNo
    }));
    
    return mappedRows;
  } catch (error) {
    throw new Error(`11번가 마켓 정보 조회 실패: ${error.message}`);
  }
};

// 네이버 마켓 생성
export const createNaverMarket = async (userid, marketData) => {
  try {
    const {
      naver_market_number,
      naver_market_memo,
      naver_maximun_sku_count,
      naver_client_secret,
      naver_client_id,
      naver_release_address_no,
      naver_refund_address_no
    } = marketData;

    // undefined 값을 null로 변환 및 필드명 매핑
    const params = [
      userid,
      naver_market_number,
      naver_market_memo,
      naver_maximun_sku_count,
      naver_client_secret || null,
      naver_client_id || null,
      naver_release_address_no || null,
      naver_refund_address_no || null
    ];

    const [result] = await promisePool.execute(
      `INSERT INTO naver_account_info (userid, naver_market_number, naver_market_memo, naver_maximun_sku_count, naver_client_secret, naver_client_id, shippingAddressId, returnAddressId) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      params
    );

    return result;
  } catch (error) {
    // 중복 키 오류 처리
    if (error.code === 'ER_DUP_ENTRY') {
      throw new Error('중복되는 마켓번호가 있습니다.');
    }
    throw new Error(`네이버 마켓 생성 실패: ${error.message}`);
  }
};

// 쿠팡 마켓 생성
export const createCoopangMarket = async (userid, marketData) => {
  try {
    const {
      coopang_market_number,
      coopang_market_memo,
      coopang_maximun_sku_count,
      coopang_vendor_id,
      coopang_access_key,
      coopang_secret_key,
      coopang_outbound_shipping_place_code,
      coopang_return_center_code,
      coopang_return_charge_name,
      coopang_company_contact_number,
      coopang_return_zip_code,
      coopang_return_address,
      coopang_return_address_detail,
      coopang_vendor_user_id,
      coopang_return_charge
    } = marketData;

    // undefined 값을 null로 변환
    const params = [
      userid,
      coopang_market_number,
      coopang_market_memo,
      coopang_maximun_sku_count,
      coopang_access_key,
      coopang_secret_key,
      coopang_vendor_id,
      coopang_return_charge_name || null,
      coopang_return_center_code || null,
      coopang_company_contact_number || null,
      coopang_return_zip_code || null,
      coopang_return_address || null,
      coopang_return_address_detail || null,
      coopang_outbound_shipping_place_code || null,
      coopang_vendor_user_id || null
    ];

    const [result] = await promisePool.execute(
      `INSERT INTO coopang_account_info (
        userid, coopang_market_number, coopang_market_memo, coopang_maximun_sku_count,
        access_key, secret_key, vendor_id, return_charge_name, return_center_code, company_contact_number,
        return_zip_code, return_address, return_address_detail, outbound_shipping_place_code,
        vendor_user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      params
    );

    return result;
  } catch (error) {
    // 중복 키 오류 처리
    if (error.code === 'ER_DUP_ENTRY') {
      throw new Error('중복되는 마켓번호가 있습니다.');
    }
    throw new Error(`쿠팡 마켓 생성 실패: ${error.message}`);
  }
};

// 11번가 마켓 생성
export const createElevenstoreMarket = async (userid, marketData) => {
  try {
    const {
      elevenstore_market_number,
      elevenstore_market_memo,
      elevenstore_maximun_sku_count,
      elevenstore_api_key,
      elevenstore_shipping_address_id,
      elevenstore_return_address_id,
      elevenstore_template_no
    } = marketData;

    // undefined 값을 null로 변환
    const params = [
      userid,
      elevenstore_market_number,
      elevenstore_market_memo,
      elevenstore_maximun_sku_count,
      elevenstore_api_key,
      elevenstore_shipping_address_id || null,
      elevenstore_return_address_id || null,
      elevenstore_template_no || null
    ];

    const [result] = await promisePool.execute(
      `INSERT INTO elevenstore_account_info (
        userid, elevenstore_market_number, elevenstore_market_memo, elevenstore_maximun_sku_count,
        api_key, shippingAddressId, returnAddressId, prdInfoTmpltNo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      params
    );

    return result;
  } catch (error) {
    // 중복 키 오류 처리
    if (error.code === 'ER_DUP_ENTRY') {
      throw new Error('중복되는 마켓번호가 있습니다.');
    }
    throw new Error(`11번가 마켓 생성 실패: ${error.message}`);
  }
};

// 네이버 마켓 업데이트
export const updateNaverMarket = async (userid, shopid, marketData) => {
  try {
    const {
      naver_market_number,
      naver_market_memo,
      naver_maximun_sku_count,
      naver_client_secret,
      naver_client_id,
      naver_release_address_no,
      naver_refund_address_no
    } = marketData;

    // undefined 값을 null로 변환 및 필드명 매핑
    const params = [
      naver_market_number,
      naver_market_memo,
      naver_maximun_sku_count,
      naver_client_secret || null,
      naver_client_id || null,
      naver_release_address_no || null,
      naver_refund_address_no || null,
      userid,
      shopid
    ];

    console.log('SQL 파라미터:', params); // 디버깅용

    const [result] = await promisePool.execute(
      `UPDATE naver_account_info SET 
        naver_market_number = ?,
        naver_market_memo = ?,
        naver_maximun_sku_count = ?,
        naver_client_secret = ?,
        naver_client_id = ?,
        shippingAddressId = ?,
        returnAddressId = ?
      WHERE userid = ? AND shopid = ?`,
      params
    );

    if (result.affectedRows === 0) {
      throw new Error('해당 네이버 마켓을 찾을 수 없습니다.');
    }

    return result;
  } catch (error) {
    throw new Error(`네이버 마켓 업데이트 실패: ${error.message}`);
  }
};

// 쿠팡 마켓 업데이트
export const updateCoopangMarket = async (userid, shopid, marketData) => {
  try {
    const {
      coopang_market_number,
      coopang_market_memo,
      coopang_maximun_sku_count,
      coopang_vendor_id,
      coopang_access_key,
      coopang_secret_key,
      coopang_outbound_shipping_place_code,
      coopang_return_center_code,
      coopang_return_charge_name,
      coopang_company_contact_number,
      coopang_return_zip_code,
      coopang_return_address,
      coopang_return_address_detail,
      coopang_vendor_user_id,
      coopang_return_charge
    } = marketData;

    // undefined 값을 null로 변환
    const params = [
      coopang_market_number,
      coopang_market_memo,
      coopang_maximun_sku_count,
      coopang_access_key,
      coopang_secret_key,
      coopang_vendor_id,
      coopang_return_charge_name || null,
      coopang_return_center_code || null,
      coopang_company_contact_number || null,
      coopang_return_zip_code || null,
      coopang_return_address || null,
      coopang_return_address_detail || null,
      coopang_outbound_shipping_place_code || null,
      coopang_vendor_user_id || null,
      userid,
      shopid
    ];

    console.log('쿠팡 마켓 업데이트 SQL 파라미터:', params); // 디버깅용

    const [result] = await promisePool.execute(
      `UPDATE coopang_account_info SET 
        coopang_market_number = ?,
        coopang_market_memo = ?,
        coopang_maximun_sku_count = ?,
        access_key = ?,
        secret_key = ?,
        vendor_id = ?,
        return_charge_name = ?,
        return_center_code = ?,
        company_contact_number = ?,
        return_zip_code = ?,
        return_address = ?,
        return_address_detail = ?,
        outbound_shipping_place_code = ?,
        vendor_user_id = ?
      WHERE userid = ? AND shopid = ?`,
      params
    );

    if (result.affectedRows === 0) {
      throw new Error('해당 쿠팡 마켓을 찾을 수 없습니다.');
    }

    return result;
  } catch (error) {
    throw new Error(`쿠팡 마켓 업데이트 실패: ${error.message}`);
  }
};

// 11번가 마켓 업데이트
export const updateElevenstoreMarket = async (userid, shopid, marketData) => {
  try {
    const {
      elevenstore_market_number,
      elevenstore_market_memo,
      elevenstore_maximun_sku_count,
      elevenstore_api_key,
      elevenstore_shipping_address_id,
      elevenstore_return_address_id,
      elevenstore_template_no
    } = marketData;

    // undefined 값을 null로 변환
    const params = [
      elevenstore_market_number,
      elevenstore_market_memo,
      elevenstore_maximun_sku_count,
      elevenstore_api_key,
      elevenstore_shipping_address_id || null,
      elevenstore_return_address_id || null,
      elevenstore_template_no || null,
      userid,
      shopid
    ];

    console.log('11번가 마켓 업데이트 SQL 파라미터:', params); // 디버깅용

    const [result] = await promisePool.execute(
      `UPDATE elevenstore_account_info SET 
        elevenstore_market_number = ?,
        elevenstore_market_memo = ?,
        elevenstore_maximun_sku_count = ?,
        api_key = ?,
        shippingAddressId = ?,
        returnAddressId = ?,
        prdInfoTmpltNo = ?
      WHERE userid = ? AND shopid = ?`,
      params
    );

    if (result.affectedRows === 0) {
      throw new Error('해당 11번가 마켓을 찾을 수 없습니다.');
    }

    return result;
  } catch (error) {
    throw new Error(`11번가 마켓 업데이트 실패: ${error.message}`);
  }
};

// 네이버 마켓 삭제
export const deleteNaverMarket = async (userid, shopid) => {
  try {
    const [result] = await promisePool.execute(
      'DELETE FROM naver_account_info WHERE userid = ? AND shopid = ?',
      [userid, shopid]
    );

    if (result.affectedRows === 0) {
      throw new Error('해당 네이버 마켓을 찾을 수 없습니다.');
    }

    return result;
  } catch (error) {
    throw new Error(`네이버 마켓 삭제 실패: ${error.message}`);
  }
};

// 쿠팡 마켓 삭제
export const deleteCoopangMarket = async (userid, shopid) => {
  try {
    const [result] = await promisePool.execute(
      'DELETE FROM coopang_account_info WHERE userid = ? AND shopid = ?',
      [userid, shopid]
    );

    if (result.affectedRows === 0) {
      throw new Error('해당 쿠팡 마켓을 찾을 수 없습니다.');
    }

    return result;
  } catch (error) {
    throw new Error(`쿠팡 마켓 삭제 실패: ${error.message}`);
  }
};

// 11번가 마켓 삭제
export const deleteElevenstoreMarket = async (userid, shopid) => {
  try {
    const [result] = await promisePool.execute(
      'DELETE FROM elevenstore_account_info WHERE userid = ? AND shopid = ?',
      [userid, shopid]
    );

    if (result.affectedRows === 0) {
      throw new Error('해당 11번가 마켓을 찾을 수 없습니다.');
    }

    return result;
  } catch (error) {
    throw new Error(`11번가 마켓 삭제 실패: ${error.message}`);
  }
};

// ESM 마켓 정보 조회
export const getEsmMarkets = async (userid) => {
  try {
    const [rows] = await promisePool.execute(
      'SELECT shopid, esm_market_number, esm_market_memo, esm_maximun_sku_count, registered_sku_count, auction_id, gmarket_id, delivery_template_code, disclosure_template_code, created_at, updated_at FROM esm_account_info WHERE userid = ?',
      [userid]
    );
    
    return rows;
  } catch (error) {
    throw new Error(`ESM 마켓 정보 조회 실패: ${error.message}`);
  }
};

// ESM 마켓 생성
export const createEsmMarket = async (userid, marketData) => {
  try {
    const {
      esm_market_number,
      esm_market_memo,
      esm_maximun_sku_count,
      auction_id,
      gmarket_id,
      delivery_template_code,
      disclosure_template_code
    } = marketData;

    const [result] = await promisePool.execute(
      `INSERT INTO esm_account_info (userid, esm_market_number, esm_market_memo, esm_maximun_sku_count, auction_id, gmarket_id, delivery_template_code, disclosure_template_code) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userid, esm_market_number, esm_market_memo, esm_maximun_sku_count, auction_id || null, gmarket_id || null, delivery_template_code || null, disclosure_template_code || null]
    );

    return result;
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new Error('중복되는 ESM 마켓 번호가 있습니다.');
    }
    throw new Error(`ESM 마켓 생성 실패: ${error.message}`);
  }
};

// ESM 마켓 업데이트
export const updateEsmMarket = async (userid, shopid, marketData) => {
  try {
    const {
      esm_market_number,
      esm_market_memo,
      esm_maximun_sku_count,
      auction_id,
      gmarket_id,
      delivery_template_code,
      disclosure_template_code
    } = marketData;

    const params = [
      esm_market_number,
      esm_market_memo,
      esm_maximun_sku_count,
      auction_id || null,
      gmarket_id || null,
      delivery_template_code || null,
      disclosure_template_code || null,
      userid,
      shopid
    ];

    const [result] = await promisePool.execute(
      `UPDATE esm_account_info SET 
        esm_market_number = ?,
        esm_market_memo = ?,
        esm_maximun_sku_count = ?,
        auction_id = ?,
        gmarket_id = ?,
        delivery_template_code = ?,
        disclosure_template_code = ?
      WHERE userid = ? AND shopid = ?`,
      params
    );

    if (result.affectedRows === 0) {
      throw new Error('해당 ESM 마켓을 찾을 수 없습니다.');
    }

    return result;
  } catch (error) {
    throw new Error(`ESM 마켓 업데이트 실패: ${error.message}`);
  }
};

// ESM 마켓 삭제
export const deleteEsmMarket = async (userid, shopid) => {
  try {
    const [result] = await promisePool.execute(
      'DELETE FROM esm_account_info WHERE userid = ? AND shopid = ?',
      [userid, shopid]
    );

    if (result.affectedRows === 0) {
      throw new Error('해당 ESM 마켓을 찾을 수 없습니다.');
    }

    return result;
  } catch (error) {
    throw new Error(`ESM 마켓 삭제 실패: ${error.message}`);
  }
};

/**
 * 특정 마켓 계정의 이미지 URL들 조회 (삭제 시 사용)
 * @param {number} userid - 사용자 ID
 * @param {string} marketType - 마켓 타입 (coopang, naver, elevenstore, esm)
 * @param {number} shopid - 계정 ID
 * @returns {Object|null} 이미지 URL 데이터
 */
export const getMarketImageUrls = async (userid, marketType, shopid) => {
  try {
    let tableName;
    
    switch (marketType) {
      case 'coopang':
        tableName = 'coopang_account_info';
        break;
      case 'naver':
        tableName = 'naver_account_info';
        break;
      case 'elevenstore':
        tableName = 'elevenstore_account_info';
        break;
      case 'esm':
        tableName = 'esm_account_info';
        break;
      default:
        throw new Error(`지원하지 않는 마켓 타입: ${marketType}`);
    }
    
    const [rows] = await promisePool.execute(
      `SELECT top_image_1, top_image_2, top_image_3, 
              bottom_image_1, bottom_image_2, bottom_image_3
       FROM ${tableName} 
       WHERE userid = ? AND shopid = ?`,
      [userid, shopid]
    );
    
    return rows[0] || null;
  } catch (error) {
    console.error('마켓 이미지 URL 조회 오류:', error);
    throw error;
  }
};

/**
 * 새로 생성된 마켓 계정에 이미지 URL들 설정
 * @param {number} userid - 사용자 ID
 * @param {string} marketType - 마켓 타입 (coopang, naver, elevenstore)
 * @param {number} shopid - 계정 ID
 * @param {Object} imageUrls - 설정할 이미지 URL들
 * @returns {boolean} 설정 성공 여부
 */
export const setMarketImageUrls = async (userid, marketType, shopid, imageUrls) => {
  try {
    let tableName;
    
    switch (marketType) {
      case 'coopang':
        tableName = 'coopang_account_info';
        break;
      case 'naver':
        tableName = 'naver_account_info';
        break;
      case 'elevenstore':
        tableName = 'elevenstore_account_info';
        break;
      case 'esm':
        tableName = 'esm_account_info';
        break;
      default:
        throw new Error(`지원하지 않는 마켓 타입: ${marketType}`);
    }
    
    const updateFields = [];
    const values = [];
    
    // 이미지 URL 필드들 처리
    const imageFields = ['top_image_1', 'top_image_2', 'top_image_3', 'bottom_image_1', 'bottom_image_2', 'bottom_image_3'];
    
    imageFields.forEach(field => {
      if (imageUrls[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        values.push(imageUrls[field]);
      }
    });
    
    if (updateFields.length === 0) {
      return true; // 업데이트할 이미지가 없으면 성공으로 처리
    }
    
    values.push(userid, shopid);
    
    const query = `UPDATE ${tableName} SET ${updateFields.join(', ')}, updated_at = NOW() WHERE userid = ? AND shopid = ?`;
    
    await promisePool.execute(query, values);
    
    return true;
  } catch (error) {
    console.error('마켓 이미지 URL 설정 오류:', error);
    throw error;
  }
};

/**
 * 사용자의 모든 마켓 계정 정보와 이미지 URL들을 조회
 * @param {number} userid - 사용자 ID
 * @returns {Object} 마켓별 계정 정보 배열
 */
export const getAllMarketAccountsWithImages = async (userid) => {
  try {
    const [coopangRows] = await promisePool.execute(
      `SELECT shopid, top_image_1, top_image_2, top_image_3, bottom_image_1, bottom_image_2, bottom_image_3 FROM coopang_account_info WHERE userid = ?`,
      [userid]
    );
    const [naverRows] = await promisePool.execute(
      `SELECT shopid, top_image_1, top_image_2, top_image_3, bottom_image_1, bottom_image_2, bottom_image_3 FROM naver_account_info WHERE userid = ?`,
      [userid]
    );
    const [elevenstoreRows] = await promisePool.execute(
      `SELECT shopid, top_image_1, top_image_2, top_image_3, bottom_image_1, bottom_image_2, bottom_image_3 FROM elevenstore_account_info WHERE userid = ?`,
      [userid]
    );
    
    // ESM 계정들
    const [esmRows] = await promisePool.execute(
      `SELECT shopid, esm_market_number, 
              top_image_1, top_image_2, top_image_3, 
              bottom_image_1, bottom_image_2, bottom_image_3 
       FROM esm_account_info WHERE userid = ?`,
      [userid]
    );
    
    return {
      coopang: coopangRows,
      naver: naverRows,
      elevenstore: elevenstoreRows,
      esm: esmRows
    };
  } catch (error) {
    console.error('모든 마켓 이미지 정보 조회 오류:', error);
    throw error;
  }
};

/**
 * 특정 마켓의 모든 계정에서 지정된 이미지 필드를 비움
 * @param {number} userid - 사용자 ID
 * @param {string} marketType - 마켓 타입 (coopang, naver, elevenstore, esm)
 * @param {string} imageField - 비울 이미지 필드명
 * @returns {boolean} 성공 여부
 */
export const clearMarketImageField = async (userid, marketType, imageField) => {
  try {
    let tableName;
    switch (marketType) {
      case 'coopang':
        tableName = 'coopang_account_info';
        break;
      case 'naver':
        tableName = 'naver_account_info';
        break;
      case 'elevenstore':
        tableName = 'elevenstore_account_info';
        break;
      case 'esm':
        tableName = 'esm_account_info';
        break;
      default:
        return true; // 해당사항 없는 경우 성공으로 처리
    }
    
    const query = `UPDATE ${tableName} SET ${imageField} = NULL, updated_at = NOW() WHERE userid = ?`;
    await promisePool.execute(query, [userid]);
    
    return true;
  } catch (error) {
    console.error(`${marketType} 마켓 이미지 필드 비우기 오류:`, error);
    throw error;
  }
};
