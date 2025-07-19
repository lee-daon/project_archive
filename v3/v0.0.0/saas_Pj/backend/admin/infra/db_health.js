import express from 'express';
import { promisePool } from '../../common/utils/connectDB.js';
import logger from '../../common/utils/logger.js';

const router = express.Router();

/**
 * 데이터베이스 연결 상태 확인
 * @returns {Promise<Object>} - DB 상태 정보
 */
const checkDatabaseHealth = async () => {
  try {
    const startTime = Date.now();
    const [rows] = await promisePool.execute('SELECT 1 as status');
    const responseTime = Date.now() - startTime;
    
    // 간단한 DB 통계 정보 추가
    const [connectionStats] = await promisePool.execute('SHOW STATUS LIKE "Threads_connected"');
    const [uptimeStats] = await promisePool.execute('SHOW STATUS LIKE "Uptime"');
    
    return {
      status: 'connected',
      responseTime: `${responseTime}ms`,
      connected: true,
      threadsConnected: connectionStats[0]?.Value || 'N/A',
      uptime: uptimeStats[0]?.Value ? `${Math.floor(uptimeStats[0].Value / 3600)}시간` : 'N/A'
    };
  } catch (error) {
    return {
      status: 'disconnected',
      error: error.message,
      connected: false,
      responseTime: null,
      threadsConnected: null,
      uptime: null
    };
  }
};

/**
 * 데이터베이스 헬스 체크 라우터
 * GET /admin/infra/db-health
 * 
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 * @returns {Promise<void>}
 */
router.get('/', async (req, res) => {
  try {
    const userid = req.user.userid;
    
    if (!userid) {
      return res.status(401).json({
        success: false,
        error: '인증이 필요합니다.',
        code: 'UNAUTHORIZED'
      });
    }

    // 데이터베이스 상태 확인
    const dbHealth = await checkDatabaseHealth();
    
    const healthData = {
      timestamp: new Date().toISOString(),
      database: dbHealth
    };

    // DB 연결 상태에 따라 HTTP 상태 코드 결정
    const statusCode = dbHealth.connected ? 200 : 503;
    const message = dbHealth.connected ? 
      '데이터베이스 상태가 정상입니다.' : 
      '데이터베이스 연결에 문제가 있습니다.';

    return res.status(statusCode).json({
      success: dbHealth.connected,
      message: message,
      data: healthData
    });

  } catch (error) {
    logger.error(error);
    
    return res.status(500).json({
      success: false,
      error: error.message || 'DB 상태 확인 중 오류가 발생했습니다.',
      code: 'DB_HEALTH_CHECK_ERROR'
    });
  }
});

export default router; 