import express from 'express';
import { filterBannedBrands } from '../../services/processing/brandfilter.js';
import { updateBrandChecked } from '../../db/savePreprocessing.js';

const router = express.Router();

router.post('/brandfilter', async (req, res) => {
  try {
    
    // productIds 배열을 가져옴
    const productIds = req.app.locals.processinginfo.productIds;
    console.log(productIds);
     // 예: [12321, 2321, 44221, 23123212222, 231232467]
    
    // 브랜드 체크 업데이트
    await updateBrandChecked(productIds);
    console.log('brand_checked 업데이트 완료:');
    
    // 금지 브랜드 필터링
    const brandban = await filterBannedBrands(productIds);
    req.app.locals.brandban = brandban;
    
    // 3. 결과를 클라이언트로 전송
    res.json({
      message: 'brandfilter 완료',
      redirectTo: 'brandban' // 메인 페이지에서 brandban 메뉴로 전환하도록 지시
    });
  } catch (err) {
    console.error('Error filtering brands:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
