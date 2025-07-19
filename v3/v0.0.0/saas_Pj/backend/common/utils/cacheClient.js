import Redis from 'ioredis';
import dotenv from 'dotenv';
import logger from './logger.js';

dotenv.config();

// 캐시 전용 Redis 연결 설정
const cacheRedisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || '',
  db: process.env.REDIS_DB || 0
});

// 연결 이벤트
cacheRedisClient.on('connect', () => {
  logger.debug('Redis 서버에 연결되었습니다. (캐시 전용)');
});

cacheRedisClient.on('error', (err) => {
  logger.error(err);
});

/**
 * 캐시에 데이터 저장 (TTL 설정 가능)
 * @param {string} key - 캐시 키
 * @param {any} value - 저장할 값
 * @param {number} ttl - 만료 시간(초), 기본값: 3600초(1시간)
 * @returns {Promise<string>} - Redis SET 결과
 */
export const setCache = async (key, value, ttl = 3600) => {
  try {
    const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
    await cacheRedisClient.setex(key, ttl, serializedValue);
    logger.debug(`캐시 저장 완료: ${key}`);
    return 'OK';
  } catch (error) {
    logger.error(error);
    throw error;
  }
};

/**
 * 캐시에서 데이터 조회
 * @param {string} key - 캐시 키
 * @param {boolean} parseJson - JSON 파싱 여부, 기본값: true
 * @returns {Promise<any|null>} - 캐시된 데이터 또는 null
 */
export const getCache = async (key, parseJson = true) => {
  try {
    const value = await cacheRedisClient.get(key);
    
    if (value === null) {
      logger.debug(`캐시 없음: ${key}`);
      return null;
    }
    
    logger.debug(`캐시 조회 완료: ${key}`);
    
    if (!parseJson) {
      return value;
    }
    
    try {
      return JSON.parse(value);
    } catch (parseError) {
      // JSON 파싱 실패 시 원본 문자열 반환
      return value;
    }
  } catch (error) {
    logger.error(error);
    throw error;
  }
};

/**
 * 캐시 삭제
 * @param {string} key - 삭제할 캐시 키
 * @returns {Promise<number>} - 삭제된 키의 개수
 */
export const deleteCache = async (key) => {
  try {
    const deletedCount = await cacheRedisClient.del(key);
    logger.debug(`캐시 삭제 완료: ${key} (삭제된 키: ${deletedCount}개)`);
    return deletedCount;
  } catch (error) {
    logger.error(error);
    throw error;
  }
};

/**
 * 패턴으로 캐시 키들 삭제
 * @param {string} pattern - 삭제할 키 패턴 (예: "user:*", "settings:*")
 * @returns {Promise<number>} - 삭제된 키의 개수
 */
export const deleteCacheByPattern = async (pattern) => {
  try {
    const keys = await cacheRedisClient.keys(pattern);
    if (keys.length === 0) {
      logger.debug(`패턴 ${pattern}에 해당하는 캐시 없음`);
      return 0;
    }
    
    const deletedCount = await cacheRedisClient.del(...keys);
    logger.debug(`패턴 캐시 삭제 완료: ${pattern} (삭제된 키: ${deletedCount}개)`);
    return deletedCount;
  } catch (error) {
    logger.error(error);
    throw error;
  }
};

/**
 * 캐시 존재 여부 확인
 * @param {string} key - 확인할 캐시 키
 * @returns {Promise<boolean>} - 존재 여부
 */
export const hasCache = async (key) => {
  try {
    const exists = await cacheRedisClient.exists(key);
    return exists === 1;
  } catch (error) {
    logger.error(error);
    throw error;
  }
};

export default cacheRedisClient; 