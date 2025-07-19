import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import axios from 'axios';
import { promisePool } from '../../../common/utils/connectDB.js';

/**
 * 상품 ID와 이미지 순서로 원본 이미지 URL 가져오기
 * @param {number} productId - 상품 ID
 * @param {number} imageOrder - 이미지 순서 
 * @returns {Promise<string|null>} 이미지 URL 또는 null
 */
export async function getImageUrl(productId, imageOrder) {
  try {
    const [rows] = await promisePool.execute(
      'SELECT imageurl FROM item_images_raw WHERE productid = ? AND imageorder = ?',
      [productId, imageOrder]
    );
    
    if (rows.length > 0) {
      let imageUrl = rows[0].imageurl;
      
      // URL이 //로 시작하면 https: 추가
      if (imageUrl && imageUrl.startsWith('//')) {
        imageUrl = 'https:' + imageUrl;
      }
      
      return imageUrl;
    }
    return null;
  } catch (error) {
    console.error('이미지 URL 조회 중 오류:', error);
    throw error;
  }
}

/**
 * 이미지 다운로드 함수
 * @param {string} url - 다운로드할 이미지 URL
 * @param {string} outputPath - 저장할 경로
 * @returns {Promise<string>} 저장된 파일 경로
 */
export async function downloadImage(url, outputPath) {
  try {
    // URL이 //로 시작하면 https: 추가
    if (url.startsWith('//')) {
      url = 'https:' + url;
    }
    
    // 디렉토리 생성
    await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
    
    // 이미지 다운로드
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    await fs.promises.writeFile(outputPath, Buffer.from(response.data));
    
    return outputPath;
  } catch (error) {
    console.error('이미지 다운로드 중 오류:', error);
    throw error;
  }
}

/**
 * 이미지 리사이징 및 1000x1000px 정사각형으로 변환
 * @param {string} inputPath - 입력 이미지 경로
 * @param {string} outputPath - 출력 이미지 경로
 * @returns {Promise<string>} 처리된 이미지 경로
 */
export async function resizeAndPadImage(inputPath, outputPath) {
  try {
    // 이미지 리사이징 및 1000x1000px 정사각형으로 변환 (비율 무시)
    await sharp(inputPath)
      .resize(1000, 1000, { fit: 'fill' }) // 'fill' 옵션으로 비율 무시하고 채움
      .toFile(outputPath);
    
    return outputPath;
  } catch (error) {
    console.error('이미지 리사이징 중 오류:', error);
    throw error;
  }
}

/**
 * 누끼 이미지 결과를 데이터베이스에 저장
 * @param {number} productId - 상품 ID
 * @param {number} imageOrder - 이미지 순서
 * @param {string} imageUrl - 저장된 이미지 경로 또는 URL
 * @returns {Promise<Object>} 저장 결과
 */
export async function saveNukkiImage(productId, imageOrder, imageUrl) {
  try {
    // 기존 데이터 확인
    const [existingRows] = await promisePool.execute(
      'SELECT * FROM nukki_image WHERE productid = ? AND image_order = ?',
      [productId, imageOrder]
    );
    
    let result;
    if (existingRows.length > 0) {
      // 업데이트
      [result] = await promisePool.execute(
        'UPDATE nukki_image SET image_url = ? WHERE productid = ? AND image_order = ?',
        [imageUrl, productId, imageOrder]
      );
    } else {
      // 삽입
      [result] = await promisePool.execute(
        'INSERT INTO nukki_image (productid, image_url, image_order) VALUES (?, ?, ?)',
        [productId, imageUrl, imageOrder]
      );
    }
    
    return {
      success: true,
      productId,
      imageUrl,
      affectedRows: result.affectedRows
    };
  } catch (error) {
    console.error('누끼 이미지 저장 중 오류:', error);
    throw error;
  }
}
