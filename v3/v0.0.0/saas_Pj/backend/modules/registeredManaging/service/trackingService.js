import axios from 'axios';
import { getProductInfo, getMultipleProductInfo } from '../repository/getTrackingInfo.js';
import { API_TIMEOUTS } from '../../../common/config/detailsetting.js';

// 환경 변수에서 트래킹 API 설정을 가져옵니다
const TRACKING_API_BASE_URL = process.env.TRACKING_API_URL;
const TRACKING_API_SECRET = process.env.TRACKING_API_SECRET;

/**
 * 트래킹 API 기본 설정
 */
const trackingApi = axios.create({
  baseURL: TRACKING_API_BASE_URL,
  timeout: API_TIMEOUTS.TRACKING_API.GENERAL_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TRACKING_API_SECRET}`
  }
});

/**
 * 상품 조회수 통계를 가져오는 함수
 * @param {number} userId - 사용자 ID
 * @param {Object} options - 조회 옵션
 * @param {string} [options.productId] - 특정 상품 ID
 * @param {string} [options.groupId] - 특정 그룹 ID
 * @param {number} [options.days=30] - 조회 일수
 * @param {string} [options.market='total'] - 마켓 (cou, nav, ele, esm, total)
 * @param {number} [options.minViews] - 최소 조회수
 * @param {number} [options.maxViews] - 최대 조회수
 * @param {string} [options.sortOrder='desc'] - 정렬 순서
 * @returns {Promise<Object>} 트래킹 통계 데이터
 */
export async function getTrackingStats(userId, options = {}) {
  try {
    const {
      productId,
      groupId,
      days = 30,
      market = 'total',
      minViews,
      maxViews,
      sortOrder = 'desc'
    } = options;

    // 쿼리 파라미터 구성
    const params = {
      userId,
      days,
      market,
      sort_order: sortOrder
    };

    // 선택적 파라미터 추가
    if (productId) params.productId = productId;
    if (groupId) params.groupId = groupId;
    if (minViews !== undefined) params.min_views = minViews;
    if (maxViews !== undefined) params.max_views = maxViews;


    const response = await trackingApi.get('/api/views', { params });

    if (response.status === 200) {
      const trackingData = response.data;
      
      if (Array.isArray(trackingData) && trackingData.length > 0) {
        // 트래킹 데이터에서 productId 추출
        const productIds = trackingData.map(item => item.productId).filter(Boolean);
        
        if (productIds.length > 0) {
          // 내부 DB에서 상품 정보 가져오기
          const productInfos = await getMultipleProductInfo(userId, productIds);
          
          // 트래킹 데이터와 상품 정보 결합
          const enrichedData = trackingData.map(trackingItem => {
            const productInfo = productInfos.find(p => p.productid === trackingItem.productId);
            
            // ESM 조회수 계산 (gma + acu)
            const esmViews = (trackingItem.gma_views || 0) + (trackingItem.acu_views || 0);
            
            return {
              productId: trackingItem.productId,
              productName: productInfo?.productName || '알 수 없는 상품',
              groupCode: productInfo?.groupCode || null,
              imageUrl: productInfo?.imageUrl || null,
              platforms: productInfo?.platforms || { coopang: null, naver: null, elevenstore: null, esm: null },
              totalViews: trackingItem.total_views || 0,
              couViews: trackingItem.cou_views || 0,
              navViews: trackingItem.nav_views || 0,
              eleViews: trackingItem.ele_views || 0,
              esmViews: esmViews // gma + acu 합계
            };
          });

          return {
            success: true,
            data: enrichedData,
            message: '트래킹 통계를 성공적으로 가져왔습니다.'
          };
        }
      }
      
      // 트래킹 데이터가 없는 경우
      return {
        success: true,
        data: [],
        message: '조회된 트래킹 데이터가 없습니다.'
      };
    } else {
      throw new Error(`트래킹 API 오류: ${response.status}`);
    }

  } catch (error) {
    console.error('트래킹 통계 조회 중 오류:', error);
    
    if (error.response) {
      // 트래킹 API에서 반환한 오류
      return {
        success: false,
        message: `트래킹 API 오류: ${error.response.data?.error || error.response.statusText}`,
        error: error.response.data
      };
    } else if (error.code === 'ECONNABORTED') {
      // 타임아웃 오류
      return {
        success: false,
        message: '트래킹 API 응답 시간이 초과되었습니다.',
        error: 'Timeout'
      };
    } else {
      // 기타 오류
      return {
        success: false,
        message: '트래킹 통계 조회 중 오류가 발생했습니다.',
        error: error.message
      };
    }
  }
}

/**
 * 특정 상품의 날짜별 상세 조회수를 가져오는 함수
 * @param {number} userId - 사용자 ID
 * @param {string} productId - 상품 ID
 * @param {number} [days=14] - 조회 일수
 * @returns {Promise<Object>} 날짜별 상세 조회수 데이터
 */
export async function getTrackingDetails(userId, productId, days = 14) {
  try {
    // 필수 파라미터 검증
    if (!userId || !productId) {
      return {
        success: false,
        message: 'userId와 productId는 필수 파라미터입니다.',
        error: 'Missing required parameters'
      };
    }

    const params = {
      userId,
      productId,
      days
    };

    console.log('트래킹 상세 API 호출:', params);

    const response = await trackingApi.get('/api/detailviews', { params });

    if (response.status === 200) {
      const trackingData = response.data;
      
      if (Array.isArray(trackingData) && trackingData.length > 0) {
        // 상품 정보 가져오기
        const productInfo = await getProductInfo(userId, productId);
        
        // 트래킹 데이터에 상품 정보 추가
        const enrichedData = {
          productId: productId,
          productName: productInfo?.productName || '알 수 없는 상품',
          groupCode: productInfo?.groupCode || null,
          imageUrl: productInfo?.imageUrl || null,
          platforms: productInfo?.platforms || { coopang: null, naver: null, elevenstore: null, esm: null },
          dailyStats: trackingData.map(item => ({
            date: item.date,
            totalViews: item.total_views || 0,
            couViews: item.cou_views || 0,
            navViews: item.nav_views || 0,
            eleViews: item.ele_views || 0,
            esmViews: (item.gma_views || 0) + (item.acu_views || 0)
          }))
        };

        return {
          success: true,
          data: enrichedData,
          message: '날짜별 상세 조회수를 성공적으로 가져왔습니다.'
        };
      }
      
      // 트래킹 데이터가 없는 경우
      return {
        success: true,
        data: {
          productId: productId,
          dailyStats: []
        },
        message: '해당 기간에 조회 데이터가 없습니다.'
      };
    } else {
      throw new Error(`트래킹 API 오류: ${response.status}`);
    }

  } catch (error) {
    console.error('트래킹 상세 조회 중 오류:', error);
    
    if (error.response) {
      // 트래킹 API에서 반환한 오류
      return {
        success: false,
        message: `트래킹 API 오류: ${error.response.data?.error || error.response.statusText}`,
        error: error.response.data
      };
    } else if (error.code === 'ECONNABORTED') {
      // 타임아웃 오류
      return {
        success: false,
        message: '트래킹 API 응답 시간이 초과되었습니다.',
        error: 'Timeout'
      };
    } else {
      // 기타 오류
      return {
        success: false,
        message: '트래킹 상세 조회 중 오류가 발생했습니다.',
        error: error.message
      };
    }
  }
}

/**
 * 트래킹 API 상태를 확인하는 함수
 * @returns {Promise<boolean>} API 상태 (true: 정상, false: 오류)
 */
export async function checkTrackingApiHealth() {
  try {
    // 간단한 헬스체크 요청 (더미 사용자로)
    const response = await trackingApi.get('/api/views', {
      params: { userId: 1 },
      timeout: API_TIMEOUTS.GENERAL.SHORT_TIMEOUT
    });
    
    return response.status === 200 || response.status === 401; // 401도 API가 살아있음을 의미
  } catch (error) {
    console.error('트래킹 API 헬스체크 실패:', error);
    return false;
  }
} 