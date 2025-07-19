import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeOps } from './ops/index.js';
// import open from 'open';  // 이 패키지를 먼저 설치해야 합니다: npm install open

// ES 모듈에서 __dirname 사용
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PORT 환경변수가 없으면 3000을 기본 포트로 사용합니다.
const PORT = process.env.PORT || 3000;

// 워커 프로세스 시작 함수
function startWorker(workerPath, workerName) {
  console.log(`${workerName} 시작 중...`);
  
  const workerProcess = spawn('node', [workerPath], {
    stdio: 'inherit', // 부모 프로세스와 IO 공유
    cwd: process.cwd() // 현재 작업 디렉토리 사용
  });
  
  workerProcess.on('close', (code) => {
    console.log(`${workerName} 종료됨 (코드: ${code})`);
    
    // 워커가 비정상 종료되면 5초 후 재시작
    if (code !== 0) {
      console.log(`${workerName} 5초 후 재시작...`);
      setTimeout(() => {
        startWorker(workerPath, workerName);
      }, 5000);
    }
  });
  
  return workerProcess;
}

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
  
  // 타오바오 상세 정보 워커 시작
  const taobaoWorkerPath = path.join(__dirname, 'worker', 'taobaodetail', 'taobaoworker.js');
  startWorker(taobaoWorkerPath, '타오바오 상세 정보 워커');
  
  // 번역 워커 시작
  const translatorWorkerPath = path.join(__dirname, 'worker', 'translator', 'worker.js');
  startWorker(translatorWorkerPath, '번역 워커');
  
  // 누끼 이미지 처리 워커 시작
  const nukkiWorkerPath = path.join(__dirname, 'worker', 'nukki', 'nukkiWorker.js');
  startWorker(nukkiWorkerPath, '누끼 이미지 처리 워커');
  
  // --- 이미지 번역 워커들을 개별 프로세스로 시작 ---
  const taskSenderPath = path.join(__dirname, 'worker', 'imgTranslator', 'taskSender.js');
  startWorker(taskSenderPath, '이미지 번역 작업 전송 워커');

  const successHandlerPath = path.join(__dirname, 'worker', 'imgTranslator', 'successHandler.js');
  startWorker(successHandlerPath, '이미지 번역 성공 핸들러');

  const errorHandlerPath = path.join(__dirname, 'worker', 'imgTranslator', 'errorHandler.js');
  startWorker(errorHandlerPath, '이미지 번역 에러 핸들러');
  
  // 네이버 등록 워커 시작
  const naverRegisterWorkerPath = path.join(__dirname, 'worker', 'naverRegister', 'worker.js');
  startWorker(naverRegisterWorkerPath, '네이버 등록 워커');
  
  // 쿠팡 등록 워커 시작
  const coopangRegisterWorkerPath = path.join(__dirname, 'worker', 'coopangRegister', 'worker.js');
  startWorker(coopangRegisterWorkerPath, '쿠팡 등록 워커');

  const elevenstoreRegisterWorkerPath = path.join(__dirname, 'worker', 'elevenStoreRegister', 'worker.js');
  startWorker(elevenstoreRegisterWorkerPath, '11번가 등록 워커');

  // 가격 변경 워커 시작
  const priceChangerWorkerPath = path.join(__dirname, 'worker', 'priceChanger', 'worker.js');
  startWorker(priceChangerWorkerPath, '가격 변경 워커');

  // 마켓 상품 관리 워커 시작
  const marketProductRemoverWorkerPath = path.join(__dirname, 'worker', 'marketProductRemover', 'worker.js');
  startWorker(marketProductRemoverWorkerPath, '마켓 상품 관리 워커');

  // 이미지 다운로드 워커 시작
  const imgDownloadWorkerPath = path.join(__dirname, 'worker', 'imgDownloader', 'worker.js');
  startWorker(imgDownloadWorkerPath, '이미지 다운로드 워커');

  // Ops 모듈 초기화 (cron 작업 시작)
  initializeOps();
});

// 프로세스 종료 시 정리 작업
process.on('SIGINT', () => {
  console.log('서버 종료 중...');
  process.exit();
});

process.on('SIGTERM', () => {
  console.log('서버 종료 중...');
  process.exit();
});
