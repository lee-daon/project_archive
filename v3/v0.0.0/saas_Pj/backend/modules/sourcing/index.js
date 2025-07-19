import express from 'express';
import uploadRouter from './controller/upload.js';
import getbyshopRouter from './controller/getbyshop.js';
import listcheckRouter from './controller/listcheck.js';
import updatestatusRouter from './controller/updatestatus.js';
import updatebanRouter from './controller/updateban.js';
import detailparselistRouter from './controller/detailparselist.js';
import setupinfoRouter from './controller/setupinfo.js';
import urlSourcingRouter from './controller/urlSourcing.js';
import { requireBasicPlan } from '../../common/middleware/planChecker.js';

const router = express.Router();

// 업로드 관련 라우트
router.use('/upload',requireBasicPlan, uploadRouter);

// 쇼핑몰별 상품 조회 관련 라우트
router.use('/getbyshop', requireBasicPlan, getbyshopRouter);

// 상품 ID 기반 직접 소싱 관련 라우트
router.use('/urlsourcing', requireBasicPlan, urlSourcingRouter);

// 상품 목록 조회 관련 라우트
router.use('/listcheck', listcheckRouter);

// 상태 업데이트 관련 라우트
router.use('/updatestatus', requireBasicPlan, updatestatusRouter);

// 금지 상태 업데이트 관련 라우트
router.use('/updateban', requireBasicPlan, updatebanRouter);

// 상품 상세 정보 파싱 관련 라우트
router.use('/detailparselist', requireBasicPlan, detailparselistRouter);

// 소싱 페이지 업데이트용용// setupinfo API 엔드포인트 추가
router.use('/getstatus/setupinfo', setupinfoRouter);

export default router; 