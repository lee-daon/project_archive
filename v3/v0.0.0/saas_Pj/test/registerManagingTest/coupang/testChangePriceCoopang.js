import { changePrice } from '../../../backend/modules/registeredManaging/service/coopangControl/changePrice.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ES 모듈에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 프로젝트 루트에서 .env 파일 로드
dotenv.config({ path: path.join(__dirname, '../../.env') });



const accessKey = process.env.COOPANG_ACCESS_KEY;
const secretKey = process.env.COOPANG_SECRET_KEY;

const sellerProductId = 15607431994;

console.log('=== 테스트 시작 ===');
const result = await changePrice(accessKey, secretKey, sellerProductId, 10);

console.log('=== 결과 ===');
console.log(result);