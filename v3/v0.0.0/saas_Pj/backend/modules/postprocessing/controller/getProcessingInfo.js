import express from 'express';
import { getStatusCounts, getProductsByStatus } from '../repository/getProcessingInfo.js';

const router = express.Router();

/**
 * @route GET /postprc/getprocessinginfo
 * @desc 상품 처리 상태 정보를 조회
 * @params {string} order - 정렬 순서(asc: 과거순, desc: 최신순), 기본값: asc
 * @params {number} limit - 가져올 항목 수, 기본값: 10
 * @params {string} status - 처리 상태(pending, brandbanCheck, processing, success, fail), 기본값: 없음(전체 조회)
 * @params {string} group_code - 조회할 그룹 코드, 기본값: 없음(전체 조회)
 */
router.get('/', async (req, res) => {
  try {
    // 쿼리 파라미터 사용
    // status가 없거나 빈 문자열 또는 'all'일 경우 5개 상태(pending, brandbanCheck, processing, success, fail) 조회
    let status = req.query.status || '';
    const limit = req.query.limit || 10;
    const order = req.query.order || 'asc';
    const group_code = req.query.group_code || '';
    
    const userid = req.user.userid;
    
    console.log('요청 파라미터:', { userid, status, limit, order, group_code });
    
    // 파라미터 유효성 검사
    if (limit <= 0 || isNaN(parseInt(limit))) {
      return res.status(400).json({ 
        success: false, 
        message: '유효하지 않은 항목 수입니다.' 
      });
    }
    
    if (order !== 'asc' && order !== 'desc') {
      return res.status(400).json({ 
        success: false, 
        message: '유효하지 않은 정렬 순서입니다. asc 또는 desc를 사용하세요.' 
      });
    }
    
    const validStatuses = ['pending', 'brandbanCheck', 'processing', 'success', 'fail', 'all', '', null, undefined];
    
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: '유효하지 않은 상태 값입니다.' 
      });
    }

    // 전체 상태별 카운트 조회
    const statusCounts = await getStatusCounts(userid);
    
    // 요청한 상태 및 그룹 코드에 해당하는 상품 목록 조회
    const products = await getProductsByStatus(userid, status, limit, order, group_code);

    // 결과 반환
    return res.status(200).json({
      success: true,
      data: {
        counts: statusCounts,
        products: products
      }
    });
    
  } catch (error) {
    console.error('처리 상태 정보 조회 중 오류 발생:', error);
    return res.status(500).json({ 
      success: false, 
      message: '서버 오류가 발생했습니다.' 
    });
  }
});

export default router;
