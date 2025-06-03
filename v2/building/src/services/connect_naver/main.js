/**
 * 네이버 커머스 API 연동 모듈
 * 상품 정보 조립, 매핑, 등록 요청 처리
 */
import axios from 'axios';
import dotenv from 'dotenv';
import { prepareNaverProductData } from './mapping_final.js';
import { generateSignature, getAuthToken } from './api_assist/naver_auth.js';
import { 
  saveNaverProductNumbers, 
  updateStatusOnSuccess, 
  updateStatusOnFailure 
} from '../../db/register/naverRegisterInfo.js';

dotenv.config();

/**
 * 인증 토큰을 사용하여 네이버 커머스 API에 상품 등록 요청
 * @param {string} accessToken - 인증 토큰
 * @param {object} productData - 등록할 상품 데이터
 * @returns {Promise<object>} 상품 등록 결과
 */
async function registerProductWithToken(accessToken, productData) {
  try {
    const url = "https://api.commerce.naver.com/external/v2/products";
    
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json;charset=UTF-8'
    };
    
    const response = await axios.post(url, productData, {
      headers: headers
    });
    
    return response.data;
  } catch (error) {
    console.error("API 호출 오류:", error.message);
    
    // 상세 오류 정보 출력
    if (error.response && error.response.data) {
      console.error("상세 오류 정보:", JSON.stringify(error.response.data, null, 2));
      if (error.response.data.invalidInputs) {
        console.error("유효하지 않은 필드:", JSON.stringify(error.response.data.invalidInputs, null, 2));
      }
    }
    
    throw error;
  }
}

/**
 * 네이버 커머스 API를 통해 상품을 등록하는 메인 함수
 * @param {string} productId - 등록할 상품 ID
 * @returns {Promise<object>} 상품 등록 결과 정보
 */
async function registerNaverProduct(productId) {
  // 1. 상품 정보 준비 (API 형식으로 변환)
  let naverProductData;
  try {
    console.log(`상품 ID ${productId} 정보 준비 중...`);
    naverProductData = await prepareNaverProductData(productId);
  } catch (error) {
    console.error(`상품 정보 준비 중 오류 발생: ${error.message}`);
    // 등록 실패 시 status 테이블 업데이트
    try {
      await updateStatusOnFailure(productId, error.message);
    } catch (statusError) {
      console.error(`상태 업데이트 실패: ${statusError.message}`);
    }
    throw new Error(`상품 정보 준비 실패: ${error.message}`);
  }

  // 2. 인증 토큰 획득
  let tokenData;
  try {
    console.log("인증 토큰 획득 중...");
    const CLIENT_ID = process.env.NAVER_CLIENT_ID;
    const CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;
    const TYPE = 'SELF';
    
    // 타임스탬프 생성
    const timestamp = Date.now();
    
    // 전자서명 생성
    const signature = generateSignature(CLIENT_ID, CLIENT_SECRET, timestamp);
    
    // 인증 토큰 요청
    tokenData = await getAuthToken(CLIENT_ID, signature, TYPE, '', timestamp);
    //console.log('인증 토큰 획득 완료');
  } catch (error) {
    console.error(`인증 토큰 획득 중 오류 발생: ${error.message}`);
    // 등록 실패 시 status 테이블 업데이트
    try {
      await updateStatusOnFailure(productId, error.message);
    } catch (statusError) {
      console.error(`상태 업데이트 실패: ${statusError.message}`);
    }
    throw new Error(`인증 토큰 획득 실패: ${error.message}`);
  }
    
  // 3. 상품 등록 API 호출
  let registerResponse;
  try {
    console.log("상품 등록 요청 전송 중...");
    registerResponse = await registerProductWithToken(tokenData.access_token, naverProductData);
    console.log("상품 등록 성공:", registerResponse.originProductNo);
  } catch (error) {
    console.error(`상품 등록 API 호출 중 오류 발생: ${error.message}`);
    // 등록 실패 시 status 테이블 업데이트
    try {
      await updateStatusOnFailure(productId, error.message);
    } catch (statusError) {
      console.error(`상태 업데이트 실패: ${statusError.message}`);
    }
    throw new Error(`상품 등록 실패: ${error.message}`);
  }
    
  // 4. DB에 네이버 상품 번호 저장
  try {
    await saveNaverProductNumbers(
      productId, 
      registerResponse.originProductNo, 
      registerResponse.smartstoreChannelProductNo
    );
    
    // 등록 성공 시 status 테이블 업데이트
    await updateStatusOnSuccess(productId);
  } catch (error) {
    console.error(`상품 번호 저장 중 오류 발생: ${error.message}`);
    // 상품 등록은 성공했으므로 에러를 던지지 않고 계속 진행
    console.warn(`상품은 등록되었으나 DB 저장에 실패했습니다. 상품 ID: ${productId}, 원상품번호: ${registerResponse.originProductNo}`);
  }
     
  return registerResponse;
}

/**
 * 지정된 시간(ms) 동안 대기하는 함수
 * @param {number} ms - 대기 시간(밀리초)
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 여러 상품 일괄 등록 (네이버 API 레이트 리밋 1초 고려)
 * @param {Array<string>} productIds - 상품 ID 배열
 * @returns {Promise<Object>} 등록 결과 요약
 */
async function registerMultipleProducts(productIds) {
  const results = [];
  const errors = [];

  for (let i = 0; i < productIds.length; i++) {
    const productId = productIds[i];
    
    try {
      console.log(`상품 #${i+1}(ID: ${productId}) 등록 중...`);
      const result = await registerNaverProduct(productId);
      results.push({
        success: true,
        productId: productId,
        naverProductNo: result.originProductNo,
        smartstoreChannelProductNo: result.smartstoreChannelProductNo
      });
    } catch (error) {
      console.error(`상품 #${i+1}(ID: ${productId}) 등록 실패:`, error.message);
      
      // 일괄 등록에서 발생한 에러도 status 테이블에 업데이트
      try {
        await updateStatusOnFailure(productId, error.message);
      } catch (statusError) {
        console.error(`상태 업데이트 실패: ${statusError.message}`);
      }
      
      errors.push({
        success: false,
        productId: productId,
        error: error.message
      });
      results.push({
        success: false,
        productId: productId,
        error: error.message
      });
    }
    
    // 마지막 상품이 아닌 경우 네이버 API 레이트 리밋(1초)을 고려하여 대기
    if (i < productIds.length - 1) {
      console.log(`네이버 API 레이트 리밋 준수를 위해 1초 대기 중...`);
      await sleep(1000);
    }
  }

  return {
    results,
    summary: {
      total: productIds.length,
      success: results.filter(r => r.success).length,
      failed: errors.length
    }
  };
}

export { registerNaverProduct, registerMultipleProducts };
