import fs from 'fs';
import path from 'path';
import tmp from 'tmp';
import dotenv from 'dotenv';
import { downloadImage } from '../../src/services/image_translation/downloadImages.js';
import { translateImage } from '../../src/services/image_translation/imageTranslateApi.js';

// .env 파일 로드 (프로젝트 루트 기준)
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// 임시 디렉토리 생성 (스크립트 종료 시 자동 정리되도록 설정)
// removeCallback 함수를 직접 호출할 필요 없이, 프로세스 종료 시 정리됩니다.
const tmpDirObject = tmp.dirSync({ unsafeCleanup: true });
const tempDir = tmpDirObject.name;
console.log(`임시 디렉토리 생성됨: ${tempDir}`);

// 즉시 실행 비동기 함수 (IIAFE) 사용
(async () => {
  try {
    // 1. 설정
    // 테스트에 사용할 공개 이미지 URL (간단한 영문 텍스트 포함)
    const imageUrl = 'https://img.alicdn.com/imgextra/i3/211816929/O1CN010BBOOH213X31JlFyv_!!211816929.jpg';
    const targetLang = 'ko'; // 번역 목표 언어: 한국어
    const downloadedFileName = 'downloaded_image.png';
    const translatedFileName = 'translated_image.png';

    // 임시 디렉토리 내 파일 경로 설정
    const downloadedImagePath = path.join(tempDir, downloadedFileName);
    const translatedImagePath = path.join(tempDir, translatedFileName);

    // API 키 확인
    if (!process.env.RAPID_API_KEY) {
      throw new Error('RAPID_API_KEY가 .env 파일에 설정되지 않았습니다. 스크립트를 실행할 수 없습니다.');
    }
    console.log('RAPID_API_KEY 확인됨.');

    // 2. 이미지 다운로드
    console.log(`이미지 다운로드 중... URL: ${imageUrl}`);
    await downloadImage(imageUrl, downloadedImagePath);
    console.log(`이미지 다운로드 완료: ${downloadedImagePath}`);
    if (!fs.existsSync(downloadedImagePath)) {
        throw new Error(`다운로드된 이미지를 찾을 수 없습니다: ${downloadedImagePath}`);
    }

    // 3. 이미지 번역 (실제 API 호출)
    console.log(`이미지 번역 중... 대상 언어: ${targetLang}`);
    const resultPath = await translateImage(
      downloadedImagePath,
      targetLang,
      'noto', // 사용할 폰트
      false,   // 외곽선(stroke) 비활성화 여부
      translatedImagePath // 번역된 이미지 저장 경로 지정
    );

    // 4. 결과 출력
    if (fs.existsSync(resultPath)) {
        console.log('------------------------------------------');
        console.log('✅ 번역 완료!');
        console.log(`번역된 이미지 경로: ${resultPath}`);
        console.log('------------------------------------------');
    } else {
        throw new Error(`번역된 이미지 파일을 찾을 수 없습니다: ${resultPath}`);
    }

  } catch (error) {
    console.error('오류 발생:', error.message);
    // 스택 트레이스도 출력하여 디버깅 용이하게 함
    if (error.stack) {
        console.error(error.stack);
    }
  } finally {
    // 임시 디렉토리 정리 (선택 사항: tmp.dirSync는 기본적으로 프로세스 종료 시 정리됨)
    // 명시적으로 정리하려면 아래 주석 해제. 단, 오류 발생 시에도 정리됨.
    // try {
    //   if (fs.existsSync(tempDir)) {
    //     fs.rmSync(tempDir, { recursive: true, force: true });
    //     console.log(`임시 디렉토리 정리 완료: ${tempDir}`);
    //   }
    // } catch (cleanupError) {
    //   console.error(`임시 디렉토리 정리 중 오류 발생: ${cleanupError.message}`);
    // }
    // tmp 라이브러리의 자동 정리를 신뢰하는 경우 finally 블록이 필요 없을 수 있습니다.
  }
})(); // IIAFE 호출
