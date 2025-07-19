import express from 'express';
import getstatusRouter from './controller/getstatus.js';
import managerRouter from './controller/manager.js';
import translatedetailRouter from './controller/translatedetail.js';
import brandbanCheckRouter from './controller/brandbanCheck.js';
import brandfilterRouter from './controller/brandfilter.js';
import { requireBasicPlan } from '../../common/middleware/planChecker.js';
// import imgTranslationController from './controller/imgTranslationController.js'; // [DEPRECATED] 워커에서 직접 처리하므로 더 이상 사용하지 않음

const router = express.Router();

router.use('/getstatus', getstatusRouter);
router.use('/manager',requireBasicPlan, managerRouter);
router.use('/translatedetail', translatedetailRouter);
router.use('/brandbancheck', brandbanCheckRouter);
router.use('/brandfilter', brandfilterRouter);
// router.use('/imgtranslation', imgTranslationController); // [DEPRECATED] 워커에서 직접 처리하므로 더 이상 사용하지 않음

export default router; 