import pLimit from 'p-limit';
import { API_SETTINGS } from '../config/settings.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 지정된 지연 시간(delay)을 준수하는 Rate Limiter 인스턴스를 생성합니다.
 * @param {number} delay - 각 호출 사이의 최소 지연 시간 (밀리초)
 * @returns {{acquire: function(): Promise<void>}} Rate Limiter 객체
 */
function createRateLimiter(delay) {
  const limit = pLimit(1);
  let lastApiCallTime = 0;

  const acquireLockAndDelay = async () => {
    const now = Date.now();
    const timeSinceLastCall = now - lastApiCallTime;

    if (timeSinceLastCall < delay) {
      const waitTime = delay - timeSinceLastCall;
      await sleep(waitTime);
    }

    lastApiCallTime = Date.now();
  };

  return {
    acquire: () => limit(acquireLockAndDelay),
  };
}

export const geminiLimiter = createRateLimiter(API_SETTINGS.GEMINI_API_DELAY_MS);
export const taobaoApiLimiter = createRateLimiter(API_SETTINGS.TAOBAO_API_DELAY_MS);
