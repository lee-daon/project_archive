import express from 'express';
import adminChecker from '../common/middleware/adminchecker.js';
import dbBackupRouter from './infra/db_backup.js';
import healthCheckRouter from './infra/chech_health.js';
import dbHealthCheckRouter from './infra/db_health.js';
import logInfoRouter from './logInfo/index.js';
import updateRouter from './update/update.js';
import userPaymentRouter from './update/userPayment.js';
import createAccountRouter from './update/createAccount.js';

const router = express.Router();

/**
 * DB 백업 라우트
 * POST /admin/infra/db-backup
 * 관리자 권한 필요
 */
router.use('/infra/db-backup', adminChecker, dbBackupRouter);

/**
 * 서버 헬스 체크 라우트 (CPU, RAM만)
 * GET /admin/infra/health
 * 관리자 권한 필요
 */
router.use('/infra/health', adminChecker, healthCheckRouter);

/**
 * 데이터베이스 헬스 체크 라우트
 * GET /admin/infra/db-health
 * 관리자 권한 필요
 */
router.use('/infra/db-health', adminChecker, dbHealthCheckRouter);

/**
 * 로그 정보 조회/삭제 라우트
 * GET, DELETE /admin/log-info/*
 * 관리자 권한 필요
 */
router.use('/log-info', adminChecker, logInfoRouter);

/**
 * 공지사항 등 업데이트 라우트
 * POST /admin/update/*
 * 관리자 권한 필요
 */
router.use('/update', adminChecker, updateRouter);

/**
 * 유저 결제 관리 라우트
 * GET, PUT /admin/user-payment/*
 * 관리자 권한 필요
 */
router.use('/user-payment', adminChecker, userPaymentRouter);

/**
 * 계정 생성 라우트
 * POST /admin/create-account/*
 * 관리자 권한 필요
 */
router.use('/create-account', adminChecker, createAccountRouter);

export default router;
