import bcrypt from "bcrypt";
import axios from "axios";
import dotenv from "dotenv";
import logger from './logger.js';
dotenv.config();  

// 프록시 설정 관련 코드 제거됨

// 커스텀 헤더 인터셉터 설정 코드 제거됨

// HTTP 및 HTTPS 에이전트 설정 제거됨

/**
 * 전자서명 생성 함수
 * @param {string} clientId - 애플리케이션 ID
 * @param {string} clientSecret - 애플리케이션 시크릿 (salt로 사용)
 * @param {number} timestamp - 밀리초 단위의 타임스탬프
 * @returns {string} 생성된 전자서명
 */
function generateSignature(clientId, clientSecret, timestamp) {
  try {
    // 밑줄로 연결하여 password 생성
    const password = `${clientId}_${timestamp}`;
    
    // clientSecret이 완전한 bcrypt salt 형식인지 확인
    let salt = clientSecret;
    
    // bcrypt salt 형식 검증
    if (salt.startsWith('$2a$') || salt.startsWith('$2b$') || salt.startsWith('$2y$')) {
      const parts = salt.split('$');
      
      if (parts.length >= 4) {
        const version = parts[1]; // 2a, 2b, 2y
        const rounds = parts[2];  // 04, 10, 12 등
        const saltPart = parts[3]; // 실제 salt 부분
        
        // rounds가 숫자인지 확인
        if (isNaN(parseInt(rounds))) {
          salt = 10; // 기본값 사용
        } else if (saltPart.length !== 22) {
          salt = 10; // 기본값 사용
        }
        // 형식이 올바른 경우 그대로 사용
      } else {
        salt = 10; // 기본값 사용
      }
    } else {
      // salt가 bcrypt 형식이 아닌 경우 기본 salt rounds 사용
      salt = 10;
    }
    
    // bcrypt 해싱
    const hashed = bcrypt.hashSync(password, salt);
    // base64 인코딩
    return Buffer.from(hashed, "utf-8").toString("base64");
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

/**
 * API 인증 토큰 발급/갱신 요청 함수
 * @param {string} client_id - 제공된 애플리케이션 ID
 * @param {string} client_secret_sign - 전자서명
 * @param {string} type - 인증 토큰 발급 타입 (SELLER 또는 SELF)
 * @param {string} account_id - type이 SELLER인 경우 입력하는 판매자 ID
 * @param {number} timestamp - 밀리초 단위의 타임스탬프
 * @param {object} config - 외부에서 전달받은 설정
 * @returns {Promise<object>} 인증 토큰 정보
 */
async function getAuthToken(client_id, client_secret_sign, type, account_id = '', timestamp, config = {}) {
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
      data: params,
      // httpsAgent 제거
      ...config // 외부에서 전달받은 설정 병합
    };
    
    // axios로 API 요청 보내기
    const response = await axios.request(axiosConfig);
    
    // 응답 데이터
    const data = response.data;
    
    return data;
  } catch (error) {
    logger.error(error.response ? error.response.data : error.message);
    throw error;
  }
}

/* 사용 예시
async function main() {
  // 애플리케이션 정보
  const CLIENT_ID = process.env.NAVER_CLIENT_ID; // 이걸로 유저 식별하는 거임
  const CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;
  const TYPE = 'SELF';
  const ACCOUNT_ID = '';
  
  try {
    // 타임스탬프를 하나만 생성하여 동일하게 사용
    const timestamp = Date.now();
    
    // 전자서명 생성
    const signature = generateSignature(CLIENT_ID, CLIENT_SECRET, timestamp);
    console.log('생성된 전자서명:', signature);
    
    // 인증 토큰 발급 요청 - 동일한 타임스탬프 전달
    const tokenData = await getAuthToken(CLIENT_ID, signature, TYPE, ACCOUNT_ID, timestamp);
    console.log('발급된 인증 토큰:', tokenData.access_token);
  } catch (error) {
    logger.error(error);
  }
}

// 함수 실행
main();*/

export { generateSignature, getAuthToken };
