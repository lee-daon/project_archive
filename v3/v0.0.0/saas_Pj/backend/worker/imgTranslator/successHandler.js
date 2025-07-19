import { runResultHandler } from './mainworker.js';
import { QUEUE_NAMES } from '../../common/config/settings.js';

const IMG_TRANSLATE_SUCCESS_QUEUE = QUEUE_NAMES.IMG_TRANSLATE_SUCCESS_QUEUE;

runResultHandler(IMG_TRANSLATE_SUCCESS_QUEUE, '이미지 번역 성공 결과 처리 워커', true).catch(err => {
  console.error('Success Handler 워커 실행 중 치명적 오류:', err);
  process.exit(1);
}); 