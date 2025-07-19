/**
 * 네이버 커머스 API 키워드 필터링 모듈
 * @module keywordFilter
 */
import axios from 'axios';
import { generateSignature, getAuthToken } from './naver_auth.js';

/**
 * 네이버 커머스 API를 사용하여 제한된 태그 여부를 조회하는 함수
 * @param {string[]} tags - 확인할 태그 배열
 * @param {Object} naverApiAuth - 네이버 API 인증 정보 {clientId, clientSecret}
 * @returns {Promise<object>} 제한 태그 목록 및 상태 정보
 * @throws {Error} 태그 배열이 비어있거나 API 호출 중 오류 발생 시
 */
async function getRestrictedTags(tags, naverApiAuth) {
    if (!Array.isArray(tags) || tags.length === 0) {
        throw new Error('태그 배열은 필수이며, 최소 하나 이상의 태그가 필요합니다.');
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
        return response.data;

    } catch (error) {
        // 에러 처리
        console.error('제한 태그 조회 오류:', error.response ? error.response.data : error.message);
        throw error;
    }
}

/**
 * 키워드에서 제한된 태그를 필터링하여 최대 10개의 태그를 반환하는 함수
 * @param {string[]} keywords - 키워드 배열
 * @param {Object} naverApiAuth - 네이버 API 인증 정보 {clientId, clientSecret}
 * @returns {Promise<string[]>} 필터링된 키워드 배열 (최대 10개)
 */
async function filterRestrictedTags(keywords, naverApiAuth) {
    try {
        if (!Array.isArray(keywords) || keywords.length === 0) {
            return [];
        }

        // 중국어, 특수문자, 공백을 제거하고 빈 문자열을 필터링합니다.
        const processedKeywords = keywords
            .map(keyword => keyword.replace(/[^a-zA-Z0-9ㄱ-ㅎㅏ-ㅣ가-힣]/g, ''))
            .filter(keyword => keyword.length > 0);

        if (processedKeywords.length === 0) {
            return [];
        }

        // 제한된 태그 확인
        const restrictionResult = await getRestrictedTags(processedKeywords, naverApiAuth);
        
        // 제한되지 않은 태그만 필터링
        const allowedTags = restrictionResult
            .filter(item => !item.restricted)
            .map(item => item.tag);
        
        // 최대 10개만 반환
        return allowedTags.slice(0, 10);
        
    } catch (error) {
        console.error('태그 필터링 오류:', error);
        // 오류 발생 시 원본 키워드 중 최대 10개 반환 (공백 제거)
        const fallbackKeywords = keywords
            .map(keyword => keyword.replace(/[^a-zA-Z0-9ㄱ-ㅎㅏ-ㅣ가-힣]/g, ''))
            .filter(keyword => keyword.length > 0)
            .slice(0, 10);
        
        return fallbackKeywords;
    }
}

export { filterRestrictedTags };
