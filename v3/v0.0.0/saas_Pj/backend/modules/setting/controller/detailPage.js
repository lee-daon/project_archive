import express from 'express';
import multer from 'multer';
import { getDetailPageSettingService, updateDetailPageSettingService } from '../service/detailPage.js';

const router = express.Router();

// multer 설정 (메모리 저장)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 6 // 최대 6개 파일
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('허용되지 않는 파일 형식입니다.'), false);
    }
  }
});

// GET / - 상세페이지 설정 조회
router.get('/', async (req, res) => {
  try {
    const userid = req.user.userid;
    
    if (!userid) {
      return res.status(400).json({
        success: false,
        message: 'userid가 필요합니다.'
      });
    }

    const setting = await getDetailPageSettingService(userid);

    res.json({
      success: true,
      message: '상세페이지 설정 조회 성공',
      data: setting
    });
  } catch (error) {
    console.error('상세페이지 설정 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '설정 조회에 실패했습니다.',
      error: error.message
    });
  }
});

// POST / - 상세페이지 설정 업데이트
router.post('/', upload.any(), async (req, res) => {
  try {
    const userid = req.user.userid;
    const settingData = req.body;
    
    if (!userid) {
      return res.status(400).json({
        success: false,
        message: 'userid가 필요합니다.'
      });
    }

    // 업로드된 파일들을 필드명으로 매핑
    const files = {};
    if (req.files) {
      req.files.forEach(file => {
        files[file.fieldname] = file;
      });
    }

    const result = await updateDetailPageSettingService(userid, settingData, files);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: '설정 저장에 실패했습니다.',
        error: '유효성 검증 실패',
        validation_errors: result.validationErrors
      });
    }

    res.json({
      success: true,
      message: '상세페이지 설정이 성공적으로 저장되었습니다.',
      data: result.data
    });
  } catch (error) {
    console.error('상세페이지 설정 업데이트 오류:', error);
    
    // multer 오류 처리
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: '파일 크기가 5MB를 초과합니다.',
        error: error.message
      });
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: '업로드할 수 있는 파일 개수를 초과했습니다.',
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: '설정 저장 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

export default router;
