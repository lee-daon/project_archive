import express from 'express';
import { getNaverAddressBooks } from '../service/naver-address-book.js';

const router = express.Router();

// POST /setting/naver-address-book - 네이버 주소록 조회
router.post('/', async (req, res) => {
  try {
    const { client_id, client_secret } = req.body;
    
    // 디버깅: 받은 값들 확인
    console.log('받은 client_id:', client_id);
    console.log('받은 client_secret:', client_secret);
    console.log('client_secret 길이:', client_secret?.length);
    console.log('client_secret이 bcrypt 형태인가:', client_secret?.startsWith('$2'));
    
    // 필수 파라미터 검증
    if (!client_id) {
      return res.status(400).json({
        success: false,
        message: 'client_id가 필요합니다.'
      });
    }

    if (!client_secret) {
      return res.status(400).json({
        success: false,
        message: 'client_secret이 필요합니다.'
      });
    }

    // 네이버 주소록 조회 서비스 호출
    const result = await getNaverAddressBooks(client_id, client_secret, {
      page: 1,
      size: 100
    });

    res.json(result);
  } catch (error) {
    console.error('네이버 주소록 조회 오류:', error);
    
    // 클라이언트 인증 실패 처리
    if (error.message.includes('클라이언트 인증 실패')) {
      return res.status(401).json({
        success: false,
        message: '클라이언트 인증 실패',
        error: 'INVALID_CLIENT_CREDENTIALS'
      });
    }

    // 접근 권한 오류 처리
    if (error.message.includes('접근 권한이 없습니다')) {
      return res.status(403).json({
        success: false,
        message: '접근 권한이 없습니다',
        error: 'ACCESS_DENIED'
      });
    }

    // API 호출 한도 초과 처리
    if (error.message.includes('API 호출 한도를 초과했습니다')) {
      return res.status(429).json({
        success: false,
        message: 'API 호출 한도를 초과했습니다',
        error: 'RATE_LIMIT_EXCEEDED'
      });
    }

    // 기타 오류 처리
    res.status(500).json({
      success: false,
      message: error.message,
      error: error.message
    });
  }
});

export default router;
