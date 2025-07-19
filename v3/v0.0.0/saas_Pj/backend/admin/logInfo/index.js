import express from 'express';
import { promisePool } from '../../common/utils/connectDB.js';
import logger from '../../common/utils/logger.js';

const router = express.Router();

const getPagination = (page, limit) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const offset = (pageNum - 1) * limitNum;
  return { limit: limitNum, offset, page: pageNum };
};

// GET /logInfo/not-used-image - 폐기 이미지 로그 조회
router.get('/not-used-image', async (req, res) => {
  const { userid, page, limit } = req.query;
  const { limit: queryLimit, offset, page: currentPage } = getPagination(page, limit);

  try {
    let countQuery = 'SELECT COUNT(*) as total FROM not_used_image';
    let dataQuery = 'SELECT * FROM not_used_image';
    const params = [];

    if (userid && userid.trim() !== '') {
      const userIdNum = parseInt(userid, 10);
      if (!isNaN(userIdNum)) {
        countQuery += ' WHERE userid = ?';
        dataQuery += ' WHERE userid = ?';
        params.push(userIdNum);
      }
    }

    // 전체 개수 조회
    const [countResult] = await promisePool.execute(countQuery, params);
    const total = countResult[0].total;

    // 데이터 조회
    dataQuery += ` ORDER BY created_at DESC LIMIT ${queryLimit} OFFSET ${offset}`;
    const [rows] = await promisePool.execute(dataQuery, params);
    
    res.json({ 
      success: true, 
      data: rows,
      total: total,
      page: currentPage,
      limit: queryLimit
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /logInfo/users - 사용자 정보 및 통계 조회
router.get('/users', async (req, res) => {
  const { userid, page, limit } = req.query;
  const { limit: queryLimit, offset, page: currentPage } = getPagination(page, limit);
  
  try {
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM user_info u 
      LEFT JOIN user_statistics s ON u.userid = s.userid
    `;
    let dataQuery = `
      SELECT u.*, s.* 
      FROM user_info u 
      LEFT JOIN user_statistics s ON u.userid = s.userid
    `;
    const params = [];

    if (userid && userid.trim() !== '') {
      const userIdNum = parseInt(userid, 10);
      if (!isNaN(userIdNum)) {
        countQuery += ' WHERE u.userid = ?';
        dataQuery += ' WHERE u.userid = ?';
        params.push(userIdNum);
      }
    }

    // 전체 개수 조회
    const [countResult] = await promisePool.execute(countQuery, params);
    const total = countResult[0].total;

    // 데이터 조회
    dataQuery += ` ORDER BY u.created_at DESC LIMIT ${queryLimit} OFFSET ${offset}`;
    const [rows] = await promisePool.execute(dataQuery, params);
    
    res.json({ 
      success: true, 
      data: rows,
      total: total,
      page: currentPage,
      limit: queryLimit
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /logInfo/usage - 사용량 로그 조회
router.get('/usage', async (req, res) => {
  const { userid, page, limit } = req.query;
  const { limit: queryLimit, offset, page: currentPage } = getPagination(page, limit);

  try {
    let countQuery = 'SELECT COUNT(*) as total FROM usage_log';
    let dataQuery = 'SELECT * FROM usage_log';
    const params = [];

    if (userid && userid.trim() !== '') {
      const userIdNum = parseInt(userid, 10);
      if (!isNaN(userIdNum)) {
        countQuery += ' WHERE userid = ?';
        dataQuery += ' WHERE userid = ?';
        params.push(userIdNum);
      }
    }

    // 전체 개수 조회
    const [countResult] = await promisePool.execute(countQuery, params);
    const total = countResult[0].total;

    // 데이터 조회
    dataQuery += ` ORDER BY usage_time DESC LIMIT ${queryLimit} OFFSET ${offset}`;
    const [rows] = await promisePool.execute(dataQuery, params);
    
    res.json({ 
      success: true, 
      data: rows,
      total: total,
      page: currentPage,
      limit: queryLimit
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /logInfo/error - 에러 로그 조회
router.get('/error', async (req, res) => {
  const { userid, page, limit } = req.query;
  const { limit: queryLimit, offset, page: currentPage } = getPagination(page, limit);

  try {
    let countQuery = 'SELECT COUNT(*) as total FROM error_log';
    let dataQuery = 'SELECT * FROM error_log';
    const params = [];

    if (userid && userid.trim() !== '') {
      const userIdNum = parseInt(userid, 10);
      if (!isNaN(userIdNum)) {
        countQuery += ' WHERE userid = ?';
        dataQuery += ' WHERE userid = ?';
        params.push(userIdNum);
      }
    }

    // 전체 개수 조회
    const [countResult] = await promisePool.execute(countQuery, params);
    const total = countResult[0].total;

    // 데이터 조회
    dataQuery += ` ORDER BY created_at DESC LIMIT ${queryLimit} OFFSET ${offset}`;
    const [rows] = await promisePool.execute(dataQuery, params);
    
    res.json({ 
      success: true, 
      data: rows,
      total: total,
      page: currentPage,
      limit: queryLimit
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /logInfo/info - 정보 로그 조회
router.get('/info', async (req, res) => {
  const { page, limit } = req.query;
  const { limit: queryLimit, offset, page: currentPage } = getPagination(page, limit);

  try {
    const countQuery = 'SELECT COUNT(*) as total FROM info_log';
    let dataQuery = 'SELECT * FROM info_log';

    // 전체 개수 조회
    const [countResult] = await promisePool.execute(countQuery);
    const total = countResult[0].total;

    // 데이터 조회
    dataQuery += ` ORDER BY created_at DESC LIMIT ${queryLimit} OFFSET ${offset}`;
    const [rows] = await promisePool.execute(dataQuery);
    
    res.json({ 
      success: true, 
      data: rows,
      total: total,
      page: currentPage,
      limit: queryLimit
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /logInfo/not-used-image/:id - 폐기 이미지 로그 삭제
router.delete('/not-used-image/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const idNum = parseInt(id, 10);
    if (isNaN(idNum)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }

    const [result] = await promisePool.execute('DELETE FROM not_used_image WHERE id = ?', [idNum]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Log not found' });
    }
    res.json({ success: true, message: 'Log deleted successfully' });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /logInfo/usage/:id - 사용량 로그 삭제
router.delete('/usage/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const idNum = parseInt(id, 10);
    if (isNaN(idNum)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }

    const [result] = await promisePool.execute('DELETE FROM usage_log WHERE id = ?', [idNum]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Log not found' });
    }
    res.json({ success: true, message: 'Log deleted successfully' });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /logInfo/error/:log_id - 에러 로그 삭제
router.delete('/error/:log_id', async (req, res) => {
  const { log_id } = req.params;
  
  try {
    const logIdNum = parseInt(log_id, 10);
    if (isNaN(logIdNum)) {
      return res.status(400).json({ success: false, message: 'Invalid log_id format' });
    }

    const [result] = await promisePool.execute('DELETE FROM error_log WHERE log_id = ?', [logIdNum]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Log not found' });
    }
    res.json({ success: true, message: 'Log deleted successfully' });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /logInfo/info/:log_id - 정보 로그 삭제
router.delete('/info/:log_id', async (req, res) => {
  const { log_id } = req.params;
  
  try {
    const logIdNum = parseInt(log_id, 10);
    if (isNaN(logIdNum)) {
      return res.status(400).json({ success: false, message: 'Invalid log_id format' });
    }

    const [result] = await promisePool.execute('DELETE FROM info_log WHERE log_id = ?', [logIdNum]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Log not found' });
    }
    res.json({ success: true, message: 'Log deleted successfully' });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router; 