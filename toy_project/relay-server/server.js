import express from 'express';
import axios from 'axios';
import { URL } from 'url';

const app = express();
const PORT = process.env.PORT || 3000;

// 내부 인증 키
const authKey = 'example-key';

// JSON 파싱 미들웨어
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 헬스체크
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: '중계서버 작동 중' });
});

// URL에서 대상 서버와 경로를 추출하는 함수
function parseTargetUrl(requestPath) {
  // /api/ 제거
  const pathWithoutApi = requestPath.replace(/^\/api\//, '');
  
  if (!pathWithoutApi) {
    throw new Error('대상 URL이 제공되지 않았습니다.');
  }

  // 프로토콜이 없는 경우 https:// 추가
  let fullUrl = pathWithoutApi;
  if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
    fullUrl = 'https://' + fullUrl;
  }

  try {
    const urlObj = new URL(fullUrl);
    const baseUrl = `${urlObj.protocol}//${urlObj.host}`;
    const targetPath = urlObj.pathname + urlObj.search;
    
    return {
      baseUrl,
      targetPath: targetPath || '/'
    };
  } catch (error) {
    throw new Error('유효하지 않은 URL 형식입니다.');
  }
}

// 모든 요청을 중계하는 라우트
app.all('/api/*', async (req, res) => {
  try {
    // 인증 헤더 확인
    const internalKey = req.headers['internal-key'];
    if (internalKey !== authKey) {
      console.warn('인증 실패: 잘못된 internal-key');
      return res.status(401).json({ error: 'Unauthorized', message: '유효하지 않은 internal-key 입니다.' });
    }

    console.log(`요청 받음: ${req.method} ${req.path}`);
    
    // URL에서 대상 서버와 경로 추출
    const { baseUrl, targetPath } = parseTargetUrl(req.path);
    
    // 최종 대상 URL 생성
    const targetUrl = baseUrl + targetPath;
    
    // 요청 헤더 준비 (불필요한 헤더 제거)
    const headers = { ...req.headers };
    delete headers.host;
    delete headers['internal-key']; // 내부 인증 헤더는 전달하지 않음
    
    // axios 요청 설정
    const config = {
      method: req.method,
      url: targetUrl,
      headers: headers,
      params: req.query,
      timeout: 30000
    };
    
    // POST/PUT/PATCH 요청의 경우 body 추가
    if (['POST', 'PUT', 'PATCH'].includes(req.method.toUpperCase())) {
      config.data = req.body;
    }
    
    console.log(`중계 요청: ${req.method} ${targetUrl}`);
    
    // 대상 서버로 요청 전송
    const response = await axios(config);
    
    // 응답 헤더도 함께 전달 (필요한 경우)
    const responseHeaders = { ...response.headers };
    delete responseHeaders['content-encoding']; // gzip 등의 인코딩 헤더 제거
    delete responseHeaders['transfer-encoding'];
    
    // 응답 전달
    res.set(responseHeaders);
    res.status(response.status).json(response.data);
    
  } catch (error) {
    console.error('중계 오류:', error.message);
    
    if (error.response) {
      // 대상 서버 오류 응답
      res.status(error.response.status).json(error.response.data);
    } else {
      // 네트워크 오류 등
      res.status(500).json({
        error: '중계서버 오류',
        message: error.message
      });
    }
  }
});

// 사용법 안내
app.get('/', (req, res) => {
  res.json({
    message: '중계서버 사용법',
    usage: 'GET /api/{대상도메인}/{API경로}',
    examples: [
      'GET /api/jsonplaceholder.typicode.com/posts/1',
      'GET /api/httpbin.org/get?test=1',
      'POST /api/httpbin.org/post'
    ],
    headers: {
      required: 'internal-key: [관리자에게 문의]'
    },
    note: '인증 키는 별도로 제공됩니다.'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 중계서버가 포트 ${PORT}에서 시작되었습니다`);
  // console.log(`📍 대상 서버: ${TARGET_SERVER}`);
  console.log(`📋 헬스체크: http://localhost:${PORT}/health`);
  console.log(`📖 사용법: http://localhost:${PORT}/`);
  console.log(`🔗 예시: http://localhost:${PORT}/api/httpbin.org/get`);
});
