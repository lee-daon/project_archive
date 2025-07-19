/**
 * 네이버 등록용 이미지 처리 모듈
 * @module imageProcessing
 */
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import os from 'os';
import FormData from 'form-data';
import { generateSignature, getAuthToken } from './naver_auth.js';
import { cleanImageUrl, cleanImageArray } from '../../../../common/utils/Validator.js';

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
            responseType: 'stream',
            timeout: 30000, // 30초 타임아웃
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        const writer = fs.createWriteStream(outputPath);
        response.data.pipe(writer);
        
        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                resolve(outputPath);
            });
            writer.on('error', (error) => {
                console.error(`파일 쓰기 오류: ${outputPath}`, error);
                reject(error);
            });
        });
    } catch (error) {
        console.error(`이미지 다운로드 오류 (${imageUrl}):`, error.message);
        throw error;
    }
}

/**
 * 파일 확장자에 따른 Content-Type 반환
 * @param {string} extension - 파일 확장자 (.jpg, .png 등)
 * @returns {string} - MIME 타입
 */
function getContentType(extension) {
    switch (extension.toLowerCase()) {
        case '.jpg':
        case '.jpeg':
            return 'image/jpeg';
        case '.png':
            return 'image/png';
        case '.gif':
            return 'image/gif';
        case '.bmp':
            return 'image/bmp';
        default:
            return 'application/octet-stream';
    }
}

/**
 * 파일 헤더를 확인하여 실제 이미지 형식 검증
 * @param {string} filePath - 검증할 파일 경로
 * @returns {string|null} - 실제 이미지 형식 또는 null
 */
function validateImageFormat(filePath) {
    try {
        const buffer = fs.readFileSync(filePath);
        
        // 파일이 너무 작으면 유효하지 않음
        if (buffer.length < 10) {
            return null;
        }
        
        // JPEG 헤더 확인 (FF D8 FF)
        if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
            return 'jpeg';
        }
        
        // PNG 헤더 확인 (89 50 4E 47 0D 0A 1A 0A)
        if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
            return 'png';
        }
        
        // GIF 헤더 확인 (47 49 46 38)
        if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
            return 'gif';
        }
        
        // BMP 헤더 확인 (42 4D)
        if (buffer[0] === 0x42 && buffer[1] === 0x4D) {
            return 'bmp';
        }
        
        return null;
    } catch (error) {
        console.error('이미지 형식 검증 오류:', error);
        return null;
    }
}

/**
 * 네이버 API를 사용하여 이미지 업로드
 * @param {string[]} imagePaths - 업로드할 이미지 파일 경로 배열
 * @param {Object} naverApiAuth - 네이버 API 인증 정보 {clientId, clientSecret}
 * @returns {Promise<Object>} 업로드 결과
 */
async function uploadImagesToNaver(imagePaths, naverApiAuth) {
    try {
        // 파일 개수 제한 체크
        if (imagePaths.length > 10) {
            throw new Error('이미지는 최대 10개까지만 업로드할 수 있습니다.');
        }
        
        // 타임스탬프 생성
        const timestamp = Date.now();
        
        // 전자서명 생성
        const signature = generateSignature(naverApiAuth.clientId, naverApiAuth.clientSecret, timestamp);
        
        // 인증 토큰 발급 요청
        const tokenData = await getAuthToken(naverApiAuth.clientId, signature, 'SELF', '', timestamp);
        const accessToken = tokenData.access_token;
        
        // FormData 생성
        const formData = new FormData();
        
        // 파일 정보 확인 및 FormData에 추가
        for (let i = 0; i < imagePaths.length; i++) {
            const imagePath = imagePaths[i];
            
            // 파일 존재 여부 확인
            if (!fs.existsSync(imagePath)) {
                throw new Error(`이미지 파일이 존재하지 않습니다: ${imagePath}`);
            }
            
            // 파일 크기 확인 (10MB 제한)
            const stats = fs.statSync(imagePath);
            const fileSizeInMB = stats.size / (1024 * 1024);
            if (fileSizeInMB > 10) {
                throw new Error(`이미지 파일 크기가 10MB를 초과합니다: ${imagePath} (${fileSizeInMB.toFixed(2)}MB)`);
            }
            
            // 파일 확장자 확인
            let ext = path.extname(imagePath).toLowerCase();
            const validExtensions = ['.jpg', '.jpeg', '.gif', '.png', '.bmp'];
            
            if (!validExtensions.includes(ext)) {
                throw new Error(`지원하지 않는 이미지 형식입니다: ${ext}. 지원하는 형식: JPG, GIF, PNG, BMP`);
            }
            
            // 실제 이미지 형식 검증
            const actualFormat = validateImageFormat(imagePath);
            if (!actualFormat) {
                throw new Error(`올바른 이미지 파일이 아닙니다: ${imagePath}`);
            }
            
            // 확장자와 실제 형식 일치 확인
            const expectedFormats = {
                '.jpg': 'jpeg',
                '.jpeg': 'jpeg',
                '.png': 'png',
                '.gif': 'gif',
                '.bmp': 'bmp'
            };
            
            if (expectedFormats[ext] !== actualFormat) {
                // 실제 형식에 맞는 확장자로 변경
                const correctExt = actualFormat === 'jpeg' ? '.jpg' : `.${actualFormat}`;
                ext = correctExt;
            }
            
            // 영문 파일명 생성 (한글 파일명 문제 방지)
            const fileName = `image_${i}_${Date.now()}${ext}`;
            
            // FormData에 파일 추가
            const fileContent = fs.readFileSync(imagePath);
            formData.append('imageFiles', fileContent, {
                filename: fileName,
                contentType: getContentType(ext)
            });
        }
        
        // API 요청 설정
        const config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://api.commerce.naver.com/external/v1/product-images/upload',
            headers: { 
                ...formData.getHeaders(),
                'Accept': 'application/json;charset=UTF-8', 
                'Authorization': `Bearer ${accessToken}`
            },
            data: formData
        };
        
        // API 요청 실행
        const response = await axios.request(config);
        
        // 응답 데이터 반환
        return response.data;
        
    } catch (error) {
        console.error('네이버 이미지 업로드 오류:', error.response ? error.response.data : error.message);
        throw error;
    }
}

/**
 * 이미지 업로드 및 형식 변환 함수 (네이버 API 사용)
 * @param {string} representativeImage - 대표 이미지 URL
 * @param {string[]} images - 추가 이미지 URL 배열
 * @param {string} productId - 상품 ID
 * @param {Object} naverApiAuth - 네이버 API 인증 정보
 * @returns {Promise<Object>} 네이버 형식의 이미지 객체
 */
async function processAndUploadImages(representativeImage, images, productId, naverApiAuth) {
    // 임시 디렉토리 설정
    const tempDir = path.join(os.tmpdir(), `naver_img_upload_${productId}`);
    let downloadedFiles = []; // 삭제할 임시 파일 목록

    try {
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        
        // 이미지 URL 정리 및 검증
        const cleanedRepresentativeImage = cleanImageUrl(representativeImage);
        const cleanedImages = cleanImageArray(images);
        
        if (!cleanedRepresentativeImage) {
            throw new Error('대표 이미지 URL이 유효하지 않습니다.');
        }
        
        const imageUrls = [cleanedRepresentativeImage, ...cleanedImages];
        const imagePathsToUpload = [];
        
        for (let i = 0; i < imageUrls.length; i++) {
            const imageUrl = imageUrls[i];
            let targetPath = imageUrl;

            if (!imageUrl.startsWith('C:')) {
                const outputPath = path.join(tempDir, `raw_${i}${path.extname(imageUrl) || '.jpg'}`);
                try {
                    targetPath = await downloadImage(imageUrl, outputPath);
                    downloadedFiles.push(targetPath); // 삭제 목록에 추가
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
        const uploadResult = await uploadImagesToNaver(imagePathsToUpload, naverApiAuth);
        
        // 네이버 API 형식으로 변환
        const naverImageFormat = {
            representativeImage: {
                url: uploadResult.images[0].url
            },
            optionalImages: uploadResult.images.slice(1).map(img => ({ url: img.url }))
        };
        
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
            // 임시 디렉토리 삭제 오류는 무시
        }
    }
}

export { processAndUploadImages }; 