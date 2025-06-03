import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import path from 'path';
import dotenv from 'dotenv';
import { generateSignature, getAuthToken } from './naver_auth.js';

dotenv.config();

/**
 * 네이버 커머스 API - 이미지 업로드 함수
 * 로컬 컴퓨터에 저장된 이미지 파일들을 네이버 커머스 API에 업로드합니다.
 * 
 * @param {string[]} imagePaths - 업로드할 이미지 파일 경로 배열
 * @returns {Promise<Object>} - API 응답 결과
 */
async function uploadImages(imagePaths) {
  try {
    // 파일 개수 제한 체크
    if (imagePaths.length > 10) {
      throw new Error('이미지는 최대 10개까지만 업로드할 수 있습니다.');
    }
    
    // 환경 변수에서 인증 정보 가져오기
    const CLIENT_ID = process.env.NAVER_CLIENT_ID;
    const CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;
    
    // 타임스탬프 생성
    const timestamp = Date.now();
    
    // 전자서명 생성
    const signature = generateSignature(CLIENT_ID, CLIENT_SECRET, timestamp);
    
    // 인증 토큰 발급 요청
    const tokenData = await getAuthToken(CLIENT_ID, signature, 'SELF', '', timestamp);
    const accessToken = tokenData.access_token;
    
    // FormData 생성
    const formData = new FormData();
    
    // 파일 정보 확인 및 FormData에 추가
    for (let i = 0; i < imagePaths.length; i++) {
      const imagePath = imagePaths[i];
      
      // 파일 존재 여부 확인
      if (!fs.existsSync(imagePath)) {
        throw new Error(`이미지 파일이 존재하지 않습니다: ${imagePath}`);
      }
      
      // 파일 확장자 확인
      const ext = path.extname(imagePath).toLowerCase();
      const validExtensions = ['.jpg', '.jpeg', '.gif', '.png', '.bmp'];
      
      if (!validExtensions.includes(ext)) {
        throw new Error(`지원하지 않는 이미지 형식입니다: ${ext}. 지원하는 형식: JPG, GIF, PNG, BMP`);
      }
      
      // 파일 이름 추출
      const fileName = path.basename(imagePath);
      
      // FormData에 파일 추가
      const fileContent = fs.readFileSync(imagePath);
      formData.append('imageFiles', fileContent, {
        filename: fileName,
        contentType: getContentType(ext)
      });
    }
    
    // API 요청 설정
    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://api.commerce.naver.com/external/v1/product-images/upload',
      headers: { 
        ...formData.getHeaders(),
        'Accept': 'application/json;charset=UTF-8', 
        'Authorization': `Bearer ${accessToken}`
      },
      data: formData
    };
    
    // API 요청 실행
    const response = await axios.request(config);
    
    // 응답 데이터 반환
    return response.data;
  } catch (error) {
    throw error;
  }
}

/**
 * 파일 확장자에 따른 Content-Type 반환
 * @param {string} extension - 파일 확장자 (.jpg, .png 등)
 * @returns {string} - MIME 타입
 */
function getContentType(extension) {
  switch (extension.toLowerCase()) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.gif':
      return 'image/gif';
    case '.bmp':
      return 'image/bmp';
    default:
      return 'application/octet-stream';
  }
}

export default uploadImages;
