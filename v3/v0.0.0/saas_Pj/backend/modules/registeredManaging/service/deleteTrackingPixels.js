import axios from 'axios';
import dotenv from 'dotenv';
import { API_TIMEOUTS } from '../../../common/config/detailsetting.js';

dotenv.config();

// 환경 변수에서 트래킹 API 설정을 가져옵니다
const TRACKING_API_BASE_URL = process.env.TRACKING_API_URL || 'https://an.loopton.com';
const TRACKING_API_SECRET = process.env.TRACKING_API_SECRET;

/**
 * 트래킹 API 기본 설정
 */
const trackingApi = axios.create({
    baseURL: TRACKING_API_BASE_URL,
    timeout: API_TIMEOUTS.TRACKING_API.DELETE_VIEWS_TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TRACKING_API_SECRET}`
    }
});

/**
 * 조회 데이터 삭제 API 호출
 * @param {number} userId - 사용자 ID
 * @param {number} productId - 상품 ID
 * @returns {Promise<Object>} 삭제 결과
 */
async function deleteViewsData(userId, productId) {
    try {
        const params = {
            userId,
            productId
        };

        const response = await trackingApi.delete('/api/views', { params });

        return {
            success: true,
            deletedRows: response.data.deletedRows || 0,
            message: response.data.message || '데이터가 성공적으로 삭제되었습니다.'
        };

    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.error || error.message
        };
    }
}

export { deleteViewsData };
