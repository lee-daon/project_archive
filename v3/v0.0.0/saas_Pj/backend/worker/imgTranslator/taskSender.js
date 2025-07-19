import { runTaskSender } from './mainworker.js';

runTaskSender().catch(err => {
  console.error('Task Sender 워커 실행 중 치명적 오류:', err);
  process.exit(1);
}); 