// productImageProcessor.js
import { getRawImageUrls, getDesImageUrls, saveTranslatedImagePaths } from '../../db/processing/getNsaveImages.js';
import { downloadImagesForProduct } from './downloadImages.js';
import { processImages } from './mergeimage.js';
import { translateDividedImages } from './imageTranslateApi.js';
import { divideTranslatedImages, cleanupTempFiles } from './dividedimages.js';
import fs from 'fs';
import path from 'path';
import pLimit from 'p-limit';
import dotenv from 'dotenv';

dotenv.config();

// 상수 정의
const SAVE_BASE_PATH = process.env.SAVE_BASE_PATH;

/**
 * 상품ID를 입력받아 이미지를 처리하고 번역한 후 저장하는 함수
 * @param {string} productId - 상품의 고유 ID
 * @param {string} targetLang - 번역 대상 언어 (기본값: 'ko')
 * @returns {Promise<Object>} - 처리 결과
 */
async function processAndTranslateProductImages(productId, targetLang = 'ko') {
  // 임시 디렉토리 변수 선언
  let rawResult = null;
  let desResult = null;
  let processedResult = null;
  let translatedResult = null;
  let dividedResult = null;
  
  try {
    // DB에서 이미지 URL 조회
    const rawUrls = await getRawImageUrls(productId);
    const desUrls = await getDesImageUrls(productId);
    
    console.log(`상품 ID ${productId}의 이미지 조회 완료`);
    
    // 각 이미지 URL 배열을 임시 디렉토리에 다운로드
    rawResult = await downloadImagesForProduct(productId, rawUrls);
    desResult = await downloadImagesForProduct(productId, desUrls);
    
    //console.log(`이미지 다운로드 완료`);

    // 이미지 처리
    processedResult = await processImages({ raw: rawResult, des: desResult });
    console.log(`이미지 다운로드+합성성 완료`);
    
    // 이미지 번역
    translatedResult = await translateDividedImages(processedResult, targetLang);
    console.log(`이미지 번역 완료`);
    
    // 번역된 이미지 분할 및 저장
    dividedResult = await divideTranslatedImages(
      translatedResult, 
      processedResult, 
      SAVE_BASE_PATH, 
      productId
    );
    //console.log(`이미지 분할 및 저장 완료: ${dividedResult.outputDir}`);
    
    return {
      success: true,
      productId,
      outputDir: dividedResult.outputDir,
      imageCount: {
        raw: dividedResult.rawImages.length,
        des: dividedResult.desImages.length
      },
      dividedResult
    };
  } catch (error) {
    console.error(`이미지 처리 중 오류 발생: ${error.message}`);
    throw error;
  } finally {
    // 임시 디렉토리 정리 (항상 실행)
    try {
      // 원본 다운로드 임시 디렉토리 정리
      if (rawResult && rawResult.tmpDir) {
        //console.log(`정리 중: ${rawResult.tmpDir.name}`);
        rawResult.tmpDir.removeCallback();
      }
      if (desResult && desResult.tmpDir) {
        //console.log(`정리 중: ${desResult.tmpDir.name}`);
        desResult.tmpDir.removeCallback();
      }
      
      // 이미지 처리 임시 파일 정리
      if (processedResult && processedResult.raw && processedResult.raw.outputDir) {
        await cleanupDirectory(processedResult.raw.outputDir);
      }
      if (processedResult && processedResult.des && processedResult.des.outputDir) {
        await cleanupDirectory(processedResult.des.outputDir);
      }
      if (processedResult && processedResult.composite && processedResult.composite.outputDir) {
        await cleanupDirectory(processedResult.composite.outputDir);
      }
      
      // 번역 결과 임시 파일 정리
      if (translatedResult) {
        await cleanupTempFiles(translatedResult);
      }
    } catch (cleanupError) {
      console.error(`임시 디렉토리 정리 중 오류 발생: ${cleanupError.message}`);
    }
  }
}

/**
 * 지정된 디렉토리와 해당 디렉토리 내의 모든 파일을 삭제
 * @param {string} dirPath - 삭제할 디렉토리 경로
 */
async function cleanupDirectory(dirPath) {
  if (!dirPath || !fs.existsSync(dirPath)) {
    return;
  }
  
  try {
    // 디렉토리 내 모든 파일 삭제
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      fs.unlinkSync(filePath);
    }
    
    // 디렉토리 삭제
    fs.rmdirSync(dirPath);
    
    //console.log(`디렉토리 정리 완료: ${dirPath}`);
  } catch (error) {
    console.error(`디렉토리 정리 중 오류 발생: ${error.message}`);
  }
}

/**
 * 일정 시간 동안 지연시키는 유틸리티 함수
 * @param {number} ms - 지연 시간 (밀리초)
 * @returns {Promise<void>}
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 단일 상품의 이미지를 처리하는 함수
 * @param {string} productId - 상품의 고유 ID
 * @returns {Promise<Object>} - 처리 결과
 */
async function processOneProduct(productId) {
  try {
    const result = await processAndTranslateProductImages(productId);
    
    if (result.success && result.dividedResult) {
      const rawPaths = result.dividedResult.rawImages;
      const desPaths = result.dividedResult.desImages;
      
      // DB에 번역된 이미지 경로 저장
      const saveResult = await saveTranslatedImagePaths(productId, rawPaths, desPaths);
      
      console.log(`상품 ID ${productId}의 이미지 경로 DB 저장 완료:`);
      console.log(`- RAW 이미지: ${saveResult.rawCount}장`);
      console.log(`- DES 이미지: ${saveResult.desCount}장`);
      
      return { success: true, productId, saveResult };
    } else {
      console.error(`상품 ID ${productId}의 이미지 처리 결과가 유효하지 않습니다.`);
      return { success: false, productId, error: '처리 결과가 유효하지 않음' };
    }
  } catch (error) {
    console.error(`상품 ID ${productId} 처리 중 오류 발생: ${error.message}`);
    return { success: false, productId, error: error.message };
  }
}

/**
 * 여러 상품의 이미지를 비동기적으로 병렬 처리하는 함수
 * @param {Array<string>} productIds - 처리할 상품 ID 배열
 * @param {number} concurrency - 동시 처리할 최대 요청 수 (기본값: 10)
 * @param {boolean} useRateLimit - true면 작업 시작과 완료 시 1초 지연, false면 지연 없음 (기본값: true)
 * @returns {Promise<Array<Object>>} - 모든 상품의 처리 결과
 */
async function imagetranslate(productIds) {
  const limit = pLimit(4);
  const results = [];
  for (const productId of productIds) {
    results.push(limit(() => processOneProduct(productId)));
    await delay(2000);
  }
  return Promise.all(results);
}

export { processAndTranslateProductImages, imagetranslate };



