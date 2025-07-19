import { generateGeminiWithImage } from '../ai_config/gemini.js';
import { getMainImageUrl } from '../db/img.js';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import os from 'os';
import crypto from 'crypto';

// 비동기 파일 작업을 위한 프로미스 기반 함수
const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);
const unlinkAsync = promisify(fs.unlink);

/**
 * URL에 프로토콜이 없는 경우 https://를 추가하는 함수
 * 
 * @param {string} url - 처리할 URL
 * @returns {string} - 프로토콜이 추가된 URL
 */
function ensureProtocol(url) {
  if (!url) return url;
  
  // URL이 //로 시작하면 https:를 추가
  if (url.startsWith('//')) {
    return `https:${url}`;
  }
  
  // URL이 http:// 또는 https://로 시작하지 않으면 https://를 추가
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  
  return url;
}

/**
 * 이미지 URL에서 데이터를 다운로드하고 base64로 인코딩하여 반환하는 함수
 * 
 * @param {string} imageUrl - 다운로드할 이미지 URL
 * @param {boolean} includePrefix - base64 문자열에 data:image/xxx;base64, 접두사 포함 여부 (기본값: false)
 * @returns {Promise<{base64: string, mimeType: string}>} - base64 인코딩된 이미지 데이터와 MIME 타입
 */
async function downloadImageAsBase64(imageUrl, includePrefix = false) {
  if (!imageUrl) {
    throw new Error('이미지 URL이 제공되지 않았습니다.');
  }

  // URL에 프로토콜 추가
  const processedUrl = ensureProtocol(imageUrl);

  try {
    // 임시 파일명 생성 (충돌 방지를 위한 랜덤 해시 추가)
    const tempDir = os.tmpdir();
    const randomHash = crypto.randomBytes(8).toString('hex');
    const tempFilePath = path.join(tempDir, `temp_image_${randomHash}`);

    // 이미지 다운로드
    const response = await axios({
      method: 'GET',
      url: processedUrl,
      responseType: 'arraybuffer',
      timeout: 30000, // 30초 타임아웃
    });

    // Content-Type에서 MIME 타입 추출
    const mimeType = response.headers['content-type'] || 'image/jpeg';
    
    // 이미지 데이터를 임시 파일에 저장
    await writeFileAsync(tempFilePath, response.data);
    
    // 임시 파일에서 데이터를 읽어 base64로 인코딩
    const imageBuffer = await readFileAsync(tempFilePath);
    const base64Data = imageBuffer.toString('base64');
    
    // 임시 파일 삭제
    await unlinkAsync(tempFilePath);
    
    // 요청에 따라 접두사 포함 여부 결정
    const result = includePrefix ? 
      `data:${mimeType};base64,${base64Data}` : 
      base64Data;
    
    return {
      base64: result,
      mimeType: mimeType
    };
  } catch (error) {
    console.error('이미지 다운로드 또는 변환 오류:', error.message);
    throw new Error(`이미지 다운로드 실패: ${error.message}`);
  }
}

/**
 * 이미지 기반 고급 키워드 생성 함수 - 핵심 로직만 포함
 * 
 * @param {string} promptData - 프롬프트 데이터 JSON 문자열
 * @param {number} productid - 상품 ID
 * @param {string} prompt - 시스템 프롬프트
 * @param {Object} schema - 응답 JSON 스키마
 * @returns {Promise<Array<string>>} 생성된 키워드 배열
 */
export async function generateImageBasedKeywords(promptData, productid, prompt, schema) {
  // 1. 상품 메인 이미지 URL 가져오기
  const imageUrl = await getMainImageUrl(productid);
  if (!imageUrl) {
    throw new Error('메인 이미지가 없어 고급 키워드 생성을 진행할 수 없습니다.');
  }
  
  // 2. 이미지를 base64로 다운로드
  const { base64: imageBase64, mimeType } = await downloadImageAsBase64(imageUrl);
  
  // 3. Gemini API 호출하여 이미지 기반 키워드 생성 요청
  const generatedKeywords = await generateGeminiWithImage(
    promptData,
    imageBase64, 
    mimeType,
    prompt,
    schema
  );
  
  return generatedKeywords;
}
