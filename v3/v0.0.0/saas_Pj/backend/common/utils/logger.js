import winston from 'winston';
import Transport from 'winston-transport';
import dotenv from 'dotenv';
import { saveErrorLog } from './assistDb/error_log.js';
import { saveInfoLog } from './assistDb/info_log.js';

// .env 파일에서 환경 변수 로드
dotenv.config();

// 커스텀 DB Transport 클래스 정의
class DbTransport extends Transport {
  constructor(opts) {
    super(opts);
  }

  log(info, callback) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    const { level, message, userid, userId, productid, stack } = info;
    
    // Error 객체가 전달된 경우 stack을 사용하고, 그렇지 않으면 message를 사용
    const content = stack || message;
    const logMessage = `[${new Date().toISOString()}] [${level.toUpperCase()}]: ${content}`;

    if (level === 'error') {
      // userid와 userId 둘 다 지원 (userid 우선, 없으면 userId, 둘 다 없으면 기본값 0)
      const finalUserid = userid !== undefined ? userid : (userId !== undefined ? userId : 0);
      const finalProductid = productid !== undefined ? productid : 1;
      saveErrorLog(finalUserid, finalProductid, logMessage);
    } else if (level === 'info') {
      saveInfoLog(logMessage);
    }

    callback();
  }
}

// 로그 레벨 정의
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// 로그 레벨별 색상 (콘솔 출력용)
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};
winston.addColors(colors);

// 콘솔 로그 포맷 정의
const consoleFormat = winston.format.combine(
  winston.format.splat(), // %s, %d 같은 포맷팅을 위해 추가
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `[${info.timestamp}] [${info.level}]: ${info.stack || info.message}`
  )
);

// DB 저장을 위한 포맷
const dbFormat = winston.format.combine(
    winston.format.splat(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' })
);

// 전송(Transport) 설정
const transports = [
  // 콘솔 로그 출력
  new winston.transports.Console({
      format: consoleFormat,
  }),
  // DB에 로그 저장
  new DbTransport({
    level: 'info', // info 레벨 이상의 로그만 DB에 저장 (info, warn, error)
    format: dbFormat,
  }),
];

/**
 * 로거 생성
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'debug', // .env에서 로그 레벨을 가져오고, 없으면 'debug'
  levels,
  transports,
});

export default logger;

/**
 * 사용법:
 *
 * 1. 로거 가져오기:
 * import logger from './path/to/logger.js';
 *
 * 2. 다양한 레벨로 로그 기록:
 * logger.debug('디버그 메시지입니다.'); // 콘솔에만 출력
 * logger.info('사용자가 로그인했습니다.'); // 콘솔 및 info_log 테이블에 저장
 * logger.warn('사용되지 않는 API 경고입니다.'); // 콘솔에만 출력
 * logger.error(new Error('결제 처리에 실패했습니다.'), { userid: 123, productid: 456 }); // Error 객체를 직접 전달
 *
 * 3. 컨텍스트와 함께 오류 기록:
 * // logger.error에 Error 객체를 직접 전달하면 스택 트레이스가 자동으로 기록됩니다.
 * // userid, productid와 같은 추가 정보는 meta 객체로 전달할 수 있습니다.
 * try {
 *   throw new Error('문제가 발생했습니다!');
 * } catch (error) {
 *   logger.error(error, {
 *     userid: 1,
 *     productid: 101,
 *   });
 * }
 *
 *
 * 출력 형식:
 *
 * 1. 콘솔 출력:
 * - 가독성을 위해 색상으로 구분됩니다.
 * - 형식: [YYYY-MM-DD HH:mm:ss:ms] [레벨]: [스택 트레이스 또는 메시지]
 * - 예시: [2024-07-26 10:30:15:500] [ERROR]: Error: 문제가 발생했습니다! at /app/src/index.js:10:11
 *
 * 2. `error_log` 테이블 기록:
 * - userid: 1 (예시)
 * - productid: 101 (예시)
 * - error_message: [YYYY-MM-DDTHH:mm:ss.sssZ] [ERROR]: Error: 문제가 발생했습니다! at /app/src/index.js:10:11...
 *
 * 3. `info_log` 테이블 기록:
 * - info_message: [YYYY-MM-DDTHH:mm:ss.sssZ] [INFO]: 사용자가 로그인했습니다.
 *
 *
 * 마이그레이션 예시 (기존 console.log/error 전환):
 *
 * // 기존 코드 (Before)
 * router.get('/search', async (req, res) => {
 *   try {
 *     const { userid, searchValue } = req.query;
 *     console.log(`상품 검색 요청 - userid: ${userid}, searchTerm: ${searchValue}`);
 *     // ... (로직 생략)
 *     res.status(200).json(result);
 *   } catch (error) {
 *     console.error('상품 검색 중 오류:', error);
 *     return res.status(500).json({
 *       success: false,
 *       message: '서버 오류가 발생했습니다.',
 *       error: error.message
 *     });
 *   }
 * });
 *
 * // 새로운 로거 사용 (After)
 * import logger from '../../../common/utils/logger.js'; // 경로에 주의
 *
 * router.get('/search', async (req, res) => {
 *   const { userid, searchValue } = req.query; // try 밖으로 빼서 error 핸들러에서도 사용
 *   try {
 *     logger.debug(`상품 검색 요청 - userid: ${userid}, searchTerm: ${searchValue}`);
 *     // ... (로직 생략)
 *     res.status(200).json(result);
 *   } catch (error) {
 *     logger.error(error, { userid }); // 에러 객체와 함께 userid 전달
 *     return res.status(500).json({
 *       success: false,
 *       message: '서버 오류가 발생했습니다.' // 사용자에게는 간단한 메시지만 전달
 *     });
 *   }
 * });
 */
