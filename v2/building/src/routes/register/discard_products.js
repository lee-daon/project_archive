/**
 * @fileoverview 상품 폐기 관련 API 라우터
 * 상품 개별 및 그룹 단위 폐기 기능을 제공합니다.
 * @module routes/register/discard_products
 */

import express from 'express';
import { discardProductsService } from '../../services/pre_register/preRegisterService.js';
import { discardProductsGroupService } from '../../services/register/discard_group.js';

const router = express.Router();

/**
 * 개별 상품 폐기 처리 라우트
 * 선택한 상품들의 상태를 폐기 처리합니다.
 * status 테이블의 discarded 필드를 true로 설정합니다.
 * 
 * @route POST /product_discard/individual
 * @param {Object} req.body - 요청 본문
 * @param {Array<string|number>} req.body.productIds - 폐기 처리할 상품 ID 배열
 * @returns {Object} 폐기 처리 결과
 * @property {boolean} success - 성공 여부
 * @property {number} [updatedCount] - 업데이트된 상품 수
 * @property {string} [message] - 결과 메시지
 * @throws {Error} 처리 중 오류 발생 시
 */
router.post('/product_discard/individual', async (req, res) => {
  try {
    const { productIds } = req.body;
    
    // 요청 검증
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '폐기할 상품 ID가 제공되지 않았습니다.'
      });
    }
    
    // 요청 받은 상품 ID 목록 콘솔에 출력
    console.log('폐기 처리할 상품 ID 목록:', productIds);
    
    const result = await discardProductsService(productIds);
    res.json(result);
    
  } catch (error) {
    console.error('상품 폐기 처리 오류:', error);
    res.status(500).json({
      success: false,
      message: error.message || '상품 폐기 처리 중 오류가 발생했습니다.'
    });
  }
});

/**
 * 상품 그룹 폐기 API
 * 선택한 상품 그룹을 폐기 처리합니다.
 * 
 * @route POST /product_discard/group
 * @param {Object} req.body - 요청 본문
 * @param {string} req.body.groupCode - 폐기할 상품 그룹 코드
 * @param {string} req.body.groupMemo - 폐기할 상품 그룹 메모
 * @param {string} req.body.tabType - 탭 유형 (common, coopang, naver)
 * @returns {Object} 폐기 처리 결과
 * @property {boolean} success - 성공 여부
 * @property {number} count - 폐기된 상품 개수
 * @property {string} message - 결과 메시지
 * @throws {Error} 처리 중 오류 발생 시
 */
router.post('/product_discard/group', async (req, res) => {
  const { groupCode, groupMemo, tabType } = req.body;
  
  // 요청 검증
  if (!groupCode) {
    return res.status(400).json({ 
      success: false,
      error: '그룹 코드가 필요합니다.' 
    });
  }
  
  try {
    // 서비스 계층 호출 - 그룹 단위 폐기 처리
    const result = await discardProductsGroupService(groupCode, groupMemo, tabType);
    res.json(result);
    
  } catch (error) {
    console.error('상품 그룹 폐기 오류:', error);
    
    // 클라이언트에게 적절한 오류 응답 반환
    if (error.message === '폐기할 상품이 없습니다.') {
      return res.status(404).json({ 
        success: false,
        error: error.message 
      });
    }
    
    if (error.message === '잘못된 등록 타입입니다.') {
      return res.status(400).json({ 
        success: false,
        error: error.message 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: '상품 폐기 중 오류가 발생했습니다.',
      message: error.message 
    });
  }
});

export default router;
