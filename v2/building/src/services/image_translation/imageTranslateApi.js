import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';
import path from 'path';
import dotenv from 'dotenv';
import os from 'os';

dotenv.config();

/**
 * 이미지 파일을 번역하는 함수
 * @param {string} imagePath - 번역할 이미지 파일 경로
 * @param {string} targetLang - 번역 대상 언어 (기본값: 'ko')
 * @param {string} font - 사용할 폰트 (기본값: 'noto')
 * @param {boolean} strokeDisabled - 외곽선(stroke) 비활성화 여부 (기본값: false)
 * @param {string} outputPath - 결과 이미지 저장 경로 (기본값: null - 저장하지 않음)
 * @returns {Promise<Buffer|string>} - 번역된 이미지 버퍼 또는 저장된 파일 경로
 */
export async function translateImage(
  imagePath, 
  targetLang = 'ko', 
  font = 'noto', 
  strokeDisabled = false,
  outputPath = null
) {
  if (!fs.existsSync(imagePath)) {
    throw new Error(`파일이 존재하지 않습니다: ${imagePath}`);
  }

  const performRequest = async () => {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(imagePath));

    const rapidApiKey = process.env.RAPID_API_KEY;
    if (!rapidApiKey) {
      throw new Error('RAPID_API_KEY가 .env 파일에 설정되지 않았습니다.');
    }

    // API 요청 설정
    const options = {
      method: 'POST',
      url: 'https://torii-image-translator.p.rapidapi.com/upload',
      headers: {
        'x-rapidapi-host': 'torii-image-translator.p.rapidapi.com',
        'x-rapidapi-key': rapidApiKey,
        'font': font,
        'target_lang': targetLang,
        'stroke_disabled': strokeDisabled.toString(),
        ...formData.getHeaders()
      },
      data: formData,
      responseType: 'arraybuffer'
    };
    return axios(options);
  };

  let attempts = 0;
  const maxAttempts = 2;
  while (true) {
    try {
      const response = await performRequest();
      if (outputPath) {
        fs.writeFileSync(outputPath, response.data);
        return outputPath;
      } else {
        return response.data;
      }
    } catch (error) {
      if (error.response && error.response.status === 429 && attempts < maxAttempts) {
        attempts++;
        const delayMs = Math.floor(Math.random() * (10000 - 7000 + 1)) + 7000;
        console.warn(`429 에러 발생. ${delayMs / 1000}초 후 재시도합니다. (시도 ${attempts}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        continue;
      } else if (error.response) {
        console.error('응답 오류:', error.response.status);
        throw new Error(`API 응답 오류: ${error.response.status}`);
      } else if (error.request) {
        console.error('요청 오류:', error.message);
        throw new Error(`API 요청 오류: ${error.message}`);
      } else {
        console.error('오류:', error.message);
        throw error;
      }
    }
  }
}

/**
 * result 객체의 leftHalf와 rightHalf 이미지를 번역하고 임시 디렉토리에 저장하는 함수
 * @param {Object} result - 이미지 처리 결과 객체
 * @param {string} targetLang - 번역 대상 언어 (기본값: 'ko')
 * @param {string} font - 사용할 폰트 (기본값: 'noto')
 * @param {boolean} strokeDisabled - 외곽선(stroke) 비활성화 여부 (기본값: false)
 * @returns {Promise<Object>} - 번역된 이미지 경로를 포함한 객체
 */
export async function translateDividedImages(
  result, 
  targetLang = 'ko', 
  font = 'noto', 
  strokeDisabled = false
) {
  try {
    // 결과 객체 유효성 검사
    if (!result || !result.composite || !result.composite.dividedImages) {
      throw new Error('유효하지 않은 result 객체입니다.');
    }

    const { leftHalf, rightHalf } = result.composite.dividedImages;
    if (!leftHalf || !rightHalf) {
      throw new Error('분할된 이미지 경로가 유효하지 않습니다.');
    }

    // 임시 디렉토리 생성
    const timestamp = new Date().getTime();
    const tempDir = path.join(os.tmpdir(), `translated_images_${timestamp}`);
    
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // 번역된 이미지 저장 경로
    const translatedLeftPath = path.join(tempDir, 'translated_left_half.png');
    const translatedRightPath = path.join(tempDir, 'translated_right_half.png');

    // 병렬로 이미지 번역 실행
    const [translatedLeft, translatedRight] = await Promise.all([
      translateImage(leftHalf, targetLang, font, strokeDisabled, translatedLeftPath),
      translateImage(rightHalf, targetLang, font, strokeDisabled, translatedRightPath)
    ]);

    // 결과 반환
    return {
      tempDir,
      translatedImages: {
        leftHalf: translatedLeft,
        rightHalf: translatedRight
      }
    };
  } catch (error) {
    console.error('분할 이미지 번역 오류:', error.message);
    throw error;
  }
}


