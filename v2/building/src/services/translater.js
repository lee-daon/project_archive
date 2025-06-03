import axios from 'axios';
import * as db from '../db/sourcing/Productlist.js';

// 인증 정보 (앱 등록 시 발급받은 값을 입력하세요)
const clientId = process.env.PAPAGO_CLIENT_ID;       // X-NCP-APIGW-API-KEY-ID
const clientSecret = process.env.PAPAGO_SECRET;        // X-NCP-APIGW-API-KEY
const glossaryKey = ''; // glossaryKey (필요하지 않다면 빈 문자열로 설정)

// Papago NMT API 엔드포인트
const url = 'https://papago.apigw.ntruss.com/nmt/v1/translation';

// 3월 20일 도메인 변경 예정
//https://naveropenapi.apigw.ntruss.com → https://papago.apigw.ntruss.com
//으로 변경되니까 수정하기

/**
 * 주어진 텍스트를 Papago NMT API를 통해 번역한 후, 번역된 텍스트만 반환합니다.
 * @param {string} text - 번역할 원문 텍스트
 * @returns {Promise<string>} 번역된 텍스트
 */
export async function translateText(text) {
  // API 요청 데이터 구성
  const requestData = {
    source: 'auto',     // 원본 언어 자동 감지
    target: 'ko',       // 번역할 대상 언어 (예: 한국어)
    text,               // 입력 텍스트
    glossaryKey,        // 글로서리 키 (없으면 빈 문자열)
    replaceInfo: ' ',   // replaceInfo 옵션 (필요에 따라 수정)
    honorific: 'true'   // 높임말 여부
  };

  try {
    const response = await axios.post(url, requestData, {
      headers: {
        'X-NCP-APIGW-API-KEY-ID': clientId,
        'X-NCP-APIGW-API-KEY': clientSecret,
        'Content-Type': 'application/json'
      }
    });

    return response.data.message.result.translatedText;
  } catch (error) {
    console.error('요청 에러:', error);
    if (error.response && error.response.status === 400) {
      console.error('혹시 상품을 한국어로 수집했는지 확인해주세요');
    }
    throw error;
  }
}

/**
 * newProducts 배열의 각 객체의 productName 값을 번역하여 교체하고, DB도 업데이트합니다.
 * 만약 번역 중 두번째 오류가 발생하면 전체 번역 과정을 중지합니다.
 * @param {Array<Object>} newProducts - 번역 후 상품명 업데이트 대상 객체 배열
 * @returns {Promise<Array<Object>>} 번역이 완료된 배열
 */
export async function translateProductNames(newProducts) {
  for (let i = 0; i < newProducts.length; i++) {
    const product = newProducts[i];
    if (product.productName) {
      try {
        // productName을 번역하고 그 결과로 교체
        const translatedName = await translateText(product.productName);
        product.productName = translatedName;
        // DB 업데이트: 번역된 상품명을 저장
        await db.updateProduct({
          productId: product.productId,
          productName: translatedName,
        });
        if (i % 6 === 0) {console.log( i + '번째 상품품 번역 완료');} // 6개씩 출력
      } catch (error) {
        console.error(`상품 [${product.productName}] 번역 중 에러 발생 (1차 시도):`, error);
        // 1차 시도에 실패하면 재시도
        try {
          const translatedName = await translateText(product.productName);
          product.productName = translatedName;
          // 재시도 성공 시 DB 업데이트
          await db.updateProduct({
            productId: product.productId,
            productName: translatedName,
          });
        } catch (retryError) {
          // 두번째 오류가 발생하면 전체 번역 과정을 중지
          console.error(`상품 번호 [${i + 1}] 번역 재시도 중 에러 발생:`, retryError);
          throw new Error(`상품 번호 [${i + 1}] 번역 재시도 중 에러 발생 - 번역 과정을 중지합니다.`);
        }
      }
    }
  }
  return newProducts;
}