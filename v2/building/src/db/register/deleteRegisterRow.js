/**
 * @fileoverview 등록 관리 테이블 행 삭제 기능 모듈
 * 상품 폐기 시 쿠팡, 네이버 등록 관리 테이블의 행을 삭제하는 기능을 제공합니다.
 * @module db/register/deleteRegisterRow
 */

import { promisePool } from '../connectDB.js';

/**
 * 등록 관리 테이블에서 상품 기록 삭제 함수
 * 
 * @async
 * @param {Array<string>} productIds - 삭제할 상품 ID 배열
 * @returns {Promise<Object>} 삭제 결과 객체
 */
export async function deleteProductsFromRegisterManagement(productIds) {
  try {
    // 상품 ID를 SQL 파라미터로 사용하기 위한 플레이스홀더 생성
    const placeholders = productIds.map(() => '?').join(',');
    
    // 쿠팡 등록 관리 테이블에서 삭제
    const coopangQuery = `
      DELETE FROM coopang_register_management
      WHERE productid IN (${placeholders})
    `;
    
    const [coopangResult] = await promisePool.query(coopangQuery, productIds);
    
    // 네이버 등록 관리 테이블에서 삭제
    const naverQuery = `
      DELETE FROM naver_register_management
      WHERE productid IN (${placeholders})
    `;
    
    const [naverResult] = await promisePool.query(naverQuery, productIds);
    
    return {
      coopangDeleted: coopangResult.affectedRows,
      naverDeleted: naverResult.affectedRows
    };
  } catch (error) {
    console.error('등록 관리 테이블 삭제 오류:', error);
    throw error;
  }
}
