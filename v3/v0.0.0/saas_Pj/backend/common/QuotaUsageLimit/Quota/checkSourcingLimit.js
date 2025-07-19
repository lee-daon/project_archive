import { promisePool } from '../../utils/connectDB.js';
import logger from '../../utils/logger.js';
/**
 * 사용 로그 기록 함수
 * @param {number} userId - 사용자 ID
 * @param {string} usageType - 사용 유형
 * @param {number} usageAmount - 사용 수량
 * @param {string} comment - 사용 내용 설명
 */
async function logUsage(userId, usageType, usageAmount, comment = null) {
  try {
    await promisePool.execute(
      `INSERT INTO usage_log (userid, usage_type, usage_amount, usage_time, comment) VALUES (?, ?, ?, NOW(), ?)`,
      [userId, usageType, usageAmount, comment]
    );
  } catch (error) {
    logger.error(error, { userId });
  }
}

/**
 * 소싱 할당량 확인 및 차감
 * @param {number} userid - 사용자 ID
 * @param {number} workCount - 작업 개수
 * @returns {Promise<{success: boolean, message?: string, statusCode?: number}>}
 */
export async function checkSourcingLimit(userid, workCount) {
  try {
    // 사용자 정보와 통계 조회
    const [userResults] = await promisePool.execute(`
      SELECT 
        ui.plan,
        us.daily_sourcing_remaining,
        us.daily_sourcing_upgrade_time
      FROM user_info ui
      JOIN user_statistics us ON ui.userid = us.userid
      WHERE ui.userid = ? AND ui.is_active = TRUE
    `, [userid]);

    if (userResults.length === 0) {
      return {
        success: false,
        message: '사용자 정보를 찾을 수 없습니다.',
        statusCode: 404
      };
    }

    const { plan, daily_sourcing_remaining, daily_sourcing_upgrade_time } = userResults[0];

    // 현재 시간과 업그레이드 시간 파싱
    const currentTime = new Date();
    const upgradeTime = daily_sourcing_upgrade_time ? new Date(daily_sourcing_upgrade_time) : null;

    const hasEnoughQuota = workCount <= daily_sourcing_remaining;

    // 1) 할당량이 충분한 경우
    if (hasEnoughQuota) {
      // 엔터프라이즈는 업그레이드 시간이 없거나 이미 지난 경우에만 통과
      if (plan === 'enterprise' && upgradeTime && upgradeTime > currentTime) {
        return {
          success: false,
          message: '서버의 타오바오 api 할당량을 일시적으로 초과했습니다. 최대 30분 이내 복구 진행중...',
          statusCode: 429
        };
      }

      // 할당량 차감
      await promisePool.execute(
        `
        UPDATE user_statistics 
        SET daily_sourcing_remaining = daily_sourcing_remaining - ?
        WHERE userid = ?
      `,
        [workCount, userid]
      );

      // 소싱 사용 로그 기록
      await logUsage(userid, 'sourcing', workCount, `상품 소싱 - ${workCount}개 상품 처리`);

      return {
        success: true,
        message: '할당량 확인 및 차감 완료'
      };
    }

    // 2) 할당량 부족 (free/basic)
    if (plan === 'free' || plan === 'basic') {
      return {
        success: false,
        message: '일일 사용량을 초과하였습니다',
        statusCode: 429
      };
    }

    // 3) 할당량 부족 (enterprise)
    if (plan === 'enterprise') {
      // 업그레이드 시간이 지났거나 설정되어 있지 않다면 새로 설정
      if (!upgradeTime || upgradeTime <= currentTime) {
        const randomMinutes = Math.floor(Math.random() * 21) + 10; // 10~30분
        const nextUpgradeTime = new Date(currentTime.getTime() + randomMinutes * 60 * 1000);

        await promisePool.execute(
          `
          UPDATE user_statistics 
          SET daily_sourcing_remaining = 1500,
              daily_sourcing_upgrade_time = ?
          WHERE userid = ?
        `,
          [nextUpgradeTime, userid]
        );

        // 엔터프라이즈 할당량 업그레이드 로그 기록
        await logUsage(userid, 'sourcing', 1500, `엔터프라이즈 할당량 자동 업그레이드 - 1500개 추가`);
      }

      // 업그레이드 대기 중 블로킹
      return {
        success: false,
        message: '서버의 타오바오 api 할당량을 일시적으로 초과했습니다. 최대 30분 이내 복구 진행중...',
        statusCode: 429
      };
    }

    // 예상치 못한 경우
    return {
      success: false,
      message: '알 수 없는 오류가 발생했습니다.',
      statusCode: 500
    };

  } catch (error) {
    logger.error(error, { userid });
    return {
      success: false,
      message: '서버 오류가 발생했습니다.',
      statusCode: 500
    };
  }
}
