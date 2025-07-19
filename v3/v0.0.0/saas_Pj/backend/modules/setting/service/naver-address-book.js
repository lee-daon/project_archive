import axios from 'axios';
import bcrypt from 'bcrypt';

/**
 * 전자서명 생성 함수
 * @param {string} clientId - 애플리케이션 ID
 * @param {string} clientSecret - 애플리케이션 시크릿
 * @param {number} timestamp - 밀리초 단위의 타임스탬프
 * @returns {string} 생성된 전자서명
 */
const generateSignature = (clientId, clientSecret, timestamp) => {
  // 밑줄로 연결하여 password 생성
  const password = `${clientId}_${timestamp}`;
  // bcrypt 해싱
  const hashed = bcrypt.hashSync(password, clientSecret);
  // base64 인코딩
  return Buffer.from(hashed, "utf-8").toString("base64");
};

/**
 * API 인증 토큰 발급/갱신 요청 함수
 * @param {string} client_id - 제공된 애플리케이션 ID
 * @param {string} client_secret_sign - 전자서명
 * @param {string} type - 인증 토큰 발급 타입 (SELLER 또는 SELF)
 * @param {string} account_id - type이 SELLER인 경우 입력하는 판매자 ID
 * @param {number} timestamp - 밀리초 단위의 타임스탬프
 * @returns {Promise<object>} 인증 토큰 정보
 */
const getAuthToken = async (client_id, client_secret_sign, type, account_id = '', timestamp) => {
  try {
    // 요청 본문 파라미터 설정
    const params = new URLSearchParams();
    params.append('client_id', client_id);
    params.append('timestamp', timestamp);
    params.append('grant_type', 'client_credentials');
    params.append('client_secret_sign', client_secret_sign);
    params.append('type', type);
    
    // type이 SELLER인 경우에만 account_id 추가
    if (type === 'SELLER' && account_id) {
      params.append('account_id', account_id);
    }
    
    // API 요청 설정
    const axiosConfig = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://api.commerce.naver.com/external/v1/oauth2/token',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded', 
        'Accept': 'application/json'
      },
      data: params
    };
    
    // axios로 API 요청 보내기
    const response = await axios.request(axiosConfig);
    
    // 응답 데이터
    const data = response.data;
    console.log('인증 토큰:', data.access_token);
    
    return data;
  } catch (error) {
    console.error('인증 토큰 발급 오류:', error.response ? error.response.data : error.message);
    throw error;
  }
};

/**
 * 네이버 커머스 API에서 주소록 목록 조회
 * @param {string} clientId - 네이버 클라이언트 ID
 * @param {string} clientSecret - 네이버 클라이언트 시크릿
 * @param {object} options - 조회 옵션
 * @param {number} [options.page=1] - 페이지 번호 (기본값: 1)
 * @param {number} [options.size=100] - 페이지당 항목 수 (기본값: 100, 최대: 100)
 * @returns {Promise<object>} 주소록 목록 정보
 * @throws {Error} API 호출 중 오류 발생 시
 */
export const getNaverAddressBooks = async (clientId, clientSecret, options = {}) => {
  try {
    // 입력값 검증
    if (!clientId || typeof clientId !== 'string') {
      throw new Error('유효한 클라이언트 ID가 필요합니다.');
    }

    if (!clientSecret || typeof clientSecret !== 'string') {
      throw new Error('유효한 클라이언트 시크릿이 필요합니다.');
    }

    const TYPE = 'SELF';
    const timestamp = Date.now();
    
    // 전자서명 생성
    const signature = generateSignature(clientId, clientSecret, timestamp);
    
    // 인증 토큰 발급 요청
    const tokenData = await getAuthToken(clientId, signature, TYPE, '', timestamp);
    const accessToken = tokenData.access_token;
    
    // 쿼리 파라미터 설정
    const params = new URLSearchParams();
    params.append('page', (options.page || 1).toString());
    params.append('size', (options.size || 100).toString());
    
    // URL 구성
    const url = `https://api.commerce.naver.com/external/v1/seller/addressbooks-for-page?${params.toString()}`;
    
    // 주소록 조회 API 요청
    const response = await axios.request({
      method: 'get',
      url: url,
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
    });
    
    // 디버깅: API 응답 데이터 확인
    console.log('네이버 API 전체 응답:', JSON.stringify(response.data, null, 2));
    console.log('addressBooks 배열:', response.data.addressBooks);
    console.log('addressBooks 길이:', response.data.addressBooks?.length);
    
    // 응답 데이터 가공 - addressBooks 배열 사용
    const addressBooks = response.data.addressBooks || [];
    
    // 필요한 필드만 추출하여 반환
    const formattedAddressBooks = addressBooks.map(book => ({
      addressBookNo: book.addressBookNo,
      name: book.name,
      addressType: book.addressType,
      baseAddress: book.baseAddress,
      detailAddress: book.detailAddress,
      address: book.address,
      phoneNumber1: book.phoneNumber1
    }));
    
    console.log('가공된 주소록 데이터:', formattedAddressBooks);
    
    return {
      success: true,
      data: formattedAddressBooks,
      message: '주소록 조회 성공'
    };
  } catch (error) {
    console.error('주소록 조회 오류:', error.response ? error.response.data : error.message);
    
    // 네이버 API 오류 처리
    if (error.response) {
      const { status, data } = error.response;
      
      if (status === 401) {
        throw new Error('클라이언트 인증 실패');
      } else if (status === 403) {
        throw new Error('접근 권한이 없습니다');
      } else if (status === 429) {
        throw new Error('API 호출 한도를 초과했습니다');
      } else {
        throw new Error(data.message || '네이버 API 호출 중 오류가 발생했습니다');
      }
    }
    
    throw new Error(`주소록 조회 실패: ${error.message}`);
  }
};
