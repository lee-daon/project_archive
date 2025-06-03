import axios from 'axios';
import dotenv from 'dotenv';
import { generateSignature, getAuthToken } from './naver_auth.js';

dotenv.config();

/**
 * 네이버 커머스 API - 상품 정보 제공 고시 조회 함수
 * 카테고리 ID를 입력하면 해당 카테고리에서 추천하는 상품정보제공고시 상품군 목록을 조회합니다.
 * 
 * @param {string} categoryId - 카테고리 ID (예: '50000810')
 * @returns {Promise<Object>} - API 응답 결과
 */
async function getProductsForProvidedNotice(categoryId) {
  try {
    // 환경 변수에서 인증 정보 가져오기
    const CLIENT_ID = process.env.NAVER_CLIENT_ID;
    const CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;
    
    // 타임스탬프 생성
    const timestamp = Date.now();
    
    // 전자서명 생성
    const signature = generateSignature(CLIENT_ID, CLIENT_SECRET, timestamp);
    
    // 인증 토큰 발급 요청
    const tokenData = await getAuthToken(CLIENT_ID, signature, 'SELF', '', timestamp);
    const accessToken = tokenData.access_token;
    
    // API 요청 설정
    const config = {
      method: 'get',
      url: `https://api.commerce.naver.com/external/v1/products-for-provided-notice?categoryId=${categoryId}`,
      headers: { 
        'Accept': 'application/json;charset=UTF-8', 
        'Authorization': `Bearer ${accessToken}`
      }
    };
    
    // API 요청 실행
    const response = await axios.request(config);
    
    // 응답 데이터 반환
    return response.data;
  } catch (error) {
    // 간단한 에러 핸들링
    throw error;
  }
}

export { getProductsForProvidedNotice };
