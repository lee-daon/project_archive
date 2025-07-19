import express from 'express';
import path from 'path';
import fs from 'fs';

const router = express.Router();

/**
 * ESM 엑셀 파일 다운로드
 * GET /reg/download/excel/:filename
 */
router.get('/excel/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    
    // 파일명 보안 검증
    if (!filename || filename.includes('..') || !filename.endsWith('.xlsx')) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 파일명입니다.'
      });
    }
    
    // 파일 경로 생성
    const filePath = path.join(process.cwd(), 'temp', filename);
    
    // 파일 존재 확인
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: '파일을 찾을 수 없습니다.'
      });
    }
    
    // 파일 다운로드 헤더 설정
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Cache-Control', 'no-cache');
    
    // 파일 스트림으로 전송
    const fileStream = fs.createReadStream(filePath);
    
    fileStream.on('error', (error) => {
      console.error('파일 스트림 오류:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: '파일 다운로드 중 오류가 발생했습니다.'
        });
      }
    });
    
    fileStream.on('end', () => {
      // 파일 다운로드 완료 후 5분 뒤 삭제 (선택사항)
      setTimeout(() => {
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`임시 파일 삭제 완료: ${filename}`);
          }
        } catch (error) {
          console.error(`임시 파일 삭제 실패: ${filename}`, error);
        }
      }, 5 * 60 * 1000); // 5분
    });
    
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('Excel 다운로드 오류:', error);
    
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: '서버 내부 오류가 발생했습니다.'
      });
    }
  }
});

export default router; 