import express from 'express';
import { updateApproveStatus } from '../repository/approveStatusControl.js';
import { generateMultiplePrivateData } from '../service/createOwnership.js';
import { saveProductGroup } from '../repository/groupcode.js';

const router = express.Router();

/**
 * 상품 승인 처리 라우터
 * POST /api/postprocessing/approve
 * 
 * @param {Object} req - 요청 객체 (productids, memo, commitcode를 포함)
 * @param {Object} res - 응답 객체
 * @returns {Promise<void>}
 */
router.post('/', async (req, res) => {
  try {
    const { productids, memo, commitcode } = req.body;
    const userid = req.user.userid;
    
    if (!productids || !Array.isArray(productids) || productids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '승인할 상품 ID 배열이 필요합니다.'
      });
    }
    
    if (!commitcode) {
      return res.status(400).json({
        success: false,
        message: '상품 그룹 코드(commitcode)가 필요합니다.'
      });
    }
    
    // 1. processing_status 테이블 상태 업데이트 (status를 'commit'으로 변경)
    const approveResult = await updateApproveStatus(userid, productids);
    
    if (!approveResult.success) {
      return res.status(400).json(approveResult);
    }
    
    // 2. private 테이블들에 데이터 복사
    const privateDataResult = await generateMultiplePrivateData(userid, productids);
    
    // 3. pre_register 테이블에 product_group_code, product_group_memo 저장
    const groupResult = await saveProductGroup(
      userid,
      productids,
      commitcode,
      memo || ''
    );
    
    return res.status(200).json({
      success: true,
      message: `${productids.length}개 상품이 승인 처리되었습니다.`,
      results: {
        approveStatus: approveResult,
        privateData: privateDataResult,
        groupInfo: groupResult
      }
    });
  } catch (error) {
    console.error('상품 승인 처리 중 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message
    });
  }
});

export default router;
