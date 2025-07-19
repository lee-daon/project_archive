import express from 'express';
import {
  getMarketInfo,
  createMarketService,
  updateMarketService,
  deleteMarketService
} from '../service/marketSetting.js';
import { validateMarketCreation } from '../../../common/QuotaUsageLimit/Limit/checkMarkerLimit.js';

const router = express.Router();

// GET / - 마켓 정보 조회
router.get('/', async (req, res) => {
  try {
    const userid = req.user.userid;
    const { market } = req.query;
    
    if (!userid) {
      return res.status(400).json({
        success: false,
        message: 'userid가 필요합니다.'
      });
    }

    if (!market) {
      return res.status(400).json({
        success: false,
        message: 'market 파라미터가 필요합니다. (naver, coopang, elevenstore, esm)'
      });
    }

    if (market !== 'naver' && market !== 'coopang' && market !== 'elevenstore' && market !== 'esm') {
      return res.status(400).json({
        success: false,
        message: 'market은 naver, coopang, elevenstore, esm만 지원됩니다.'
      });
    }

    const marketInfo = await getMarketInfo(userid, market);

    res.json({
      success: true,
      data: marketInfo
    });
  } catch (error) {
    console.error('마켓 정보 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '마켓 정보 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// POST / - 새로운 마켓 생성
router.post('/', async (req, res) => {
  try {
    const userid = req.user.userid;
    const { market } = req.query;
    const marketData = req.body;
    
    if (!userid) {
      return res.status(400).json({
        success: false,
        message: 'userid가 필요합니다.'
      });
    }

    if (!market) {
      return res.status(400).json({
        success: false,
        message: 'market 파라미터가 필요합니다. (naver, coopang, elevenstore, esm)'
      });
    }

    if (market !== 'naver' && market !== 'coopang' && market !== 'elevenstore' && market !== 'esm') {
      return res.status(400).json({
        success: false,
        message: 'market은 naver, coopang, elevenstore, esm만 지원됩니다.'
      });
    }

    // 마켓 생성 가능 여부 확인
    try {
      await validateMarketCreation(userid);
    } catch (limitError) {
      return res.status(403).json({
        success: false,
        message: limitError.message
      });
    }

    const result = await createMarketService(userid, market, marketData);

    res.status(201).json({
      success: true,
      message: result.message,
      data: {
        shopid: result.insertId
      }
    });
  } catch (error) {
    console.error('마켓 생성 오류:', error);
    res.status(400).json({
      success: false,
      message: '마켓 생성 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// PUT /:shopid - 마켓 정보 수정
router.put('/:shopid', async (req, res) => {
  try {
    const userid = req.user.userid;
    const { market } = req.query;
    const { shopid } = req.params;
    const marketData = req.body;
    
    if (!userid) {
      return res.status(400).json({
        success: false,
        message: 'userid가 필요합니다.'
      });
    }

    if (!market) {
      return res.status(400).json({
        success: false,
        message: 'market 파라미터가 필요합니다. (naver, coopang, elevenstore, esm)'
      });
    }

    if (market !== 'naver' && market !== 'coopang' && market !== 'elevenstore' && market !== 'esm') {
      return res.status(400).json({
        success: false,
        message: 'market은 naver, coopang, elevenstore, esm만 지원됩니다.'
      });
    }

    if (!shopid || isNaN(parseInt(shopid))) {
      return res.status(400).json({
        success: false,
        message: 'shopid는 유효한 숫자여야 합니다.'
      });
    }

    const result = await updateMarketService(userid, market, parseInt(shopid), marketData);

    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('마켓 업데이트 오류:', error);
    res.status(400).json({
      success: false,
      message: '마켓 업데이트 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// DELETE /:shopid - 마켓 삭제
router.delete('/:shopid', async (req, res) => {
  try {
    const userid = req.user.userid;
    const { market } = req.query;
    const { shopid } = req.params;
    
    if (!userid) {
      return res.status(400).json({
        success: false,
        message: 'userid가 필요합니다.'
      });
    }

    if (!market) {
      return res.status(400).json({
        success: false,
        message: 'market 파라미터가 필요합니다. (naver, coopang, elevenstore, esm)'
      });
    }

    if (market !== 'naver' && market !== 'coopang' && market !== 'elevenstore' && market !== 'esm') {
      return res.status(400).json({
        success: false,
        message: 'market은 naver, coopang, elevenstore, esm만 지원됩니다.'
      });
    }

    if (!shopid || isNaN(parseInt(shopid))) {
      return res.status(400).json({
        success: false,
        message: 'shopid는 유효한 숫자여야 합니다.'
      });
    }

    const result = await deleteMarketService(userid, market, parseInt(shopid));

    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('마켓 삭제 오류:', error);
    res.status(400).json({
      success: false,
      message: '마켓 삭제 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

export default router;
