import express from 'express';
import getProcessingInfoRouter from './controller/getProcessingInfo.js';
import discardRouter from './controller/discard.js';
import approveRouter from './controller/approve.js';
import productsRouter from './controller/getProducts.js';
import putProductsRouter from './controller/putProduct.js';
import generateRegisterDataRouter from './controller/generate-register-data.js';
import categoryMappingRouter from './controller/categorymapping.js';
import coopangSuggestionRouter from './controller/coopang_suggestion.js';
import { requireBasicPlan } from '../../common/middleware/planChecker.js';
const router = express.Router();

router.use('/getprocessinginfo', getProcessingInfoRouter);
router.use('/discard',requireBasicPlan, discardRouter);
router.use('/approve', requireBasicPlan, approveRouter);
router.use('/getproducts', productsRouter);
router.use('/putproduct', requireBasicPlan, putProductsRouter);
router.use('/generate-register-data', requireBasicPlan, generateRegisterDataRouter);
router.use('/categorymapping', categoryMappingRouter);
router.use('/coopang-suggestion', requireBasicPlan, coopangSuggestionRouter);

export default router; 