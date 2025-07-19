import axios from 'axios';

// API 기본 URL
const API_URL = process.env.VUE_APP_API_URL;

// axios 인스턴스 생성
const httpClient = axios.create({
  baseURL: API_URL,
  withCredentials: true, // 쿠키 자동 전송
  headers: {
    'Content-Type': 'application/json'
  }
});

// 요청 인터셉터 - JWT 토큰을 헤더에 추가
httpClient.interceptors.request.use(
  config => {
    // 쿠키가 withCredentials로 자동 전송되므로 추가 설정 불필요
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 401 오류 처리
httpClient.interceptors.response.use(
  response => response,
  error => {
    // 인증 오류 (401)
    if (error.response && error.response.status === 401) {
      // 세션 정보 정리 (쿠키는 서버에서 관리)
      sessionStorage.removeItem('user');
      console.log('인증 세션이 만료되었습니다.');
      
      // 로그인 페이지로 리다이렉트 (현재 페이지가 로그인 페이지가 아닌 경우)
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default httpClient; 