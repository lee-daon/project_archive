import axios from 'axios';
import logger from './logger.js';
// 더 이상 프록시가 아니므로 관련 상수는 사용하지 않습니다.

/**
 * 직접 GET 요청을 보내는 함수 (기존 proxyGet과 호환)
 * @param {string} url - 대상 URL (예: api-gateway.coupang.com/...)
 * @param {object} params - 쿼리 파라미터
 * @param {object} headers - 추가 헤더
 * @returns {Promise} axios 응답 객체
 */
export const proxyGet = async (url, params = {}, headers = {}) => {
  try {
    const directUrl = url.startsWith('http') ? url : `https://${url}`;
    
    const config = {
      method: 'GET',
      url: directUrl,
      params,
      headers
    };

    const response = await axios(config);
    return response;
  } catch (error) {
    logger.error(error);
    throw error;
  }
};

/**
 * 직접 POST 요청을 보내는 함수 (기존 proxyPost와 호환)
 * @param {string} url - 대상 URL (예: api-gateway.coupang.com/...)
 * @param {object} data - 요청 바디 데이터
 * @param {object} headers - 추가 헤더
 * @returns {Promise} axios 응답 객체
 */
export const proxyPost = async (url, data = {}, headers = {}) => {
  try {
    const directUrl = url.startsWith('http') ? url : `https://${url}`;
    
    const config = {
      method: 'POST',
      url: directUrl,
      data,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const response = await axios(config);
    return response;
  } catch (error) {
    logger.error(error);
    throw error;
  }
};

/**
 * 직접 PUT 요청을 보내는 함수 (기존 proxyPut과 호환)
 * @param {string} url - 대상 URL
 * @param {object} data - 요청 바디 데이터
 * @param {object} headers - 추가 헤더
 * @returns {Promise} axios 응답 객체
 */
export const proxyPut = async (url, data = {}, headers = {}) => {
  try {
    const directUrl = url.startsWith('http') ? url : `https://${url}`;
    
    const config = {
      method: 'PUT',
      url: directUrl,
      data,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const response = await axios(config);
    return response;
  } catch (error) {
    logger.error(error);
    throw error;
  }
};

/**
 * 직접 DELETE 요청을 보내는 함수 (기존 proxyDelete와 호환)
 * @param {string} url - 대상 URL
 * @param {object} headers - 추가 헤더
 * @returns {Promise} axios 응답 객체
 */
export const proxyDelete = async (url, headers = {}) => {
  try {
    const directUrl = url.startsWith('http') ? url : `https://${url}`;
    
    const config = {
      method: 'DELETE',
      url: directUrl,
      headers
    };

    const response = await axios(config);
    return response;
  } catch (error) {
    logger.error(error);
    throw error;
  }
};

/**
 * 직접 HTTP 요청을 보내는 범용 함수 (기존 proxyRequest와 호환)
 * @param {string} method - HTTP 메서드
 * @param {string} url - 대상 URL
 * @param {object} options - 요청 옵션 (data, params, headers)
 * @returns {Promise} axios 응답 객체
 */
export const proxyRequest = async (method, url, options = {}) => {
  const { data, params, headers = {} } = options;
  
  try {
    const directUrl = url.startsWith('http') ? url : `https://${url}`;
    
    const config = {
      method: method.toUpperCase(),
      url: directUrl,
      headers
    };

    if (data) {
      config.data = data;
      config.headers['Content-Type'] = 'application/json';
    }

    if (params) {
      config.params = params;
    }

    const response = await axios(config);
    return response;
  } catch (error) {
    logger.error(error);
    throw error;
  }
};

// 기존 호환성을 위해 export는 유지
export const INTERNAL_KEY = '';
export const PROXY_BASE_URL = '';
