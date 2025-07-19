import { addToQueue } from '../../../common/utils/redisClient.js';
import { QUEUE_NAMES } from '../../../common/config/settings.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * 네이버 등록 작업을 큐에 추가
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 */
export const addNaverRegisterJob = async (userid, productid) => {
  try {
    const taskData = {
      userid,
      productid
    };

    await addToQueue(QUEUE_NAMES.NAVER_REGISTER, taskData);
    
    return taskData;
  } catch (error) {
    throw error;
  }
};

/**
 * 쿠팡 등록 작업을 큐에 추가
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 */
export const addCoopangRegisterJob = async (userid, productid) => {
  try {
    const taskData = {
      userid,
      productid
    };

    await addToQueue(QUEUE_NAMES.COOPANG_REGISTER, taskData);
    
    return taskData;
  } catch (error) {
    throw error;
  }
};

/**
 * 11번가 등록 작업을 큐에 추가
 * @param {number} userid - 사용자 ID
 * @param {number} productid - 상품 ID
 */
export const addElevenstoreRegisterJob = async (userid, productid) => {
  try {
    const taskData = {
      userid,
      productid
    };

    await addToQueue(QUEUE_NAMES.ELEVENSTORE_REGISTER, taskData);
    
    return taskData;
  } catch (error) {
    throw error;
  }
};