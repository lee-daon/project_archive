/**
 * 요청 개수 제한 검증
 * @param {number} count - 요청할 개수
 * @param {number} limit - 제한 개수 (기본값: 200)
 * @returns {Object} 검증 결과
 */
export function checkRequestLimit(count, limit = 200) {
    if (count > limit) {
        return {
            success: false,
            statusCode: 429,
            message: `한번에 요청은 ${limit}개가 넘을 수 없습니다`
        };
    }
    
    return {
        success: true
    };
}
