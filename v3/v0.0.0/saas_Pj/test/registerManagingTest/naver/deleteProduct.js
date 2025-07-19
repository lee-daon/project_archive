import { deleteProduct } from '../../../backend/modules/registeredManaging/service/naverControl/deleteProduct.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ES 모듈에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 프로젝트 루트에서 .env 파일 로드
dotenv.config({ path: path.join(__dirname, '../../.env') });



const clientId = process.env.NAVER_CLIENT_ID;
const clientSecret = process.env.NAVER_CLIENT_SECRET;

const sellerProductId = 11944023089;

console.log('=== 테스트 시작 ===');
const result = await deleteProduct(sellerProductId, clientId, clientSecret);

console.log('=== 결과 ===');
console.log(result);