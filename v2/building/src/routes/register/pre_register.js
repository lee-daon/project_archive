import express from 'express';
import { getPreRegisterProductsService } from '../../services/pre_register/preRegisterService.js';

const router = express.Router();

/**
 * 등록 대기 상품 목록을 가져오는 라우트
 * preprocessing이 완료되었으나 아직 등록 가능 상태가 아닌 상품을 조회합니다.
 * 최신순/과거순으로 정렬 가능하며, 개별 목록 또는 testcode 그룹별로 조회할 수 있습니다.
 * 
 * @route GET /pre_register
 * @param {string} [req.query.sortBy='desc'] - 정렬 방식 ('desc': 최신순, 'asc': 과거순)
 * @param {string} [req.query.viewMode='individual'] - 조회 모드 ('individual': 개별 목록, 'grouped': testcode 그룹별)
 * @param {string} [req.query.testCode] - 조회할 특정 testcode (viewMode가 'grouped'이고 특정 testcode 조회 시 사용)
 * 
 */
router.get('/pre_register', async (req, res) => {
  try {
    const { sortBy = 'desc', viewMode = 'individual', testCode } = req.query;
    
    if (viewMode !== 'individual' && viewMode !== 'grouped') {
      return res.status(400).json({
        success: false,
        message: '잘못된 조회 모드입니다.'
      });
    }
    
    const result = await getPreRegisterProductsService({ sortBy, viewMode, testCode });
    res.json(result);
    
  } catch (error) {
    console.error('등록 대기 상품 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '등록 대기 상품 조회 중 오류가 발생했습니다.'
    });
  }
});

export default router;
