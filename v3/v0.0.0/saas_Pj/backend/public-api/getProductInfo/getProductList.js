import express from 'express';
import { getProductList } from './db/getproductdata.js';

const router = express.Router();

// 상품 리스트 조회
router.post('/', async (req, res) => {
  try {
    const { allowDuplicates, groupCode } = req.body;
    const userid = req.user.userid;

    console.log(`사용자 ${userid}의 상품 리스트 조회 요청 - 중복허용: ${allowDuplicates}, 그룹코드: ${groupCode || '없음'}`);

    // allowDuplicates 타입 검증 (선택사항)
    if (allowDuplicates !== undefined && typeof allowDuplicates !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'allowDuplicates는 boolean 타입이어야 합니다.'
      });
    }

    // groupCode 타입 검증 (선택사항)
    if (groupCode !== undefined && groupCode !== null && typeof groupCode !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'groupCode는 문자열이어야 합니다.'
      });
    }

    // DB에서 상품 리스트 조회
    const result = await getProductList(userid, allowDuplicates || false, groupCode || null);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.message
      });
    }

    // 성공 응답
    return res.json({
      success: true,
      message: result.message,
      productIds: result.data
    });

  } catch (error) {
    console.error('상품 리스트 조회 오류:', error);
    return res.status(500).json({
      success: false,
      message: '요청 처리 중 오류가 발생했습니다.'
    });
  }
});

export default router;
