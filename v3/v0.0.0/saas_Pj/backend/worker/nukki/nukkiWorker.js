import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { getFromQueue } from '../../common/utils/redisClient.js';
import { processNukki } from './assist/nukkiProcessor.js';
import { QUEUE_NAMES, API_SETTINGS } from '../../common/config/settings.js';

dotenv.config();

// 작업 큐 이름
const NUKKI_QUEUE = QUEUE_NAMES.NUKKI_IMAGE_QUEUE;

// 작업 간 대기 시간(ms)
const PROCESS_INTERVAL = API_SETTINGS.NUKKI_PROCESS_INTERVAL;

/**
 * 임시 폴더 정리 함수
 * @returns {Promise<void>}
 */
async function cleanupTempDir() {
  const tempDir = path.join(process.cwd(), 'temp');
  
  try {
    // 임시 폴더가 없으면 생성
    if (!fs.existsSync(tempDir)) {
      await fs.promises.mkdir(tempDir, { recursive: true });
      console.log('임시 폴더 생성됨:', tempDir);
      return;
    }
    
    // 임시 폴더의 파일 목록 가져오기
    const files = await fs.promises.readdir(tempDir);
    
    // 누끼 처리 관련 임시 파일만 필터링
    const nukkiTempFiles = files.filter(file => 
      (file.includes('_temp.jpg') || 
       file.includes('_resized.jpg') || 
       file.includes('_transparent.png'))
    );
    
    if (nukkiTempFiles.length === 0) {
      console.log('정리할 임시 파일이 없습니다.');
      return;
    }
    
    console.log(`${nukkiTempFiles.length}개의 임시 파일 정리 중...`);
    
    // 파일 삭제
    for (const file of nukkiTempFiles) {
      const filePath = path.join(tempDir, file);
      try {
        await fs.promises.unlink(filePath);
      } catch (error) {
        console.warn(`임시 파일 삭제 실패: ${file}`, error.message);
      }
    }
    
    console.log('임시 폴더 정리 완료');
  } catch (error) {
    console.error('임시 폴더 정리 중 오류:', error);
  }
}

/**
 * 누끼 작업 처리 함수
 * @param {Object} task - 큐에서 가져온 작업
 * @returns {Promise<Object>} 작업 처리 결과
 */
async function processTask(task) {
  try {
    console.log(`작업 처리 시작: 사용자 ${task.userId}, 상품 ${task.productId}, 순서 ${task.order}`);
    
    // 누끼 이미지 처리
    const result = await processNukki(
      task.userId,
      task.productId,
      task.order || 0
    );
    
    console.log(`작업 처리 완료: 사용자 ${task.userId}, 상품 ${task.productId}, 결과: ${result.success ? '성공' : '실패'}`);
    return result;
  } catch (error) {
    console.error(`작업 처리 중 오류: ${error.message}`);
    return {
      success: false,
      error: error.message,
      task
    };
  }
}

/**
 * 메인 작업 루프
 */
async function startWorker() {
  console.log('누끼 워커 시작됨');
  
  // 시작 시 임시 폴더 정리
  await cleanupTempDir();
  
  // 30분마다 임시 폴더 정리
  setInterval(cleanupTempDir, 30 * 60 * 1000);
  
  while (true) {
    try {
      // 큐에서 작업 가져오기
      const task = await getFromQueue(NUKKI_QUEUE, 0);
      
      if (task) {
        console.log(`새 작업 수신: 사용자 ${task.userId}, 상품 ${task.productId}`);
        
        // 작업 실행
        await processTask(task);
        
        // 다음 작업 처리 전 지정된 시간만큼 대기
        await new Promise(resolve => setTimeout(resolve, PROCESS_INTERVAL));
      }
    } catch (error) {
      console.error('워커 실행 중 오류:', error);
      
      // 오류 발생 시 잠시 대기 후 재시도
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

// 워커 시작
startWorker().catch(error => {
  console.error('누끼 워커 실행 중 치명적 오류:', error);
  process.exit(1);
});
