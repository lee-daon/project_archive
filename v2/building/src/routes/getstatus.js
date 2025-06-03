// 백엔드 API 예시 코드 (Express.js 기준)

import express from 'express';
const router = express.Router();
import { promisePool } from "../db/connectDB.js";

// 통계 정보를 가져오는 API 엔드포인트
router.get('/stats', async (req, res) => {
  try {
    const connection = await promisePool.getConnection();
    
    // 각 상태별 개수 조회
    const [sourcingCompleted] = await connection.query(
      'SELECT COUNT(*) as count FROM status WHERE sourcing_completed = TRUE'
    );
    
    const [preprocessingCompleted] = await connection.query(
      'SELECT COUNT(*) as count FROM status WHERE preprocessing_completed = TRUE'
    );
    
    const [isRegistrable] = await connection.query(
      'SELECT COUNT(*) as count FROM status WHERE is_registrable = TRUE'
    );
    
    const [registered] = await connection.query(
      'SELECT COUNT(*) as count FROM status WHERE registered = TRUE'
    );
    
    // 새로운 통계 정보 조회
    const [categoryMappingRequired] = await connection.query(
      'SELECT COUNT(*) as count FROM status WHERE category_mapping_required = TRUE'
    );
    
    const [discarded] = await connection.query(
      'SELECT COUNT(*) as count FROM status WHERE discarded = TRUE'
    );
    
    connection.release();
    
    res.json({
      sourcingCompleted: sourcingCompleted[0].count,
      preprocessingCompleted: preprocessingCompleted[0].count,
      isRegistrable: isRegistrable[0].count,
      registered: registered[0].count,
      categoryMappingRequired: categoryMappingRequired[0].count,
      discarded: discarded[0].count
    });
    
  } catch (error) {
    console.error('통계 정보 조회 중 오류 발생:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});


export default router;
