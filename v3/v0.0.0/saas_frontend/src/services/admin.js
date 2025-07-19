import httpClient from './httpClient';

// 환경 변수에서 API URL 가져오기
const ADMIN_ENDPOINT = `/admin`;
const USER_PAYMENT_ENDPOINT = `/admin/user-payment`;
const CREATE_ACCOUNT_ENDPOINT = `/admin/create-account`;

/**
 * 현재 사용자가 관리자인지 확인합니다
 * @returns {boolean} 관리자 여부
 */
export const isAdmin = () => {
  try {
    const userStr = sessionStorage.getItem('user');
    if (!userStr) return false;
    
    const user = JSON.parse(userStr);
    return user && user.userid === 1;
  } catch (error) {
    console.error('관리자 권한 확인 중 오류:', error);
    return false;
  }
};

/**
 * 시스템 상태를 확인합니다
 * @returns {Promise} API 응답
 */
export const checkSystemHealth = async () => {
  try {
    const response = await httpClient.get(`${ADMIN_ENDPOINT}/infra/health`);
    return response.data;
  } catch (error) {
    console.error('시스템 상태 확인 중 오류 발생:', error);
    throw error;
  }
};

/**
 * 데이터베이스 백업을 실행합니다
 * @returns {Promise} API 응답
 */
export const createDatabaseBackup = async () => {
  try {
    const response = await httpClient.post(`${ADMIN_ENDPOINT}/infra/db-backup`);
    return response.data;
  } catch (error) {
    console.error('데이터베이스 백업 중 오류 발생:', error);
    throw error;
  }
};

/**
 * 데이터베이스 상태를 확인합니다
 * @returns {Promise} API 응답
 */
export const checkDatabaseHealth = async () => {
  try {
    const response = await httpClient.get(`${ADMIN_ENDPOINT}/infra/db-health`);
    return response.data;
  } catch (error) {
    console.error('데이터베이스 상태 확인 중 오류 발생:', error);
    throw error;
  }
};

// ==================== 로그 정보 관리 ====================

/**
 * 폐기 이미지 로그를 조회합니다
 * @param {Object} params - 쿼리 파라미터 {userid, page, limit}
 * @returns {Promise} API 응답
 */
export const getNotUsedImageLogs = async (params = {}) => {
  try {
    const response = await httpClient.get(`${ADMIN_ENDPOINT}/log-info/not-used-image`, { params });
    return response.data;
  } catch (error) {
    console.error('폐기 이미지 로그 조회 중 오류 발생:', error);
    throw error;
  }
};

/**
 * 사용량 로그를 조회합니다
 * @param {Object} params - 쿼리 파라미터 {userid, page, limit}
 * @returns {Promise} API 응답
 */
export const getUsageLogs = async (params = {}) => {
  try {
    const response = await httpClient.get(`${ADMIN_ENDPOINT}/log-info/usage`, { params });
    return response.data;
  } catch (error) {
    console.error('사용량 로그 조회 중 오류 발생:', error);
    throw error;
  }
};

/**
 * 에러 로그를 조회합니다
 * @param {Object} params - 쿼리 파라미터 {userid, page, limit}
 * @returns {Promise} API 응답
 */
export const getErrorLogs = async (params = {}) => {
  try {
    const response = await httpClient.get(`${ADMIN_ENDPOINT}/log-info/error`, { params });
    return response.data;
  } catch (error) {
    console.error('에러 로그 조회 중 오류 발생:', error);
    throw error;
  }
};

/**
 * 폐기 이미지 로그를 삭제합니다
 * @param {number} id - 삭제할 로그 ID
 * @returns {Promise} API 응답
 */
export const deleteNotUsedImageLog = async (id) => {
  try {
    const response = await httpClient.delete(`${ADMIN_ENDPOINT}/log-info/not-used-image/${id}`);
    return response.data;
  } catch (error) {
    console.error('폐기 이미지 로그 삭제 중 오류 발생:', error);
    throw error;
  }
};

/**
 * 사용량 로그를 삭제합니다
 * @param {number} id - 삭제할 로그 ID
 * @returns {Promise} API 응답
 */
export const deleteUsageLog = async (id) => {
  try {
    const response = await httpClient.delete(`${ADMIN_ENDPOINT}/log-info/usage/${id}`);
    return response.data;
  } catch (error) {
    console.error('사용량 로그 삭제 중 오류 발생:', error);
    throw error;
  }
};

/**
 * 에러 로그를 삭제합니다
 * @param {number} logId - 삭제할 에러 로그 ID
 * @returns {Promise} API 응답
 */
export const deleteErrorLog = async (logId) => {
  try {
    const response = await httpClient.delete(`${ADMIN_ENDPOINT}/log-info/error/${logId}`);
    return response.data;
  } catch (error) {
    console.error('에러 로그 삭제 중 오류 발생:', error);
    throw error;
  }
};

/**
 * 정보 로그를 조회합니다
 * @param {Object} params - 쿼리 파라미터 {page, limit} (userid 필터링 없음)
 * @returns {Promise} API 응답
 */
export const getInfoLogs = async (params = {}) => {
  try {
    const response = await httpClient.get(`${ADMIN_ENDPOINT}/log-info/info`, { params });
    return response.data;
  } catch (error) {
    console.error('정보 로그 조회 중 오류 발생:', error);
    throw error;
  }
};

/**
 * 정보 로그를 삭제합니다
 * @param {number} logId - 삭제할 정보 로그 ID
 * @returns {Promise} API 응답
 */
export const deleteInfoLog = async (logId) => {
  try {
    const response = await httpClient.delete(`${ADMIN_ENDPOINT}/log-info/info/${logId}`);
    return response.data;
  } catch (error) {
    console.error('정보 로그 삭제 중 오류 발생:', error);
    throw error;
  }
};

// ==================== 사용자 관리 ====================

/**
 * 사용자 정보 및 통계를 조회합니다
 * @param {Object} params - 쿼리 파라미터 {userid, page, limit}
 * @returns {Promise} API 응답
 */
export const getUsersInfo = async (params = {}) => {
  try {
    const response = await httpClient.get(`${ADMIN_ENDPOINT}/log-info/users`, { params });
    return response.data;
  } catch (error) {
    console.error('사용자 정보 조회 중 오류 발생:', error);
    throw error;
  }
};

/**
 * 특정 사용자 정보를 조회합니다 (이메일 또는 사용자 ID로)
 * @param {string} identifier - 사용자 식별자 (이메일 또는 사용자 ID)
 * @returns {Promise} API 응답
 */
export const getUserByIdentifier = async (identifier) => {
  try {
    const response = await httpClient.get(`${USER_PAYMENT_ENDPOINT}/users/${identifier}`);
    return response.data;
  } catch (error) {
    console.error('사용자 조회 중 오류 발생:', error);
    throw error;
  }
};

/**
 * 사용자 정보를 수정합니다
 * @param {string} identifier - 사용자 식별자 (이메일 또는 사용자 ID)
 * @param {Object} updateData - 수정할 사용자 데이터
 * @returns {Promise} API 응답
 */
export const updateUserInfo = async (identifier, updateData) => {
  try {
    const response = await httpClient.put(`${USER_PAYMENT_ENDPOINT}/users/${identifier}`, updateData);
    return response.data;
  } catch (error) {
    console.error('사용자 정보 수정 중 오류 발생:', error);
    throw error;
  }
};

/**
 * 로컬 계정을 생성합니다
 * @param {Object} accountData - 계정 생성 데이터
 * @returns {Promise} API 응답
 */
export const createLocalAccount = async (accountData) => {
  try {
    const response = await httpClient.post(`${CREATE_ACCOUNT_ENDPOINT}/local`, accountData);
    return response.data;
  } catch (error) {
    console.error('로컬 계정 생성 중 오류 발생:', error);
    throw error;
  }
};

// ==================== 공지사항 관리 ====================

/**
 * 공지사항 목록을 조회합니다
 * @param {Object} params - 쿼리 파라미터 {page, limit, type, tag_type, is_active}
 * @returns {Promise} API 응답
 */
export const getNotices = async (params = {}) => {
  try {
    const response = await httpClient.get(`${ADMIN_ENDPOINT}/update/notices`, { params });
    return response.data;
  } catch (error) {
    console.error('공지사항 목록 조회 중 오류 발생:', error);
    throw error;
  }
};

/**
 * 특정 공지사항을 조회합니다
 * @param {number} id - 공지사항 ID
 * @returns {Promise} API 응답
 */
export const getNotice = async (id) => {
  try {
    const response = await httpClient.get(`${ADMIN_ENDPOINT}/update/notices/${id}`);
    return response.data;
  } catch (error) {
    console.error('공지사항 조회 중 오류 발생:', error);
    throw error;
  }
};

/**
 * 공지사항을 작성합니다
 * @param {Object} noticeData - 공지사항 데이터 {type, tag_type, title, content}
 * @returns {Promise} API 응답
 */
export const createNotice = async (noticeData) => {
  try {
    const response = await httpClient.post(`${ADMIN_ENDPOINT}/update/notices`, noticeData);
    return response.data;
  } catch (error) {
    console.error('공지사항 작성 중 오류 발생:', error);
    throw error;
  }
};

/**
 * 공지사항을 수정합니다
 * @param {number} id - 공지사항 ID
 * @param {Object} noticeData - 수정할 공지사항 데이터 {type, tag_type, title, content, is_active}
 * @returns {Promise} API 응답
 */
export const updateNotice = async (id, noticeData) => {
  try {
    const response = await httpClient.put(`${ADMIN_ENDPOINT}/update/notices/${id}`, noticeData);
    return response.data;
  } catch (error) {
    console.error('공지사항 수정 중 오류 발생:', error);
    throw error;
  }
};

/**
 * 공지사항을 삭제합니다
 * @param {number} id - 삭제할 공지사항 ID
 * @returns {Promise} API 응답
 */
export const deleteNotice = async (id) => {
  try {
    const response = await httpClient.delete(`${ADMIN_ENDPOINT}/update/notices/${id}`);
    return response.data;
  } catch (error) {
    console.error('공지사항 삭제 중 오류 발생:', error);
    throw error;
  }
};
