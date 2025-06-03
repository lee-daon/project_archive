import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

// .env 파일에서 환경변수 로드
dotenv.config();

// AWS S3 클라이언트 설정 (SDK v3)
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

/**
 * 이미지 배열을 S3에 업로드하고 호스팅된 URL 배열을 반환하는 함수
 * @param {string[]} imagePaths - 업로드할 이미지 파일 경로 배열
 * @returns {Promise<{images: string[]}>} 호스팅된 이미지 URL 배열
 */
const uploadImagesToS3 = async (imagePaths) => {
  try {
    const uploadPromises = imagePaths.map(async (imagePath) => {
      // 파일 확장자 추출
      const fileExtension = path.extname(imagePath);
      const fileName = `${uuidv4()}${fileExtension}`;
      
      // 파일 읽기
      const fileContent = fs.readFileSync(imagePath);
      
      // S3 업로드 파라미터
      const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: `uploads/${fileName}`,
        Body: fileContent,
        ContentType: `image/${fileExtension.substring(1)}`,
      };
      
      // S3에 업로드 (SDK v3)
      await s3Client.send(new PutObjectCommand(params));
      
      // S3 URL 생성
      return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/uploads/${fileName}`;
    });
    
    // 모든 업로드 완료 대기
    const uploadedUrls = await Promise.all(uploadPromises);
    
    // 지정된 형식으로 반환
    return {
      images: uploadedUrls
    };
  } catch (error) {
    console.error('이미지 업로드 오류:', error);
    throw error;
  }
};
/*
// 테스트 코드
async function test() {
  try {
    // 업로드할 이미지 파일 경로 배열
    const imagePaths = [
      'C:/Users/leeda/programing/item_images/translated/14971809051/raw_1.jpg',
      'C:/Users/leeda/programing/item_images/translated/14971809051/raw_2.jpg',
      'C:/Users/leeda/programing/item_images/translated/14971809051/raw_3.jpg',
      'C:/Users/leeda/programing/item_images/translated/14971809051/raw_4.jpg'
    ];
    
    const result = await uploadImagesToS3(imagePaths);
    console.log('업로드 결과:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('오류 발생:', error);
  }
}

// 테스트 실행 (필요시 주석 해제)
test();*/

export { uploadImagesToS3 };
