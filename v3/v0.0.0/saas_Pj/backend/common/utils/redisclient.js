import Redis from 'ioredis';
import dotenv from 'dotenv';
import logger from './logger.js';
dotenv.config();

// 일반 명령(RPUSH, LLEN 등)을 위한 Redis 클라이언트
const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || '',
  db: process.env.REDIS_DB || 0,
});

// 블로킹 명령(BLPOP 등) 전용 Redis 클라이언트
const blockingRedisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || '',
  db: process.env.REDIS_DB || 0,
});

// 연결 이벤트
redisClient.on('connect', () => {
  logger.debug('Redis(일반) 서버에 연결되었습니다.');
});

redisClient.on('error', (err) => {
  logger.error(err);
});

blockingRedisClient.on('connect', () => {
  logger.debug('Redis(블로킹) 서버에 연결되었습니다.');
});

blockingRedisClient.on('error', (err) => {
  logger.error(err);
});

// Redis 연결 테스트 함수 (필요시에만 사용)
export const testRedisConnection = async () => {
  try {
    const testKey = 'redis_connection_test';
    const testValue = 'connected_' + Date.now();
    
    // 테스트 키-값 설정 및 확인
    await redisClient.set(testKey, testValue);
    const result = await redisClient.get(testKey);
    
    // 테스트 키 삭제
    await redisClient.del(testKey);
    
    return result === testValue;
  } catch (error) {
    logger.error(error);
    return false;
  }
};

/**
 * Redis 큐에 데이터 추가 (오른쪽 끝에 추가)
 * @param {string} queueName - 큐 이름
 * @param {object} data - 큐에 추가할 작업 데이터
 * @returns {Promise<number>} - 큐의 길이
 */
export const addToQueue = async (queueName, data) => {
  try {
    // 데이터를 JSON 문자열로 변환하여 큐의 오른쪽에 추가
    const queueLength = await redisClient.rpush(queueName, JSON.stringify(data));
    return queueLength;
  } catch (error) {
    logger.error(error);
    throw error;
  }
};

/**
 * Redis 큐에서 데이터 가져오기 (왼쪽 끝에서 추출)
 * @param {string} queueName - 큐 이름
 * @param {number} timeout - 큐가 비어있을 때 대기할 시간(초), 0은 무한 대기
 * @returns {Promise<object|null>} - 큐에서 가져온 데이터 객체 또는 null
 */
export const getFromQueue = async (queueName, timeout = 0) => {
  try {
    // BLPOP: 큐의 왼쪽(가장 오래된 항목)에서 항목을 가져오고 제거
    // timeout: 큐가 비어있을 때 대기할 시간(초), 0은 무한 대기
    const result = await blockingRedisClient.blpop(queueName, timeout);
    
    // 결과가 없으면 null 반환
    if (!result) return null;
    

    const data = JSON.parse(result[1]);
    return data;
  } catch (error) {
    logger.error(error);
    throw error;
  }
};

/**
 * Redis 큐에서 한 번에 여러 데이터 가져오기 (Lua 스크립트 사용)
 * @param {string} queueName - 큐 이름
 * @param {number} count - 가져올 데이터의 최대 개수
 * @returns {Promise<Array<object>>} - 큐에서 가져온 데이터 객체 배열
 */
export const getMultipleFromQueue = async (queueName, count) => {
  try {
    // Lua 스크립트: count 만큼 lpop 실행. 원자성을 보장.
    const script = `
      local items = {}
      for i = 1, ARGV[1] do
        local item = redis.call('LPOP', KEYS[1])
        if not item then
          break
        end
        table.insert(items, item)
      end
      return items
    `;
    // 스크립트가 등록되지 않았으면 등록
    if (!blockingRedisClient.getMultiple) {
      blockingRedisClient.defineCommand('getMultiple', {
        numberOfKeys: 1,
        lua: script,
      });
    }
    const results = await blockingRedisClient.getMultiple(queueName, count);

    if (!results || results.length === 0) {
      return [];
    }
    
    // JSON 파싱
    return results.map(item => JSON.parse(item));
  } catch (error) {
    logger.error(error);
    throw error;
  }
};

/**
 * Redis 큐의 길이 조회
 * @param {string} queueName - 큐 이름
 * @returns {Promise<number>} - 큐의 길이
 */
export const getQueueLength = async (queueName) => {
  try {
    const length = await redisClient.llen(queueName);
    return length;
  } catch (error) {
    logger.error(error);
    throw error;
  }
};

/**
 * 여러 Redis 큐의 길이를 한번에 조회
 * @param {string[]} queueNames - 큐 이름 배열
 * @returns {Promise<Object>} - 큐 이름을 키로 하고 길이를 값으로 하는 객체
 */
export const getMultipleQueueLengths = async (queueNames) => {
  try {
    const pipeline = redisClient.pipeline();
    
    // 모든 큐에 대해 llen 명령을 파이프라인에 추가
    queueNames.forEach(queueName => {
      pipeline.llen(queueName);
    });
    
    // 파이프라인 실행
    const results = await pipeline.exec();
    
    // 결과를 객체 형태로 변환
    const queueLengths = {};
    queueNames.forEach((queueName, index) => {
      queueLengths[queueName] = results[index][1]; // [error, result] 형태이므로 result만 추출
    });
    
    return queueLengths;
  } catch (error) {
    logger.error(error);
    throw error;
  }
};

export default redisClient;
