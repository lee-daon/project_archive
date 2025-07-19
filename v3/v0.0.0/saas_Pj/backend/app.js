import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import dotenv from 'dotenv';

// 환경 변수 로드
dotenv.config();

// 통합 라우터 임포트- 서버 핵심 모듈 라우터
import sourcingRouter from './modules/sourcing/index.js';
import authRouter from './modules/auth/index.js';
import processingRouter from './modules/processing/index.js';
import postprocessingRouter from './modules/postprocessing/index.js';
import settingRouter from './modules/setting/index.js';
import registerRouter from './modules/register/index.js';
import orderControlRouter from './modules/orderControl/index.js';
import registeredManagingRouter from './modules/registeredManaging/index.js';
import mainPageRouter from './modules/mainPage/index.js';

// 보조, 외부 모듈 라우터
import adminRouter from './admin/index.js';
import publicApiRouter from './public-api/index.js';

// QuotaUsageLimit 모듈 라우터
import quotaUsageLimitRouter from './common/QuotaUsageLimit/getInfo.js';

// 미들웨어 임포트
import jwtParser from './common/middleware/jwtparser.js';
import apiKeyMiddleware from './common/middleware/apikeyauth.js';

const app = express();

// ES 모듈에서 __dirname 사용을 위한 설정
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 미들웨어 설정
app.use(express.json());
app.use(cookieParser()); // 쿠키 파서 미들웨어 추가

// 세션 미들웨어 설정 (네이버 로그인 state 관리용)
app.use(session({
  secret: process.env.SESSION_SECRET || 'naver-login-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS에서만 보안 쿠키
    httpOnly: true,
    maxAge: 1000 * 60 * 10 // 10분
  }
}));

app.use(cors({
  origin: [
    process.env.FRONTEND_URL, 
    'http://localhost:5500', 
    'http://127.0.0.1:5500',
    'http://localhost:8080',  // 프론트엔드 포트 추가
    'http://127.0.0.1:8080'
  ],
  credentials: true
}));

// API 라우터 설정
// 소싱 모듈에만 JWT 파서 미들웨어 적용
app.use('/src', jwtParser, sourcingRouter);
app.use('/prc', jwtParser, processingRouter);
app.use('/postprc', jwtParser, postprocessingRouter);
app.use('/setting', jwtParser, settingRouter);
app.use('/auth', authRouter);
app.use('/reg', jwtParser, registerRouter);
app.use('/order', jwtParser, orderControlRouter);
app.use('/regmng', jwtParser, registeredManagingRouter);
app.use('/admin', jwtParser, adminRouter);
app.use('/apiEnterprise', apiKeyMiddleware, publicApiRouter);
app.use('/home', jwtParser, mainPageRouter);

// QuotaUsageLimit 라우터 (JWT 파서 적용)
app.use('/qtuslm', jwtParser, quotaUsageLimitRouter);

// 루트 경로 핸들러
app.get('/', (req, res) => {
  res.json({ 
    message: '백엔드 API 서버가 실행 중입니다',
    version: '1.0'
  });
});

// 404 핸들러
app.use((req, res) => {
  res.status(404).json({ 
    message: '요청한 리소스를 찾을 수 없습니다' 
  });
});

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error('서버 오류:', err);
  res.status(500).json({ 
    message: '서버 내부 오류가 발생했습니다',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

export default app; 