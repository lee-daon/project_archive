import express from 'express';
import { processProducts } from '../../services/sourcing/processDetailproduct.js';


const router = express.Router();

router.post('/detailparselist', async (req, res) => {
  const detailpageparsetarget = req.body;
  console.log(detailpageparsetarget.length);

  try {
    const { successCount, failApiCount, failSaveCount, productIds } = await processProducts(detailpageparsetarget);
    req.app.locals.setupinfo = {
      productIds : productIds,
      successCount : successCount,
      failApiCount : failApiCount,
      failSaveCount : failSaveCount,
      totalCount: detailpageparsetarget.length,
    }
    console.log(req.app.locals.setupinfo);
    
    res.json({
      message: '모든 상품 처리 완료',
      redirectUrl: 'http://localhost:3000/?menu=sourcing'
    });
  } catch (err) {
    console.error('상품 처리 중 오류:', err);
    res.status(500).json({ message: '상품 처리 중 오류 발생' });
  }
});

export default router; 