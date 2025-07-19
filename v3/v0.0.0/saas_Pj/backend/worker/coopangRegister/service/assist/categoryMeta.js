import { createCoupangAuthHeaders } from '../../../../common/utils/coopang_auth.js';
import { proxyGet } from '../../../../common/utils/proxy.js';

/**
 * 쿠팡 카테고리 메타데이터 조회 (특정 카테고리 코드)
 * @param {string} accessKey - 쿠팡 액세스 키
 * @param {string} secretKey - 쿠팡 시크릿 키
 * @param {number} displayCategoryCode - 노출 카테고리 코드
 * @returns {Promise<object>} 카테고리 메타데이터 응답
 */
export const getCoupangCategoryMeta = async (accessKey, secretKey, displayCategoryCode) => {
    try {
      // 입력값 검증
      if (!accessKey || typeof accessKey !== 'string') {
        throw new Error('유효한 액세스 키가 필요합니다.');
      }
  
      if (!secretKey || typeof secretKey !== 'string') {
        throw new Error('유효한 시크릿 키가 필요합니다.');
      }
  
      if (!displayCategoryCode || typeof displayCategoryCode !== 'number') {
        throw new Error('유효한 카테고리 코드가 필요합니다.');
      }
  
      const method = 'GET';
      const path = `/v2/providers/seller_api/apis/api/v1/marketplace/meta/category-related-metas/display-category-codes/${displayCategoryCode}`;
      const query = ''; // 쿼리 파라미터 없음
      
      // 인증 헤더 생성
      const headers = createCoupangAuthHeaders(accessKey, secretKey, method, path, query);
      
      // 프록시를 통한 요청
      const url = `api-gateway.coupang.com${path}`;
      

      const response = await proxyGet(url, {}, headers);
      
      return {
        success: true,
        data: response.data,
        message: `카테고리 ${displayCategoryCode} 메타데이터 조회 성공`
      };
    } catch (error) {
      console.error(`카테고리 ${displayCategoryCode} 메타데이터 조회 실패:`, error.message);
      return {
        success: false,
        error: error.message,
        data: null,
        message: `카테고리 ${displayCategoryCode} 메타데이터 조회 실패`
      };
    }
  };

/**
 * 카테고리 메타데이터에서 noticeCategories를 처리하여 상품 등록용 공지사항 배열을 생성하는 함수
 * @param {Object} categoryMetaData - 쿠팡 카테고리 메타데이터 응답 객체
 * @param {string} phoneNumber - 소비자상담 관련 전화번호
 * @returns {Array} 공지사항 배열
 */
const processNoticeCategories = (categoryMetaData, phoneNumber) => {
  try {
    
    // 입력 데이터 검증
    if (!categoryMetaData?.data?.noticeCategories) {
      console.warn('공지사항 카테고리 데이터가 없습니다.');
      return [];
    }

    if (!phoneNumber || typeof phoneNumber !== 'string') {
      console.warn('유효한 전화번호가 제공되지 않았습니다.');
      phoneNumber = '상세페이지참조'; // 기본값 설정
    }

    const noticeCategories = categoryMetaData.data.noticeCategories;

    // 우선순위: "기타 재화" > 첫 번째 카테고리
    let selectedCategory = noticeCategories.find(category => 
      category.noticeCategoryName === "기타 재화"
    );
    
    if (!selectedCategory && noticeCategories.length > 0) {
      selectedCategory = noticeCategories[0];
    }

    if (!selectedCategory) {
      console.warn('사용 가능한 공지사항 카테고리가 없습니다.');
      return [];
    }

    // noticeCategoryDetailNames를 notices 형태로 변환
    const notices = selectedCategory.noticeCategoryDetailNames.map(detail => {
      const detailName = detail.noticeCategoryDetailName;
      let content = "상세페이지참조"; // 기본값

      // 특정 필드별 처리
      if (detailName.includes("제조국") && detailName.includes("원산지")) {
        content = "중국";
      } else if (detailName.includes("제조국")) {
        content = "중국";
      } else if (detailName.includes("수입자")) {
        content = "한국";
      } else if (detailName.includes("A/S 책임자") && detailName.includes("전화번호")) {
        content = phoneNumber;
      } else if (detailName.includes("소비자상담") && detailName.includes("전화번호")) {
        content = phoneNumber;
      }

      return {
        noticeCategoryName: selectedCategory.noticeCategoryName,
        noticeCategoryDetailName: detailName,
        content: content
      };
    });

    return notices;

  } catch (error) {
    console.error('공지사항 카테고리 처리 중 오류:', error);
    return [];
  }
};

/**
 * 쿠팡 카테고리 메타데이터를 조회하고 공지사항 정보를 추출하는 함수
 * @param {string} accessKey - 쿠팡 액세스 키
 * @param {string} secretKey - 쿠팡 시크릿 키
 * @param {number} displayCategoryCode - 노출 카테고리 코드
 * @param {string} phoneNumber - 소비자상담 관련 전화번호
 * @returns {Promise<object>} 처리된 공지사항 정보
 */
export const getCoupangCategoryNotices = async (accessKey, secretKey, displayCategoryCode, phoneNumber) => {
  try {
    // 1단계: 카테고리 메타데이터 조회
    const metaResult = await getCoupangCategoryMeta(accessKey, secretKey, displayCategoryCode);
    
    
    if (!metaResult.success) {
      return {
        success: false,
        error: metaResult.error,
        message: metaResult.message,
        data: null
      };
    }

    // 2단계: 공지사항 카테고리 처리
    const notices = processNoticeCategories(metaResult.data, phoneNumber);

    // 3단계: 결과 반환
    return {
      success: true,
      data: {
        notices: notices
      },
      message: `카테고리 ${displayCategoryCode} 공지사항 추출 성공`
    };
    
  } catch (error) {
    console.error(`카테고리 ${displayCategoryCode} 공지사항 추출 실패:`, error);
    return {
      success: false,
      error: error.message,
      message: `카테고리 ${displayCategoryCode} 공지사항 추출 실패`,
      data: null
    };
  }
};