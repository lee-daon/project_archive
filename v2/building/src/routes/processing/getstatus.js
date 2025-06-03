import express from 'express';
const router = express.Router();
import { getProcessingStats } from "../../db/processing/getstatus.js";

// 가공 통계 정보 가져오기
router.get('/getstatus/stats', async (req, res) => {
    try {
      const stats = await getProcessingStats();
      
      res.json(stats);
    } catch (error) {
      console.error('통계 정보 조회 오류:', error);
      res.status(500).json({ error: '통계 정보를 가져오는 중 오류가 발생했습니다.' });
    }
  });
  
export default router;
