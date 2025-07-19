import { promisePool } from '../../../common/utils/connectDB.js';

/**
 * 네이버 등록에 필요한 설정 데이터를 가져오는 함수
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @returns {Object} 구조화된 설정 데이터
 */
export async function getConfig(userid, productid) {
    try {
        // 1. naver_register_config에서 배송 및 기본 설정 가져오기
        const [naverConfigRows] = await promisePool.execute(
            `SELECT delivery_company, after_service_telephone, after_service_guide_content,
                    naver_point, return_delivery_fee, exchange_delivery_fee, purchase_point,
                    naver_cashback_price, text_review_point, photo_video_review_point,
                    after_use_text_review_point, after_use_photo_video_review_point,
                    store_member_review_point, include_delivery_fee, include_import_duty,
                    price_setting_logic
             FROM naver_register_config 
             WHERE userid = ?`,
            [userid]
        );

        // 2. common_setting에서 공통 설정 가져오기 (basic_minimum_margin_percentage, basic_margin_percentage 제외)
        const [commonSettingRows] = await promisePool.execute(
            `SELECT minimum_margin, buying_fee, import_duty, import_vat,
                    china_exchange_rate, usa_exchange_rate, min_percentage, max_percentage,
                    include_properties, include_options, use_az_option
             FROM common_setting 
             WHERE userid = ?`,
            [userid]
        );

        // 3. naver_register_management에서 등록 관리 데이터 가져오기
        const [registerManagementRows] = await promisePool.execute(
            `SELECT delivery_fee, minimum_profit_margin, profit_margin, market_number
             FROM naver_register_management 
             WHERE userid = ? AND productid = ?`,
            [userid, productid]
        );

        // 4. market_number를 이용해 naver_account_info에서 주소 정보 및 API 인증 정보 가져오기
        let accountInfoRows = [];
        if (registerManagementRows.length > 0 && registerManagementRows[0].market_number) {
            console.log('디버그 - market_number:', registerManagementRows[0].market_number);
            const [accountRows] = await promisePool.execute(
                `SELECT shippingAddressId, returnAddressId, naver_client_secret, naver_client_id,
                        top_image_1, top_image_2, top_image_3, bottom_image_1, bottom_image_2, bottom_image_3
                 FROM naver_account_info 
                 WHERE userid = ? AND naver_market_number = ?`,
                [userid, registerManagementRows[0].market_number]
            );
            accountInfoRows = accountRows;
            console.log('디버그 - accountInfoRows 개수:', accountInfoRows.length);
            if (accountInfoRows.length > 0) {
                console.log('디버그 - client_id:', accountInfoRows[0].naver_client_id);
                console.log('디버그 - client_secret 길이:', accountInfoRows[0].naver_client_secret?.length);
            }
        }

        // 데이터 검증
        if (naverConfigRows.length === 0) {
            throw new Error(`네이버 등록 설정을 찾을 수 없습니다. userid: ${userid}`);
        }
        if (commonSettingRows.length === 0) {
            throw new Error(`공통 설정을 찾을 수 없습니다. userid: ${userid}`);
        }
        if (registerManagementRows.length === 0) {
            throw new Error(`등록 관리 데이터를 찾을 수 없습니다. userid: ${userid}, productid: ${productid}`);
        }
        if (accountInfoRows.length === 0) {
            throw new Error(`계정 정보를 찾을 수 없습니다. userid: ${userid}, market_number: ${registerManagementRows[0].market_number}`);
        }

        // 구조화된 데이터 반환 (register_setting.js 구조 참고)
        return {
            naverConfig: {
                deliveryCompany: naverConfigRows[0].delivery_company,
                afterServiceTelephoneNumber: naverConfigRows[0].after_service_telephone,
                afterServiceGuideContent: naverConfigRows[0].after_service_guide_content,
                naverpoint: naverConfigRows[0].naver_point,
                claimDeliveryInfo: {
                    returnDeliveryFee: naverConfigRows[0].return_delivery_fee,
                    exchangeDeliveryFee: naverConfigRows[0].exchange_delivery_fee,
                    shippingAddressId: accountInfoRows[0].shippingAddressId,
                    returnAddressId: accountInfoRows[0].returnAddressId
                },
                purchasePoint: naverConfigRows[0].purchase_point,
                reviewPointPolicy: {
                    textReviewPoint: naverConfigRows[0].text_review_point,
                    photoVideoReviewPoint: naverConfigRows[0].photo_video_review_point,
                    afterUseTextReviewPoint: naverConfigRows[0].after_use_text_review_point,
                    afterUsePhotoVideoReviewPoint: naverConfigRows[0].after_use_photo_video_review_point,
                    storeMemberReviewPoint: naverConfigRows[0].store_member_review_point
                },
                naverCashbackPrice: naverConfigRows[0].naver_cashback_price,
                priceSettingLogic: naverConfigRows[0].price_setting_logic
            },
            priceConfig: {
                minimumMargin: commonSettingRows[0].minimum_margin,
                minimumProfitMargin: registerManagementRows[0].minimum_profit_margin,
                profitMargin: registerManagementRows[0].profit_margin,
                deliveryFee: registerManagementRows[0].delivery_fee,
                buyingFee: commonSettingRows[0].buying_fee,
                importDuty: commonSettingRows[0].import_duty,
                importVat: commonSettingRows[0].import_vat,
                chinaExchangeRate: commonSettingRows[0].china_exchange_rate,
                usaExchangeRate: commonSettingRows[0].usa_exchange_rate,
                minPercentage: commonSettingRows[0].min_percentage,
                maxPercentage: commonSettingRows[0].max_percentage,
                includeDeliveryFee: naverConfigRows[0].include_delivery_fee,
                includeImportDuty: naverConfigRows[0].include_import_duty
            },
            detailPageConfig: {
                topImages: [
                    accountInfoRows[0].top_image_1,
                    accountInfoRows[0].top_image_2,
                    accountInfoRows[0].top_image_3
                ].filter(img => img && img.trim() !== ''), // 빈 값 제거
                bottomImages: [
                    accountInfoRows[0].bottom_image_1,
                    accountInfoRows[0].bottom_image_2,
                    accountInfoRows[0].bottom_image_3
                ].filter(img => img && img.trim() !== ''), // 빈 값 제거
                includeProperties: commonSettingRows[0].include_properties,
                includeOptions: commonSettingRows[0].include_options,
                useAzOption: commonSettingRows[0].use_az_option
            },
            registerManagement: {
                marketNumber: registerManagementRows[0].market_number
            },
            naverApiAuth: {
                clientSecret: accountInfoRows[0].naver_client_secret,
                clientId: accountInfoRows[0].naver_client_id
            }
        };

    } catch (error) {
        console.error('getConfig 함수에서 오류 발생:', error);
        throw error;
    }
}
