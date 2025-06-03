import { downloadImagesForProduct } from '../image_translation/downloadImages.js';
import { resizeRawImages } from '../image_translation/mergeimage.js';
import { translateImage } from '../image_translation/imageTranslateApi.js';
import { getSkuImageUrls, saveTranslatedSkuImagePath } from '../../db/processing/getNsaveImages.js';
import fs from 'fs';
import path from 'path';
import pLimit from 'p-limit';
import dotenv from 'dotenv';
import sharp from 'sharp';
import { tmpdir } from 'os';

dotenv.config();

// 상수 정의
const SAVE_BASE_PATH = process.env.SAVE_BASE_PATH_option;
console.log(`SAVE_BASE_PATH: ${SAVE_BASE_PATH}`); // 환경 변수 값 출력

/**
 * 여러 SKU 이미지를 세로로 합치기
 * @param {Array<string>} imagePaths - 이미지 경로 배열
 * @returns {Promise<Object>} - 처리된 이미지 결과
 */
async function mergeSkuImages(imagePaths) {
  // 각 이미지의 메타데이터(높이) 정보 가져오기
  const imageMetadata = await Promise.all(
    imagePaths.map(path => sharp(path).metadata())
  );
  
  // 전체 높이 계산
  const totalHeight = imageMetadata.reduce((sum, meta) => sum + meta.height, 0);
  const maxWidth = Math.max(...imageMetadata.map(meta => meta.width));
  
  // 이미지 합치기를 위한 설정
  const compositeOperations = [];
  let currentY = 0;
  
  for (let i = 0; i < imagePaths.length; i++) {
    compositeOperations.push({
      input: imagePaths[i],
      top: currentY,
      left: 0
    });
    currentY += imageMetadata[i].height;
  }
  
  // 결과 이미지 저장할 디렉토리 생성
  const outputDir = path.join(tmpdir(), `merged_sku_${Date.now()}`);
  await fs.promises.mkdir(outputDir, { recursive: true });
  
  // 병합된 이미지 생성
  const mergedImagePath = path.join(outputDir, 'merged.jpg');
  await sharp({
    create: {
      width: maxWidth,
      height: totalHeight,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
    .composite(compositeOperations)
    .jpeg()
    .toFile(mergedImagePath);
  
  return { 
    outputDir, 
    mergedImagePath,
    originalHeight: totalHeight,
    originalWidths: imageMetadata.map(meta => meta.width),
    originalHeights: imageMetadata.map(meta => meta.height)
  };
}

/**
 * 번역된 하나의 이미지를 원래 이미지 크기대로 다시 분할
 * @param {string} translatedImagePath - 번역된 이미지 경로
 * @param {Array<number>} originalHeights - 원본 이미지들의 높이 배열
 * @param {string} outputBasePath - 출력할 기본 경로
 * @param {string} productId - 상품 ID
 * @param {Array<string>} propPaths - 속성 경로 배열
 * @returns {Promise<Array<Object>>} - 분할된 이미지 정보
 */
async function splitTranslatedImage(
  translatedImagePath, 
  originalHeights,
  outputBasePath, 
  productId,
  propPaths
) {
  // 결과 이미지 저장할 디렉토리 생성
  let outputDir;
  
  if (outputBasePath && productId) {
    // 지정된 경로에 상품 ID 폴더 생성
    outputDir = path.join(outputBasePath, productId);
    await fs.promises.mkdir(outputDir, { recursive: true });
    console.log(`이미지 저장 경로: ${outputDir}`); // 저장 경로 출력
  } else {
    // 임시 디렉토리 사용
    outputDir = path.join(tmpdir(), `split_sku_${Date.now()}`);
    await fs.promises.mkdir(outputDir, { recursive: true });
  }
  
  const splitResults = [];
  let currentY = 0;
  
  // 각 원본 이미지 높이에 맞게 번역된 이미지 분할
  for (let i = 0; i < originalHeights.length; i++) {
    const height = originalHeights[i];
    const propPath = propPaths[i];
    
    // 파일명 생성 방식 변경 - 콜론(:)과 같은 특수문자 제거 및 파일 시스템에 안전한 이름으로 변경
    const safeFileName = `option_${i+1}_${propPath.replace(/[:\/]/g, '_').replace(/[^a-zA-Z0-9_-]/g, '')}.jpg`;
    const outputPath = path.join(outputDir, safeFileName);
    
    console.log(`분할 이미지 저장: ${outputPath}, propPath: ${propPath}`); // 디버그용 로그
    
    try {
      await sharp(translatedImagePath)
        .extract({ 
          left: 0, 
          top: currentY, 
          width: 1000, // 리사이즈된 너비
          height: height 
        })
        .toFile(outputPath);
      
      splitResults.push({
        propPath: propPath,
        imagePath: outputPath
      });
      
      currentY += height;
    } catch (error) {
      console.error(`이미지 분할 오류 (${propPath}):`, error.message);
    }
  }
  
  return {
    outputDir,
    splitResults
  };
}

/**
 * 단일 상품의 SKU 이미지를 처리하는 함수
 * @param {string} productId - 상품의 고유 ID
 * @returns {Promise<Object>} - 처리 결과
 */
async function processOneProduct(productId) {
  // 임시 디렉토리 변수 선언
  let downloadResult = null;
  let resizedResult = null;
  let mergedResult = null;
  
  try {
    // 1. DB에서 SKU 이미지 URL 조회
    const skuImages = await getSkuImageUrls(productId);
    
    if (skuImages.length === 0) {
      console.log(`상품 ID ${productId}의 SKU 이미지가 없습니다.`);
      return { success: false, productId, error: 'SKU 이미지 없음' };
    }
    
    if (skuImages.length >= 10) {
      console.log(`상품 ID ${productId}의 SKU 이미지가 ${skuImages.length}개로 10개 이상입니다. 처리를 건너뜁니다.`);
      return { success: false, productId, error: 'SKU 이미지 개수 초과 (10개 이상)', imageCount: skuImages.length };
    }
    
    console.log(`상품 ID ${productId}의 SKU 이미지 ${skuImages.length}개 조회 완료`);
    
    // 2. 이미지 다운로드
    const imageUrls = skuImages.map(img => img.image_url).filter(url => url && url.trim() !== '');
    
    if (imageUrls.length === 0) {
      console.log(`상품 ID ${productId}의 유효한 SKU 이미지 URL이 없습니다.`);
      return { success: false, productId, error: '유효한 SKU 이미지 URL 없음' };
    }
    
    downloadResult = await downloadImagesForProduct(productId, imageUrls);
    
    // 3. 이미지 리사이징 (1000x1000)
    resizedResult = await resizeRawImages(downloadResult);
    
    // 4. 리사이징된 이미지 세로로 병합
    mergedResult = await mergeSkuImages(resizedResult.resizedPaths);
    
    // 5. 이미지 번역
    const translatedImagePath = path.join(mergedResult.outputDir, 'translated.png');
    await translateImage(mergedResult.mergedImagePath, 'ko', 'noto', false, translatedImagePath);
    
    // 6. 번역된 이미지를 원래 크기대로 다시 분할
    const propPaths = skuImages.map(img => img.prop_path);
    const splitResult = await splitTranslatedImage(
      translatedImagePath,
      mergedResult.originalHeights,
      SAVE_BASE_PATH,
      productId,
      propPaths
    );
    
    // 7. DB에 번역된 이미지 경로 저장
    let successCount = 0;
    for (const split of splitResult.splitResults) {
      const saved = await saveTranslatedSkuImagePath(
        productId,
        split.propPath,
        split.imagePath
      );
      if (saved) successCount++;
    }
    
    console.log(`상품 ID ${productId}의 SKU 이미지 번역 완료 (${successCount}/${splitResult.splitResults.length})`);
    
    return {
      success: true,
      productId,
      imageCount: skuImages.length,
      savedCount: successCount
    };
  } catch (error) {
    console.error(`SKU 이미지 처리 중 오류 발생: ${error.message}`);
    return { success: false, productId, error: error.message };
  } finally {
    // 임시 디렉토리 정리
    try {
      if (downloadResult && downloadResult.tmpDir) {
        downloadResult.tmpDir.removeCallback();
      }
      if (resizedResult && resizedResult.outputDir) {
        await fs.promises.rm(resizedResult.outputDir, { recursive: true, force: true });
      }
      if (mergedResult && mergedResult.outputDir) {
        await fs.promises.rm(mergedResult.outputDir, { recursive: true, force: true });
      }
    } catch (cleanupError) {
      console.error(`임시 디렉토리 정리 중 오류 발생: ${cleanupError.message}`);
    }
  }
}

/**
 * 일정 시간 동안 지연시키는 유틸리티 함수
 * @param {number} ms - 지연 시간 (밀리초)
 * @returns {Promise<void>}
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 여러 상품의 SKU 이미지를 비동기적으로 병렬 처리하는 함수
 * @param {Array<string>} productIds - 처리할 상품 ID 배열
 * @returns {Promise<Array<Object>>} - 모든 상품의 처리 결과
 */
async function translateOptionImages(productIds) {
  const limit = pLimit(4); // 최대 4개 병렬 처리
  const results = [];
  
  for (const productId of productIds) {
    results.push(limit(() => processOneProduct(productId)));
    await delay(2000); // 요청 간 2초 지연
  }
  
  return Promise.all(results);
}

export { translateOptionImages };
