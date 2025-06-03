/**
 * 네이버 커머스 API 추천 태그 조회 모듈
 * @module recommend_tag
 */
import axios from 'axios';
import dotenv from 'dotenv';
import { generateSignature, getAuthToken } from './naver_auth.js'; // httpsAgent 제거

dotenv.config();

/**
 * 네이버 API 클라이언트 정보
 * @constant {string} CLIENT_ID - 네이버 클라이언트 ID
 * @constant {string} CLIENT_SECRET - 네이버 클라이언트 시크릿
 * @constant {string} TYPE - 인증 타입 (SELF 또는 SELLER)
 * @constant {string} ACCOUNT_ID - SELLER 타입일 경우 판매자 ID
 */
const CLIENT_ID = process.env.NAVER_CLIENT_ID;
const CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;
const TYPE = 'SELF'; // 또는 'SELLER'
const ACCOUNT_ID = ''; // TYPE이 'SELLER'인 경우 판매자 ID 입력

/**
 * 네이버 커머스 API를 사용하여 추천 태그를 가져오는 함수
 * @param {string} keyword - 검색할 키워드
 * @returns {Promise<object>} 추천 태그 정보 객체
 * @throws {Error} API 호출 중 오류 발생 시
 */
async function getRecommendTags(keyword) {
  try {
    // 1. 인증 토큰 발급 받기
    const timestamp = Date.now();
    const signature = generateSignature(CLIENT_ID, CLIENT_SECRET, timestamp);
    const tokenData = await getAuthToken(CLIENT_ID, signature, TYPE, ACCOUNT_ID, timestamp);
    const accessToken = tokenData.access_token;

    // 2. 추천 태그 API 요청 설정
    const config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: 'https://api.commerce.naver.com/external/v2/tags/recommend-tags',
      headers: {
        'Accept': 'application/json;charset=UTF-8',
        'Authorization': `Bearer ${accessToken}` // 발급받은 토큰 사용
      },
      params: {
        keyword: keyword // 쿼리 파라미터로 키워드 전달
      }
    };

    // 3. API 요청 보내기
    const response = await axios.request(config);
    console.log('추천 태그:', JSON.stringify(response.data));
    return response.data;

  } catch (error) {
    // 에러 발생 시 현재 IP 주소 확인 시도
    try {
      const ipResponse = await axios.get('https://api.ipify.org?format=json');
      console.error('현재 IP 주소:', ipResponse.data.ip);
    } catch (ipError) {
      console.error('IP 주소 확인 중 오류 발생:', ipError.message);
    }

    console.error('추천 태그 요청 오류:', error.response ? error.response.data : error.message);
    if (error.response && error.response.status === 401) {
      console.error('인증 실패. 토큰이 만료되었거나 유효하지 않을 수 있습니다.');
    }
    throw error;

  }
}

export { getRecommendTags }; // 외부에서 사용할 수 있도록 함수 내보내기
