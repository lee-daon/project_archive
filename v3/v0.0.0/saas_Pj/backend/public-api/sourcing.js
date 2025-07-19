import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

// URL에서 상품 ID 추출하는 함수
function extractProductIdFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const id = urlObj.searchParams.get('id');
    if (id) {
      return id;
    }
 
    return null;
  } catch (error) {
    return null;
  }
}

// 상품 URL 소싱 요청
router.post('/', async (req, res) => {
  try {
    const { urls } = req.body;
    const userid = req.user.userid;

    // 데이터 구조 검증
    if (!urls || !Array.isArray(urls)) {
      return res.status(400).json({
        success: false,
        message: '유효한 urls 배열이 필요합니다.'
      });
    }

    // 상품 개수 제한 검증 (100개 이상)
    if (urls.length >= 100) {
      return res.status(400).json({
        success: false,
        message: '한 번에 요청할 수 있는 상품은 최대 99개입니다.'
      });
    }

    // 빈 배열 검증
    if (urls.length === 0) {
      return res.status(400).json({
        success: false,
        message: '최소 1개 이상의 상품 URL이 필요합니다.'
      });
    }

    // 각 URL에서 상품 ID 추출 및 검증
    const invalidUrls = [];
    const validProductIds = [];

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      
      if (!url || typeof url !== 'string' || url.trim() === '') {
        invalidUrls.push({
          index: i,
          url: url,
          reason: '유효하지 않은 URL'
        });
        continue;
      }

      const productId = extractProductIdFromUrl(url.trim());
      
      if (!productId) {
        invalidUrls.push({
          index: i,
          url: url,
          reason: 'URL에서 상품 ID를 추출할 수 없습니다'
        });
      } else {
        validProductIds.push(productId);
      }
    }

    // 유효하지 않은 URL이 있는 경우 오류 반환
    if (invalidUrls.length > 0) {
      return res.status(400).json({
        success: false,
        message: '일부 URL에서 상품 ID를 추출할 수 없습니다.',
        invalidUrls: invalidUrls
      });
    }

    // 내부 API로 요청 전송
    try {
      const response = await axios.post(
        `${process.env.API_BASE_URL}/src/urlSourcing?userid=${userid}`,
        {
          productIds: validProductIds
        },
        {
          headers: {
            'x-api-key': process.env.INTERNAL_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      // 내부 API 응답을 그대로 클라이언트에게 전달
      return res.json(response.data);

    } catch (internalError) {
      console.error('내부 API 호출 오류:', internalError.message);
      
      // 내부 API 오류 응답 처리
      if (internalError.response) {
        return res.status(internalError.response.status).json(internalError.response.data);
      }

      return res.status(500).json({
        success: false,
        message: '내부 서비스 처리 중 오류가 발생했습니다.'
      });
    }

  } catch (error) {
    console.error('sourcing API 오류:', error);
    return res.status(500).json({
      success: false,
      message: '요청 처리 중 오류가 발생했습니다.'
    });
  }
});

export default router;
