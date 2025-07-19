import express from 'express';
import { getMemosList, createMemo, updateMemo, deleteMemo } from '../repository/memos.js';

const router = express.Router();

/**
 * 메모 목록 조회
 * GET /home/memos
 * 
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 * @returns {Promise<void>}
 */
router.get('/', async (req, res) => {
  try {
    const userid = req.user.userid;
    
    console.log(`메모 목록 조회 요청 - userid: ${userid}`);
    
    const memos = await getMemosList(userid);
    
    return res.status(200).json({
      success: true,
      data: memos
    });
  } catch (error) {
    console.error('메모 목록 조회 중 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * 메모 생성
 * POST /home/memos
 * 
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 * @returns {Promise<void>}
 */
router.post('/', async (req, res) => {
  try {
    const userid = req.user.userid;
    const { title, content } = req.body;
    
    if (!title) {
      return res.status(400).json({
        success: false,
        message: '메모 제목이 필요합니다.'
      });
    }
    
    console.log(`메모 생성 요청 - userid: ${userid}, title: ${title}`);
    
    const newMemo = await createMemo(userid, title, content || '');
    
    return res.status(201).json({
      success: true,
      data: newMemo
    });
  } catch (error) {
    console.error('메모 생성 중 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * 메모 수정
 * PUT /home/memos/:id
 * 
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 * @returns {Promise<void>}
 */
router.put('/:id', async (req, res) => {
  try {
    const userid = req.user.userid;
    const { id } = req.params;
    const { title, content } = req.body;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: '유효한 메모 ID가 필요합니다.'
      });
    }
    
    if (!title) {
      return res.status(400).json({
        success: false,
        message: '메모 제목이 필요합니다.'
      });
    }
    
    console.log(`메모 수정 요청 - userid: ${userid}, id: ${id}`);
    
    const updatedMemo = await updateMemo(parseInt(id), userid, title, content || '');
    
    if (!updatedMemo) {
      return res.status(404).json({
        success: false,
        message: '메모를 찾을 수 없습니다.'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: updatedMemo
    });
  } catch (error) {
    console.error('메모 수정 중 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message
    });
  }
});

/**
 * 메모 삭제
 * DELETE /home/memos/:id
 * 
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 * @returns {Promise<void>}
 */
router.delete('/:id', async (req, res) => {
  try {
    const userid = req.user.userid;
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: '유효한 메모 ID가 필요합니다.'
      });
    }
    
    console.log(`메모 삭제 요청 - userid: ${userid}, id: ${id}`);
    
    const isDeleted = await deleteMemo(parseInt(id), userid);
    
    if (!isDeleted) {
      return res.status(404).json({
        success: false,
        message: '메모를 찾을 수 없습니다.'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: '메모가 삭제되었습니다.'
    });
  } catch (error) {
    console.error('메모 삭제 중 오류:', error);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error.message
    });
  }
});

export default router;
