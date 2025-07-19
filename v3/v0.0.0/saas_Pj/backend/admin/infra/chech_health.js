import express from 'express';
import os from 'os';
import logger from '../../common/utils/logger.js';

const router = express.Router();

/**
 * 바이트를 읽기 쉬운 형태로 변환
 * @param {number} bytes - 바이트 수
 * @returns {string} - 변환된 문자열 (예: "1.5 GB")
 */
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 퍼센트 형태로 변환
 * @param {number} value - 0~1 사이의 값
 * @returns {string} - 퍼센트 문자열 (예: "75.2%")
 */
const formatPercent = (value) => {
  return (value * 100).toFixed(1) + '%';
};

/**
 * 업타임을 읽기 쉬운 형태로 변환
 * @param {number} seconds - 초 단위 업타임
 * @returns {string} - 변환된 문자열 (예: "2일 5시간 30분")
 */
const formatUptime = (seconds) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}일`);
  if (hours > 0) parts.push(`${hours}시간`);
  if (minutes > 0) parts.push(`${minutes}분`);
  
  return parts.length > 0 ? parts.join(' ') : '1분 미만';
};



/**
 * 서버 헬스 체크 라우터
 * GET /admin/infra/health
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

    // 시스템 정보 수집
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsage = process.memoryUsage();
    
    // CPU 정보
    const cpus = os.cpus();
    const loadAvg = os.loadavg();
    
    // 프로세스 업타임
    const processUptime = process.uptime();
    const systemUptime = os.uptime();
    
    const healthData = {
      timestamp: new Date().toISOString(),
      server: {
        status: 'running',
        nodeVersion: process.version,
        platform: os.platform(),
        architecture: os.arch(),
        hostname: os.hostname(),
        uptime: {
          process: formatUptime(processUptime),
          system: formatUptime(systemUptime),
          processSeconds: Math.floor(processUptime),
          systemSeconds: Math.floor(systemUptime)
        }
      },
      memory: {
        system: {
          total: formatBytes(totalMemory),
          used: formatBytes(usedMemory),
          free: formatBytes(freeMemory),
          usagePercent: formatPercent(usedMemory / totalMemory)
        },
        process: {
          rss: formatBytes(memoryUsage.rss),
          heapTotal: formatBytes(memoryUsage.heapTotal),
          heapUsed: formatBytes(memoryUsage.heapUsed),
          external: formatBytes(memoryUsage.external),
          heapUsagePercent: formatPercent(memoryUsage.heapUsed / memoryUsage.heapTotal)
        }
      },
      cpu: {
        cores: cpus.length,
        model: cpus[0].model,
        loadAverage: {
          '1min': loadAvg[0].toFixed(2),
          '5min': loadAvg[1].toFixed(2),
          '15min': loadAvg[2].toFixed(2)
        }
      }
    };

    return res.status(200).json({
      success: true,
      message: '서버 상태가 정상입니다.',
      data: healthData
    });

  } catch (error) {
    logger.error(error);
    
    return res.status(500).json({
      success: false,
      error: error.message || '서버 상태 확인 중 오류가 발생했습니다.',
      code: 'HEALTH_CHECK_ERROR'
    });
  }
});

export default router;
