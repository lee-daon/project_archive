import fs from 'fs';
import path from 'path';
import { 
  S3Client, 
  PutObjectCommand, 
  CopyObjectCommand
} from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import logger from './logger.js';
dotenv.config();

// Cloudflare R2 설정
const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_DOMAIN = process.env.R2_DOMAIN;
const CLOUDFLARE_ACCESS_KEY_ID = process.env.CLOUDFLARE_ID;
const CLOUDFLARE_SECRET_KEY = process.env.CLOUDFLARE_SECRET_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

// 캐시 설정
const CACHE_CONTROL_INFINITE = 'public, max-age=31536000, immutable'; // 무한 캐시 (1년 + immutable)
const CACHE_CONTROL_NORMAL = 'public, max-age=86400'; // 일반 캐시 (1일)
const DEFAULT_PATH = 'images'; // 기본 이미지 저장 경로

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
 * Content-Type 결정
 * @param {string} fileExt - 파일 확장자
 * @returns {string} - Content-Type
 */
const getContentType = (fileExt) => {
  if (['.jpg', '.jpeg'].includes(fileExt)) return 'image/jpeg';
  if (fileExt === '.png') return 'image/png';
  if (fileExt === '.gif') return 'image/gif';
  if (fileExt === '.webp') return 'image/webp';
  return 'application/octet-stream';
};

/**
 * 경로를 정규화하여 반환
 * @param {string} filePath - 정규화할 경로
 * @returns {string} - 정규화된 경로
 */
const normalizePath = (filePath) => {
  if (!filePath) return DEFAULT_PATH;
  
  // 경로 정규화
  let normalizedPath = filePath.trim();
  
  // 앞뒤 슬래시 제거
  normalizedPath = normalizedPath.replace(/^\/+|\/+$/g, '');
  
  return normalizedPath || DEFAULT_PATH;
};

/**
 * 이미지를 Cloudflare R2에 업로드
 * @param {string} imagePath - 업로드할 이미지 파일 경로
 * @param {string} subPath - 저장할 하위 경로 (예: 'users/profiles')
 * @param {string} filename - 저장될 파일명 (지정하지 않으면 원본 파일명 사용)
 * @param {boolean} infiniteCache - 무한 캐시 사용 여부 (기본값: true)
 * @param {Object} metadata - 추가 메타데이터
 * @returns {Promise<Object>} - 업로드 결과 객체
 */
const uploadImage = async (
  imagePath, 
  subPath = DEFAULT_PATH, 
  filename = null, 
  infiniteCache = true, 
  metadata = {}
) => {
  try {
    if (!CLOUDFLARE_ACCESS_KEY_ID || !CLOUDFLARE_SECRET_KEY) {
      throw new Error('Cloudflare R2 설정 정보가 부족합니다.');
    }

    // 파일 읽기
    const fileContent = fs.readFileSync(imagePath);
    
    // 파일명 설정
    const finalFilename = filename || path.basename(imagePath);
    
    // 파일 확장자와 Content-Type 지정
    const fileExt = path.extname(finalFilename).toLowerCase();
    const contentType = getContentType(fileExt);
    
    // 저장 경로 설정
    const normalizedPath = normalizePath(subPath);
    
    // 고유한 키 생성
    const timestamp = Date.now();
    const key = `${normalizedPath}/${timestamp}-${finalFilename}`;
    
    // 캐시 설정
    const cacheControl = infiniteCache ? CACHE_CONTROL_INFINITE : CACHE_CONTROL_NORMAL;
    
    // R2에 업로드할 객체 정의
    const params = {
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: fileContent,
      ContentType: contentType,
      CacheControl: cacheControl,
      Metadata: metadata
    };
    
    // R2에 업로드
    const command = new PutObjectCommand(params);
    const response = await r2Client.send(command);
    
    // 파일 URL 구성 (공개 도메인 사용)
    const fileUrl = `${R2_DOMAIN}/${key}`;
    
    return {
      success: true,
      data: response,
      key,
      url: fileUrl,
      cacheControl
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
 * Buffer를 사용하여 이미지를 Cloudflare R2에 업로드
 * @param {Buffer} buffer - 업로드할 이미지 Buffer
 * @param {string} originalName - 원본 파일명
 * @param {string} subPath - 저장할 하위 경로 (예: 'users/profiles')
 * @param {string} filename - 저장될 파일명 (지정하지 않으면 원본 파일명 사용)
 * @param {boolean} infiniteCache - 무한 캐시 사용 여부 (기본값: true)
 * @param {Object} metadata - 추가 메타데이터
 * @returns {Promise<Object>} - 업로드 결과 객체
 */
const uploadImageFromBuffer = async (
  buffer,
  originalName,
  subPath = DEFAULT_PATH, 
  filename = null, 
  infiniteCache = true, 
  metadata = {}
) => {
  try {
    if (!CLOUDFLARE_ACCESS_KEY_ID || !CLOUDFLARE_SECRET_KEY) {
      throw new Error('Cloudflare R2 설정 정보가 부족합니다.');
    }

    // 파일명 설정
    const finalFilename = filename || originalName;
    
    // 파일 확장자와 Content-Type 지정
    const fileExt = path.extname(finalFilename).toLowerCase();
    const contentType = getContentType(fileExt);
    
    // 저장 경로 설정
    const normalizedPath = normalizePath(subPath);
    
    // 고유한 키 생성
    const timestamp = Date.now();
    const key = `${normalizedPath}/${timestamp}-${finalFilename}`;
    
    // 캐시 설정
    const cacheControl = infiniteCache ? CACHE_CONTROL_INFINITE : CACHE_CONTROL_NORMAL;
    
    // R2에 업로드할 객체 정의
    const params = {
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: cacheControl,
      Metadata: metadata
    };
    
    // R2에 업로드
    const command = new PutObjectCommand(params);
    const response = await r2Client.send(command);
    
    // 파일 URL 구성 (공개 도메인 사용)
    const fileUrl = `${R2_DOMAIN}/${key}`;
    
    return {
      success: true,
      data: response,
      key,
      url: fileUrl,
      cacheControl
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
 * Cloudflare R2에서 이미지를 복사
 * @param {string} sourceUrl - 원본 이미지 URL
 * @param {string} newSubPath - 새로운 저장 경로
 * @param {string} newFilename - 새로운 파일명 (선택사항)
 * @param {Object} metadata - 추가 메타데이터
 * @returns {Promise<Object>} - 복사 결과 객체
 */
const copyObject = async (sourceUrl, newSubPath, newFilename = null, metadata = {}) => {
  try {
    if (!CLOUDFLARE_ACCESS_KEY_ID || !CLOUDFLARE_SECRET_KEY) {
      throw new Error('Cloudflare R2 설정 정보가 부족합니다.');
    }

    // URL에서 키 추출
    const sourceKey = sourceUrl.replace(`${R2_DOMAIN}/`, '');
    
    // 새로운 파일명 생성
    const originalFilename = path.basename(sourceKey);
    const finalFilename = newFilename || originalFilename;
    
    // 파일 확장자와 Content-Type 지정
    const fileExt = path.extname(finalFilename).toLowerCase();
    const contentType = getContentType(fileExt);
    
    // 저장 경로 설정
    const normalizedPath = normalizePath(newSubPath);
    
    // 고유한 키 생성
    const timestamp = Date.now();
    const newKey = `${normalizedPath}/${timestamp}-${finalFilename}`;
    
    // 복사 명령 생성
    const copyParams = {
      Bucket: R2_BUCKET_NAME,
      CopySource: `${R2_BUCKET_NAME}/${sourceKey}`,
      Key: newKey,
      ContentType: contentType,
      CacheControl: CACHE_CONTROL_INFINITE,
      Metadata: metadata,
      MetadataDirective: 'REPLACE'
    };
    
    const copyCommand = new CopyObjectCommand(copyParams);
    const response = await r2Client.send(copyCommand);
    
    // 새로운 파일 URL 구성
    const newFileUrl = `${R2_DOMAIN}/${newKey}`;
    
    return {
      success: true,
      data: response,
      sourceKey,
      newKey,
      url: newFileUrl,
      originalUrl: sourceUrl
    };
  } catch (error) {
    logger.error(error);
    return {
      success: false,
      error: error.message,
      originalUrl: sourceUrl
    };
  }
};

export { uploadImage, uploadImageFromBuffer, copyObject };
