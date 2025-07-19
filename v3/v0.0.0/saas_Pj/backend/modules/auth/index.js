import express from 'express';
import loginRouter from './controller/login.js';
import naverAuthRouter from './controller/naverAuth.js';
import localCredentialsRouter from './controller/localCredentials.js';
import authStatusRouter from './controller/authStatus.js';
import apiKeyRouter from './controller/apiKey.js';
import jwtParser from '../../common/middleware/jwtparser.js';

const router = express.Router();

// 로컬 로그인 라우트
router.use('/login', loginRouter);

// 네이버 소셜 로그인/회원가입 라우트
router.use('/naver', naverAuthRouter);

// 인증 상태 확인 라우트 (JWT 인증 필요)
router.use('/status', jwtParser, authStatusRouter);

// 로컬 크리덴셜 설정 라우트 (JWT 인증 필요)
router.use('/local-credentials', jwtParser, localCredentialsRouter);

// API 키 관리 라우트 (JWT 인증 필요)
router.use('/api-key', jwtParser, apiKeyRouter);

export default router;
