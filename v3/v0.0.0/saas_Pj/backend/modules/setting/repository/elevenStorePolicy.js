import { promisePool } from '../../../common/utils/connectDB.js';

// 11번가 정책 조회
export async function getElevenStorePolicy(userid) {
  const [rows] = await promisePool.execute(
    'SELECT * FROM elevenstore_setting WHERE userid = ?',
    [userid]
  );
  return rows[0] || null;
}

// 11번가 정책 생성 (기본값으로)
export async function createElevenStorePolicy(userid) {
  const defaultPolicy = {
    overseas_size_chart_display: false,
    include_import_duty: true,
    include_delivery_fee: true,
    elevenstore_point_amount: 1000,
    option_array_logic: 'most_products',
    return_cost: 5000,
    exchange_cost: 5000,
    as_guide: '문의사항이 있으시면 고객센터로 연락주세요.',
    return_exchange_guide: '상품 수령 후 7일 이내 반품/교환이 가능합니다.',
    delivery_company_code: '00045',
    overseas_product_indication: true
  };

  await promisePool.execute(
    `INSERT INTO elevenstore_setting (
      userid, overseas_size_chart_display, include_import_duty, include_delivery_fee,
      elevenstore_point_amount, option_array_logic, return_cost, exchange_cost,
      as_guide, return_exchange_guide, delivery_company_code, overseas_product_indication
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userid,
      defaultPolicy.overseas_size_chart_display,
      defaultPolicy.include_import_duty,
      defaultPolicy.include_delivery_fee,
      defaultPolicy.elevenstore_point_amount,
      defaultPolicy.option_array_logic,
      defaultPolicy.return_cost,
      defaultPolicy.exchange_cost,
      defaultPolicy.as_guide,
      defaultPolicy.return_exchange_guide,
      defaultPolicy.delivery_company_code,
      defaultPolicy.overseas_product_indication
    ]
  );
}

// 11번가 정책 생성 또는 업데이트
export async function upsertElevenStorePolicy(userid, policyData) {
  await promisePool.execute(
    `INSERT INTO elevenstore_setting (
      userid, overseas_size_chart_display, include_import_duty, include_delivery_fee,
      elevenstore_point_amount, option_array_logic, return_cost, exchange_cost,
      as_guide, return_exchange_guide, delivery_company_code, overseas_product_indication
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      overseas_size_chart_display = VALUES(overseas_size_chart_display),
      include_import_duty = VALUES(include_import_duty),
      include_delivery_fee = VALUES(include_delivery_fee),
      elevenstore_point_amount = VALUES(elevenstore_point_amount),
      option_array_logic = VALUES(option_array_logic),
      return_cost = VALUES(return_cost),
      exchange_cost = VALUES(exchange_cost),
      as_guide = VALUES(as_guide),
      return_exchange_guide = VALUES(return_exchange_guide),
      delivery_company_code = VALUES(delivery_company_code),
      overseas_product_indication = VALUES(overseas_product_indication),
      updated_at = CURRENT_TIMESTAMP`,
    [
      userid,
      policyData.overseas_size_chart_display,
      policyData.include_import_duty,
      policyData.include_delivery_fee,
      policyData.elevenstore_point_amount,
      policyData.option_array_logic,
      policyData.return_cost,
      policyData.exchange_cost,
      policyData.as_guide,
      policyData.return_exchange_guide,
      policyData.delivery_company_code,
      policyData.overseas_product_indication
    ]
  );
}
