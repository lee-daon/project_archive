import express from 'express';
import { getNoticesList, getNoticeById } from '../repository/notices.js';

const router = express.Router();

/**
 * 공지사항 목록 조회
 * GET /home/notices
 * 
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 * @returns {Promise<void>}
 */
router.get('/', async (req, res) => {
  try {
    console.log('공지사항 목록 조회 요청');
    
    const notices = await getNoticesList(); 
    
    return res.status(200).json({
      success: true,
      data: notices
    });
  } catch (error) {
    console.error('공지사항 목록 조회 중 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * 공지사항 상세 조회
 * GET /home/notices/:id
 * 
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 * @returns {Promise<void>}
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: '유효한 공지사항 ID가 필요합니다.'
      });
    }
    
    console.log(`공지사항 상세 조회 요청 - id: ${id}`);
    
    const notice = await getNoticeById(parseInt(id));
    
    if (!notice) {
      return res.status(404).json({
        success: false,
        message: '공지사항을 찾을 수 없습니다.'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: notice
    });
  } catch (error) {
    console.error('공지사항 상세 조회 중 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message
    });
  }
});

export default router;
