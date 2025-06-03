import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { tmpdir } from 'os';

/**
 * 번역된 이미지(왼쪽/오른쪽 반)를 원래 형태의 이미지로 다시 분할
 * @param {Object} translatedResult - translateDividedImages 함수의 결과 객체
 * @param {Object} originalResult - 원본 processImages 함수의 결과 객체
 * @param {string} outputBasePath - 출력할 기본 경로 (기본값: tmpdir)
 * @param {string} productId - 상품 ID (기본값: null, 제공되면 해당 ID로 폴더 생성)
 * @returns {Promise<Object>} - 분할된 이미지 정보
 */
async function divideTranslatedImages(translatedResult, originalResult, outputBasePath = null, productId = null) {
  const { translatedImages } = translatedResult;
  const { raw, des } = originalResult;
  
  // 결과 이미지 저장할 디렉토리 생성
  let outputDir;
  
  if (outputBasePath && productId) {
    // 지정된 경로에 상품 ID 폴더 생성
    outputDir = path.join(outputBasePath, productId);
    await fs.mkdir(outputDir, { recursive: true });
    //console.log(`상품 ID ${productId}에 대한 폴더 생성: ${outputDir}`);
  } else {
    // 임시 디렉토리 사용
    outputDir = path.join(tmpdir(), `divided_translated_${Date.now()}`);
    await fs.mkdir(outputDir, { recursive: true });
    console.log(`임시 폴더 생성: ${outputDir}`);
  }
  
  // RAW 이미지 분할
  const rawPaths = await extractRawImages(
    translatedImages.leftHalf, 
    raw.count,
    outputDir
  );
  
  // DES 이미지 분할
  const desPaths = await extractDesImages(
    translatedImages, 
    des.totalHeightBeforeSplit,
    outputDir
  );
  
  return {
    outputDir,
    rawImages: rawPaths,
    desImages: desPaths
  };
}

/**
 * 번역된 왼쪽 반쪽 이미지에서 원본 RAW 이미지 추출
 * @param {string} leftHalfPath - 번역된 왼쪽 반쪽 이미지 경로
 * @param {number} count - 원본 RAW 이미지 개수
 * @param {string} outputDir - 출력 디렉토리
 * @returns {Promise<Array<string>>} - 추출된 이미지 경로 배열
 */
async function extractRawImages(leftHalfPath, count, outputDir) {
  const extractedPaths = [];
  
  // 이미지 메타데이터 가져오기
  const metadata = await sharp(leftHalfPath).metadata();
  
  // 이미지 사이즈 정보
  const RAW_SIZE = 1000; // RAW 이미지 크기
  const GAP = 250; // 이미지 간 간격
  
  for (let i = 0; i < count; i++) {
    const startY = i * (RAW_SIZE + GAP); // 시작 Y 좌표
    
    // 이미지 경계 검사
    if (startY + RAW_SIZE > metadata.height) {
      console.warn(`경고: RAW 이미지 ${i+1}이 원본 이미지 범위를 벗어납니다. 건너뜁니다.`);
      continue;
    }
    
    // 개별 RAW 이미지 추출
    const outputPath = path.join(outputDir, `raw_${i + 1}.jpg`);
    await sharp(leftHalfPath)
      .extract({ 
        left: 0, 
        top: startY, 
        width: Math.min(RAW_SIZE, metadata.width), 
        height: Math.min(RAW_SIZE, metadata.height - startY) 
      })
      .toFile(outputPath);
    
    extractedPaths.push(outputPath);
  }
  
  return extractedPaths;
}

/**
 * 번역된 이미지에서 원본 DES 이미지 추출
 * @param {Object} translatedImages - 번역된 이미지 경로 객체
 * @param {number} totalHeightBeforeSplit - 분할 전 DES 이미지의 총 높이
 * @param {string} outputDir - 출력 디렉토리
 * @returns {Promise<Array<string>>} - 추출된 이미지 경로 배열
 */
async function extractDesImages(translatedImages, totalHeightBeforeSplit, outputDir) {
  // 이미지 메타데이터 가져오기
  const leftMetadata = await sharp(translatedImages.leftHalf).metadata();
  const rightMetadata = await sharp(translatedImages.rightHalf).metadata();
  
  // 추출된 모든 DES 이미지 경로 배열
  const extractedPaths = [];
  
  // 이미지 위치 정보
  const DES_WIDTH = 860; // DES 이미지 너비
  const MAX_HEIGHT = 3000; // 각 분할 이미지의 최대 높이
  
  // 이미지 위치 정보
  const LEFT_X = 1140; // 왼쪽 이미지의 DES 시작 X 좌표
  const RIGHT_X1 = 140; // 오른쪽 이미지의 첫 번째 DES 시작 X 좌표
  const RIGHT_X2 = 1140; // 오른쪽 이미지의 두 번째 DES 시작 X 좌표
  
  // 3000px 단위로 분할할 수 있는 이미지 수 계산
  const fullSegments = Math.floor(totalHeightBeforeSplit / MAX_HEIGHT);
  const remainingHeight = totalHeightBeforeSplit % MAX_HEIGHT;
  
  console.log(`총 DES 이미지 높이: ${totalHeightBeforeSplit}px`);
  //console.log(`3000px 단위 분할 수: ${fullSegments}장`);
  //console.log(`나머지 높이: ${remainingHeight}px`);
  
  // 3가지 열에 대한 세그먼트 정보
  const columns = [
    { 
      name: 'des_left',
      sourcePath: translatedImages.leftHalf,
      metadata: leftMetadata,
      xPosition: LEFT_X,
      maxCount: 2 // 최대 추출 가능 세그먼트 수
    },
    {
      name: 'des_right1',
      sourcePath: translatedImages.rightHalf,
      metadata: rightMetadata,
      xPosition: RIGHT_X1,
      maxCount: 2
    },
    {
      name: 'des_right2',
      sourcePath: translatedImages.rightHalf,
      metadata: rightMetadata,
      xPosition: RIGHT_X2,
      maxCount: fullSegments // 남은 모든 세그먼트
    }
  ];
  
  // 처리할 총 세그먼트 수 (나머지 높이 포함)
  const totalSegments = fullSegments + (remainingHeight > 0 ? 1 : 0);
  //console.log(`처리할 총 세그먼트 수: ${totalSegments}`);
  
  // 각 열을 순차적으로 처리
  let remainingSegments = totalSegments;
  
  // 순서대로 각 열을 처리
  for (let colIndex = 0; colIndex < columns.length; colIndex++) {
    const column = columns[colIndex];
    
    // 현재 열에서 추출할 세그먼트 수 계산
    const segmentsForColumn = Math.min(column.maxCount, remainingSegments);
    
    // 현재 열에서 세그먼트 추출
    for (let i = 0; i < segmentsForColumn; i++) {
      const isLastSegment = (i === segmentsForColumn - 1) && (remainingSegments <= segmentsForColumn);
      const height = (isLastSegment && remainingHeight > 0) ? remainingHeight : MAX_HEIGHT;
      
      await extractSegment(
        column.sourcePath,
        column.metadata,
        column.xPosition,
        DES_WIDTH,
        i * MAX_HEIGHT,
        height,
        outputDir,
        column.name,
        i + 1,
        extractedPaths
      );
    }
    
    // 남은 세그먼트 수 업데이트
    remainingSegments -= segmentsForColumn;
    
    // 모든 세그먼트가 처리되었으면 종료
    if (remainingSegments <= 0) {
      break;
    }
  }
  
  return extractedPaths;
}

/**
 * 단일 이미지 세그먼트 추출
 * @param {string} sourcePath - 소스 이미지 경로
 * @param {Object} metadata - 이미지 메타데이터
 * @param {number} xPosition - X 좌표 시작점
 * @param {number} width - 추출할 너비
 * @param {number} startY - 소스 이미지에서의 시작 Y 좌표
 * @param {number} height - 추출할 높이
 * @param {string} outputDir - 출력 디렉토리
 * @param {string} prefix - 파일명 접두사
 * @param {number} index - 파일 인덱스
 * @param {Array} outputPaths - 출력 경로를 추가할 배열
 * @returns {Promise<boolean>} - 추출 성공 여부
 */
async function extractSegment(
  sourcePath,
  metadata,
  xPosition,
  width,
  startY,
  height,
  outputDir,
  prefix,
  index,
  outputPaths
) {
  // 이미지 경계 검사
  if (xPosition >= metadata.width || startY >= metadata.height) {
    console.warn(`경고: ${prefix}_${index} 이미지가 범위를 벗어납니다. 건너뜁니다.`);
    return false;
  }
  
  const outputPath = path.join(outputDir, `${prefix}_${index}.jpg`);
  
  try {
    await sharp(sourcePath)
      .extract({ 
        left: xPosition, 
        top: startY, 
        width: Math.min(width, metadata.width - xPosition), 
        height: Math.min(height, metadata.height - startY) 
      })
      .toFile(outputPath);
    
    outputPaths.push(outputPath);
    //console.log(`${prefix}_${index} 이미지 추출 완료: 높이 ${height}px`);
    return true;
  } catch (error) {
    console.error(`${prefix}_${index} 이미지 추출 오류:`, error.message);
    console.error(`파라미터: left=${xPosition}, top=${startY}, width=${Math.min(width, metadata.width - xPosition)}, height=${Math.min(height, metadata.height - startY)}`);
    return false;
  }
}

/**
 * 임시 디렉토리의 파일들 정리
 * @param {Object} translatedResult - 번역 결과 객체
 * @returns {Promise<void>}
 */
async function cleanupTempFiles(translatedResult) {
  if (!translatedResult || !translatedResult.tempDir) {
    return;
  }
  
  try {
    // 디렉토리 내 모든 파일 삭제
    const files = await fs.readdir(translatedResult.tempDir);
    
    for (const file of files) {
      await fs.unlink(path.join(translatedResult.tempDir, file));
    }
    
    // 디렉토리 삭제
    await fs.rmdir(translatedResult.tempDir);
    
    //console.log(`임시 디렉토리 정리 완료: ${translatedResult.tempDir}`);
  } catch (error) {
    console.error(`임시 파일 정리 중 오류 발생: ${error.message}`);
  }
}

export { divideTranslatedImages, cleanupTempFiles };

