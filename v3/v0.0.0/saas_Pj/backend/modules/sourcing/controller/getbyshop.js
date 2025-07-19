import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import { extractShopInfo_V2, collectItemsFromShop_V2 } from '../service/getshopitems.js';
import { checkBanStatus } from '../repository/banCheck.js';
import { saveSellerInfo, saveShopInfo } from '../repository/update_shopNseller.js';
import { INTERNAL_API_KEY } from '../../../common/middleware/jwtparser.js';

dotenv.config();
const router = express.Router();
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

router.post('/', async (req, res) => {
  try {
    const { url, count, ignoreBan, is_shopurl } = req.body;
    const userid = req.user.userid;
    
    // URL에서 상점 정보 추출 (V2 API 사용)
    let shopInfo;
    try {
      shopInfo = await extractShopInfo_V2(url, is_shopurl);
      console.log('추출된 상점 정보:', shopInfo);
    } catch (error) {
      console.error('상점 정보 추출 중 오류:', error);
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    // 상점 정보가 없거나 불완전한 경우 처리
    if (!shopInfo) {
      return res.status(400).json({
        success: false,
        message: '상점 정보를 추출할 수 없습니다.'
      });
    }
    
    const { shopId, sellerId } = shopInfo;
    console.log(`상점 ID: ${shopId || 'null'}, 판매자 ID: ${sellerId || 'null'}`);
    
    // 판매자와 상점의 금지 상태 확인 (ignoreBan이 true가 아닌 경우)
    if (!ignoreBan) {
      try {
        const safeSellerId = sellerId || null;
        const safeShopId = shopId || null;
        
        // 판매자나 상점 ID 중 하나라도 있으면 검사
        if (safeSellerId || safeShopId) {
          console.log(`금지 상태 확인: 판매자 ID=${safeSellerId}, 상점 ID=${safeShopId}`);
          const banStatus = await checkBanStatus(userid, safeSellerId, safeShopId);
          
          // 금지되었거나 확인이 필요한 경우 즉시 반환
          if (banStatus.isBanned || banStatus.needsConfirmation) {
            return res.status(200).json({
              success: false,
              warning: banStatus.warning,
              needsConfirmation: banStatus.needsConfirmation,
              shopId: safeShopId,
              sellerId: safeSellerId
            });
          }
        }
      } catch (banCheckError) {
        console.error('금지 상태 확인 중 오류:', banCheckError);
        // 금지 체크 실패해도 계속 진행
      }
    }
    
    // 판매자와 상점의 정보를 ban_seller, ban_shop 테이블에 추가 (없는 경우에만)
    if (sellerId) {
      try {
        await saveSellerInfo(userid, sellerId);
      } catch (saveError) {
        console.error('판매자 정보 저장 중 오류:', saveError);
        // 저장 실패해도 계속 진행
      }
    }
    
    if (shopId) {
      try {
        await saveShopInfo(userid, shopId);
      } catch (saveError) {
        console.error('상점 정보 저장 중 오류:', saveError);
        // 저장 실패해도 계속 진행
      }
    }
    
    // 상점에서 상품 수집 (V2 API 사용)
    try {
      const items = await collectItemsFromShop_V2(shopId, count);
      
      // 수집된 상품이 없는 경우
      if (!items || items.length === 0) {
        return res.json({
          success: true,
          message: '수집된 상품이 없습니다.',
          itemCount: 0
        });
      }
      
      console.log(`상점에서 ${items.length}개의 상품을 수집했습니다.`);
      
      // 수집된 상품을 /upload 엔드포인트로 전송
      try {
        const uploadResponse = await axios.post(
          `${API_BASE_URL}/src/upload?userid=${userid}`,
          items,
          {
            headers: {
              'x-api-key': INTERNAL_API_KEY
            }
          }
        );
        res.json(uploadResponse.data);
        
      } catch (uploadError) {
        console.error('upload 엔드포인트 요청 중 오류:', uploadError);
        const status = uploadError.response?.status || 500;
        const message = uploadError.response?.data?.message || uploadError.message;
        return res.status(status).json({
          success: false,
          message
        });
      }
    } catch (collectError) {
      console.error('상품 수집 중 오류:', collectError);
      return res.status(500).json({
        success: false,
        message: `상품 수집 중 오류 발생: ${collectError.message}`
      });
    }
    
  } catch (error) {
    console.error('쇼핑몰 상품 수집 중 오류:', error);
    return res.status(500).json({
      success: false, 
      message: `쇼핑몰 상품 수집 중 오류 발생: ${error.message}`
    });
  }
});

export default router;