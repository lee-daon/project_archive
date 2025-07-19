import { promisePool } from '../../../common/utils/connectDB.js';

/**
 * 11번가 등록에 필요한 설정 데이터를 가져오는 함수
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 * @returns {Object} 구조화된 설정 데이터
 */
export async function getConfig(userid, productid) {
    try {
        // 1. elevenstore_setting에서 11번가 기본 설정 가져오기
        const [elevenstoreSettingRows] = await promisePool.execute(
            `SELECT overseas_size_chart_display, include_import_duty, include_delivery_fee,
                    elevenstore_point_amount, option_array_logic, return_cost, exchange_cost,
                    as_guide, return_exchange_guide, delivery_company_code, overseas_product_indication
             FROM elevenstore_setting 
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

        // 3. elevenstore_register_management에서 등록 관리 데이터 가져오기
        const [registerManagementRows] = await promisePool.execute(
            `SELECT delivery_fee, minimum_profit_margin, profit_margin, market_number
             FROM elevenstore_register_management 
             WHERE userid = ? AND productid = ?`,
            [userid, productid]
        );

        // 4. market_number를 이용해 elevenstore_account_info에서 API 인증 정보 및 계정 정보 가져오기
        let accountInfoRows = [];
        if (registerManagementRows.length > 0 && registerManagementRows[0].market_number) {
            const [accountRows] = await promisePool.execute(
                `SELECT api_key, shippingAddressId, returnAddressId, prdInfoTmpltNo,
                        top_image_1, top_image_2, top_image_3, bottom_image_1, bottom_image_2, bottom_image_3
                 FROM elevenstore_account_info 
                 WHERE userid = ? AND elevenstore_market_number = ?`,
                [userid, registerManagementRows[0].market_number]
            );
            accountInfoRows = accountRows;
        }

        // 데이터 검증
        if (elevenstoreSettingRows.length === 0) {
            throw new Error(`11번가 설정을 찾을 수 없습니다. userid: ${userid}`);
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
            elevenstoreConfig: {
                overseasSizeChartDisplay: elevenstoreSettingRows[0].overseas_size_chart_display,
                overseasProductIndication: elevenstoreSettingRows[0].overseas_product_indication,
                elevenstorePointAmount: elevenstoreSettingRows[0].elevenstore_point_amount,
                optionArrayLogic: elevenstoreSettingRows[0].option_array_logic,
                asGuide: elevenstoreSettingRows[0].as_guide,
                returnExchangeGuide: elevenstoreSettingRows[0].return_exchange_guide,
                deliveryCompanyCode: elevenstoreSettingRows[0].delivery_company_code,
                prdInfoTmpltNo: accountInfoRows[0].prdInfoTmpltNo,
                returnInfo: {
                    returnCost: elevenstoreSettingRows[0].return_cost,
                    exchangeCost: elevenstoreSettingRows[0].exchange_cost,
                    shippingAddressId: accountInfoRows[0].shippingAddressId,
                    returnAddressId: accountInfoRows[0].returnAddressId
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
                includeDeliveryFee: elevenstoreSettingRows[0].include_delivery_fee,
                includeImportDuty: elevenstoreSettingRows[0].include_import_duty
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
            elevenstoreApiAuth: {
                apiKey: accountInfoRows[0].api_key
            }
        };

    } catch (error) {
        console.error('getConfig 함수에서 오류 발생:', error);
        throw error;
    }
}
