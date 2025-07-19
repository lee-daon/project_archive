import express from 'express';
import searchProductRouter from './controller/searchProduct.js';

const router = express.Router();

router.use('/search-product', searchProductRouter);

export default router;
