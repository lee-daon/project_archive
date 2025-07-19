/**
 * 관리자 권한을 확인하는 미들웨어
 * req.user.userid가 1인 경우 관리자로 간주합니다.
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 * @param {Function} next - 다음 미들웨어 함수
 */
const adminChecker = (req, res, next) => {
  // jwtParser 미들웨어가 먼저 실행되어 req.user를 설정해야 합니다.
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: '인증 정보가 없습니다. 먼저 로그인해 주세요.'
    });
  }

  // TODO: 현재는 userid가 1인 사용자만 관리자로 간주합니다.
  // 추후 user_info 테이블에 role 컬럼을 추가하여 역할을 관리하는 것이 좋습니다.
  const isAdmin = req.user.userid === 1;

  if (isAdmin) {
    next(); // 관리자면 다음 미들웨어로 진행
  } else {
    res.status(403).json({
      success: false,
      message: '접근 권한이 없습니다. 관리자만 접근 가능합니다.'
    });
  }
};

export default adminChecker;
