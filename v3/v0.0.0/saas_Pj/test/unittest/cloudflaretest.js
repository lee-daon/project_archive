import { uploadImage } from '../../backend/common/utils/img_hosting.js';
import dotenv from 'dotenv';
import fs from 'fs';

// 환경 변수 설정
dotenv.config();


/**
 * 이미지 업로드 테스트
 */
async function runTest() {
  try {
    // 업로드할 이미지 경로
    const imagePath = 'C:/Users/leeda/바탕 화면/test_img/resized_des_1745402166993/resized_2.jpg';
    
    // 파일 존재 확인
    if (!fs.existsSync(imagePath)) {
      console.error(`파일이 존재하지 않습니다: ${imagePath}`);
      return;
    }
    
    console.log('Cloudflare R2 이미지 업로드 테스트 시작...');
    console.log(`대상 파일: ${imagePath}`);
    console.log(`파일 크기: ${(fs.statSync(imagePath).size / 1024).toFixed(2)}KB`);

    // 이미지 업로드 (무한 캐시 옵션 사용)
    const subPath = 'test/images';
    const filename = null; // 원본 파일명 사용
    const infiniteCache = true; // 무한 캐시 사용
    const metadata = { 
      uploadType: 'test',
      description: 'test_image_upload'
    };
    
    const result = await uploadImage(imagePath, subPath, filename, infiniteCache, metadata);

    // 결과 출력
    if (result.success) {
      console.log('이미지 업로드 성공!');
      console.log(`이미지 URL: ${result.url}`);
      console.log(`이미지 키: ${result.key}`);
      console.log(`캐시 설정: ${result.cacheControl}`);
    } else {
      console.error('이미지 업로드 실패!');
      console.error(`오류 메시지: ${result.error}`);
    }
  } catch (error) {
    console.error('테스트 실행 중 오류 발생:', error);
  }
}

// 테스트 실행
runTest();
