import express from 'express';
import { getExtraSettings, saveExtraSettings } from '../repository/extraSetting.js';
import { 
  getMarketNumbersService, 
  getProductCountService, 
  updateProductCountService 
} from '../service/countCorrection.js';
import { deleteCache } from '../../../common/utils/cacheClient.js';
import { CACHE_KEYS } from '../../../common/config/settings.js';

const router = express.Router();

/**
 * 기타 설정 조회
 * GET /setting/extra/
 */
router.get('/', async (req, res) => {
  try {
    const userid = req.user?.userid;

    if (!userid) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.'
      });
    }

    const settings = await getExtraSettings(userid);
    
    return res.json({
      success: true,
      data: settings
    });

  } catch (error) {
    console.error('기타 설정 조회 오류:', error);
    return res.status(500).json({
      success: false,
      message: '설정 조회에 실패했습니다.'
    });
  }
});

/**
 * 기타 설정 업데이트
 * PUT /setting/extra/
 */
router.put('/', async (req, res) => {
  try {
    const userid = req.user?.userid;
    const { use_deep_ban, allow_keyword_spacing } = req.body;

    if (!userid) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.'
      });
    }

    // 데이터 검증
    if (use_deep_ban !== 0 && use_deep_ban !== 1) {
      return res.status(400).json({
        success: false,
        message: 'use_deep_ban은 0 또는 1이어야 합니다.'
      });
    }

    if (allow_keyword_spacing !== 0 && allow_keyword_spacing !== 1) {
      return res.status(400).json({
        success: false,
        message: 'allow_keyword_spacing은 0 또는 1이어야 합니다.'
      });
    }

    await saveExtraSettings(userid, use_deep_ban, allow_keyword_spacing);

    // 뛰어쓰기 설정 관련 캐시 무효화
    try {
      const cacheKey = CACHE_KEYS.SPACING_SETTING(userid);
      const deletedCount = await deleteCache(cacheKey);
      console.log(`사용자 ${userid}의 뛰어쓰기 설정 캐시 무효화 완료 (삭제된 키: ${deletedCount}개)`);
    } catch (cacheError) {
      console.error(`사용자 ${userid}의 뛰어쓰기 설정 캐시 무효화 중 오류:`, cacheError);
      // 캐시 무효화 실패는 전체 작업에 영향을 주지 않음
    }

    return res.json({
      success: true,
      message: '설정이 성공적으로 업데이트되었습니다.'
    });

  } catch (error) {
    console.error('기타 설정 업데이트 오류:', error);
    return res.status(500).json({
      success: false,
      message: '설정 업데이트에 실패했습니다.'
    });
  }
});

/**
 * 마켓번호 목록 조회
 * GET /setting/extra/market-numbers/?market={market}
 */
router.get('/market-numbers', async (req, res) => {
  try {
    const userid = req.user?.userid;
    const { market } = req.query;

    if (!userid) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.'
      });
    }

    if (!market) {
      return res.status(400).json({
        success: false,
        message: '마켓 종류가 필요합니다.'
      });
    }

    const marketNumbers = await getMarketNumbersService(userid, market);
    
    return res.json({
      success: true,
      data: marketNumbers
    });

  } catch (error) {
    console.error('마켓번호 목록 조회 오류:', error);
    return res.status(500).json({
      success: false,
      message: '마켓번호 목록 조회에 실패했습니다.'
    });
  }
});

/**
 * 상품개수 조회
 * GET /setting/extra/product-count/?market={market}&market_number={market_number}
 */
router.get('/product-count', async (req, res) => {
  try {
    const userid = req.user?.userid;
    const { market, market_number } = req.query;

    if (!userid) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.'
      });
    }

    if (!market) {
      return res.status(400).json({
        success: false,
        message: '마켓 종류가 필요합니다.'
      });
    }

    if (!market_number) {
      return res.status(400).json({
        success: false,
        message: '마켓번호가 필요합니다.'
      });
    }

    const productCount = await getProductCountService(
      userid, 
      market, 
      parseInt(market_number)
    );

    if (!productCount) {
      return res.status(404).json({
        success: false,
        message: '상품개수 조회에 실패했습니다.'
      });
    }
    
    return res.json({
      success: true,
      data: productCount
    });

  } catch (error) {
    console.error('상품개수 조회 오류:', error);
    return res.status(500).json({
      success: false,
      message: '상품개수 조회에 실패했습니다.'
    });
  }
});

/**
 * 상품개수 수정
 * PUT /setting/extra/product-count/
 */
router.put('/product-count', async (req, res) => {
  try {
    const userid = req.user?.userid;
    const { market, market_number, count } = req.body;

    if (!userid) {
      return res.status(401).json({
        success: false,
        message: '인증이 필요합니다.'
      });
    }

    if (!market) {
      return res.status(400).json({
        success: false,
        message: '마켓 종류가 필요합니다.'
      });
    }

    if (market_number === undefined || market_number === null) {
      return res.status(400).json({
        success: false,
        message: '마켓번호가 필요합니다.'
      });
    }

    if (count === undefined || count === null) {
      return res.status(400).json({
        success: false,
        message: '상품개수가 필요합니다.'
      });
    }

    const updatedInfo = await updateProductCountService(
      userid, 
      market, 
      parseInt(market_number), 
      parseInt(count)
    );
    
    return res.json({
      success: true,
      message: '상품개수가 성공적으로 수정되었습니다.',
      data: updatedInfo
    });

  } catch (error) {
    console.error('상품개수 수정 오류:', error);
    return res.status(500).json({
      success: false,
      message: '상품개수 수정에 실패했습니다.'
    });
  }
});

export default router;
