// rateLimitCleaner.js
// 공용 레이트리밋 Map 메모리 정리를 위한 유틸리티
// 사용 예시:
//   import { createMaybeCleanup } from './rateLimitCleaner.js';
//   const maybeCleanup = createMaybeCleanup({ map: userLastProcessTime });
//   ... 루프 안에서 maybeCleanup();

/**
 * 오래된 rate-limit 정보를 주기적으로 정리하는 클로저를 반환합니다.
 * @param {Object} params
 * @param {Map<any, number>} params.map - userid → lastProcessTime 형태의 Map
 * @param {number} [params.expireMs=3600000] - 항목 만료 기준(기본 1시간)
 * @param {number} [params.intervalMs=300000] - GC 검사 주기(기본 5분)
 * @returns {() => void} cleanup 함수를 반환
 */
export function createMaybeCleanup({ map, expireMs = 60 * 60 * 1000, intervalMs = 5 * 60 * 1000 }) {
  let lastCleanupTime = Date.now();

  return function maybeCleanup() {
    const now = Date.now();
    if (now - lastCleanupTime < intervalMs) return;

    for (const [key, lastTime] of map) {
      if (now - lastTime > expireMs) {
        map.delete(key);
      }
    }

    lastCleanupTime = now;
  };
} 