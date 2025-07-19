/**
 * 네이버 커머스 API 카테고리 상세 정보 조회 모듈
 * @module getCategoryDetails
 */
import axios from 'axios';
import { generateSignature, getAuthToken } from './naver_auth.js';

/**
 * 네이버 커머스 API를 사용하여 카테고리 상세 정보를 조회하는 함수
 * @param {string} categoryId - 조회할 카테고리 ID
 * @param {Object} naverApiAuth - 네이버 API 인증 정보 {clientId, clientSecret}
 * @returns {Promise<object>} 카테고리 상세 정보
 * @throws {Error} API 호출 중 오류 발생 시
 */
async function getCategoryDetails(categoryId, naverApiAuth) {
    if (!categoryId) {
        throw new Error('카테고리 ID는 필수입니다.');
    }

    if (!naverApiAuth || !naverApiAuth.clientId || !naverApiAuth.clientSecret) {
        throw new Error('네이버 API 인증 정보가 필요합니다.');
    }

    try {
        // 1. 인증 토큰 발급 받기
        const timestamp = Date.now();
        const signature = generateSignature(naverApiAuth.clientId, naverApiAuth.clientSecret, timestamp);
        const tokenData = await getAuthToken(naverApiAuth.clientId, signature, 'SELF', '', timestamp);
        const accessToken = tokenData.access_token;

        // 2. API URL 구성
        const url = `https://api.commerce.naver.com/external/v1/categories/${categoryId}`;

        // 3. API 요청 설정
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
        return response.data;

    } catch (error) {
        console.error('카테고리 정보 조회 오류:', error.response ? error.response.data : error.message);
        throw error;
    }
}

export { getCategoryDetails }; 