import { promisePool } from '../../../../../common/utils/connectDB.js';

/**
 * ESM 등록에 필요한 설정 데이터를 가져오는 함수 (여러 상품 일괄 처리)
 * @param {number} userid - 사용자 ID
 * @param {Array<number>} productIds - 상품 ID 배열
 * @returns {Object} 구조화된 설정 데이터
 */
export async function getConfig(userid, productIds) {
    try {
        if (!Array.isArray(productIds) || productIds.length === 0) {
            throw new Error('productIds는 비어있지 않은 배열이어야 합니다.');
        }

        // productIds를 쿼리에서 사용할 수 있도록 변환
        const placeholders = productIds.map(() => '?').join(',');

        // 1. esm_setting에서 ESM 정책 설정 가져오기
        const [esmSettingRows] = await promisePool.execute(
            `SELECT include_import_duty, include_delivery_fee, max_option_count
             FROM esm_setting 
             WHERE userid = ?`,
            [userid]
        );

        // 2. common_setting에서 공통 설정 가져오기
        const [commonSettingRows] = await promisePool.execute(
            `SELECT minimum_margin, buying_fee, import_duty, import_vat,
                    china_exchange_rate, usa_exchange_rate, min_percentage, max_percentage,
                    basic_delivery_fee, include_properties, include_options, use_az_option
             FROM common_setting 
             WHERE userid = ?`,
            [userid]
        );

        // 3. esm_register_management에서 등록 관리 데이터 가져오기 (여러 상품)
        const [registerManagementRows] = await promisePool.execute(
            `SELECT productid, delivery_fee, minimum_profit_margin, profit_margin, market_number
             FROM esm_register_management 
             WHERE userid = ? AND productid IN (${placeholders})`,
            [userid, ...productIds]
        );

        // 4. 고유한 market_number들 수집
        const marketNumbers = [...new Set(registerManagementRows
            .filter(row => row.market_number !== null)
            .map(row => row.market_number))];

        // 5. esm_account_info에서 계정 정보 가져오기
        let accountInfoRows = [];
        if (marketNumbers.length > 0) {
            const marketPlaceholders = marketNumbers.map(() => '?').join(',');
            const [accountRows] = await promisePool.execute(
                `SELECT esm_market_number, auction_id, gmarket_id,
                        top_image_1, top_image_2, top_image_3, 
                        bottom_image_1, bottom_image_2, bottom_image_3,
                        delivery_template_code, disclosure_template_code
                 FROM esm_account_info 
                 WHERE userid = ? AND esm_market_number IN (${marketPlaceholders})`,
                [userid, ...marketNumbers]
            );
            accountInfoRows = accountRows;
        }

        // 데이터 검증
        if (commonSettingRows.length === 0) {
            throw new Error(`공통 설정을 찾을 수 없습니다. userid: ${userid}`);
        }
        if (registerManagementRows.length === 0) {
            throw new Error(`등록 관리 데이터를 찾을 수 없습니다. userid: ${userid}, productIds: ${productIds.join(',')}`);
        }

        // ESM 설정이 없으면 기본값 사용
        const esmSetting = esmSettingRows[0] || {
            include_import_duty: true,
            include_delivery_fee: true,
            max_option_count: 1
        };

        // 계정 정보를 market_number로 매핑
        const accountInfoMap = {};
        accountInfoRows.forEach(row => {
            accountInfoMap[row.esm_market_number] = row;
        });

        // 등록 관리 데이터를 productid로 매핑
        const registerManagementMap = {};
        registerManagementRows.forEach(row => {
            registerManagementMap[row.productid] = row;
        });

        // 구조화된 데이터 반환
        return {
            esmConfig: {
                includeImportDuty: esmSetting.include_import_duty,
                includeDeliveryFee: esmSetting.include_delivery_fee,
                maxOptionCount: esmSetting.max_option_count
            },
            priceConfig: {
                minimumMargin: commonSettingRows[0].minimum_margin,
                buyingFee: commonSettingRows[0].buying_fee,
                importDuty: commonSettingRows[0].import_duty,
                importVat: commonSettingRows[0].import_vat,
                chinaExchangeRate: commonSettingRows[0].china_exchange_rate,
                usaExchangeRate: commonSettingRows[0].usa_exchange_rate,
                minPercentage: commonSettingRows[0].min_percentage,
                maxPercentage: commonSettingRows[0].max_percentage,
                basicDeliveryFee: commonSettingRows[0].basic_delivery_fee
            },
            detailPageConfig: {
                includeProperties: commonSettingRows[0].include_properties,
                includeOptions: commonSettingRows[0].include_options,
                useAzOption: commonSettingRows[0].use_az_option
            },
            // 상품별 등록 관리 정보
            productManagementMap: registerManagementMap,
            // 마켓별 계정 정보
            accountInfoMap: accountInfoMap,
            // 전체 상품 ID 목록
            productIds: productIds
        };

    } catch (error) {
        console.error('ESM getConfig 함수에서 오류 발생:', error);
        throw error;
    }
}
