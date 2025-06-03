/**
 * imageProcessing.js
 * 이미지 다운로드, 업로드 및 처리 관련 함수 모듈
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import os from 'os';
import uploadImages from '../api_assist/images_upload.js';
import { uploadImagesToS3 } from '../s3hosting.js';

/**
 * 이미지 URL에서 파일 다운로드 함수
 * @param {string} imageUrl - 다운로드할 이미지 URL
 * @param {string} outputPath - 저장할 파일 경로
 * @returns {Promise<string>} 저장된 파일 경로
 */
async function downloadImage(imageUrl, outputPath) {
  try {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    if (imageUrl.startsWith('C:')) {
      return imageUrl; // 로컬 파일은 그대로 반환
    }
    
    let processedUrl = imageUrl;
    if (imageUrl.startsWith('//')) {
      processedUrl = `https:${imageUrl}`;
    } else if (!imageUrl.startsWith('http')) {
      processedUrl = `https://${imageUrl}`;
    }
    
    const response = await axios({
      method: 'get',
      url: processedUrl,
      responseType: 'stream'
    });
    
    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(outputPath));
      writer.on('error', reject);
    });
  } catch (error) {
    console.error(`이미지 다운로드 오류 (${imageUrl}):`, error.message);
    throw error;
  }
}

/**
 * 이미지 업로드 및 형식 변환 함수 (네이버 API 사용)
 * @param {string} representativeImage - 대표 이미지 URL
 * @param {string[]} images - 추가 이미지 URL 배열
 * @param {string} productId - 상품 ID
 * @returns {Promise<Object>} 네이버 형식의 이미지 객체
 */
async function processAndUploadImages(representativeImage, images, productId) {
  // 임시 디렉토리 설정
  const tempDir = path.join(os.tmpdir(), `naver_img_upload_${productId}`);
  let downloadedFiles = []; // 삭제할 임시 파일 목록

  try {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const imageUrls = [representativeImage, ...images];
    const imagePathsToUpload = [];
    
    for (let i = 0; i < imageUrls.length; i++) {
      const imageUrl = imageUrls[i];
      let targetPath = imageUrl;
      let isTemporary = false;

      if (!imageUrl.startsWith('C:')) {
        const outputPath = path.join(tempDir, `raw_${i}${path.extname(imageUrl) || '.jpg'}`);
        try {
          targetPath = await downloadImage(imageUrl, outputPath);
          downloadedFiles.push(targetPath); // 삭제 목록에 추가
          isTemporary = true;
        } catch (err) {
          console.error(`이미지 #${i} 다운로드 실패 (${imageUrl}):`, err.message);
          continue; // 실패 시 다음 이미지로
        }
      } else if (fs.existsSync(imageUrl)) {
         // 로컬 파일이고 존재하면 그대로 사용
      } else {
        console.error(`로컬 파일이 존재하지 않음: ${imageUrl}`);
        continue; // 존재하지 않으면 다음 이미지로
      }
      imagePathsToUpload.push(targetPath);
    }
    
    if (imagePathsToUpload.length === 0) {
      throw new Error('업로드할 이미지가 없습니다.');
    }
    
    // 이미지 업로드 (네이버 API)
    const uploadResult = await uploadImages(imagePathsToUpload);
    
    // 네이버 API 형식으로 변환
    const naverImageFormat = {
      representativeImage: {
        url: uploadResult.images[0].url
      },
      optionalImages: uploadResult.images.slice(1).map(img => ({ url: img.url }))
    };
    console.log(`[${productId}] 네이버 이미지 업로드 완료: 대표 ${naverImageFormat.representativeImage.url}, 추가 ${naverImageFormat.optionalImages.length}개`);
    
    return naverImageFormat;

  } catch (error) {
    console.error(`[${productId}] 네이버 이미지 처리 및 업로드 오류:`, error);
    throw error;
  } finally {
    // 임시 파일 삭제
    downloadedFiles.forEach(filePath => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.error(`임시 파일 삭제 오류 (${filePath}):`, err);
      }
    });
    // 임시 디렉토리 삭제 시도 (비어있을 경우)
    try {
      if (fs.existsSync(tempDir) && fs.readdirSync(tempDir).length === 0) {
        fs.rmdirSync(tempDir);
      }
    } catch (err) {
       // console.warn(`임시 디렉토리 삭제 오류 (${tempDir}):`, err); // 필요 시 경고 로그
    }
  }
}

/**
 * 상세 이미지 및 옵션 이미지 S3 호스팅 함수
 * @param {string[]} descriptionImages - 상세 이미지 URL 배열
 * @param {Object} optionImages - 옵션 이미지 객체 (propPath: imageUrl)
 * @param {Object} optionValueNames - 옵션 값 이름 객체 (propPath: name)
 * @param {string} productId - 상품 ID
 * @returns {Promise<Object>} 호스팅된 이미지 정보 ({ descriptionImages: [], optionNamesWithImages: [] })
 */
async function hostImagesOnS3(descriptionImages, optionImages, optionValueNames, productId) {
  // 임시 디렉토리 설정
  const tempBaseDir = path.join(os.tmpdir(), `s3_img_upload_${productId}`);
  const tempDescDir = path.join(tempBaseDir, 'desc');
  const tempOptDir = path.join(tempBaseDir, 'options');
  let tempDescFiles = []; // 삭제할 임시 상세 파일 목록
  let tempOptFiles = {}; // 삭제할 임시 옵션 파일 목록 (propPath: filePath)

  try {
    // 상세 이미지 처리
    const descriptionImagePathsToUpload = [];
    if (descriptionImages && descriptionImages.length > 0) {
      if (!fs.existsSync(tempDescDir)) {
        fs.mkdirSync(tempDescDir, { recursive: true });
      }

      for (let i = 0; i < descriptionImages.length; i++) {
        const imageUrl = descriptionImages[i];
        let targetPath = imageUrl;

        if (!imageUrl.startsWith('C:')) {
          const outputPath = path.join(tempDescDir, `desc_${i}${path.extname(imageUrl) || '.jpg'}`);
          try {
            targetPath = await downloadImage(imageUrl, outputPath);
            tempDescFiles.push(targetPath); // 삭제 목록에 추가
          } catch (err) {
            console.error(`상세 이미지 #${i} 다운로드 실패 (${imageUrl}):`, err.message);
            continue;
          }
        } else if (!fs.existsSync(imageUrl)) {
           console.error(`로컬 상세 파일이 존재하지 않음: ${imageUrl}`);
           continue;
        }
        descriptionImagePathsToUpload.push(targetPath);
      }
    }
    
    // 상세 이미지 S3 호스팅
    let hostedDescriptionImagesResult = { images: [] };
    if (descriptionImagePathsToUpload.length > 0) {
      try {
        hostedDescriptionImagesResult = await uploadImagesToS3(descriptionImagePathsToUpload);
      } catch (err) {
        console.error(`[${productId}] S3 상세 이미지 호스팅 실패:`, err.message);
        // 실패해도 계속 진행 (옵션 이미지 처리 위해)
      }
    }
    
    // 옵션 이미지 처리
    const optionNamesWithImagesResult = [];
    if (optionImages) {
       if (!fs.existsSync(tempOptDir)) {
         fs.mkdirSync(tempOptDir, { recursive: true });
       }
      
      for (const [propPath, imageUrl] of Object.entries(optionImages)) {
        let hostedImageUrl = imageUrl; // 최종 이미지 URL (호스팅되었거나 원래 http URL)
        let tempOptFilePath = null; // 임시 다운로드된 파일 경로

        if (imageUrl.startsWith('http')) {
        } else {
            let uploadPath = imageUrl;
            if (!imageUrl.startsWith('C:')) {
              const outputPath = path.join(tempOptDir, `option_${propPath.replace(/[:\\/]/g, '_')}${path.extname(imageUrl) || '.jpg'}`); // 파일명 특수문자 처리 강화
              try {
                  uploadPath = await downloadImage(imageUrl, outputPath);
                  tempOptFilePath = uploadPath; // 임시 파일 경로 저장
              } catch (err) {
                  console.error(`옵션 이미지 다운로드 실패 (${propPath}, ${imageUrl}):`, err.message);
                  continue; // 실패 시 다음 옵션으로
              }
            } else if (!fs.existsSync(imageUrl)) {
               console.error(`${propPath}: 로컬 옵션 파일이 존재하지 않음 - ${imageUrl}`);
               continue;
            }
            
            // S3에 업로드
            try {
                const uploadResult = await uploadImagesToS3([uploadPath]);
                
                if (uploadResult && uploadResult.images && uploadResult.images.length > 0) {
                    hostedImageUrl = uploadResult.images[0]; // S3 URL로 업데이트
                    // 임시 파일 삭제 목록에 추가 (성공 시)
                    if (tempOptFilePath) {
                       tempOptFiles[propPath] = tempOptFilePath;
                    }
                } else {
                    console.error(`${propPath}: S3 업로드 결과가 비어있음`);
                    // 업로드 실패 시 원본 URL 유지 (이미 http였거나 로컬 경로)
                }
            } catch (err) {
                 console.error(`옵션 이미지 S3 업로드 실패 (${propPath}):`, err.message);
                 // 업로드 실패 시 원본 URL 유지
            }
        }

        // 결과 배열에 추가 (name과 최종 image url)
        if (optionValueNames[propPath]) { // 이름이 있는 경우만 추가
           optionNamesWithImagesResult.push({
                name: optionValueNames[propPath],
                image: hostedImageUrl
           });
        } else {
            console.warn(`옵션 이름 없음: ${propPath}`);
        }
      }
    }
    
    // 최종 결과 조합
    const finalResult = {
      descriptionImages: hostedDescriptionImagesResult.images || [],
      optionNamesWithImages: optionNamesWithImagesResult
    };
    
    console.log(`[${productId}] S3 호스팅 완료: 상세 ${finalResult.descriptionImages.length}개, 옵션 ${finalResult.optionNamesWithImages.length}개`);
    
    return finalResult;

  } catch (error) {
    console.error(`[${productId}] S3 이미지 호스팅 전체 오류:`, error);
    throw error;
  } finally {
    // 임시 상세 이미지 파일 삭제
    tempDescFiles.forEach(filePath => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.error(`임시 상세 파일 삭제 오류 (${filePath}):`, err);
      }
    });
    // 임시 옵션 이미지 파일 삭제
    Object.values(tempOptFiles).forEach(filePath => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.error(`임시 옵션 파일 삭제 오류 (${filePath}):`, err);
      }
    });
     // 임시 베이스 디렉토리 삭제 시도 (비어있을 경우)
    try {
      if (fs.existsSync(tempBaseDir) && fs.readdirSync(tempBaseDir).length === 0) {
        fs.rmdirSync(tempBaseDir, { recursive: true }); // 하위 디렉토리까지 삭제
      } else if (fs.existsSync(tempBaseDir)) {
         // 디렉토리가 비어있지 않으면 내용 확인 (디버깅용)
         // const remainingFiles = fs.readdirSync(tempBaseDir, { withFileTypes: true });
         // console.warn(`임시 디렉토리 ${tempBaseDir}가 비어있지 않아 삭제하지 않음:`, remainingFiles.map(f => f.name));
      }
    } catch (err) {
       // console.warn(`임시 디렉토리 삭제 오류 (${tempBaseDir}):`, err); // 필요 시 경고 로그
    }
  }
}

export { downloadImage, processAndUploadImages, hostImagesOnS3 };


// 좀 많이 개판이다....