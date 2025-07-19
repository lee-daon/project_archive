import { getConfig } from './db/getConfig.js';
import { getBaseData } from './db/getBasedata.js';
import { createInitialJson } from './service/createInitialJson.js';
import { mapToCoupangFormat } from './service/mapping.js';
import { registerProductToCoupang } from './service/registerProduct.js';

/**
 * 에러 메시지에서 옵션 매핑이 필요한지 확인
 * @param {string} errorMessage - 에러 메시지
 * @returns {boolean} 옵션 매핑이 필요하면 true
 */
function isOptionMappingRequiredError(errorMessage) {
    if (!errorMessage || typeof errorMessage !== 'string') {
        return false;
    }
    
    // 옵션 관련 에러 메시지들 확인
    return errorMessage.includes('유효하지 않은 구매 옵션이 존재합니다') ||
           errorMessage.includes('필수 구매 옵션이 존재하지 않습니다');
}

/**
 * 쿠팡 등록 메인 오퍼레이터
 * 모든 중간급 로직을 통합하고 컨트롤하는 역할
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @returns {Object} 처리 결과
 */
export async function mainOperator(userid, productid) {
    try {


        // 1. getConfig를 이용해 설정 데이터 가져오기
        const config = await getConfig(userid, productid);

        // 2. getBaseData를 이용해 카테고리 아이디 초기 스키마 가져오기
        const baseData = await getBaseData(userid, productid);

        // 3. createInitialJson에서 1차 가공처리
        const initialJsonResult = await createInitialJson(
            baseData.jsonData,          // JSON 형태의 상품 데이터
            baseData.coopangCatId,      // 쿠팡 카테고리 ID
            config.priceConfig,         // 가격 설정 데이터
            config.coopangConfig,       // 쿠팡 설정 데이터
            config.detailPageConfig,    // 상세페이지 설정 데이터
            userid,                     // 사용자 ID
            productid,                  // 상품 ID
            baseData.productGroupCode   // 상품 그룹 코드
        );

        // 4. mapping.js를 이용해 쿠팡 등록 가능한 형태로 매핑
        const mappingResult = await mapToCoupangFormat(initialJsonResult, config);


        // 매핑이 실패한 경우 조기 반환
        if (!mappingResult.success) {
            return {
                success: false,
                message: `쿠팡 매핑 실패: ${mappingResult.message}`,
                userid: userid,
                productid: productid
            };
        }

        // 5. 쿠팡에 실제 상품 등록 요청
        const registrationResult = await registerProductToCoupang(
            mappingResult.data,         // 매핑된 쿠팡 등록용 데이터
            config.coopangApiAuth.accessKey,
            config.coopangApiAuth.secretKey
        );

        // 상태 저장을 위한 데이터 준비 (worker.js에서 사용)
        const statusData = {
            mappingData: mappingResult.data,
            discountRate: initialJsonResult.initialJson.discountRate,
            marketNumber: config.registerManagement.marketNumber
        };

        // 등록 실패 시 에러 타입 확인
        if (!registrationResult.success) {
            const isOptionMapRequired = isOptionMappingRequiredError(registrationResult.message || registrationResult.error);
            
            return {
                success: false,
                message: registrationResult.message || `쿠팡 등록 프로세스 실패 - ${registrationResult.error}`,
                error: registrationResult.error || registrationResult.message,
                statusData: statusData,
                isOptionMapRequired: isOptionMapRequired, // 옵션 매핑 필요 여부 추가
                userid: userid,
                productid: productid
            };
        }

        // 최종 반환값 (등록 성공)
        return {
            success: registrationResult.success,
            message: '쿠팡 등록 프로세스 완료 - 상품 등록 성공',
            registeredProductNumber: registrationResult.registeredProductNumber || null,
            itemsCount: mappingResult.totalItems || 0,
            error: registrationResult.error || null,
            statusData: statusData, // worker.js에서 상태 저장에 사용
            userid: userid,
            productid: productid
        };

    } catch (error) {
        console.error('mainOperator에서 오류 발생:', error);
        
        return {
            success: false,
            message: error.message,
            error: error.message,
            userid: userid,
            productid: productid
        };
    }
}
