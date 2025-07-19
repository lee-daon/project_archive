import { copyObject } from '../../../common/utils/img_hosting.js';
import { getCommonImageUrls } from '../repository/detailPage.js';
import { setMarketImageUrls, getMarketImageUrls as getMarketUrls } from '../repository/marketSetting.js';
import crypto from 'crypto';

/**
 * 난수 파일명 생성
 * @param {string} originalName - 원본 파일명
 * @returns {string} 생성된 파일명
 */
const generateRandomFileName = (originalName) => {
  const randomString = crypto.randomBytes(16).toString('hex');
  const extension = originalName.split('.').pop();
  return `${randomString}.${extension}`;
};

/**
 * 공통 설정의 이미지들을 새로운 마켓 계정으로 복사
 * @param {number} userid - 사용자 ID
 * @param {string} marketType - 마켓 타입 (coopang, naver, elevenstore, esm)
 * @param {number} shopid - 새로 생성된 계정 ID
 * @returns {Object} 복사 결과
 */
export const copyCommonImagesToNewMarket = async (userid, marketType, shopid) => {
  try {
    // 공통 설정에서 이미지 URL들 조회
    const commonImages = await getCommonImageUrls(userid);
    
    if (!commonImages) {
      console.log('공통 설정에 이미지가 없습니다.');
      return {
        success: true,
        message: '복사할 이미지가 없습니다.',
        copiedCount: 0
      };
    }
    
    const imageFields = ['top_image_1', 'top_image_2', 'top_image_3', 'bottom_image_1', 'bottom_image_2', 'bottom_image_3'];
    const copyPromises = [];
    const newImageUrls = {
      top_image_1: null,
      top_image_2: null,
      top_image_3: null,
      bottom_image_1: null,
      bottom_image_2: null,
      bottom_image_3: null
    };
    
    // 각 이미지 필드에 대해 복사 작업 생성
    for (const field of imageFields) {
      const imageUrl = commonImages[field];
      
      if (imageUrl && imageUrl.trim() !== '') {
        // 새로운 경로 생성
        const newSubPath = `userDetailPageImages/${userid}/${marketType}/${shopid}`;
        
        // 새로운 파일명 생성
        const originalFilename = imageUrl.split('/').pop().split('-').slice(1).join('-'); // timestamp 제거
        const newFilename = generateRandomFileName(originalFilename);
        
        // 메타데이터 설정
        const metadata = {
          userid: userid.toString(),
          marketType: marketType,
          shopid: shopid.toString(),
          sourceField: field,
          createdFrom: 'common_setting'
        };
        
        // 복사 Promise 생성
        const copyPromise = copyObject(imageUrl, newSubPath, newFilename, metadata)
          .then(result => ({
            field,
            originalUrl: imageUrl,
            result
          }));
        
        copyPromises.push(copyPromise);
      }
    }
    
    // 모든 복사 작업을 병렬로 실행
    if (copyPromises.length === 0) {
      return {
        success: true,
        message: '복사할 이미지가 없습니다.',
        copiedCount: 0
      };
    }
    
    const copyResults = await Promise.all(copyPromises);
    
    // 성공한 복사 작업의 결과를 새로운 이미지 URL 객체에 저장
    let successCount = 0;
    const failedCopies = [];
    
    copyResults.forEach(({ field, originalUrl, result }) => {
      if (result.success) {
        newImageUrls[field] = result.url;
        successCount++;
      } else {
        failedCopies.push({ field, originalUrl, error: result.error });
      }
    });
    
    // 새로운 마켓 계정에 이미지 URL들 설정
    if (successCount > 0) {
      await setMarketImageUrls(userid, marketType, shopid, newImageUrls);
    }
    
    console.log(`이미지 복사 완료: ${successCount}/${copyPromises.length}`);
    
    if (failedCopies.length > 0) {
      console.warn('복사 실패한 이미지들:', failedCopies);
    }
    
    return {
      success: true,
      message: `${successCount}개의 이미지가 성공적으로 복사되었습니다.`,
      copiedCount: successCount,
      totalCount: copyPromises.length,
      failedCopies: failedCopies.length > 0 ? failedCopies : undefined,
      newImageUrls
    };
    
  } catch (error) {
    console.error('이미지 복사 중 오류 발생:', error);
    return {
      success: false,
      message: '이미지 복사 중 오류가 발생했습니다.',
      error: error.message
    };
  }
};

/**
 * 마켓 계정 삭제 시 해당 계정의 이미지 URL들을 수집
 * @param {number} userid - 사용자 ID
 * @param {string} marketType - 마켓 타입
 * @param {number} shopid - 삭제될 계정 ID
 * @returns {Array} 이미지 URL 배열
 */
export const collectMarketImageUrls = async (userid, marketType, shopid) => {
  try {
    const marketImages = await getMarketUrls(userid, marketType, shopid);
    
    if (!marketImages) {
      return [];
    }
    
    const imageFields = ['top_image_1', 'top_image_2', 'top_image_3', 'bottom_image_1', 'bottom_image_2', 'bottom_image_3'];
    const imageUrls = [];
    
    imageFields.forEach(field => {
      const imageUrl = marketImages[field];
      if (imageUrl && imageUrl.trim() !== '') {
        imageUrls.push(imageUrl);
      }
    });
    
    return imageUrls;
  } catch (error) {
    console.error('마켓 이미지 URL 수집 중 오류:', error);
    return [];
  }
};
