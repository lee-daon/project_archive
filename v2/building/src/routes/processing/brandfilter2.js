import express from 'express';
const router = express.Router();
import axios from 'axios'; // axios를 사용하여 HTTP 요청 전송
import { updateBannedProducts } from '../../db/savePreprocessing.js'; // banned 처리 함수 임포트
import { updateBrandBannedProducts } from '../../db/saveStatus.js';

// /brandfilter2 엔드포인트에서 요청 처리
router.post('/brandfilter2', async (req, res) => {
  try {
    // 요청 본문에서 productIds와 translateoption 추출
    const { productIds } = req.body;
    //console.log(productIds);

    // 선택된 제품들을 banned 처리
    await updateBannedProducts(productIds);
    await updateBrandBannedProducts(productIds);
    
    //console.log(translateoption);

    // req.app.locals.processinginfo.productIds가 배열인지 확인한 후 필터링 처리
    if (req.app.locals.processinginfo &&
        Array.isArray(req.app.locals.processinginfo.productIds)) {
      req.app.locals.processinginfo.productIds = req.app.locals.processinginfo.productIds.filter(id => !productIds.includes(id));
    }

    const translateoption = req.app.locals.translateoption;
    //console.log(req.app.locals.processinginfo.productIds);

    // translateoption 객체를 /translatedetail 엔드포인트로 POST 요청 전송
    // 필요에 따라 URL과 포트를 변경하세요.
    const response = await axios.post('http://localhost:3000/prc/translatedetail', translateoption);
    console.log('상태코드',response.status);
    // /translatedetail로부터 받은 응답을 클라이언트에 전달하거나 성공 메시지 전송
    res.json({
      message: 'Product IDs 필터링 및 translateoption 전송 성공',
    });
  } catch (error) {
    console.error('Error in /brandfilter2 route:', error);
    res.status(500).json({ error: error.message });
  }
}); 

export default router;
