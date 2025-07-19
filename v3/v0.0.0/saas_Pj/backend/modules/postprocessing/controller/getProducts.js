import express from 'express';
import { getProductsList, getProductDetail } from '../repository/getProducts.js';

const router = express.Router();

// 상품 리스트 조회 API
router.get('/', async (req, res) => {
  try {
    const userid = req.user.userid;
    const {
      page = 1,
      limit = 60,
      order = 'latest',
      search = ''
    } = req.query;

    // 파라미터 검증
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    if (pageNum < 1 || limitNum < 1) {
      return res.status(400).json({
        success: false,
        message: '잘못된 페이지 파라미터입니다.'
      });
    }

    if (!['latest', 'oldest'].includes(order)) {
      return res.status(400).json({
        success: false,
        message: '정렬 방식은 latest 또는 oldest만 가능합니다.'
      });
    }

    const result = await getProductsList(userid, pageNum, limitNum, order, search);

    res.json({
      success: true,
      data: {
        products: result.products,
        pagination: {
          current_page: pageNum,
          total_count: result.totalCount
        }
      }
    });

  } catch (error) {
    console.error('상품 리스트 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});

// 상품 상세 정보 조회 API (모달용)
router.get('/:productid', async (req, res) => {
  try {
    const userid = req.user.userid;
    const productid = parseInt(req.params.productid);

    if (!productid) {
      return res.status(400).json({
        success: false,
        message: '상품 ID가 필요합니다.'
      });
    }

    const result = await getProductDetail(userid, productid);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('상품 상세 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    });
  }
});


export default router;
