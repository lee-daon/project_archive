import axios from "axios";
import sharp from "sharp";
import dotenv from "dotenv";

dotenv.config();
const IMG_DOWNLOAD_WORKER_URL = process.env.IMG_DOWNLOAD_WORKER_URL;

const IMG_DOWNLOAD_API = `${IMG_DOWNLOAD_WORKER_URL}/`;
const IMG_UPLOAD_API = `${IMG_DOWNLOAD_WORKER_URL}/jpg`;
const AUTH_KEY = process.env.IMG_DOWNLOAD_AUTH_KEY;

// 재시도 로직을 위한 함수
async function retryRequest(requestFn, maxRetries = 3, delay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      console.log(`요청 실패 (${i + 1}/${maxRetries}), ${delay}ms 후 재시도...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // 지수적 백오프
    }
  }
}

/**
 * 이미지 URL을 받아 다운로드하고, webp를 jpg로 변환한 후,
 * 다시 업로드하여 호스팅 URL을 반환합니다.
 * @param {string} imageUrl - 다운로드할 원본 이미지 URL
 * @returns {Promise<string|null>} 호스팅된 이미지 URL 또는 실패 시 null
 */
async function downloadAndHostImage(imageUrl) {
  if (!AUTH_KEY) {
    console.error("IMG_DOWNLOAD_AUTH_KEY 환경변수가 설정되지 않았습니다.");
    return null;
  }

  try {
    // 1. 이미지 다운로드 요청 (재시도 로직과 타임아웃 추가)
    const downloadResponse = await retryRequest(async () => {
      return await axios.post(
        IMG_DOWNLOAD_API,
        { url: imageUrl },
        {
          headers: {
            "Content-Type": "application/json",
            "X-Auth-Key": AUTH_KEY,
          },
          responseType: "arraybuffer",
          timeout: 30000, // 30초 타임아웃
        }
      );
    });

    const contentType = downloadResponse.headers["content-type"];

    // 2. 응답 Content-Type에 따라 처리 분기
    if (contentType && contentType.includes("application/json")) {
      // 2-1. JPG/PNG의 경우, R2에 저장된 URL을 JSON으로 받음
      const responseData = JSON.parse(Buffer.from(downloadResponse.data).toString("utf-8"));
      if (responseData.success && responseData.hostedUrl) {
        return responseData.hostedUrl;
      } else {
        console.error("이미지 다운로드 API가 성공했으나, URL이 올바르지 않습니다:", responseData);
        return null;
      }
    } else if (contentType && contentType.includes("image/")) {
      // 2-2. WebP 등 다른 형식의 경우, 바이너리를 받아 JPG로 변환 후 업로드
      const imageBuffer = await sharp(downloadResponse.data).jpeg().toBuffer();

      const uploadResponse = await retryRequest(async () => {
        return await axios.post(IMG_UPLOAD_API, imageBuffer, {
          headers: {
            "Content-Type": "image/jpeg",
            "X-Auth-Key": AUTH_KEY,
          },
          timeout: 30000, // 30초 타임아웃
        });
      });

      if (uploadResponse.data && uploadResponse.data.hostedUrl) {
        return uploadResponse.data.hostedUrl;
      } else {
        console.error("JPG 업로드 후 URL을 받지 못했습니다:", uploadResponse.data);
        return null;
      }
    } else {
      console.error(`예상치 못한 Content-Type: ${contentType}`);
      return null;
    }
  } catch (error) {
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET') {
      console.error(`네트워크 연결 실패 (URL: ${imageUrl}):`, error.message);
    } else {
      console.error(`이미지 처리 중 오류 발생 (URL: ${imageUrl}):`, error.message);
    }
    
    if (error.response && error.response.data) {
      // 오류 응답이 바이너리일 수 있으므로 텍스트로 변환 시도
      try {
        const errorData = JSON.parse(Buffer.from(error.response.data).toString("utf-8"));
        console.error("오류 응답 데이터:", errorData);
      } catch (e) {
        console.error("오류 응답 데이터를 파싱할 수 없습니다.");
      }
    }
    return null;
  }
}

export { downloadAndHostImage };
