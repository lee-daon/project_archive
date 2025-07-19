import express from 'express';
import publicApiRateLimiter from '../common/middleware/publicApiRateLimiter.js';
import sourcingRouter from './sourcing.js';
import getDetailDataRouter from './getProductInfo/getDetailData.js';
import getProductListRouter from './getProductInfo/getProductList.js';
import getSoldProductRouter from './getProductInfo/getSoldProduct.js';

const router = express.Router();

// sourcing 관련 엔드포인트에 초당 1개 요청 제한 적용
router.use('/sourcing', publicApiRateLimiter(1), sourcingRouter);

// 상품 상세 데이터 조회 엔드포인트에 초당 5개 요청 제한 적용
router.use('/product-detail', publicApiRateLimiter(5), getDetailDataRouter);

// 상품 리스트 조회 엔드포인트에 초당 10개 요청 제한 적용
router.use('/product-list', publicApiRateLimiter(5), getProductListRouter);

// 판매된 상품 검색 엔드포인트에 초당 5개 요청 제한 적용
router.use('/sold-product', publicApiRateLimiter(5), getSoldProductRouter);

export default router;
