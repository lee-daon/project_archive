import axios from 'axios';
import fs from 'fs';
import path from 'path';
import tmp from 'tmp';

/**
 * 단일 이미지를 다운로드하여 지정한 파일 경로에 저장하는 함수
 * @param {string} url - 다운로드할 이미지 URL
 * @param {string} filePath - 저장할 파일 경로
 * @returns {Promise<string>} - 저장 완료된 파일 경로
 */
async function downloadImage(url, filePath) {
  // URL이 //로 시작하면 https: 추가
  const fullUrl = url.startsWith('//') ? `https:${url}` : url;
  
  const writer = fs.createWriteStream(filePath);
  const response = await axios({
    url: fullUrl,
    method: 'GET',
    responseType: 'stream'
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', () => resolve(filePath));
    writer.on('error', reject);
  });
}

/**
 * 주어진 상품의 이미지 URL 목록을 임시 디렉토리에 다운로드하는 함수
 * @param {string} productId - 상품을 식별할 고유 ID
 * @param {Array<string>} imageUrls - 해당 상품의 이미지 URL 배열 (순서 보장)
 * @returns {Promise<Object>} - { tmpDir, downloadedPaths }
 *                                tmpDir: 임시 디렉토리 객체 (나중에 cleanup() 호출로 삭제 가능)
 *                                downloadedPaths: 다운로드된 이미지 파일 경로 배열 (입력 순서 유지)
 */
async function downloadImagesForProduct(productId, imageUrls) {
  // 상품ID를 prefix로 하여 고유 임시 디렉토리 생성
  const tmpDir = tmp.dirSync({ prefix: `product_${productId}_`, unsafeCleanup: true });
  const downloadedPaths = [];

  try {
    const downloadPromises = imageUrls.map(async (url, index) => {
      if (!url) return null; // URL이 없는 경우 스킵
      
      // URL에서 파일명 추출 및 쿼리스트링/해시 제거
      let urlPath = new URL(url.startsWith('//') ? `https:${url}` : url).pathname;
      const urlFileName = urlPath.split('/').pop();
      
      // 확장자 추출 (URL에서 추출 안되면 .jpg 기본값)
      let ext = path.extname(urlFileName) || '.jpg';
      
      // 확장자가 쿼리스트링을 포함하고 있으면 정리
      if (ext.includes('?')) {
        ext = ext.split('?')[0];
      }
      
      // 순서를 반영한 파일명 생성 (예: image_1.jpg, image_2.jpg, ...)
      const fileName = `image_${index + 1}${ext}`;
      const filePath = path.join(tmpDir.name, fileName);
      
      try {
        const downloadedPath = await downloadImage(url, filePath);
        return downloadedPath;
      } catch (error) {
        console.error(`이미지 다운로드 실패: ${url}`, error.message);
        return null; // 오류가 발생해도 전체 프로세스는 계속
      }
    });
    
    const results = await Promise.all(downloadPromises);
    // null 값 필터링
    downloadedPaths.push(...results.filter(path => path !== null));
  } catch (error) {
    console.error('이미지 다운로드 중 오류 발생:', error);
    // 오류 발생 시 임시 디렉토리 정리
    tmpDir.cleanup();
    throw error;
  }
  
  // 다운로드된 이미지가 없으면 경고
  if (downloadedPaths.length === 0) {
    console.warn(`상품 ID ${productId}에 대해 다운로드된 이미지가 없습니다.`);
  }
  
  return { tmpDir, downloadedPaths };
}

export { downloadImagesForProduct, downloadImage };
