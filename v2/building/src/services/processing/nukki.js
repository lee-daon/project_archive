import { getSpecificRawImage, saveNukkiImage } from '../../db/processing/getNsaveImages.js';
import { downloadImage } from '../image_translation/downloadImages.js';
import { resizeRawImages } from '../image_translation/mergeimage.js';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import FormData from 'form-data';
import sharp from 'sharp';
import pLimit from 'p-limit';

dotenv.config();

/**
 * 특정 상품의 특정 순서 이미지를 가져와 배경을 제거하고 저장하는 함수
 * @param {string} productId - 상품 ID
 * @param {number} order - 이미지 순서
 * @param {boolean} whiteBackground - 배경을 흰색으로 설정할지 여부 (기본값: true - 흰색색 배경)
 * @returns {Promise<Object>} - 처리 결과
 */
async function processNukkiImage(productId, order, whiteBackground = true) {
  try {
    // 1. getSpecificRawImage 함수로 이미지 URL 가져오기
    const imageUrl = await getSpecificRawImage(productId, order);
    if (!imageUrl) {
      return { success: false, message: `상품 ID ${productId}의 ${order}번 이미지를 찾을 수 없습니다.` };
    }

    // 2. 이미지 다운로드 (임시 파일로)
    const tempFilePath = path.join(process.cwd(), 'temp', `${productId}_temp.jpg`);
    
    // 임시 디렉토리 생성
    await fs.promises.mkdir(path.dirname(tempFilePath), { recursive: true });
    
    await downloadImage(imageUrl, tempFilePath);

    // 3. resizeRawImages 함수 사용을 위한 객체 준비
    const rawResult = {
      tmpDir: { name: path.dirname(tempFilePath) },
      downloadedPaths: [tempFilePath]
    };

    // 4. 이미지 리사이징
    const resizedResult = await resizeRawImages(rawResult);
    const resizedImagePath = resizedResult.resizedPaths[0];

    // 5. 배경 제거 API 호출 - 바이너리 응답 요청
    const imageStream = fs.createReadStream(resizedImagePath);
    const formData = new FormData();
    formData.append('image', imageStream);

    const options = {
      method: 'POST',
      url: 'https://ai-background-remover.p.rapidapi.com/image/matte/v1',
      headers: {
        'x-rapidapi-key': process.env.RAPID_API_KEY,
        'x-rapidapi-host': 'ai-background-remover.p.rapidapi.com',
        'Accept': 'image/png', // PNG 이미지 직접 요청
        ...formData.getHeaders()
      },
      responseType: 'arraybuffer', // 바이너리 응답 요청
      data: formData
    };

    console.log('API 요청 보내는 중...');
    const response = await axios.request(options);
    //console.log('API 응답 받음');
    
    // 6. 결과 이미지 저장
    const nukkiesDir = process.env.NUKKIES_DIR 
    
    // 저장 디렉토리 생성
    await fs.promises.mkdir(nukkiesDir, { recursive: true });
    
    const outputFilePath = path.join(nukkiesDir, `${productId}.png`);
    
    // 투명 배경 이미지 저장 (임시)
    const transparentImagePath = path.join(path.dirname(tempFilePath), `${productId}_transparent.png`);
    await fs.promises.writeFile(transparentImagePath, Buffer.from(response.data));
    
    // 배경색 처리
    if (whiteBackground) {
      // 흰색 배경 적용
      await sharp(transparentImagePath)
        .flatten({ background: { r: 255, g: 255, b: 255 } }) // 투명 영역을 흰색으로 설정
        .toFile(outputFilePath);
        
      //console.log('흰색 배경이 적용된 이미지가 저장되었습니다.');
    } else {
      // 투명 배경 유지
      await fs.promises.copyFile(transparentImagePath, outputFilePath);
    }
    
    // 임시 투명 배경 이미지 삭제
    try {
      await fs.promises.unlink(transparentImagePath);
    } catch (err) {
      console.warn('임시 투명 이미지 삭제 중 오류:', err.message);
    }

    // 7. DB에 누끼 이미지 경로 저장
    const dbResult = await saveNukkiImage(productId, outputFilePath);

    // 8. 임시 파일 삭제
    try {
      await fs.promises.unlink(tempFilePath);
      await fs.promises.unlink(resizedImagePath);
    } catch (cleanupError) {
      console.warn('임시 파일 정리 중 오류:', cleanupError.message);
    }

    return {
      success: true,
      productId,
      imagePath: outputFilePath,
      whiteBackground,
      dbResult
    };
  } catch (error) {
    console.error('누끼 처리 중 오류 발생:', error);
    if (error.response) {
      console.error('API 응답 오류:', error.response.status);
      // 바이너리 응답이면 내용을 로깅하지 않음
      if (error.response.data && !(error.response.data instanceof ArrayBuffer)) {
        console.error('API 응답 데이터:', JSON.stringify(error.response.data, null, 2));
      }
    }
    return {
      success: false,
      message: error.message,
      error
    };
  }
}

/**
 * 주어진 productIds 배열에 대해 processNukkiImage 함수를 0.2초 간격으로 실행하며,
 * 동시에 최대 10개의 작업만 병렬적으로 실행합니다.
 * @param {string[]} productIds - 상품 ID 배열
 * @param {number} order - 이미지 순서 (기본값: 1)
 * @param {boolean} whiteBackground - 배경 처리 옵션 (기본값: true)
 * @returns {Promise<Object[]>} - 각 작업 결과들의 배열
 */
async function processNukkiImages(productIds, order = 0, whiteBackground = true) {
  const limit = pLimit(10);
  const results = [];
  
  for (let i = 0; i < productIds.length; i++) {
    await new Promise(resolve => setTimeout(resolve, 200));
    results.push(limit(() => processNukkiImage(productIds[i], order, whiteBackground)));
  }
  
  return await Promise.all(results);
}

export { processNukkiImage, processNukkiImages };
