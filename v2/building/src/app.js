import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import uploadRouter from './routes/sourcing/upload.js';
import updatabanRouter from './routes/sourcing/updataban.js';
import detailparselistRouter from './routes/sourcing/detailparselist.js';
import updatestatusRouter from './routes/sourcing/updatestatus.js';
import getbyshopRouter from './routes/sourcing/getbyshop.js';
import brandfilterRouter from './routes/processing/brandfilter.js';
import brandfilter2Router from './routes/processing/brandfilter2.js';
import translatedetailRouter from './routes/processing/translatedetail.js';
import getstatusRouter from './routes/getstatus.js';
import brandbanRouter from './routes/processing/brandban.js';
import processingRouter from './routes/processing/getstatus.js';
import processing_startRouter from './routes/processing/processing_start.js';
import categoryRouter from './routes/register/category.js';
import pre_registerRouter from './routes/register/pre_register.js';
import stagingRouter from './routes/register/staging.js';
import discard_productsRouter from './routes/register/discard_products.js';
import getRegisterInfoRouter from './routes/register/getRegisterInfo.js';
import registInCoopangRouter from './routes/register/registInCoopang.js';
import registInNaverRouter from './routes/register/registInNaver.js';
import categoryAdviserRouter from './routes/register/category_adviser.js';
const app = express();

// ES 모듈에서 __dirname 사용을 위한 설정
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 프로젝트 루트의 public 폴더를 정적 파일 제공 폴더로 설정
app.use(express.static(path.join(__dirname, '..', 'public')));

// main_front 폴더도 정적 파일로 제공
app.use(express.static(path.join(__dirname, '..', 'main_front')));

// JSON 파싱 및 CORS를 위한 미들웨어
app.use(express.json());
app.use(cors());

// 전역 데이터 저장용 (app.locals 사용)
app.locals.storedData = {
  bancheckedTarget: [],
  finalTargetCount: 0,
  duplicationCount: 0,
  includeBanCount: 0,
  totalCount: 0
};
// setupinfo 정보저장용-추후 db차원에서 저장할 것
app.locals.setupinfo = {
  successCount: 0,
  totalCount: 0,
  failApiCount: 0,
  failSaveCount: 0,
  productIds: [], 
}
// 가공 대상 정보 저장용
app.locals.processinginfo = {
  totalCount: 0,
  productIds: [],
  propPaths: []
}
// 브랜드 필터링 데이터 저장용
app.locals.brandban = [];

// 전역 translateoption 초기화
app.locals.translateoption = {};

app.use('/src', getbyshopRouter);

app.use('/src', uploadRouter);

app.use('/src', updatabanRouter);

app.use('/src', detailparselistRouter);

app.use('/src', updatestatusRouter);
///////////////////////////////////////////////////////////
app.use('/prc', brandfilterRouter);

app.use('/prc', brandfilter2Router);

app.use('/prc', translatedetailRouter);

app.use('/api', getstatusRouter);

app.use('/prc', brandbanRouter);

app.use('/prc', processingRouter);

app.use('/prc', processing_startRouter);
///////////////////////////////////////////////////////////
app.use('/reg', categoryRouter);

app.use('/reg', pre_registerRouter);

app.use('/reg', stagingRouter);

app.use('/reg', discard_productsRouter);

app.use('/reg', categoryAdviserRouter);

app.use('/reg/register', getRegisterInfoRouter);
app.use('/reg/register', registInCoopangRouter);
app.use('/reg/register', registInNaverRouter);

// 루트 경로에 접속 시 main.html로 리다이렉트
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'main_front', 'main.html'));
});

//fe2 업데이트용용
app.get('/src/listcheck', (req, res) => {
  console.log(req.app.locals.storedData.bancheckedTarget.length);
  res.json(req.app.locals.storedData);
});

// 소싱 페이지 업데이트용용// setupinfo API 엔드포인트 추가
app.get('/src/getstatus/setupinfo', (req, res) => {
  res.json(req.app.locals.setupinfo || { 
    successCount: 0, 
    failApiCount: 0, 
    failSaveCount: 0,
    totalCount: 0,
    productIds: []
  });
});

export default app;
