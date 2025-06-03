import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { tmpdir } from 'os';

/**
 * raw 이미지를 1000x1000 크기로 리사이징
 * @param {Object} rawResult - 다운로드된 원본 이미지 결과 객체
 * @returns {Promise<Object>} - 리사이징된 이미지 결과
 */
async function resizeRawImages(rawResult) {
  const { tmpDir, downloadedPaths } = rawResult;
  const resizedPaths = [];

  // 리사이징된 이미지를 저장할 새 임시 디렉토리 생성
  const outputDir = path.join(tmpdir(), `resized_raw_${Date.now()}`);
  await fs.mkdir(outputDir, { recursive: true });

  // 각 이미지 리사이징
  for (let i = 0; i < downloadedPaths.length; i++) {
    const outputPath = path.join(outputDir, `resized_${i + 1}.jpg`);
    await sharp(downloadedPaths[i])
      .resize(1000, 1000)
      .toFile(outputPath);
    resizedPaths.push(outputPath);
  }

  return { outputDir, resizedPaths };
}

/**
 * des 이미지를 너비 860px로 리사이징
 * @param {Object} desResult - 다운로드된 상세 이미지 결과 객체
 * @returns {Promise<Object>} - 리사이징된 이미지 결과
 */
async function resizeDesImages(desResult) {
  const { tmpDir, downloadedPaths } = desResult;
  const resizedPaths = [];

  // 리사이징된 이미지를 저장할 새 임시 디렉토리 생성
  const outputDir = path.join(tmpdir(), `resized_des_${Date.now()}`);
  await fs.mkdir(outputDir, { recursive: true });

  // 각 이미지 리사이징
  for (let i = 0; i < downloadedPaths.length; i++) {
    const outputPath = path.join(outputDir, `resized_${i + 1}.jpg`);
    await sharp(downloadedPaths[i])
      .resize(860, null) // 너비 860px, 높이는 비율 유지
      .toFile(outputPath);
    resizedPaths.push(outputPath);
  }

  return { outputDir, resizedPaths };
}

/**
 * 리사이징된 DES 이미지들을 세로로 병합하고 분할
 * @param {Array<string>} resizedImagePaths - 리사이징된 이미지 경로 배열
 * @returns {Promise<Object>} - 처리된 이미지 결과
 */
async function mergeAndSplitDesImages(resizedImagePaths) {
  // 각 이미지의 메타데이터(높이) 정보 가져오기
  const imageMetadata = await Promise.all(
    resizedImagePaths.map(path => sharp(path).metadata())
  );
  
  // 전체 높이 계산
  const totalHeight = imageMetadata.reduce((sum, meta) => sum + meta.height, 0);
  
  // 이미지 합치기를 위한 설정
  const compositeOperations = [];
  let currentY = 0;
  
  for (let i = 0; i < resizedImagePaths.length; i++) {
    compositeOperations.push({
      input: resizedImagePaths[i],
      top: currentY,
      left: 0
    });
    currentY += imageMetadata[i].height;
  }
  
  // 결과 이미지 저장할 디렉토리 생성
  const outputDir = path.join(tmpdir(), `merged_split_${Date.now()}`);
  await fs.mkdir(outputDir, { recursive: true });
  
  // 병합된 이미지 생성
  const mergedImagePath = path.join(outputDir, 'merged.jpg');
  await sharp({
    create: {
      width: 860,
      height: totalHeight,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
    .composite(compositeOperations)
    .jpeg()
    .toFile(mergedImagePath);
  
  // 3000px 단위로 분할 (최대 6개)
  const MAX_HEIGHT = 3000;
  const MAX_IMAGES = 6;
  const splitPaths = [];
  
  const splitCount = Math.min(Math.ceil(totalHeight / MAX_HEIGHT), MAX_IMAGES);
  
  for (let i = 0; i < splitCount; i++) {
    const startY = i * MAX_HEIGHT;
    const extractHeight = Math.min(MAX_HEIGHT, totalHeight - startY);
    
    if (extractHeight <= 0) break;
    
    const outputPath = path.join(outputDir, `split_${i + 1}.jpg`);
    await sharp(mergedImagePath)
      .extract({ left: 0, top: startY, width: 860, height: extractHeight })
      .toFile(outputPath);
    
    splitPaths.push(outputPath);
  }
  
  return { outputDir, splitPaths };
}

/**
 * 모든 이미지를 하나의 큰 이미지(4000x6000)로 조합하고 좌우로 이등분
 * @param {Object} resizedRawResult - 리사이징된 raw 이미지 정보
 * @param {Object} mergedSplitResult - 병합/분할된 des 이미지 정보
 * @returns {Promise<Object>} - 최종 조합 및 이등분된 이미지 정보
 */
async function createCompositeImage(resizedRawResult, mergedSplitResult) {
  // 모든 raw 및 des 이미지 경로
  const rawImagePaths = resizedRawResult.resizedPaths;
  const desImagePaths = mergedSplitResult.processedPaths;
  
  // 결과 이미지 저장할 디렉토리 생성
  const outputDir = path.join(tmpdir(), `final_composite_${Date.now()}`);
  await fs.mkdir(outputDir, { recursive: true });
  
  // 4000x6000 흰색 배경 이미지 생성
  const compositeImagePath = path.join(outputDir, 'composite.jpg');
  
  // 이미지 배치를 위한 compositeOperations 배열
  const compositeOperations = [];
  
  // 1. RAW 이미지 배치 (왼쪽 상단부터 세로로 간격 250px)
  let currentY = 0;
  for (let i = 0; i < rawImagePaths.length; i++) {
    compositeOperations.push({
      input: rawImagePaths[i],
      top: currentY,
      left: 0
    });
    // 다음 이미지를 위해 Y 좌표 증가 (1000px 이미지 + 250px 간격)
    currentY += 1000 + 250;
  }
  
  // 2. DES 이미지 배치 (세로로 2장씩, 가로로 3열)
  const desStartX = 1000 + 140; // RAW 이미지 너비(1000px) + 첫 번째 간격(140px)
  const columnWidth = 860 + 140; // DES 이미지 너비(860px) + 열 간의 간격(140px)
  
  // DES 이미지 메타데이터 가져오기
  const desMetadata = await Promise.all(
    desImagePaths.map(path => sharp(path).metadata())
  );
  
  for (let i = 0; i < desImagePaths.length; i++) {
    // 열 번호와 열 내 위치 계산 (2장씩 세로로)
    const columnIndex = Math.floor(i / 2); // 0, 0, 1, 1, 2, 2, ...
    const positionInColumn = i % 2; // 0, 1, 0, 1, 0, 1, ...
    
    // X 좌표 계산: 시작 X + (열 인덱스 * 열 너비)
    const xPosition = desStartX + (columnIndex * columnWidth);
    
    // Y 좌표 계산: 열 내 이미지 위치에 따라
    let yPosition = 0;
    if (positionInColumn > 0 && i > 0) {
      // 이전 이미지가 있을 경우, 이전 이미지 높이만큼 Y 좌표 증가
      const prevHeight = desMetadata[i - 1].height;
      yPosition = prevHeight;
    }
    
    compositeOperations.push({
      input: desImagePaths[i],
      top: yPosition,
      left: xPosition
    });
  }
  
  // 최종 이미지 생성
  await sharp({
    create: {
      width: 4000,
      height: 6000,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
    .composite(compositeOperations)
    .jpeg()
    .toFile(compositeImagePath);
  
  // 이미지를 X축으로 이등분 (왼쪽/오른쪽)
  const halfWidth = 2000; // 4000의 절반
  
  // 왼쪽 이미지 생성
  const leftHalfPath = path.join(outputDir, 'composite_left_half.jpg');
  await sharp(compositeImagePath)
    .extract({ left: 0, top: 0, width: halfWidth, height: 6000 })
    .toFile(leftHalfPath);
  
  // 오른쪽 이미지 생성
  const rightHalfPath = path.join(outputDir, 'composite_right_half.jpg');
  await sharp(compositeImagePath)
    .extract({ left: halfWidth, top: 0, width: halfWidth, height: 6000 })
    .toFile(rightHalfPath);
  
  return { 
    outputDir, 
    compositePath: compositeImagePath,
    leftHalfPath,
    rightHalfPath
  };
}

/**
 * 이미지 처리 메인 함수
 * @param {Object} imagesData - { raw, des } 형태의 다운로드된 이미지 데이터
 * @returns {Promise<Object>} - 처리된 이미지 정보
 */
async function processImages(imagesData) {
  const { raw, des } = imagesData;
  
  // 1. RAW 이미지 리사이징 (1000x1000)
  const resizedRawResult = await resizeRawImages(raw);
  
  // 2. DES 이미지 리사이징 (너비 860px)
  const resizedDesResult = await resizeDesImages(des);
  
  // 3. 리사이징된 DES 이미지 세로 병합 및 분할
  const mergedSplitResult = await mergeAndSplitDesImages(resizedDesResult.resizedPaths);
  
  // 4. 모든 이미지를 하나의 큰 이미지로 조합하고 좌우로 이등분
  const compositeResult = await createCompositeImage(
    { resizedPaths: resizedRawResult.resizedPaths }, 
    { processedPaths: mergedSplitResult.splitPaths }
  );
  
  // 각 이미지의 메타데이터(높이) 정보 가져오기
  const imageMetadata = await Promise.all(
    resizedDesResult.resizedPaths.map(path => sharp(path).metadata())
  );
  
  // 전체 높이 계산 (DES 이미지 분할 전 높이)
  const totalDesHeight = imageMetadata.reduce((sum, meta) => sum + meta.height, 0);
  
  return {
    raw: {
      outputDir: resizedRawResult.outputDir,
      processedPaths: resizedRawResult.resizedPaths,
      count: resizedRawResult.resizedPaths.length // 이미지 개수 추가
    },
    des: {
      outputDir: mergedSplitResult.outputDir,
      processedPaths: mergedSplitResult.splitPaths,
      totalHeightBeforeSplit: totalDesHeight // 분할 전 총 높이 추가
    },
    composite: {
      outputDir: compositeResult.outputDir,
      compositePath: compositeResult.compositePath,
      dividedImages: {
        leftHalf: compositeResult.leftHalfPath,
        rightHalf: compositeResult.rightHalfPath
      }
    }
  };
}

export { processImages,resizeRawImages };
