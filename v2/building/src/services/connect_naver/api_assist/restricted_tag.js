/**
 * 네이버 커머스 API 태그 제한 여부 조회 모듈- 키워드 배열 입력시 금지 대그 여부 제시
 * @module restricted_tag
 */
import axios from 'axios';
import dotenv from 'dotenv';
import { generateSignature, getAuthToken } from './naver_auth.js';

dotenv.config();

// 네이버 API 클라이언트 정보
const CLIENT_ID = process.env.NAVER_CLIENT_ID;
const CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;
const TYPE = 'SELF'; // 또는 'SELLER'
const ACCOUNT_ID = ''; // TYPE이 'SELLER'인 경우 판매자 ID 입력

/**
 * 네이버 커머스 API를 사용하여 제한된 태그 여부를 조회하는 함수
 * @param {string[]} tags - 확인할 태그 배열
 * @returns {Promise<object>} 제한 태그 목록 및 상태 정보
 * @returns [{"tag": "string", "restricted": true},.....]
 * @throws {Error} 태그 배열이 비어있거나 API 호출 중 오류 발생 시
 */
async function getRestrictedTags(tags) {
  if (!Array.isArray(tags) || tags.length === 0) {
    throw new Error('태그 배열은 필수이며, 최소 하나 이상의 태그가 필요합니다.');
  }

  try {
    // 1. 인증 토큰 발급 받기
    const timestamp = Date.now();
    const signature = generateSignature(CLIENT_ID, CLIENT_SECRET, timestamp);
    const tokenData = await getAuthToken(CLIENT_ID, signature, TYPE, ACCOUNT_ID, timestamp);
    const accessToken = tokenData.access_token;

    // 2. URL에 쿼리 파라미터 직접 구성
    let url = 'https://api.commerce.naver.com/external/v2/tags/restricted-tags';
    const queryParams = tags.map(tag => `tags=${encodeURIComponent(tag)}`).join('&');
    url = `${url}?${queryParams}`;

    // 3. 제한 태그 API 요청 설정
    const config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: url,
      headers: {
        'Accept': 'application/json;charset=UTF-8',
        'Authorization': `Bearer ${accessToken}`
      }
    };

    // 4. API 요청 보내기
    const response = await axios.request(config);
    //console.log('제한 태그 조회 결과:', JSON.stringify(response.data));
    return response.data;

  } catch (error) {
    // 에러 처리
    console.error('제한 태그 조회 오류:', error.response ? error.response.data : error.message);
    if (error.response && error.response.status === 401) {
      console.error('인증 실패. 토큰이 만료되었거나 유효하지 않을 수 있습니다.');
    }
    throw error;
  }
}

export { getRestrictedTags }; // 외부에서 사용할 수 있도록 함수 내보내기
