import { runResultHandler } from './mainworker.js';
import { QUEUE_NAMES } from '../../common/config/settings.js';

const IMG_TRANSLATE_ERROR_QUEUE = QUEUE_NAMES.IMG_TRANSLATE_ERROR_QUEUE;

runResultHandler(IMG_TRANSLATE_ERROR_QUEUE, '이미지 번역 에러 결과 처리 워커', false).catch(err => {
  console.error('Error Handler 워커 실행 중 치명적 오류:', err);
  process.exit(1);
}); 