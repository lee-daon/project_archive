import { promisePool } from '../../../common/utils/connectDB.js';

// ESM 정책 조회
export async function getEsmPolicy(userid) {
  const [rows] = await promisePool.execute(
    'SELECT * FROM esm_setting WHERE userid = ?',
    [userid]
  );
  return rows[0] || null;
}

// ESM 정책 생성 (기본값으로)
export async function createEsmPolicy(userid) {
  const defaultPolicy = {
    include_import_duty: true,
    include_delivery_fee: true,
    max_option_count: 1
  };

  await promisePool.execute(
    `INSERT INTO esm_setting (
      userid, include_import_duty, include_delivery_fee, max_option_count
    ) VALUES (?, ?, ?, ?)`,
    [
      userid,
      defaultPolicy.include_import_duty,
      defaultPolicy.include_delivery_fee,
      defaultPolicy.max_option_count
    ]
  );
}

// ESM 정책 생성 또는 업데이트
export async function upsertEsmPolicy(userid, policyData) {
  await promisePool.execute(
    `INSERT INTO esm_setting (
      userid, include_import_duty, include_delivery_fee, max_option_count
    ) VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      include_import_duty = VALUES(include_import_duty),
      include_delivery_fee = VALUES(include_delivery_fee),
      max_option_count = VALUES(max_option_count),
      updated_at = CURRENT_TIMESTAMP`,
    [
      userid,
      policyData.include_import_duty,
      policyData.include_delivery_fee,
      policyData.max_option_count
    ]
  );
}
