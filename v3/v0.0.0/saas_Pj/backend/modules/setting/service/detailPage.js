import { getDetailPageSetting, createDetailPageSetting, updateDetailPageSetting, getAllMarketAccounts, updateAllMarketDetailImages, saveNotUsedImages } from '../repository/detailPage.js';
import { getAllMarketAccountsWithImages, clearMarketImageField } from '../repository/marketSetting.js';
import { uploadImageFromBuffer } from '../../../common/utils/img_hosting.js';
import crypto from 'crypto';
import sharp from 'sharp';
import path from 'path';

/**
 * 상세페이지 설정 조회 (없으면 생성)
 * @param {number} userid - 사용자 ID
 * @returns {Object} 상세페이지 설정 데이터
 */
export const getDetailPageSettingService = async (userid) => {
  try {
    let setting = await getDetailPageSetting(userid);
    
    // 설정이 없으면 기본 설정으로 생성
    if (!setting) {
      await createDetailPageSetting(userid);
      setting = await getDetailPageSetting(userid);
    }
    
    // API 응답 형식에 맞게 변환
    const result = {
      top_images: [
        {
          url: setting.top_image_1 || "",
          file: null,
          changed: false
        },
        {
          url: setting.top_image_2 || "",
          file: null,
          changed: false
        },
        {
          url: setting.top_image_3 || "",
          file: null,
          changed: false
        }
      ],
      bottom_images: [
        {
          url: setting.bottom_image_1 || "",
          file: null,
          changed: false
        },
        {
          url: setting.bottom_image_2 || "",
          file: null,
          changed: false
        },
        {
          url: setting.bottom_image_3 || "",
          file: null,
          changed: false
        }
      ],
      include_properties: setting.include_properties ? 1 : 0,
      include_options: setting.include_options ? 1 : 0,
      created_at: setting.created_at,
      updated_at: setting.updated_at
    };
    
    return result;
  } catch (error) {
    console.error('상세페이지 설정 조회 서비스 오류:', error);
    throw error;
  }
};

/**
 * 이미지 파일 유효성 검증
 * @param {Object} file - 업로드된 파일 객체
 * @returns {Object} 검증 결과
 */
const validateImageFile = (file) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (!allowedTypes.includes(file.mimetype)) {
    return {
      valid: false,
      error: '이미지 파일 형식이 올바르지 않습니다. (JPG, JPEG, PNG, GIF, WEBP만 허용)'
    };
  }
  
  if (file.size > maxSize) {
    return {
      valid: false,
      error: '파일 크기가 5MB를 초과합니다.'
    };
  }
  
  return { valid: true };
};

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
 * 상세페이지 설정 업데이트
 * @param {number} userid - 사용자 ID
 * @param {Object} settingData - 업데이트할 설정 데이터
 * @param {Object} files - 업로드된 이미지 파일들
 * @returns {Object} 업데이트 결과
 */
export const updateDetailPageSettingService = async (userid, settingData, files = {}) => {
  try {
    const updateData = {};
    const validationErrors = {};
    
    // 기본 설정 업데이트
    if (settingData.include_properties !== undefined) {
      updateData.include_properties = parseInt(settingData.include_properties) === 1;
    }
    if (settingData.include_options !== undefined) {
      updateData.include_options = parseInt(settingData.include_options) === 1;
    }

    // --- 이미지 삭제 처리 시작 ---
    const deletedImageFields = new Set();
    const notUsedImages = [];
    
    // 삭제할 필드 식별
    if (settingData.changed_images) {
      try {
        const imageChanges = JSON.parse(settingData.changed_images);
        const allDeleted = [...(imageChanges.top_deleted || []), ...(imageChanges.bottom_deleted || [])];
        allDeleted.forEach(index => {
          const type = index < 3 ? 'top' : 'bottom';
          const fieldIndex = index < 3 ? index + 1 : index - 2;
          deletedImageFields.add(`${type}_image_${fieldIndex}`);
        });
      } catch (parseError) {
        console.error('이미지 변경 정보 파싱 오류:', parseError);
      }
    }
    
    Object.keys(settingData).forEach(key => {
      if (key.startsWith('deleted_') && settingData[key] === 'true') {
        const match = key.match(/deleted_(top|bottom)_images\[(\d+)\]/);
        if (match) {
          deletedImageFields.add(`${match[1]}_image_${parseInt(match[2]) + 1}`);
        }
      }
    });

    // 식별된 필드에 대해 이미지 삭제 작업 실행
    if (deletedImageFields.size > 0) {
      // 1. 삭제될 모든 이미지 URL 수집
      const currentSetting = await getDetailPageSetting(userid);
      const allMarketImages = await getAllMarketAccountsWithImages(userid);

      deletedImageFields.forEach(field => {
        // common_setting
        if (currentSetting && currentSetting[field]) {
          notUsedImages.push(currentSetting[field]);
        }
        // 마켓 계정들
        Object.values(allMarketImages).forEach(accounts => {
          accounts.forEach(account => {
            if (account[field]) {
              notUsedImages.push(account[field]);
            }
          });
        });
      });

      // 2. DB에서 이미지 필드 비우기 (병렬 처리)
      const clearPromises = [];
      deletedImageFields.forEach(field => {
        clearPromises.push(updateDetailPageSetting(userid, { [field]: null })); // common_setting
        clearPromises.push(clearMarketImageField(userid, 'coopang', field));
        clearPromises.push(clearMarketImageField(userid, 'naver', field));
        clearPromises.push(clearMarketImageField(userid, 'elevenstore', field));
        clearPromises.push(clearMarketImageField(userid, 'esm', field));
      });
      await Promise.all(clearPromises);
    }
    // --- 이미지 삭제 처리 종료 ---

    // --- 이미지 업로드 처리 시작 ---
    const imageFields = [
      'top_images[0]', 'top_images[1]', 'top_images[2]',
      'bottom_images[0]', 'bottom_images[1]', 'bottom_images[2]'
    ];
    
    const imageMapping = {
      'top_images[0]': 'top_image_1',
      'top_images[1]': 'top_image_2',
      'top_images[2]': 'top_image_3',
      'bottom_images[0]': 'bottom_image_1',
      'bottom_images[1]': 'bottom_image_2',
      'bottom_images[2]': 'bottom_image_3'
    };
    
    const marketAccounts = await getAllMarketAccounts(userid);
    
    for (const fieldName of imageFields) {
      const file = files[fieldName];
      if (file) {
        // 파일 유효성 검증
        const validation = validateImageFile(file);
        if (!validation.valid) {
          validationErrors[fieldName] = [validation.error];
          continue;
        }
        
        try {
          // 파일 유효성 검증 후 이미지 압축
          const compressedBuffer = await sharp(file.buffer)
            .jpeg({ quality: 80 })
            .toBuffer();
          
          // 파일명을 .jpg로 변경
          const originalNameWithJpg = `${path.parse(file.originalname).name}.jpg`;

          // 기존 이미지 URL 수집 (교체되는 이미지)
          const dbField = imageMapping[fieldName];
          const currentSettingForUpload = await getDetailPageSetting(userid); // 최신 정보 다시 조회
          if (currentSettingForUpload && currentSettingForUpload[dbField]) {
            notUsedImages.push(currentSettingForUpload[dbField]);
          }
          
          const allMarketImagesForUpload = await getAllMarketAccountsWithImages(userid);
          Object.values(allMarketImagesForUpload).forEach(accounts => {
            accounts.forEach(account => {
              if (account[dbField] && !notUsedImages.includes(account[dbField])) {
                 notUsedImages.push(account[dbField]);
              }
            });
          });
          
          // 각 계정별로 독립된 이미지 업로드 (비동기 병렬 처리)
          const uploadPromises = [];
          
          // common_setting용 독립 이미지 업로드
          const commonRandomFileName = generateRandomFileName(originalNameWithJpg);
          uploadPromises.push(
            uploadImageFromBuffer(
              compressedBuffer,
              commonRandomFileName,
              `userDetailPageImages/${userid}/common`,
              null,
              false,
              { userid: userid.toString(), type: 'common_setting' }
            ).then(result => ({ 
              type: 'common', 
              url: result.success ? result.url : null,
              success: result.success 
            }))
          );
          
          // 쿠팡 계정별 이미지 업로드
          for (const coopangAccount of marketAccounts.coopang) {
            const randomFileName = generateRandomFileName(originalNameWithJpg);
            uploadPromises.push(
              uploadImageFromBuffer(
                compressedBuffer,
                randomFileName,
                `userDetailPageImages/${userid}/coopang/${coopangAccount.shopid}`,
                null,
                false,
                { userid: userid.toString(), marketType: 'coopang', shopid: coopangAccount.shopid.toString() }
              ).then(result => ({
                type: 'coopang',
                shopid: coopangAccount.shopid,
                url: result.success ? result.url : null,
                success: result.success
              }))
            );
          }
          
          // 네이버 계정별 이미지 업로드
          for (const naverAccount of marketAccounts.naver) {
            const randomFileName = generateRandomFileName(originalNameWithJpg);
            uploadPromises.push(
              uploadImageFromBuffer(
                compressedBuffer,
                randomFileName,
                `userDetailPageImages/${userid}/naver/${naverAccount.shopid}`,
                null,
                false,
                { userid: userid.toString(), marketType: 'naver', shopid: naverAccount.shopid.toString() }
              ).then(result => ({
                type: 'naver',
                shopid: naverAccount.shopid,
                url: result.success ? result.url : null,
                success: result.success
              }))
            );
          }
          
          // 11번가 계정별 이미지 업로드
          for (const elevenstoreAccount of marketAccounts.elevenstore) {
            const randomFileName = generateRandomFileName(originalNameWithJpg);
            uploadPromises.push(
              uploadImageFromBuffer(
                compressedBuffer,
                randomFileName,
                `userDetailPageImages/${userid}/elevenstore/${elevenstoreAccount.shopid}`,
                null,
                false,
                { userid: userid.toString(), marketType: 'elevenstore', shopid: elevenstoreAccount.shopid.toString() }
              ).then(result => ({
                type: 'elevenstore',
                shopid: elevenstoreAccount.shopid,
                url: result.success ? result.url : null,
                success: result.success
              }))
            );
          }
          
          // ESM 계정별 이미지 업로드
          for (const esmAccount of marketAccounts.esm) {
            const randomFileName = generateRandomFileName(originalNameWithJpg);
            uploadPromises.push(
              uploadImageFromBuffer(
                compressedBuffer,
                randomFileName,
                `userDetailPageImages/${userid}/esm/${esmAccount.shopid}`,
                null,
                false,
                { userid: userid.toString(), marketType: 'esm', shopid: esmAccount.shopid.toString() }
              ).then(result => ({
                type: 'esm',
                shopid: esmAccount.shopid,
                url: result.success ? result.url : null,
                success: result.success
              }))
            );
          }
          
          // 모든 업로드를 병렬로 실행
          const uploadResults = await Promise.all(uploadPromises);
          
          // 업로드 결과 분리
          const uploadedImages = uploadResults.filter(result => result.success && result.type !== 'common');
          const commonUploadResult = uploadResults.find(result => result.type === 'common');
          
          // 업로드된 이미지들을 각 마켓별 계정 정보 테이블에 저장
          if (uploadedImages.length > 0) {
            await updateAllMarketDetailImages(userid, dbField, uploadedImages);
          }
          
          // common_setting 업데이트 (독립적인 이미지 사용)
          if (commonUploadResult && commonUploadResult.success) {
            updateData[dbField] = commonUploadResult.url;
          } else {
            validationErrors[fieldName] = ['공통 설정 이미지 업로드에 실패했습니다.'];
          }
        } catch (uploadError) {
          console.error('이미지 업로드 오류:', uploadError);
          validationErrors[fieldName] = ['이미지 업로드 중 오류가 발생했습니다.'];
        }
      }
    }
    // --- 이미지 업로드 처리 종료 ---
    
    // 사용하지 않는 이미지들을 not_used_image 테이블에 저장
    if (notUsedImages.length > 0) {
      const uniqueNotUsedImages = [...new Set(notUsedImages)]; // 중복 제거
      await saveNotUsedImages(userid, uniqueNotUsedImages, 'settingchange', '상세페이지 설정 변경');
    }
    
    // 유효성 검증 오류가 있으면 반환
    if (Object.keys(validationErrors).length > 0) {
      return {
        success: false,
        validationErrors
      };
    }
    
    // 설정 업데이트
    await updateDetailPageSetting(userid, updateData);
    
    // 업데이트된 설정 반환
    const updatedSetting = await getDetailPageSettingService(userid);
    
    return {
      success: true,
      data: updatedSetting
    };
  } catch (error) {
    console.error('상세페이지 설정 업데이트 서비스 오류:', error);
    throw error;
  }
};
