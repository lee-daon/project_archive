import express from 'express';
import noticesRouter from './controller/notices.js';
import memosRouter from './controller/memos.js';

const router = express.Router();

// 공지사항 라우터 연결
router.use('/notices', noticesRouter);

// 메모장 라우터 연결
router.use('/memos', memosRouter);

export default router;
