import express from 'express';
import getRegisteringInfoRouter from './controller/getRegisteringInfo.js';
import removeFromMarketRouter from './controller/removeFromMarket.js';
import deleteProductsRouter from './controller/deleteProducts.js';
import getTrackingStatsRouter from './controller/getTrackingStats.js';
import getTrackingDetailsRouter from './controller/getTrackingDetails.js';
import changePriceRouter from './controller/ChangePrice.js';
import { requireEnterprisePlan, requireBasicPlan } from '../../common/middleware/planChecker.js';

const router = express.Router();

router.use('/get-registering-info', getRegisteringInfoRouter);
router.use('/remove-from-market', requireBasicPlan, removeFromMarketRouter);
router.use('/delete-products', requireBasicPlan, deleteProductsRouter);
router.use('/get-tracking-stats', requireEnterprisePlan, getTrackingStatsRouter);
router.use('/get-tracking-details', requireEnterprisePlan, getTrackingDetailsRouter);
router.use('/change-price', requireBasicPlan, changePriceRouter);

export default router;
