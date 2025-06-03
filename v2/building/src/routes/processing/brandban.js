import express from 'express';
const router = express.Router();

// GET /brandban - 브랜드 금지 목록 및 리다이렉트 상태 제공
router.get('/brandban', (req, res) => {
  try {
    const brandban = req.app.locals.brandban || [];
    
    
    // brandfilter.js에서 설정한 redirectTo 플래그 추가
    res.json({ 
      success: true, 
      data: brandban 
    });
  } catch (error) {
    console.error('브랜드 데이터 제공 중 오류:', error);
    res.status(500).json({ error: '브랜드 데이터를 가져오는 중 오류가 발생했습니다.' });
  }
});

export default router; 