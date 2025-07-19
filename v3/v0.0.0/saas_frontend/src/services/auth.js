import httpClient from './httpClient';

// 아이디&비번 로그인
export const login = async (id, password) => {
  try {
    const response = await httpClient.post('/auth/login', {
      id,
      password
    });
    
    if (response.data.success) {
      // 사용자 정보만 저장 (인증 상태 확인용)
      sessionStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: '서버와 통신 중 오류가 발생했습니다.' };
  }
};

// 네이버 로그인 URL 가져오기
export const getNaverLoginUrl = async () => {
  try {
    const response = await httpClient.get('/auth/naver/login');
    
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: '네이버 로그인 URL을 가져올 수 없습니다.' };
  }
};

// 네이버 콜백 처리
export const handleNaverCallback = async (code, state) => {
  try {
    const response = await httpClient.post('/auth/naver/callback', {
      code,
      state
    });
    
    if (response.data.success) {
      // 사용자 정보만 저장 (인증 상태 확인용)
      sessionStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: '네이버 로그인 처리 중 오류가 발생했습니다.' };
  }
};

// 현재 사용자 정보 가져오기 (서버에서)
export const getCurrentUser = async () => {
  try {
    const response = await httpClient.get('/auth/status');
    
    if (response.data.success && response.data.user) {
      // 최신 사용자 정보로 업데이트
      sessionStorage.setItem('user', JSON.stringify(response.data.user));
      return response.data.user;
    }
    
    return null;
  } catch (error) {
    return null;
  }
};

// 아이디&비번 크리덴셜 설정
export const setLocalCredentials = async (id, password) => {
  try {
    const response = await httpClient.post('/auth/local-credentials/set', {
      id,
      password
    });
    
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: '아이디&비번 크리덴셜 설정 중 오류가 발생했습니다.' };
  }
};

// 로그아웃 (세션 정리만)
export const logout = () => {
  // 세션 스토리지 정리
  sessionStorage.removeItem('user');
  
  return { success: true };
};

// sessionStorage에서 사용자 정보 가져오기 (빠른 접근)
export const getUser = () => {
  const user = sessionStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// 인증 여부 확인 (빠른 체크)
export const isAuthenticated = () => {
  return !!getUser();
};

// API 키 생성
export const generateApiKey = async () => {
  try {
    const response = await httpClient.post('/auth/api-key/generate');
    
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'API 키 생성 중 오류가 발생했습니다.' };
  }
};

// API 키 상태 확인
export const getApiKeyStatus = async () => {
  try {
    const response = await httpClient.get('/auth/api-key/status');
    
    return response.data;
  } catch (error) {
    throw error.response?.data || { success: false, message: 'API 키 상태 확인 중 오류가 발생했습니다.' };
  }
}; 