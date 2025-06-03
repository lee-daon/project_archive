/**
 * @fileoverview 등록 관리 API 라우터
 * 상품 등록 관련 API 엔드포인트를 제공합니다.
 * @module routes/register/getRegisterInfo
 */

import express from 'express';
import { 
  getProductGroups, 
  getProductsByGroup, 
  getMarketNumbers, 
  getMarketMemo, 
  getMarketInfo 
} from '../../db/register/getRegisterSetting.js';

const router = express.Router();

/**
 * 상품 그룹 목록 조회 API
 * 등록 가능한 상품 그룹 목록을 product_group_code 단위로 반환합니다.
 * 
 * @route GET /groups
 * @param {Object} req.query - 요청 쿼리 파라미터
 * @param {string} req.query.type - 등록 타입 (common, coopang, naver)
 * @param {string} [req.query.search] - 검색어 (그룹 코드 또는 메모)
 * @returns {Object} 상품 그룹 목록
 * @throws {Error} 데이터베이스 조회 중 오류 발생 시
 */
router.get('/groups', async (req, res) => {
  const { type, search } = req.query;
  
  try {
    const groups = await getProductGroups(type, search);
    res.json({ groups });
    
  } catch (error) {
    console.error('상품 그룹 조회 오류:', error);
    
    // 에러 타입에 따른 응답
    if (error.message === '잘못된 등록 타입입니다.') {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: '상품 그룹을 불러오는 중 오류가 발생했습니다.' });
  }
});

/**
 * 상품 상세 정보 조회 API
 * 특정 그룹에 속한 상품 목록을 반환합니다.
 * 
 * @route GET /products
 * @param {Object} req.query - 요청 쿼리 파라미터
 * @param {string} req.query.group - 상품 그룹 코드
 * @param {string} req.query.memo - 상품 그룹 메모
 * @param {string} req.query.type - 등록 타입 (common, coopang, naver)
 * @returns {Object} 상품 목록
 * @throws {Error} 데이터베이스 조회 중 오류 발생 시
 */
router.get('/products', async (req, res) => {
  const { group, memo, type } = req.query;
  
  if (!group) {
    return res.status(400).json({ error: '그룹 코드가 필요합니다.' });
  }
  
  // 메모가 없어도 처리 가능하도록 수정
  const memoValue = memo || null;
  
  try {
    const products = await getProductsByGroup(group, memoValue, type);
    res.json({ products });
    
  } catch (error) {
    console.error('상품 상세 정보 조회 오류:', error);
    
    // 에러 타입에 따른 응답
    if (error.message === '잘못된 등록 타입입니다.') {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: '상품 정보를 불러오는 중 오류가 발생했습니다.' });
  }
});

/**
 * 마켓 번호 목록 조회 API
 * 등록 가능한 마켓 번호 목록을 반환합니다.
 * 
 * @route GET /markets
 * @param {Object} req.query - 요청 쿼리 파라미터
 * @param {string} req.query.type - 마켓 타입 (coopang, naver)
 * @returns {Object} 마켓 번호 목록
 * @throws {Error} 데이터베이스 조회 중 오류 발생 시
 */
router.get('/markets', async (req, res) => {
  const { type } = req.query;
  
  try {
    const markets = await getMarketNumbers(type);
    res.json({ markets });
    
  } catch (error) {
    console.error('마켓 번호 조회 오류:', error);
    
    // 에러 타입에 따른 응답
    if (error.message === '유효한 마켓 타입(coopang 또는 naver)이 필요합니다.') {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: '마켓 정보를 불러오는 중 오류가 발생했습니다.' });
  }
});

/**
 * 마켓 메모 조회 API
 * 특정 마켓 번호에 대한 메모 정보를 반환합니다.
 * 
 * @route GET /market-memo
 * @param {Object} req.query - 요청 쿼리 파라미터
 * @param {string} req.query.type - 마켓 타입 (coopang, naver)
 * @param {string} req.query.number - 마켓 번호
 * @returns {Object} 마켓 메모 정보
 * @throws {Error} 데이터베이스 조회 중 오류 발생 시
 */
router.get('/market-memo', async (req, res) => {
  const { type, number } = req.query;
  
  if (!type || !number) {
    return res.status(400).json({ error: '마켓 타입과 번호가 필요합니다.' });
  }
  
  try {
    const memo = await getMarketMemo(type, number);
    res.json({ memo });
    
  } catch (error) {
    console.error('마켓 메모 조회 오류:', error);
    res.status(500).json({ error: '마켓 메모를 불러오는 중 오류가 발생했습니다.' });
  }
});

/**
 * 마켓 번호 상세 정보 조회 API
 * 등록 가능 개수, 현재 등록된 개수 등 상세 정보를 반환합니다.
 * 
 * @route GET /market-info
 * @param {Object} req.query - 요청 쿼리 파라미터
 * @param {string} req.query.type - 마켓 타입 (coopang, naver)
 * @param {string} req.query.number - 마켓 번호
 * @returns {Object} 마켓 상세 정보
 * @throws {Error} 데이터베이스 조회 중 오류 발생 시
 */
router.get('/market-info', async (req, res) => {
  const { type, number } = req.query;
  
  if (!type || !number) {
    return res.status(400).json({ error: '마켓 타입과 번호가 필요합니다.' });
  }
  
  try {
    const marketInfo = await getMarketInfo(type, number);
    res.json(marketInfo);
    
  } catch (error) {
    console.error('마켓 정보 조회 오류:', error);
    
    // 에러 타입에 따른 응답
    if (error.message === '해당 마켓 번호 정보를 찾을 수 없습니다.') {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ error: '마켓 정보를 불러오는 중 오류가 발생했습니다.' });
  }
});

export default router;
