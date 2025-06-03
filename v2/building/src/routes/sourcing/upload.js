import express from 'express';
import { processNewProducts } from '../../services/sourcing/productListUpdate.js';
import { processBannedProducts } from '../../services/sourcing/banWordCheck.js';
import { removeDuplicateProducts } from '../../services/sourcing/duplicatefilter.js';
import { translateProductNames } from '../../services/sourcing/geminiNameTranslator.js';
import { addUrlToProducts } from '../../services/sourcing/urlcreate.js';
import open from 'open';

const router = express.Router();

router.post('/upload', async (req, res) => {


  try {
    //res.json("서버 수신완료");
    // 클라이언트로부터 전달받은 원본 상품 배열
    /**
     * @typedef {Object} ProductItem
     * @property {string} productId - 상품 고유 식별자 (예: "607454902338")
     * @property {string} productName - 상품명 (예: "Intel/英特尔S4510 240G 480G 960G 1.92T 3.84T 7.68T企业级硬盘")
     * @property {string} [pic] - 상품 이미지 URL (예: "https://img.alicdn.com/imgextra/...")
     * @property {number} [price] - 상품 가격 (예: 309)
     * @property {string} [sales] - 판매량 정보 (예: "100以内")
     * @property {string} [detail_url] - 상품 상세 페이지 URL (예: "https://item.taobao.com/item.htm?id=607454902338")
     */
    
    /**
     * req.body는 상품 정보가 담긴 배열이어야 합니다.
     * @type {ProductItem[]}
     * 
     * 예시:
     * [
     *   {
     *     "productId": "607454902338",
     *     "productName": "Intel/英特尔S4510 240G 480G 960G 1.92T 3.84T 7.68T企业级硬盘",
     *     "pic": "https://img.alicdn.com/imgextra/i3/14349340/O1CN01RV9ZwS2Irlr6omqcG_!!14349340.jpg",
     *     "price": 309,
     *     "sales": "100以内",
     *     "detail_url": "https://item.taobao.com/item.htm?id=607454902338"
     *   },
     *   ...
     * ]
     */
    const rawProducts = req.body;

    // 1. URL 추가  
    const productsWithUrls = addUrlToProducts(rawProducts);

    //2. duplicatefilter를 사용하여 중복 상품 제거
    const products = await removeDuplicateProducts(productsWithUrls);
    console.log('과정1 완료');
    // 3.신규 상품 저장 및 중복상품 갱신    
    const { duplicationCount, newProducts } = await processNewProducts(products);
    console.log('과정2 완료');
    // 4. 번역 진행, 번역된 상품명은 DB도 업데이트됨
    const translatedProducts = await translateProductNames(newProducts);
    console.log('과정3 완료');
    // 5. 금지어 체크 및 DB 업데이트 (번역된 상품명을 기준으로 검사)
    const { includeBanCount, allProducts } = await processBannedProducts(translatedProducts);
    console.log('과정4 완료');

    // 5. 최종 결과와 통계 계산
    const totalCount = allProducts.length;
    const finalTargetCount = totalCount -includeBanCount;

    // 전역 데이터 (app.locals.storedData) 업데이트
    req.app.locals.storedData = {
      bancheckedTarget: allProducts,
      finalTargetCount: finalTargetCount,
      duplicationCount: duplicationCount,
      includeBanCount: includeBanCount,
      totalCount: totalCount,
      // 데이터가 준비되었음을 표시하는 플래그 추가
      dataReady: true,
      timestamp: new Date().toISOString()
    };

    console.log('업로드 처리 완료, storedData 업데이트됨');
    res.json({
      message: '처리가 완료되었습니다.',
      redirectUrl: 'http://localhost:3000/?menu=list'
    });
    //open('http://localhost:3000/?menu=list'); 이게 진짜 계륵이네

  } catch (error) {
    console.error(error);
    // 이미 응답을 보냈으므로 추가 에러 응답은 보내지 않음
  }
});

export default router; 