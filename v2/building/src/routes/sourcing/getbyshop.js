import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import { getProductDetail } from '../../services/sourcing/getproductdetail.js';
import { getShopItems } from '../../services/sourcing/getshopitems.js';
import { checkBanStatus } from '../../db/sourcing/banCheck.js';

dotenv.config();
const router = express.Router();

router.post('/getbyshop', async (req, res) => {
  try {
    const { url, count, categoryCheck, ignoreBan } = req.body;
    
    // URL에서 상품 ID 추출
    const productIdMatch = url.match(/id=(\d+)/);
    if (!productIdMatch) {
      return res.status(400).json({
        success: false,
        message: '올바른 상품 URL이 아닙니다. 상품 ID를 찾을 수 없습니다.'
      });
    }
    
    const productId = productIdMatch[1];
    
    // 상품 상세 정보 가져오기
    const productDetail = await getProductDetail(productId);
    
    // shop_id와 seller_id 추출
    const shopId = productDetail.result.seller.shop_id;
    const sellerId = productDetail.result.seller.seller_id;
    
    // 판매자와 상점의 금지 상태 확인 (ignoreBan이 true면 건너뜀)
    if (!ignoreBan) {
      const banStatus = await checkBanStatus(sellerId, shopId);
      
      // 금지되었거나 확인이 필요한 경우
      if (banStatus.isBanned || banStatus.needsConfirmation) {
        return res.status(200).json({
          success: false,
          warning: banStatus.warning,
          needsConfirmation: banStatus.needsConfirmation,
          shopId: shopId,
          sellerId: sellerId
        });
      }
    }
    
    // 수집할 아이템 배열 초기화
    const items = [];
    let currentPage = 1;
    let continueCollecting = true;
    
    // 요청한 갯수만큼 아이템 수집
    while (continueCollecting && items.length < count) {
      // 카테고리 ID 설정 (categoryCheck가 true인 경우에만)
      const categoryId = (categoryCheck === true && productDetail.result.item && productDetail.result.item.cat_id) 
        ? productDetail.result.item.cat_id 
        : null;
      
      const shopData = await getShopItems(shopId, currentPage, categoryId);
      
      // 응답받은 상품들이 없으면 종료
      if (!shopData.result.item || shopData.result.item.length === 0) {
        continueCollecting = false;
        break;
      }
      
      // 데이터 추출 및 items 배열에 추가
      for (const item of shopData.result.item) {
        items.push({
          productId: item.num_iid,
          productName: item.title,
          pic: item.pic,
          price: item.price,
          sales: item.sales,
          detail_url: item.detail_url || `https://item.taobao.com/item.htm?id=${item.num_iid}`
        });
        
        if (items.length >= count) {
          continueCollecting = false;
          break;
        }
      }
      
      console.log(shopData.result.status.msg);
      // 더 이상 페이지가 없으면 종료
      if (shopData.result.total_page && currentPage >= shopData.result.total_page) {
        continueCollecting = false;
      }
      
      currentPage++;
    }
    
    // 수집된 상품을 /upload 엔드포인트로 전송
    try {
      const uploadResponse = await axios.post('http://localhost:3000/src/upload', items);
      
      // /upload 응답을 클라이언트에게 그대로 전달
      res.json(uploadResponse.data);
      
    } catch (uploadError) {
      console.error('upload 엔드포인트 요청 중 오류:', uploadError);
      res.status(500).json({
        success: false,
        message: `수집된 상품 처리 중 오류 발생: ${uploadError.message}`
      });
    }
    
  } catch (error) {
    console.error('쇼핑몰 상품 수집 중 오류:', error);
    res.status(500).json({
      success: false, 
      message: `쇼핑몰 상품 수집 중 오류 발생: ${error.message}`
    });
  }
});

export default router;