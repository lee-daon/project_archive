import httpClient from './httpClient';

// 환경 변수에서 API URL 가져오기
const QUOTA_ENDPOINT = `/qtuslm`;

/**
 * 사용자 통계 및 정보를 조회합니다
 * @returns {Promise} API 응답 - 사용자 정보, 할당량, 통계 포함
 */
export const getUserInfo = async () => {
  try {
    const response = await httpClient.get(`${QUOTA_ENDPOINT}/getinfo`);
    return response.data;
  } catch (error) {
    console.error('사용자 정보 조회 중 오류 발생:', error);
    throw error;
  }
};

const HOME_ENDPOINT = '/home';

// 공지사항 조회
export const getNotices = async () => {
  return httpClient.get(`${HOME_ENDPOINT}/notices`);
};

// 공지사항 상세 조회
export const getNoticeDetail = async (id) => {
  return httpClient.get(`${HOME_ENDPOINT}/notices/${id}`);
};

// 메모 목록 조회
export const getMemos = async () => {
  return httpClient.get(`${HOME_ENDPOINT}/memos`);
};

// 메모 생성
export const createMemo = async (memoData) => {
  return httpClient.post(`${HOME_ENDPOINT}/memos`, memoData);
};

// 메모 수정
export const updateMemo = async (id, memoData) => {
  return httpClient.put(`${HOME_ENDPOINT}/memos/${id}`, memoData);
};

// 메모 삭제
export const deleteMemo = async (id) => {
  return httpClient.delete(`${HOME_ENDPOINT}/memos/${id}`);
};
