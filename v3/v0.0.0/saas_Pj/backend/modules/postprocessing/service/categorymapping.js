import { 
    getRequiredCategoryIds, 
    getCategoryProductSamples,
    upsertCategoryMapping,
    getCompletedCategoryMappings
} from '../repository/categorymapping.js';

/**
 * 페이지네이션 계산 함수
 * @param {string|number} page - 페이지 번호
 * @param {string|number} limit - 페이지당 항목 수
 * @returns {Object} 페이지네이션 정보
 */
const getPagination = (page, limit) => {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;
    return { limit: limitNum, offset, page: pageNum };
};

/**
 * 카테고리 매핑 정보 조회 서비스 (논리적 무결성)
 * @param {number} userid - 사용자 ID
 * @param {string|number} page - 페이지 번호
 * @param {string|number} limit - 페이지당 항목 수
 * @returns {Promise<Object>} 카테고리 매핑 정보 응답
 */
export const getCategoryMappingInfoService = async (userid, page = null, limit = null) => {
    try {
        let paginationInfo = null;
        let paginatedLimit = null;
        let paginatedOffset = null;

        // 페이지네이션이 요청된 경우
        if (page !== null || limit !== null) {
            paginationInfo = getPagination(page, limit);
            paginatedLimit = paginationInfo.limit;
            paginatedOffset = paginationInfo.offset;
        }

        // 매핑이 필요한 카테고리들 조회
        const result = await getRequiredCategoryIds(userid, paginatedLimit, paginatedOffset);
        
        return {
            success: true,
            categories: result.categories,
            ...(paginationInfo && {
                total: result.total,
                page: paginationInfo.page,
                limit: paginationInfo.limit
            })
        };
        
    } catch (error) {
        console.error('카테고리 매핑 정보 조회 서비스 오류:', error);
        return {
            success: false,
            error: error.message,
            code: 'SERVICE_ERROR'
        };
    }
};

/**
 * 매핑 완료된 카테고리 정보 조회 서비스
 * 모든 플랫폼(네이버, 쿠팡, 11번가)에 매핑이 완료된 카테고리만 조회
 * @param {number} userid - 사용자 ID
 * @param {string|number} page - 페이지 번호
 * @param {string|number} limit - 페이지당 항목 수
 * @returns {Promise<Object>} 매핑 완료된 카테고리 정보 응답
 */
export const getCompletedCategoryMappingService = async (userid, page = null, limit = null) => {
    try {
        let paginationInfo = null;
        let paginatedLimit = null;
        let paginatedOffset = null;

        // 페이지네이션이 요청된 경우
        if (page !== null || limit !== null) {
            paginationInfo = getPagination(page, limit);
            paginatedLimit = paginationInfo.limit;
            paginatedOffset = paginationInfo.offset;
        }

        // 매핑 완료된 카테고리들 조회
        const result = await getCompletedCategoryMappings(userid, paginatedLimit, paginatedOffset);
        
        return {
            success: true,
            categories: result.categories,
            ...(paginationInfo && {
                total: result.total,
                page: paginationInfo.page,
                limit: paginationInfo.limit
            })
        };
        
    } catch (error) {
        console.error('매핑 완료된 카테고리 정보 조회 서비스 오류:', error);
        return {
            success: false,
            message: error.message,
            code: 'SERVICE_ERROR'
        };
    }
};

/**
 * 카테고리별 상품 샘플 조회 서비스
 * @param {number} userid - 사용자 ID
 * @param {string} catid - 카테고리 ID
 * @param {number} limit - 조회할 상품 수
 * @returns {Promise<Object>} 상품 샘플 응답
 */
export const getCategoryProductSamplesService = async (userid, catid, limit = 3) => {
    try {
        // 유효성 검사
        if (!catid) {
            return {
                success: false,
                error: '카테고리 ID가 필요합니다.',
                code: 'MISSING_CATID'
            };
        }

        // limit 값 검증 및 기본값 설정
        const limitNum = parseInt(limit) || 3;
        if (limitNum < 1 || limitNum > 10) {
            return {
                success: false,
                error: '조회할 상품 수는 1-10 사이여야 합니다.',
                code: 'INVALID_LIMIT'
            };
        }

        // 상품 샘플 조회
        const products = await getCategoryProductSamples(userid, catid, limitNum);
        
        return {
            success: true,
            products: products
        };
        
    } catch (error) {
        console.error('카테고리 상품 샘플 조회 서비스 오류:', error);
        return {
            success: false,
            error: error.message,
            code: 'SERVICE_ERROR'
        };
    }
};

/**
 * 카테고리 매핑 업데이트 서비스 (논리적 무결성)
 * @param {number} userid - 사용자 ID
 * @param {Array} mappings - 매핑 정보 배열
 * @returns {Promise<Object>} 업데이트 결과 응답
 */
export const updateCategoryMappingService = async (userid, mappings) => {
    try {
        // 유효성 검사
        if (!mappings || !Array.isArray(mappings) || mappings.length === 0) {
            return {
                success: false,
                error: '매핑 정보 배열이 필요합니다.',
                code: 'MISSING_MAPPINGS'
            };
        }

        // 각 매핑 정보에 대해 유효성 검사
        for (const mapping of mappings) {
            if (!mapping.catid) {
                return {
                    success: false,
                    error: '모든 매핑 정보에 catid가 필요합니다.',
                    code: 'MISSING_CATID'
                };
            }
        }

        // 매핑 정보 업데이트 (categorymapping 테이블만 수정)
        let updatedCount = 0;
        for (const mapping of mappings) {
            await upsertCategoryMapping(mapping, userid);
            updatedCount++;
        }

        return {
            success: true,
            message: '카테고리 매핑이 성공적으로 업데이트되었습니다.',
            updated_count: updatedCount,
            updated_products_count: 0 // 논리적 무결성으로 인해 별도 상품 업데이트 불필요
        };
        
    } catch (error) {
        console.error('카테고리 매핑 업데이트 서비스 오류:', error);
        return {
            success: false,
            error: error.message,
            code: 'SERVICE_ERROR'
        };
    }
};
