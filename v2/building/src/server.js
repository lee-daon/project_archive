import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import open from 'open';  // 이 패키지를 먼저 설치해야 합니다: npm install open

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
  // 서버 시작 시 자동으로 브라우저 열기
  open(`http://localhost:${PORT}`);
});
