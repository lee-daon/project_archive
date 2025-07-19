import logger from '../utils/logger.js';
const publicApiRateLimiter = (requestsPerSecond) => {
  const userRequests = new Map();

  // 메모리 누수를 방지하기 위해 주기적으로 오래된 항목 정리
  setInterval(() => {
    const now = Date.now();
    const cleanupThreshold = now - 60000; // 1분 이상 지난 요청들 정리
    
    for (const [userid, timestamps] of userRequests.entries()) {
      // 1분 이상 지난 타임스탬프들 제거
      const recentTimestamps = timestamps.filter(ts => ts > cleanupThreshold);
      
      if (recentTimestamps.length === 0) {
        userRequests.delete(userid);
      } else if (recentTimestamps.length < timestamps.length) {
        userRequests.set(userid, recentTimestamps);
      }
    }
  }, 30000); // 30초마다 실행

  return (req, res, next) => {
    try {
      if (!req.user || !req.user.userid) {
        // apikeyauth 미들웨어가 이전에 사용된 경우 이런 일이 발생해서는 안 됩니다.
        logger.error('publicApiRateLimiter: req.user.userid를 사용할 수 없습니다. apikeyauth 미들웨어가 먼저 실행되는지 확인하세요.');
        return res.status(500).json({
          success: false,
          message: '서버 설정 오류입니다.'
        });
      }

      const { userid } = req.user;
      const now = Date.now();
      const windowStart = now - 1000; // 1초 윈도우

      // 현재 사용자의 타임스탬프 배열 가져오기
      let timestamps = userRequests.get(userid) || [];
      
      // 1초 윈도우 내의 요청만 필터링하여 배열 업데이트
      timestamps = timestamps.filter(ts => ts > windowStart);

      // rate limit 체크
      if (timestamps.length >= requestsPerSecond) {
        return res.status(429).json({
          success: false,
          message: `요청이 너무 많습니다. 초당 최대 ${requestsPerSecond}개의 요청만 허용됩니다.`,
          retryAfter: 1
        });
      }

      // 현재 요청 시간 추가하고 업데이트된 배열 저장
      timestamps.push(now);
      userRequests.set(userid, timestamps);
      
      return next();

    } catch (error) {
      logger.error(error, { userid: req.user.userid });
      return res.status(500).json({
        success: false,
        message: '내부 서버 오류가 발생했습니다.'
      });
    }
  };
};

export default publicApiRateLimiter;
