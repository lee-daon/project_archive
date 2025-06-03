/**
 * 네이버 커머스 API 카테고리 정보 조회 모듈
 * @module category_search
 */
import axios from "axios";
import dotenv from "dotenv";
import { getAuthToken, generateSignature } from "./naver_auth.js";

dotenv.config();

/**
 * 네이버 커머스 API에서 특정 카테고리 정보 조회
 * @param {string} categoryId - 카테고리 ID
 * @returns {Promise<object>} 카테고리 정보
 * @throws {Error} API 호출 중 오류 발생 시
 */
async function getCategoryInfo(categoryId) {
  try {
    // 인증 토큰 발급
    const CLIENT_ID = process.env.NAVER_CLIENT_ID;
    const CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;
    const TYPE = 'SELF';
    const timestamp = Date.now();
    
    // 전자서명 생성
    const signature = generateSignature(CLIENT_ID, CLIENT_SECRET, timestamp);
    
    // 인증 토큰 발급 요청
    const tokenData = await getAuthToken(CLIENT_ID, signature, TYPE, '', timestamp);
    const accessToken = tokenData.access_token;
    
    // 카테고리 정보 조회 API 요청
    const response = await axios.request({
      method: 'get',
      url: `https://api.commerce.naver.com/external/v1/categories/${categoryId}`,
      headers: {
        'Accept': 'application/json;charset=UTF-8',
        'Authorization': `Bearer ${accessToken}`
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('카테고리 정보 조회 오류:', error.response ? error.response.data : error.message);
    throw error;
  }
}


export { getCategoryInfo };
