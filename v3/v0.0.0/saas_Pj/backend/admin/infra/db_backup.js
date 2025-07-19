import express from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { 
  S3Client, 
  PutObjectCommand, 
} from '@aws-sdk/client-s3';
import logger from '../../common/utils/logger.js';

dotenv.config();

const router = express.Router();
const execPromise = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cloudflare R2 비공개 버킷 설정
const R2_ENDPOINT = process.env.R2_ENDPOINT;
const CLOUDFLARE_ACCESS_KEY_ID = process.env.PRIVATE_CLOUDFLARE_ID;
const CLOUDFLARE_SECRET_KEY = process.env.PRIVATE_CLOUDFLARE_SECRET_KEY;
const R2_PRIVATE_BUCKET_NAME = process.env.PRIVATE_R2_BUCKET_NAME || 'db-backup';

// Cloudflare R2 클라이언트 생성
const r2Client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: CLOUDFLARE_ACCESS_KEY_ID,
    secretAccessKey: CLOUDFLARE_SECRET_KEY,
  },
  forcePathStyle: true,
  signingRegion: 'auto'
});

/**
 * 백업 파일을 비공개 R2 버킷에 업로드
 * @param {string} filePath - 업로드할 파일 경로
 * @param {string} fileName - 저장될 파일명
 * @returns {Promise<Object>} - 업로드 결과
 */
const uploadBackupToR2 = async (filePath, fileName) => {
  try {
    if (!CLOUDFLARE_ACCESS_KEY_ID || !CLOUDFLARE_SECRET_KEY) {
      throw new Error('Cloudflare R2 설정 정보가 부족합니다.');
    }

    // 파일 읽기
    const fileContent = await fs.readFile(filePath);
    
    // R2에 업로드할 객체 정의
    const params = {
      Bucket: R2_PRIVATE_BUCKET_NAME,
      Key: fileName,
      Body: fileContent,
      ContentType: 'application/sql',
      CacheControl: 'private, no-cache', // 비공개 파일이므로 캐시 금지
    };
    
    // R2에 업로드
    const command = new PutObjectCommand(params);
    const response = await r2Client.send(command);
    
    return {
      success: true,
      data: response,
      key: fileName,
      message: '비공개 버킷에 업로드 완료'
    };
  } catch (error) {
    logger.error(error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * 데이터베이스 백업 라우터
 * POST /admin/infra/db-backup
 * 
 * @param {Object} req - 요청 객체
 * @param {Object} res - 응답 객체
 * @returns {Promise<void>}
 */
router.post('/', async (req, res) => {
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const backupFileName = `${timestamp}.sql`;
  const tempDir = path.join(__dirname, 'temp_backups');
  const backupFilePath = path.join(tempDir, backupFileName);

  try {
    const userid = req.user.userid;
    
    if (!userid) {
      return res.status(401).json({
        success: false,
        error: '인증이 필요합니다.',
        code: 'UNAUTHORIZED'
      });
    }

    // 임시 백업 디렉토리 생성
    await fs.mkdir(tempDir, { recursive: true });

    // mysqldump 명령어 생성
    const command = `mysqldump --user=${process.env.DB_USER} --password=${process.env.DB_PASS} --host=${process.env.DB_HOST} ${process.env.DB_NAME} > "${backupFilePath}"`;
    
    await execPromise(command);

    // R2 비공개 버킷에 업로드
    const uploadResult = await uploadBackupToR2(backupFilePath, backupFileName);

    if (!uploadResult.success) {
      throw new Error(`R2 업로드 실패: ${uploadResult.error}`);
    }

    // 성공 응답 전송
    return res.status(201).json({
      success: true,
      message: '데이터베이스 백업 및 비공개 버킷 업로드가 성공적으로 완료되었습니다.',
      backupFileName: uploadResult.key,
      bucket: R2_PRIVATE_BUCKET_NAME
    });

  } catch (error) {
    logger.error(error);
    
    return res.status(500).json({
      success: false,
      error: error.message || '데이터베이스 백업 중 오류가 발생했습니다.',
      code: 'DB_BACKUP_ERROR'
    });
  } finally {
    // 임시 파일 삭제
    try {
      if ((await fs.stat(backupFilePath)).isFile()) {
        await fs.unlink(backupFilePath);
      }
    } catch (cleanupError) {
      if (cleanupError.code !== 'ENOENT') {
        logger.error(cleanupError);
      }
    }
  }
});

export default router;
