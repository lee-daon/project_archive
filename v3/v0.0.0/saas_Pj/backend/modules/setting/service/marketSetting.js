import {
  getNaverMarkets,
  getCoopangMarkets,
  getElevenstoreMarkets,
  getEsmMarkets,
  createNaverMarket,
  createCoopangMarket,
  createElevenstoreMarket,
  createEsmMarket,
  updateNaverMarket,
  updateCoopangMarket,
  updateElevenstoreMarket,
  updateEsmMarket,
  deleteNaverMarket,
  deleteCoopangMarket,
  deleteElevenstoreMarket,
  deleteEsmMarket
} from '../repository/marketSetting.js';
import { copyCommonImagesToNewMarket, collectMarketImageUrls } from './imgSeperation.js';
import { saveNotUsedImages } from '../repository/detailPage.js';

// 마켓 정보 조회 서비스
export const getMarketInfo = async (userid, market) => {
  try {
    if (market === 'naver') {
      const markets = await getNaverMarkets(userid);
      return {
        market: 'naver',
        markets: markets
      };
    } else if (market === 'coopang') {
      const markets = await getCoopangMarkets(userid);
      return {
        market: 'coopang',
        markets: markets
      };
    } else if (market === 'elevenstore') {
      const markets = await getElevenstoreMarkets(userid);
      return {
        market: 'elevenstore',
        markets: markets
      };
    } else if (market === 'esm') {
      const markets = await getEsmMarkets(userid);
      return {
        market: 'esm',
        markets: markets
      };
    } else {
      throw new Error('지원하지 않는 마켓입니다. (naver, coopang, elevenstore, esm만 지원)');
    }
  } catch (error) {
    throw new Error(`마켓 정보 조회 서비스 오류: ${error.message}`);
  }
};

/**
 * 마켓 계정 정보 변경 시 이미지를 교체하는 헬퍼 함수
 * @param {number} userid 사용자 ID
 * @param {string} market 마켓 타입
 * @param {number} shopid 계정 ID
 */
const handleImageReplacement = async (userid, market, shopid) => {
  // 1. 기존 이미지 URL 수집
  const oldImageUrls = await collectMarketImageUrls(userid, market, shopid);

  // 2. not_used_image 테이블에 저장
  if (oldImageUrls.length > 0) {
    await saveNotUsedImages(
      userid,
      oldImageUrls,
      'marketinfoupdate',
      `${market} 마켓 계정 정보 변경 (shopid: ${shopid})`
    );
  }

  // 3. 공통 설정 이미지를 새로 복사하여 마켓에 설정
  await copyCommonImagesToNewMarket(userid, market, shopid);
};


// 마켓 생성 서비스
export const createMarketService = async (userid, market, marketData) => {
  try {
    let result;
    let insertId;
    
    // 데이터 유효성 검증 및 마켓 생성
    if (market === 'naver') {
      validateNaverMarketData(marketData);
      result = await createNaverMarket(userid, marketData);
      insertId = result.insertId;
    } else if (market === 'coopang') {
      validateCoopangMarketData(marketData);
      result = await createCoopangMarket(userid, marketData);
      insertId = result.insertId;
    } else if (market === 'elevenstore') {
      validateElevenstoreMarketData(marketData);
      result = await createElevenstoreMarket(userid, marketData);
      insertId = result.insertId;
    } else if (market === 'esm') {
      validateEsmMarketData(marketData);
      result = await createEsmMarket(userid, marketData);
      insertId = result.insertId;
    } else {
      throw new Error('지원하지 않는 마켓입니다. (naver, coopang, elevenstore, esm만 지원)');
    }
    
    // 마켓 생성 성공 후 공통 설정의 이미지들을 새 마켓으로 복사
    try {
      console.log(`마켓 생성 완료, 이미지 복사 시작: userid=${userid}, market=${market}, shopid=${insertId}`);
      const copyResult = await copyCommonImagesToNewMarket(userid, market, insertId);
      
      if (copyResult.success) {
        console.log(`이미지 복사 성공: ${copyResult.message}`);
      } else {
        console.warn(`이미지 복사 실패: ${copyResult.message}`);
      }
    } catch (imageCopyError) {
      console.error('이미지 복사 중 오류 발생:', imageCopyError);
    }
    
    return {
      success: true,
      message: `${market === 'naver' ? '네이버' : market === 'coopang' ? '쿠팡' : market === 'elevenstore' ? '11번가' : 'ESM'} 마켓이 성공적으로 생성되었습니다.`,
      insertId: insertId
    };
  } catch (error) {
    throw new Error(`마켓 생성 서비스 오류: ${error.message}`);
  }
};

// 마켓 업데이트 서비스
export const updateMarketService = async (userid, market, shopid, marketData) => {
  try {
    let accountChanged = false;

    // 현재 마켓 정보 조회
    const currentMarketInfo = await getMarketInfo(userid, market);
    const currentMarket = currentMarketInfo.markets.find(m => m.shopid === shopid);
    if (!currentMarket) {
      throw new Error('수정할 마켓 정보를 찾을 수 없습니다.');
    }

    if (market === 'naver') {
      if (currentMarket.naver_client_id !== marketData.naver_client_id) {
        accountChanged = true;
      }
      validateNaverMarketData(marketData);
      await updateNaverMarket(userid, shopid, marketData);
    } else if (market === 'coopang') {
      if (currentMarket.coopang_vendor_user_id !== marketData.coopang_vendor_user_id) {
        accountChanged = true;
      }
      validateCoopangMarketData(marketData);
      await updateCoopangMarket(userid, shopid, marketData);
    } else if (market === 'elevenstore') {
      validateElevenstoreMarketData(marketData);
      await updateElevenstoreMarket(userid, shopid, marketData);
    } else if (market === 'esm') {
      validateEsmMarketData(marketData);
      await updateEsmMarket(userid, shopid, marketData);
    } else {
      throw new Error('지원하지 않는 마켓입니다. (naver, coopang, elevenstore, esm만 지원)');
    }

    if (accountChanged) {
      console.log(`${market} 계정 정보 변경 감지, 이미지 교체를 시작합니다.`);
      await handleImageReplacement(userid, market, shopid);
    }

    return {
      success: true,
      message: `${market === 'naver' ? '네이버' : market === 'coopang' ? '쿠팡' : market === 'elevenstore' ? '11번가' : 'ESM'} 마켓이 성공적으로 업데이트되었습니다.`
    };
  } catch (error) {
    throw new Error(`마켓 업데이트 서비스 오류: ${error.message}`);
  }
};

// 마켓 삭제 서비스
export const deleteMarketService = async (userid, market, shopid) => {
  try {
    // 1. 마켓 삭제 전에 해당 마켓의 이미지 URL들을 수집
    let imageUrls = [];
    try {
      imageUrls = await collectMarketImageUrls(userid, market, shopid);
    } catch (imageCollectError) {
      console.error('이미지 URL 수집 중 오류 발생:', imageCollectError);
    }
    
    // 2. 마켓 삭제 실행
    if (market === 'naver') {
      await deleteNaverMarket(userid, shopid);
    } else if (market === 'coopang') {
      await deleteCoopangMarket(userid, shopid);
    } else if (market === 'elevenstore') {
      await deleteElevenstoreMarket(userid, shopid);
    } else if (market === 'esm') {
      await deleteEsmMarket(userid, shopid);
    } else {
      throw new Error('지원하지 않는 마켓입니다. (naver, coopang, elevenstore, esm만 지원)');
    }
    
    // 3. 마켓 삭제 성공 후 수집된 이미지 URL들을 not_used_image 테이블에 저장
    if (imageUrls.length > 0) {
      try {
        await saveNotUsedImages(
          userid, 
          imageUrls, 
          'marketdelete', 
          `${market} 마켓 계정 삭제 (shopid: ${shopid})`
        );
      } catch (imageSaveError) {
        console.error('폐기 이미지 저장 중 오류 발생:', imageSaveError);
      }
    }
    
    return {
      success: true,
      message: `${market === 'naver' ? '네이버' : market === 'coopang' ? '쿠팡' : market === 'elevenstore' ? '11번가' : 'ESM'} 마켓이 성공적으로 삭제되었습니다.`
    };
  } catch (error) {
    throw new Error(`마켓 삭제 서비스 오류: ${error.message}`);
  }
};

// 네이버 마켓 데이터 유효성 검증
const validateNaverMarketData = (marketData) => {
  const requiredFields = ['naver_market_number', 'naver_market_memo', 'naver_maximun_sku_count'];
  
  for (const field of requiredFields) {
    if (marketData[field] === undefined || marketData[field] === null) {
      throw new Error(`필수 필드가 누락되었습니다: ${field}`);
    }
  }

  // 마켓 번호 유효성 검증
  if (!Number.isInteger(marketData.naver_market_number) || marketData.naver_market_number <= 0) {
    throw new Error('네이버 마켓 번호는 양의 정수여야 합니다.');
  }

  // SKU 개수 유효성 검증
  if (!Number.isInteger(marketData.naver_maximun_sku_count) || marketData.naver_maximun_sku_count <= 0) {
    throw new Error('최대 SKU 개수는 양의 정수여야 합니다.');
  }

  // 메모 길이 검증
  if (typeof marketData.naver_market_memo !== 'string') {
    throw new Error('마켓 메모는 문자열이어야 합니다.');
  }

  // 클라이언트 정보 검증 (선택적)
  if (marketData.naver_client_id && typeof marketData.naver_client_id !== 'string') {
    throw new Error('네이버 클라이언트 ID는 문자열이어야 합니다.');
  }

  if (marketData.naver_client_secret && typeof marketData.naver_client_secret !== 'string') {
    throw new Error('네이버 클라이언트 시크릿은 문자열이어야 합니다.');
  }

  // 배송지/반품지 주소 ID 검증 (선택적) - API 요구사항 필드명 사용
  if (marketData.naver_release_address_no && (!Number.isInteger(marketData.naver_release_address_no) || marketData.naver_release_address_no <= 0)) {
    throw new Error('배송지 주소 번호는 양의 정수여야 합니다.');
  }

  if (marketData.naver_refund_address_no && (!Number.isInteger(marketData.naver_refund_address_no) || marketData.naver_refund_address_no <= 0)) {
    throw new Error('반품지 주소 번호는 양의 정수여야 합니다.');
  }
};

// 쿠팡 마켓 데이터 유효성 검증
const validateCoopangMarketData = (marketData) => {
  const requiredFields = [
    'coopang_market_number', 
    'coopang_market_memo', 
    'coopang_maximun_sku_count',
    'coopang_vendor_id',
    'coopang_access_key',
    'coopang_secret_key'
  ];
  
  for (const field of requiredFields) {
    if (marketData[field] === undefined || marketData[field] === null || marketData[field] === '') {
      throw new Error(`필수 필드가 누락되었습니다: ${field}`);
    }
  }

  // 마켓 번호 유효성 검증
  if (!Number.isInteger(marketData.coopang_market_number) || marketData.coopang_market_number <= 0) {
    throw new Error('쿠팡 마켓 번호는 양의 정수여야 합니다.');
  }

  // SKU 개수 유효성 검증
  if (!Number.isInteger(marketData.coopang_maximun_sku_count) || marketData.coopang_maximun_sku_count <= 0) {
    throw new Error('최대 SKU 개수는 양의 정수여야 합니다.');
  }

  // 메모 길이 검증
  if (typeof marketData.coopang_market_memo !== 'string') {
    throw new Error('마켓 메모는 문자열이어야 합니다.');
  }

  // 필수 API 인증 정보 검증
  if (typeof marketData.coopang_vendor_id !== 'string' || marketData.coopang_vendor_id.trim() === '') {
    throw new Error('쿠팡 벤더 ID는 필수이며 문자열이어야 합니다.');
  }

  if (typeof marketData.coopang_access_key !== 'string' || marketData.coopang_access_key.trim() === '') {
    throw new Error('쿠팡 액세스 키는 필수이며 문자열이어야 합니다.');
  }

  if (typeof marketData.coopang_secret_key !== 'string' || marketData.coopang_secret_key.trim() === '') {
    throw new Error('쿠팡 시크릿 키는 필수이며 문자열이어야 합니다.');
  }

  // 선택적 필드 검증
  if (marketData.coopang_outbound_shipping_place_code) {
    const outboundCode = parseInt(marketData.coopang_outbound_shipping_place_code);
    if (isNaN(outboundCode) || outboundCode <= 0) {
      throw new Error('출고지 코드는 양의 정수여야 합니다.');
    }
    marketData.coopang_outbound_shipping_place_code = outboundCode;
  }

  if (marketData.coopang_return_charge) {
    const returnCharge = parseInt(marketData.coopang_return_charge);
    if (isNaN(returnCharge) || returnCharge < 0) {
      throw new Error('반품배송비는 0 이상의 정수여야 합니다.');
    }
    marketData.coopang_return_charge = returnCharge;
  }

  // 연락처 형식 검증 (선택적)
  if (marketData.coopang_company_contact_number && typeof marketData.coopang_company_contact_number !== 'string') {
    throw new Error('반품지 연락처는 문자열이어야 합니다.');
  }

  // 우편번호 형식 검증 (선택적)
  if (marketData.coopang_return_zip_code && typeof marketData.coopang_return_zip_code !== 'string') {
    throw new Error('반품지 우편번호는 문자열이어야 합니다.');
  }
};

// 11번가 마켓 데이터 유효성 검증
const validateElevenstoreMarketData = (marketData) => {
  const requiredFields = [
    'elevenstore_market_number', 
    'elevenstore_market_memo', 
    'elevenstore_maximun_sku_count',
    'elevenstore_api_key'
  ];
  
  for (const field of requiredFields) {
    if (marketData[field] === undefined || marketData[field] === null || marketData[field] === '') {
      throw new Error(`필수 필드가 누락되었습니다: ${field}`);
    }
  }

  // 마켓 번호 유효성 검증
  if (!Number.isInteger(marketData.elevenstore_market_number) || marketData.elevenstore_market_number <= 0) {
    throw new Error('11번가 마켓 번호는 양의 정수여야 합니다.');
  }

  // SKU 개수 유효성 검증
  if (!Number.isInteger(marketData.elevenstore_maximun_sku_count) || marketData.elevenstore_maximun_sku_count <= 0) {
    throw new Error('최대 SKU 개수는 양의 정수여야 합니다.');
  }

  // 메모 길이 검증
  if (typeof marketData.elevenstore_market_memo !== 'string') {
    throw new Error('마켓 메모는 문자열이어야 합니다.');
  }

  // 필수 API 인증 정보 검증
  if (typeof marketData.elevenstore_api_key !== 'string' || marketData.elevenstore_api_key.trim() === '') {
    throw new Error('11번가 API 키는 필수이며 문자열이어야 합니다.');
  }

  // 배송지/반품지 주소 ID 검증 (선택적) - addrSeq 값
  if (marketData.elevenstore_shipping_address_id && (!Number.isInteger(marketData.elevenstore_shipping_address_id) || marketData.elevenstore_shipping_address_id <= 0)) {
    throw new Error('출고지 주소 순번은 양의 정수여야 합니다.');
  }

  if (marketData.elevenstore_return_address_id && (!Number.isInteger(marketData.elevenstore_return_address_id) || marketData.elevenstore_return_address_id <= 0)) {
    throw new Error('반품지 주소 순번은 양의 정수여야 합니다.');
  }
};

// ESM 마켓 데이터 유효성 검증
const validateEsmMarketData = (marketData) => {
  const requiredFields = [
    'esm_market_number', 
    'esm_market_memo', 
    'esm_maximun_sku_count'
  ];
  
  for (const field of requiredFields) {
    if (marketData[field] === undefined || marketData[field] === null || marketData[field] === '') {
      throw new Error(`필수 필드가 누락되었습니다: ${field}`);
    }
  }

  // 마켓 번호 유효성 검증
  if (!Number.isInteger(marketData.esm_market_number) || marketData.esm_market_number <= 0) {
    throw new Error('ESM 마켓 번호는 양의 정수여야 합니다.');
  }

  // SKU 개수 유효성 검증
  if (!Number.isInteger(marketData.esm_maximun_sku_count) || marketData.esm_maximun_sku_count <= 0) {
    throw new Error('최대 SKU 개수는 양의 정수여야 합니다.');
  }

  // 메모 길이 검증
  if (typeof marketData.esm_market_memo !== 'string') {
    throw new Error('마켓 메모는 문자열이어야 합니다.');
  }

  // 선택적 필드 검증
  if (marketData.auction_id && typeof marketData.auction_id !== 'string') {
    throw new Error('옥션 ID는 문자열이어야 합니다.');
  }

  if (marketData.gmarket_id && typeof marketData.gmarket_id !== 'string') {
    throw new Error('G마켓 ID는 문자열이어야 합니다.');
  }

  // 템플릿 코드 유효성 검증 (선택적)
  if (marketData.delivery_template_code !== undefined && (!Number.isInteger(marketData.delivery_template_code) || marketData.delivery_template_code <= 0)) {
    throw new Error('배송정보 템플릿 코드는 양의 정수여야 합니다.');
  }

  if (marketData.disclosure_template_code !== undefined && (!Number.isInteger(marketData.disclosure_template_code) || marketData.disclosure_template_code <= 0)) {
    throw new Error('고시정보 템플릿 코드는 양의 정수여야 합니다.');
  }
};
