import axios from 'axios';

/**
 * 네이버 로그인 URL 생성
 * @param {string} state - CSRF 방지를 위한 상태값
 * @returns {string} 네이버 로그인 URL
 */
const getNaverLoginUrl = (state) => {
  const clientId = process.env.NAVER_LOGIN_CLIENT_ID;
  const redirectUri = process.env.NAVER_LOGIN_REDIRECT_URI;
  
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    state: state
  });
  
  return `https://nid.naver.com/oauth2.0/authorize?${params.toString()}`;
};

/**
 * 네이버 액세스 토큰 발급
 * @param {string} code - 인증 코드
 * @param {string} state - 상태값
 * @returns {Promise<object>} 토큰 정보
 */
const getNaverAccessToken = async (code, state) => {
  try {
    // 네이버 공식 문서에 따라 GET 방식으로 URL 파라미터 전송
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.NAVER_LOGIN_CLIENT_ID,
      client_secret: process.env.NAVER_LOGIN_CLIENT_SECRET,
      redirect_uri: process.env.NAVER_LOGIN_REDIRECT_URI, // 네이버 문서에서 필수로 요구
      code: code,
      state: state
    });

    const apiURL = `https://nid.naver.com/oauth2.0/token?${params.toString()}`;

    const response = await axios.get(apiURL);

    return response.data;
  } catch (error) {
    console.error('네이버 토큰 발급 오류:', error.response?.data || error.message);
    
    // 네이버 API 에러 코드에 따른 상세 처리
    if (error.response?.data?.error) {
      const errorCode = error.response.data.error;
      switch (errorCode) {
        case 'invalid_request':
          throw new Error('잘못된 요청입니다. 파라미터를 확인해주세요.');
        case 'unauthorized_client':
          throw new Error('인증받지 않은 클라이언트입니다.');
        case 'invalid_grant':
          throw new Error('인증 코드가 만료되었거나 잘못되었습니다.');
        default:
          throw new Error(`네이버 로그인 오류: ${error.response.data.error_description || errorCode}`);
      }
    }
    
    throw new Error('네이버 토큰 발급에 실패했습니다.');
  }
};

/**
 * 네이버 사용자 정보 조회
 * @param {string} accessToken - 네이버 액세스 토큰
 * @returns {Promise<object>} 사용자 정보
 */
const getNaverUserInfo = async (accessToken) => {
  try {
    const response = await axios.get('https://openapi.naver.com/v1/nid/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    return response.data.response;
  } catch (error) {
    console.error('네이버 사용자 정보 조회 오류:', error.response?.data || error.message);
    
    // 네이버 API 에러 코드에 따른 상세 처리
    if (error.response?.status === 401) {
      throw new Error('액세스 토큰이 유효하지 않습니다.');
    } else if (error.response?.status === 403) {
      throw new Error('API 호출 권한이 없습니다.');
    }
    
    throw new Error('네이버 사용자 정보 조회에 실패했습니다.');
  }
};

/**
 * 랜덤 상태값 생성
 * @returns {string} 상태값
 */
const generateState = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export { getNaverLoginUrl, getNaverAccessToken, getNaverUserInfo, generateState }; 