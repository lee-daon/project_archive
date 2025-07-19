import { promisePool } from '../../../common/utils/connectDB.js';

/**
 * 쿠팡 등록에 필요한 설정 데이터를 가져오는 함수
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @returns {Object} 구조화된 설정 데이터
 */
export async function getConfig(userid, productid) {
    try {
        // 1. coopang_setting에서 쿠팡 기본 설정 가져오기
        const [coopangSettingRows] = await promisePool.execute(
            `SELECT delivery_company_code, after_service_guide_content, after_service_telephone,
                    free_shipping, max_option_count, return_delivery_fee, include_import_duty
             FROM coopang_setting 
             WHERE userid = ?`,
            [userid]
        );

        // 2. common_setting에서 공통 설정 가져오기
        const [commonSettingRows] = await promisePool.execute(
            `SELECT minimum_margin, buying_fee, import_duty, import_vat,
                    china_exchange_rate, usa_exchange_rate, min_percentage, max_percentage,
                    include_properties, include_options, use_az_option
             FROM common_setting 
             WHERE userid = ?`,
            [userid]
        );

        // 3. coopang_register_management에서 등록 관리 데이터 가져오기
        const [registerManagementRows] = await promisePool.execute(
            `SELECT delivery_fee, minimum_profit_margin, profit_margin, market_number, use_mapped_json
             FROM coopang_register_management 
             WHERE userid = ? AND productid = ?`,
            [userid, productid]
        );

        // 4. market_number를 이용해 coopang_account_info에서 API 인증 정보 및 계정 정보 가져오기
        let accountInfoRows = [];
        if (registerManagementRows.length > 0 && registerManagementRows[0].market_number) {
            const [accountRows] = await promisePool.execute(
                `SELECT access_key, secret_key, vendor_id, return_charge_name, return_center_code,
                        company_contact_number, return_zip_code, return_address, return_address_detail,
                        outbound_shipping_place_code, vendor_user_id,
                        top_image_1, top_image_2, top_image_3, bottom_image_1, bottom_image_2, bottom_image_3
                 FROM coopang_account_info 
                 WHERE userid = ? AND coopang_market_number = ?`,
                [userid, registerManagementRows[0].market_number]
            );
            accountInfoRows = accountRows;

        }

        // 데이터 검증
        if (coopangSettingRows.length === 0) {
            throw new Error(`쿠팡 설정을 찾을 수 없습니다. userid: ${userid}`);
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

        // 구조화된 데이터 반환
        return {
            coopangConfig: {
                deliveryCompanyCode: coopangSettingRows[0].delivery_company_code,
                afterServiceGuideContent: coopangSettingRows[0].after_service_guide_content,
                afterServiceTelephone: coopangSettingRows[0].after_service_telephone,
                maxOptionCount: coopangSettingRows[0].max_option_count,
                returnInfo: {
                    returnChargeName: accountInfoRows[0].return_charge_name,
                    returnCenterCode: accountInfoRows[0].return_center_code,
                    companyContactNumber: accountInfoRows[0].company_contact_number,
                    returnZipCode: accountInfoRows[0].return_zip_code,
                    returnAddress: accountInfoRows[0].return_address,
                    returnAddressDetail: accountInfoRows[0].return_address_detail,
                    outboundShippingPlaceCode: accountInfoRows[0].outbound_shipping_place_code,
                    returnDeliveryFee: coopangSettingRows[0].return_delivery_fee
                }
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
                freeShipping: coopangSettingRows[0].free_shipping,
                includeImportDuty: coopangSettingRows[0].include_import_duty
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
                marketNumber: registerManagementRows[0].market_number,
                useMappedJson: registerManagementRows[0].use_mapped_json
            },
            coopangApiAuth: {
                accessKey: accountInfoRows[0].access_key,
                secretKey: accountInfoRows[0].secret_key,
                vendorId: accountInfoRows[0].vendor_id,
                vendorUserId: accountInfoRows[0].vendor_user_id
            }
        };

    } catch (error) {
        console.error('getConfig 함수에서 오류 발생:', error);
        throw error;
    }
}
