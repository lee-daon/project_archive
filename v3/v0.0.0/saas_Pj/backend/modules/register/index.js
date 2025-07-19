import express from 'express';
import initialRouter from './controller/initial.js';
import searchRouter from './controller/search.js';
import getImgRouter from './controller/getImg.js';
import discardRouter from './controller/discard.js';
import registerRouter from './controller/register.js';
import coopangmapingRouter from './controller/coopangmaping.js';
import downloadExcelRouter from './controller/downloadExcel.js';
import { requireBasicPlan } from '../../common/middleware/planChecker.js';

const router = express.Router();

router.use('/initial', initialRouter);
router.use('/search', searchRouter);
router.use('/image', getImgRouter);
router.use('/discard', requireBasicPlan, discardRouter);
router.use('/register', requireBasicPlan, registerRouter);
router.use('/coopangmapping', coopangmapingRouter);
router.use('/download', downloadExcelRouter);
export default router; 