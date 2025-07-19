import axios from 'axios';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import sharp from 'sharp';
import FormData from 'form-data';
import crypto from 'crypto';
import { getImageUrl, downloadImage, resizeAndPadImage, saveNukkiImage } from './download.js';
import { decreaseTaskCount } from './controlscStatus.js';
import { updateNukkiImageStatus } from './imageStatus.js';
import { uploadImage } from '../../../common/utils/img_hosting.js';

dotenv.config();

/**
 * 파일 삭제를 일정 시간 후에 실행하는 함수
 * @param {string} filePath - 삭제할 파일 경로
 * @param {number} delayMs - 지연 시간(ms)
 */
async function deleteFileWithDelay(filePath, delayMs = 1000) {
  try {
    if (!fs.existsSync(filePath)) return;
    
    // 지정된 시간 동안 대기
    await new Promise(resolve => setTimeout(resolve, delayMs));
    
    // 파일 삭제 시도
    await fs.promises.unlink(filePath);
  } catch (error) {
    console.warn(`파일 삭제 실패 (나중에 정리됨): ${filePath}`, error.message);
  }
}

/**
 * 누끼 이미지 처리 함수
 * @param {number} userId - 사용자 ID
 * @param {number} productId - 상품 ID
 * @param {number} imageOrder - 이미지 순서
 * @returns {Promise<Object>} 처리 결과
 */
export async function processNukki(userId, productId, imageOrder) {
  const tempDir = path.join(process.cwd(), 'temp');
  const nukkiDir = process.env.NUKKIES_DIR || path.join(process.cwd(), 'uploads', 'nukkies');
  
  // 임시 파일 경로
  const tempImagePath = path.join(tempDir, `${productId}_${imageOrder}_temp.jpg`);
  const resizedImagePath = path.join(tempDir, `${productId}_${imageOrder}_resized.jpg`);
  const outputFilePath = path.join(nukkiDir, `${productId}_${imageOrder}.png`);
  
  try {
    // 디렉토리 생성
    await fs.promises.mkdir(tempDir, { recursive: true });
    await fs.promises.mkdir(nukkiDir, { recursive: true });
    
    // 1. 이미지 URL 가져오기
    const imageUrl = await getImageUrl(productId, imageOrder);
    if (!imageUrl) {
      throw new Error(`상품 ID ${productId}의 ${imageOrder}번 이미지를 찾을 수 없습니다.`);
    }
    
    // 2. 이미지 다운로드
    await downloadImage(imageUrl, tempImagePath);
    
    // 3. 이미지 리사이징 (1000x1000px)
    await resizeAndPadImage(tempImagePath, resizedImagePath);
    
    // 4. 배경 제거 API 요청
    const imageStream = fs.createReadStream(resizedImagePath);
    const formData = new FormData();
    formData.append('image', imageStream);
    
    const options = {
      method: 'POST',
      url: 'https://ai-background-remover.p.rapidapi.com/image/matte/v1',
      headers: {
        'x-rapidapi-key': process.env.RAPID_API_KEY,
        'x-rapidapi-host': 'ai-background-remover.p.rapidapi.com',
        'Accept': 'image/png',
        ...formData.getHeaders()
      },
      responseType: 'arraybuffer',
      data: formData
    };
    
    console.log(`[${productId}] 누끼 API 요청 시작`);
    const response = await axios.request(options);
    console.log(`[${productId}] 누끼 API 응답 수신 완료`);
    
    // 투명 배경 이미지 (임시 저장)
    const transparentImagePath = path.join(tempDir, `${productId}_${imageOrder}_transparent.png`);
    await fs.promises.writeFile(transparentImagePath, Buffer.from(response.data));
    
    // 5. 흰색 배경 적용
    await sharp(transparentImagePath)
      .flatten({ background: { r: 255, g: 255, b: 255 } })
      .toFile(outputFilePath);
    
    // 6. Cloudflare R2에 이미지 업로드
    const randomSuffix = crypto.randomBytes(4).toString('hex');
    const filename = `${imageOrder}_${randomSuffix}.png`;
    const uploadResult = await uploadImage(
      outputFilePath,
      `nukkies/${productId}`,
      filename,
      true, // 무한 캐시 여부
      { productId: productId.toString(), imageOrder: imageOrder.toString() }
    );
    
    if (!uploadResult.success) {
      throw new Error(`이미지 업로드 실패: ${uploadResult.error}`);
    }
    
    // 7. DB에 누끼 이미지 URL 저장
    const saveResult = await saveNukkiImage(productId, imageOrder, uploadResult.url);
    
    // 8. 이미지 소유권 업데이트
    await updateNukkiImageStatus(userId, productId);
    
    // 9. 작업 상태 업데이트
    await decreaseTaskCount(userId, productId);
    
    // 10. 임시 파일 삭제 (지연 삭제로 변경)
    deleteFileWithDelay(tempImagePath, 2000);
    deleteFileWithDelay(resizedImagePath, 2000);
    deleteFileWithDelay(transparentImagePath, 2000);
    deleteFileWithDelay(outputFilePath, 2000); // 로컬 출력 파일도 삭제
    
    return {
      success: true,
      userId,
      productId,
      imageOrder,
      imageUrl: uploadResult.url // 호스팅된 URL 반환
    };
  } catch (error) {
    console.error(`[${productId}] 누끼 처리 중 오류:`, error);
    
    // 작업 실패해도 카운트는 감소
    try {
      await decreaseTaskCount(userId, productId);
    } catch (countError) {
      console.error(`[${productId}] 작업 카운트 감소 중 오류:`, countError);
    }
    
    // 임시 파일 정리 시도 (지연 삭제로 변경)
    if (fs.existsSync(tempImagePath)) deleteFileWithDelay(tempImagePath, 2000);
    if (fs.existsSync(resizedImagePath)) deleteFileWithDelay(resizedImagePath, 2000);
    if (fs.existsSync(outputFilePath)) deleteFileWithDelay(outputFilePath, 2000);
    
    return {
      success: false,
      userId,
      productId,
      imageOrder,
      error: error.message
    };
  }
} 