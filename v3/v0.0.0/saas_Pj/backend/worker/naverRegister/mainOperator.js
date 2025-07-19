/*
1. getConfig를 이용해 설정 데이터 가져오기
2. getBaseData를 이용해 카테고리 아이디 초기 스키마 가져오기
3. InitialJson함수 파라미터 넣기기
4. 옵션대상선택(config)
5. mapping에 데이터 쑤셔 넣고 매핑하기
6. 네이버 API로 상품 등록 요청

*/

//marketPolicy를 이용해 공통 설정은 가져오자? 근데 이게 공통이 맞나?

import { getConfig } from './db/getConfing.js';
import { getBaseData } from './db/getBaseData.js';
import { InitialJson } from './service/InitailJson.js';
import { optionChoice } from './service/optionChoice.js';
import { createNaverProductMapping } from './service/mapping.js';
import { generateSignature, getAuthToken } from './service/1st_Assist/naver_auth.js';
import { getCategoryDetails } from './service/1st_Assist/getCategoryDetails.js';
import { cleanImageArray } from '../../common/utils/Validator.js';
import axios from 'axios';

/**
 * 인증 토큰을 사용하여 네이버 커머스 API에 상품 등록 요청
 * @param {string} accessToken - 인증 토큰
 * @param {object} productData - 등록할 상품 데이터
 * @returns {Promise<object>} 상품 등록 결과
 */
async function registerProductWithToken(accessToken, productData) {
    try {
        const url = "https://api.commerce.naver.com/external/v2/products";
        
        const headers = {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json;charset=UTF-8'
        };
        
        console.log('네이버 API 요청 전송 중...');
        const response = await axios.post(url, productData, {
            headers: headers
        });
        
        console.log('네이버 API 응답 성공:', response.data);
        return response.data;
    } catch (error) {
        console.error("네이버 API 호출 오류:", error.message);
        
        // 상세 오류 정보 출력
        if (error.response && error.response.data) {
            console.error("상세 오류 정보:", JSON.stringify(error.response.data, null, 2));
            if (error.response.data.invalidInputs) {
                console.error("유효하지 않은 필드:", JSON.stringify(error.response.data.invalidInputs, null, 2));
            }
        }
        
        throw error;
    }
}

/**
 * 네이버 등록 메인 오퍼레이터
 * 모든 중간급 로직을 통합하고 컨트롤하는 역할
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @returns {Object} 처리 결과
 */
export async function mainOperator(userid, productid) {
    try {
        console.log(`네이버 등록 프로세스 시작 - userid: ${userid}, productid: ${productid}`);

        // 1. getConfig를 이용해 설정 데이터 가져오기
        const config = await getConfig(userid, productid);

        // 설정 데이터의 이미지 URL들 정리
        if (config.detailPageConfig) {
            if (config.detailPageConfig.topImages) {
                config.detailPageConfig.topImages = cleanImageArray(config.detailPageConfig.topImages);
            }
            if (config.detailPageConfig.bottomImages) {
                config.detailPageConfig.bottomImages = cleanImageArray(config.detailPageConfig.bottomImages);
            }
        }

        // 2. getBaseData를 이용해 카테고리 아이디 초기 스키마 가져오기
        const baseData = await getBaseData(userid, productid);

        // 2.5. 카테고리 상세 정보 조회
        const categoryDetails = await getCategoryDetails(baseData.naverCatId, config.naverApiAuth);

        // 3. InitialJson함수 파라미터 넣기
        const initialJsonResult = await InitialJson(
            baseData.jsonData, // common_schema (JSON 데이터)
            baseData.naverCatId, // n_cat_id (네이버 카테고리 ID)
            config.naverApiAuth, // clientInfo (네이버 API 인증 정보)
            config.detailPageConfig.useAzOption, // azOption (a-z 옵션, 설정값 사용)
            config.priceConfig, // priceInfo (가격 설정 데이터)
            config.detailPageConfig, // detailPageConfig (상세페이지 설정 데이터)
            config.priceConfig.includeDeliveryFee, // use_배송비
            userid, // 사용자 ID
            productid, // 상품 ID
            baseData.productGroupCode // 상품 그룹 코드
        );


        // 4. 옵션 선택 및 가격 필터링 (priceSettingLogic에 따라)
        const optionChoiceResult = await optionChoice(
            initialJsonResult.initialJson, // A-Z 처리된 JSON 데이터 (variants가 포함된 올바른 데이터)
            config.naverConfig.priceSettingLogic, // 가격 설정 로직 ('low_price', 'many', 'ai')
            initialJsonResult.initialJson.discountRate // 할인율
        );

        // 5. mapping에 데이터 쑤셔 넣고 매핑하기
        const naverProductData = await createNaverProductMapping(
            initialJsonResult,
            optionChoiceResult,
            config,
            categoryDetails
        );

        // 6. 네이버 API 인증 토큰 획득
        let tokenData;
        try {
            const CLIENT_ID = config.naverApiAuth.clientId;
            const CLIENT_SECRET = config.naverApiAuth.clientSecret;
            const TYPE = 'SELF';
            
            // 타임스탬프 생성
            const timestamp = Date.now();
            
            // 전자서명 생성
            const signature = generateSignature(CLIENT_ID, CLIENT_SECRET, timestamp);
            
            // 인증 토큰 요청
            tokenData = await getAuthToken(CLIENT_ID, signature, TYPE, '', timestamp);
        } catch (error) {
            console.error(`네이버 API 인증 토큰 획득 중 오류 발생: ${error.message}`);
            throw new Error(`네이버 API 인증 토큰 획득 실패: ${error.message}`);
        }

        // 7. 네이버 API로 상품 등록 요청
        let registerResponse;
        try {
            registerResponse = await registerProductWithToken(tokenData.access_token, naverProductData);
        } catch (error) {
            console.error(`네이버 API 상품 등록 중 오류 발생: ${error.message}`);
            throw new Error(`네이버 상품 등록 실패: ${error.message}`);
        }

        // 최종 반환값
        return {
            success: true,
            message: '네이버 등록 프로세스 모든 단계 완료 - 상품 등록 성공',
            initialJsonResult: initialJsonResult,
            optionChoiceResult: optionChoiceResult,
            naverProductData: naverProductData,
            naverRegisterResponse: registerResponse,
            userid: userid,
            productid: productid
        };

    } catch (error) {
        console.error('mainOperator에서 오류 발생:', error);
        return {
            success: false,
            message: error.message,
            userid: userid,
            productid: productid
        };
    }
}

/*
처리 순서:
1. getConfig를 이용해 설정 데이터 가져오기 ✓
2. getBaseData를 이용해 카테고리 아이디 초기 스키마 가져오기 ✓
3. InitialJson함수 파라미터 넣기 ✓
4. 옵션 선택 및 가격 필터링 (priceSettingLogic에 따라) ✓
5. mapping에 데이터 쑤셔 넣고 매핑하기 ✓
6. 네이버 API로 상품 등록 요청 ✓

marketPolicy를 이용해 공통 설정은 가져오자? 근데 이게 공통이 맞나?
-> 현재는 DB의 common_setting 테이블을 사용하도록 구현

let result = await InitialJson(
    common_schema,
    n_cat_id,
    clientInfo,
    a-z(t/f),
    priceInfo,
    use_배송비,
    tracking_url
)
*/