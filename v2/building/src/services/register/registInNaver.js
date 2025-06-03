import { findNaverRegistTargets } from '../../db/register/findRegistTarget.js';
import { updateNaverRegistInfo } from '../../db/register/NaverRegistUpdate.js';
import { registerMultipleProducts } from '../connect_naver/main.js';

/**
 * 네이버 상품 등록 서비스
 * 조건에 맞는 상품을 조회하고 등록 정보 업데이트 후 네이버 API를 통해 등록
 * @param {object} registData - 등록 요청 데이터
 * @returns {Promise<object>} - 등록 결과
 */
export const registInNaver = async (registData) => {
  try {
    const { 
      groupCode,
      groupMemo, 
      tabType,
      marketNumber, 
      deliveryFee, 
      profitMargin, 
      minProfitMargin 
    } = registData;
    
    // 필수 값 검증
    if (!groupCode || !marketNumber) {
      throw new Error('그룹 코드와 마켓 번호가 필요합니다.');
    }
    
    // 1. 등록할 상품 ID 목록 조회
    const productIds = await findNaverRegistTargets(groupCode, groupMemo, tabType);
    
    if (productIds.length === 0) {
      return {
        success: false,
        message: '등록할 상품이 없습니다.'
      };
    }
    
    // 2. 상품 등록 정보 업데이트
    const updatedCount = await updateNaverRegistInfo(
      productIds, 
      marketNumber, 
      profitMargin, 
      minProfitMargin, 
      deliveryFee
    );
    
    // 3. 네이버 API를 통해 상품 등록
    const result = await registerMultipleProducts(productIds);
    
    return {
      success: true,
      successCount: result.summary.success,
      failedCount: result.summary.failed,
      totalCount: result.summary.total,
      details: result.results,
      message: '네이버 상품 등록이 완료되었습니다.'
    };
    
  } catch (error) {
    console.error('네이버 상품 등록 중 오류:', error);
    throw error;
  }
};
