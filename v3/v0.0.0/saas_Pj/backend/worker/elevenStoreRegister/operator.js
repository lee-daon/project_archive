import { getConfig } from './db/getConfig.js';
import { getBaseData } from './db/getBasedata.js';
import { createInitialJson } from './service/createInitialJson.js';
import { optionChoice } from './service/optionChoice.js';
import { createElevenstoreMapping as createGlobalMapping } from './service/globalMapping.js';
import { createElevenstoreMapping as createLocalMapping } from './service/localMapping.js';
import { registerToElevenstore } from './service/registerProduct.js';

/**
 * 11번가 등록 메인 오퍼레이터
 * 모든 중간급 로직을 통합하고 컨트롤하는 역할
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @returns {Object} 처리 결과
 */
export async function mainOperator(userid, productid) {
    try {
        console.log(`11번가 등록 프로세스 시작 - userid: ${userid}, productid: ${productid}`);

        // 1. getConfig를 이용해 설정 데이터 가져오기
        const config = await getConfig(userid, productid);
        console.log('11번가 설정 데이터 로드 완료');

        // 2. getBaseData를 이용해 카테고리 아이디 초기 스키마 가져오기
        const baseData = await getBaseData(userid, productid);
        console.log('11번가 기본 데이터 로드 완료');

        // 3. createInitialJson에서 1차 가공처리
        const initialJsonResult = await createInitialJson(
            baseData.jsonData,              // JSON 형태의 상품 데이터
            baseData.elevenstoreCatId,      // 11번가 카테고리 ID
            config.priceConfig,             // 가격 설정 데이터
            config.elevenstoreConfig,       // 11번가 설정 데이터
            config.detailPageConfig,        // 상세페이지 설정 데이터
            userid,                         // 사용자 ID
            productid,                      // 상품 ID
            baseData.productGroupCode       // 상품 그룹 코드
        );

        // 4. 옵션 필터링 및 가격 계산
        const optionChoiceResult = await optionChoice(
            initialJsonResult.initialJson,
            config.elevenstoreConfig.optionArrayLogic,
            initialJsonResult.initialJson.discountRate
        );
        console.log('11번가 옵션 필터링 완료 - 대표가격:', optionChoiceResult.representativePrice);

        // 5. overseas_product_indication 값에 따라 적절한 매핑 함수 선택
        const isOverseasProduct = config.elevenstoreConfig.overseasProductIndication;
        const mappingFunction = isOverseasProduct ? createGlobalMapping : createLocalMapping;
        const mappingType = isOverseasProduct ? '글로벌' : '로컬(해외직구)';
        
        const mappingResult = await mappingFunction(
            optionChoiceResult.filteredJsonData,
            optionChoiceResult.representativePrice,
            config,
            baseData.productGroupCode,
            userid,
            productid
        );
        console.log(`11번가 ${mappingType} 매핑 완료 - 성공:`, mappingResult.success);

        if (!mappingResult.success) {
            throw new Error(`매핑 실패: ${mappingResult.message}`);
        }

        // 6. 11번가에 실제 상품 등록 요청
        // API 키 검증
        if (!config.elevenstoreApiAuth?.apiKey) {
            throw new Error(`11번가 API 키가 없습니다. userid: ${userid}, marketNumber: ${config.registerManagement?.marketNumber}`);
        }
        
        const registerResult = await registerToElevenstore(
            mappingResult.xmlString,
            config.elevenstoreApiAuth.apiKey,
            userid,
            productid
        );

        // 상태 저장을 위한 데이터 준비 (worker.js에서 사용)
        const statusData = {
            mappingData: optionChoiceResult.filteredJsonData,
            discountRate: initialJsonResult.initialJson.discountRate,
            marketNumber: config.registerManagement.marketNumber,
            finalMainPrice: optionChoiceResult.representativePrice,
            xmlString: mappingResult.xmlString,  // 실제 XML 문자열 (API 전송용)
            registeredProductNumber: registerResult.registeredProductNumber,
            apiResponse: registerResult.rawResponse
        };

        // 등록 성공 시 처리
        if (registerResult.success) {
            return {
                success: true,
                message: '11번가 등록 완료',
                registeredProductNumber: registerResult.registeredProductNumber,
                itemsCount: optionChoiceResult.filteredJsonData.variants?.length || 0,
                error: null,
                statusData,
                userid,
                productid
            };
        } else {
            // 등록 실패 시 처리
            return {
                success: false,
                message: `11번가 등록 실패: ${registerResult.message}`,
                registeredProductNumber: null,
                itemsCount: optionChoiceResult.filteredJsonData.variants?.length || 0,
                error: registerResult.message,
                statusData,
                userid,
                productid
            };
        }

    } catch (error) {
        console.error('11번가 mainOperator에서 오류 발생:', error);
        
        return {
            success: false,
            message: '11번가 등록 처리 중 오류 발생',
            registeredProductNumber: null,
            itemsCount: 0,
            error: error.message,
            statusData: null,
            userid,
            productid
        };
    }
}
