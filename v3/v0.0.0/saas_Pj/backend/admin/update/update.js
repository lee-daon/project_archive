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

// GET /update/notices - 공지사항 목록 조회
router.get('/notices', async (req, res) => {
  const { page, limit, type, tag_type, is_active } = req.query;
  const { limit: queryLimit, offset, page: currentPage } = getPagination(page, limit);

  try {
    let countQuery = 'SELECT COUNT(*) as total FROM notices';
    let dataQuery = 'SELECT * FROM notices';
    const params = [];
    const conditions = [];

    // type 필터링
    if (type && type.trim() !== '') {
      conditions.push('type = ?');
      params.push(type);
    }

    // tag_type 필터링
    if (tag_type && tag_type.trim() !== '') {
      const allowedTagTypes = ['success', 'warning', 'info', 'error'];
      if (allowedTagTypes.includes(tag_type)) {
        conditions.push('tag_type = ?');
        params.push(tag_type);
      }
    }

    // is_active 필터링
    if (is_active !== undefined && is_active !== '') {
      const isActiveBool = is_active === 'true' || is_active === '1';
      conditions.push('is_active = ?');
      params.push(isActiveBool);
    }

    // WHERE 조건 추가
    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      countQuery += whereClause;
      dataQuery += whereClause;
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
    res.status(500).json({ 
      success: false, 
      message: '공지사항 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// GET /update/notices/:id - 특정 공지사항 조회
router.get('/notices/:id', async (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({
      success: false,
      message: '유효한 id가 필요합니다.'
    });
  }

  try {
    const [rows] = await promisePool.execute(
      'SELECT * FROM notices WHERE id = ?',
      [parseInt(id, 10)]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '해당 공지사항을 찾을 수 없습니다.'
      });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    logger.error(error);
    res.status(500).json({
      success: false,
      message: '공지사항 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// POST /update/notices - 공지사항 작성
router.post('/notices', async (req, res) => {
  const { type, tag_type, title, content } = req.body;

  // 필수 필드 검증
  if (!type || !tag_type || !title) {
    return res.status(400).json({ 
      success: false, 
      message: 'type, tag_type, title은 필수 항목입니다.' 
    });
  }
  
  // tag_type 유효성 검증
  const allowedTagTypes = ['success', 'warning', 'info', 'error'];
  if (!allowedTagTypes.includes(tag_type)) {
    return res.status(400).json({
      success: false,
      message: `tag_type은 ${allowedTagTypes.join(', ')} 중 하나여야 합니다.`
    });
  }

  try {
    const [result] = await promisePool.execute(
      'INSERT INTO notices (type, tag_type, title, content) VALUES (?, ?, ?, ?)',
      [type, tag_type, title, content || null]
    );

    res.status(201).json({
      success: true,
      message: '공지사항이 성공적으로 작성되었습니다.',
      data: {
        id: result.insertId
      }
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ 
      success: false, 
      message: '공지사항 작성 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// PUT /update/notices/:id - 공지사항 수정
router.put('/notices/:id', async (req, res) => {
  const { id } = req.params;
  const { type, tag_type, title, content, is_active } = req.body;

  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({
      success: false,
      message: '유효한 id가 필요합니다.'
    });
  }

  // 필수 필드 검증
  if (!type || !tag_type || !title) {
    return res.status(400).json({ 
      success: false, 
      message: 'type, tag_type, title은 필수 항목입니다.' 
    });
  }
  
  // tag_type 유효성 검증
  const allowedTagTypes = ['success', 'warning', 'info', 'error'];
  if (!allowedTagTypes.includes(tag_type)) {
    return res.status(400).json({
      success: false,
      message: `tag_type은 ${allowedTagTypes.join(', ')} 중 하나여야 합니다.`
    });
  }

  try {
    const [result] = await promisePool.execute(
      'UPDATE notices SET type = ?, tag_type = ?, title = ?, content = ?, is_active = ?, updated_at = NOW() WHERE id = ?',
      [type, tag_type, title, content || null, is_active !== undefined ? is_active : true, parseInt(id, 10)]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: '해당 공지사항을 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      message: '공지사항이 성공적으로 수정되었습니다.'
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({
      success: false,
      message: '공지사항 수정 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// DELETE /update/notices/:id - 공지사항 삭제
router.delete('/notices/:id', async (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({
      success: false,
      message: '유효한 id가 필요합니다.'
    });
  }

  try {
    const [result] = await promisePool.execute(
      'DELETE FROM notices WHERE id = ?',
      [parseInt(id, 10)]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: '해당 공지사항을 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      message: '공지사항이 성공적으로 삭제되었습니다.'
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({
      success: false,
      message: '공지사항 삭제 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

export default router;
