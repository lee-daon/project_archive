import { getFromQueue } from '../../common/utils/redisClient.js';
// V1 API (주석처리)
// import { getProductDetail } from '../../common/utils/taobaoApi.js';
// import { saveProductDetail } from './db/saveProductDetail.js';
// V2 API (현재 사용)
import { getProductDetail_V2 } from '../../common/utils/taobaoApi.js';
import { saveProductDetail_v2 } from './db/saveProductDetail_v2.js';
import { checkBanStatus } from './db/banCheck.js';
import { copyExistingProductData } from './db/copyExistingProductData.js';
import { 
  updateToSuccess,
  updateToApiFailure, 
  updateToSaveFailure, 
  updateToShopBanned, 
  updateToSellerBanned 
} from './db/controlSorcingStatus.js';
import { QUEUE_NAMES, API_SETTINGS } from '../../common/config/settings.js';
import pLimit from 'p-limit';
import { saveErrorLog } from '../../common/utils/assistDb/error_log.js';

// 큐 이름 상수
const QUEUE_NAME = QUEUE_NAMES.TAOBAO_DETAIL_QUEUE;
const PROCESS_INTERVAL_MS = API_SETTINGS.TAOBAO_WORKER_DELAY_MS; // 설정된 간격마다 작업 처리

// p-limit 설정 - 동시 실행 작업 수 제한
const limit = pLimit(API_SETTINGS.CONCURRENCY_LIMITS.TAOBAO_WORKER);

/**
 * 단일 작업을 처리하는 함수
 * @param {Object} job - 작업 데이터
 * @returns {Promise<Object>} - 처리 결과
 */
async function processJob(job) {
  const { userid, productId, productName, sameCategoryId } = job;
  console.log(`상품 처리 시작 [userid: ${userid}, productId: ${productId}, productName: ${productName}, sameCategoryId: ${sameCategoryId}]`);
  
  try {
    // 1. 기존 데이터 복사 시도
    console.log(`기존 데이터 복사 시도: ${productId}`);
    const copyResult = await copyExistingProductData(productId, userid, productName, sameCategoryId);
    
    if (copyResult.canReuse && copyResult.success) {
      // 복사 성공시 금지 상태 확인
      const sellerid = copyResult.data.sellerId || '';
      const shopid = copyResult.data.shopId || '';
      
      const banStatus = await checkBanStatus(userid, sellerid, shopid);
      
      if (banStatus.isBanned) {
        console.log(`복사된 데이터의 금지 상태 감지 [userid: ${userid}, productId: ${productId}]: ${banStatus.reason} - ${banStatus.message}`);
        
        // 금지 상태에 따라 DB 업데이트
        if (banStatus.reason === 'banseller') {
          await updateToSellerBanned(userid, productId);
        } else if (banStatus.reason === 'banshop') {
          await updateToShopBanned(userid, productId);
        }
        
        return {
          success: false,
          status: banStatus.reason,
          message: banStatus.message
        };
      }
      
      // 성공 상태로 업데이트
      await updateToSuccess(userid, productId);
      
      console.log(`상품 처리 완료 (기존 데이터 복사) [productId: ${productId}]`);
      return {
        success: true,
        status: 'uncommit',
        message: '기존 데이터를 복사하여 상품 처리 완료',
        data: copyResult.data,
        method: 'copy'
      };
    }
    
    // 2. 기존 데이터 복사 실패시 API 호출로 처리
    console.log(`기존 데이터 복사 불가능, API 호출 시작: ${productId}`);
    // V1 API (주석처리)
    // const productDetailResponse = await getProductDetail(productId);
    // V2 API (현재 사용)
    const productDetailResponse = await getProductDetail_V2(productId);
    
    // API 호출 실패 시
    // V1 API 검증 (주석처리)
    // if (!productDetailResponse || productDetailResponse.error) {
    // V2 API 검증 (현재 사용)
    if (!productDetailResponse || !productDetailResponse.success || !productDetailResponse.data) {
      console.error(`API 호출 실패 [productId: ${productId}]:`, productDetailResponse?.error || '응답 없음');
      await updateToApiFailure(userid, productId);
      return { 
        success: false, 
        status: 'failapi',
        message: `API 호출 실패: ${productDetailResponse?.error || '응답 없음'}`
      };
    }
    
    // 3. 판매자와 상점의 금지 여부 확인
    // V1 API 응답 구조 (주석처리)
    // const seller = productDetailResponse.result.seller || {};
    // const sellerid = seller.seller_id || '';
    // const shopid = seller.shop_id || '';
    
    // V2 API 응답 구조 (현재 사용)
    const data = productDetailResponse.data || {};
    const sellerid = data.sellerId || '';
    
    // shopUrl에서 shopId 추출 (예: https://shop105432059.taobao.com -> 105432059)
    let shopid = '';
    if (data.shopUrl) {
      const shopMatch = data.shopUrl.match(/shop(\d+)\.taobao\.com/);
      if (shopMatch) {
        shopid = shopMatch[1];
      }
    }
    
    const banStatus = await checkBanStatus(userid, sellerid, shopid);
    
    if (banStatus.isBanned) {
      console.log(`금지 상태 감지 [userid: ${userid}, productId: ${productId}]: ${banStatus.reason} - ${banStatus.message}`);
      
      // 금지 상태에 따라 DB 업데이트
      if (banStatus.reason === 'banseller') {
        await updateToSellerBanned(userid, productId);
      } else if (banStatus.reason === 'banshop') {
        await updateToShopBanned(userid, productId);
      }
      
      return {
        success: false,
        status: banStatus.reason,
        message: banStatus.message
      };
    }
    
    // 4. 상품 상세 정보 저장
    console.log(`DB 저장 시작 [productId: ${productId}]`);
    // V1 API (주석처리)
    // const saveResult = await saveProductDetail(productDetailResponse, userid, job);
    // V2 API (현재 사용)
    const saveResult = await saveProductDetail_v2(productDetailResponse, userid, job);
    
    // 저장 실패 시
    if (!saveResult.success) {
      console.error(`DB 저장 실패 [productId: ${productId}]:`, saveResult.message);
      await updateToSaveFailure(userid, productId);
      return {
        success: false,
        status: 'failsave',
        message: saveResult.message
      };
    }
    
    // 5. 성공 상태로 업데이트
    await updateToSuccess(userid, productId);
    
    console.log(`상품 처리 완료 (API 호출) [productId: ${productId}]`);
    return {
      success: true,
      status: 'uncommit',
      message: '상품 상세 정보 처리 완료',
      data: saveResult.data,
      method: 'api'
    };
  } catch (error) {
    console.error(`상품 처리 중 오류 [productId: ${productId}]:`, error.message);

    // 오류 로그 저장
    await saveErrorLog(userid, productId, error.message);

    // API 관련 에러인지 확인하여 상태 분기 처리
    if (error.message.includes('API') || error.message.includes('상품정보가 존재하지 않습니다')) {
      await updateToApiFailure(userid, productId);
      return {
        success: false,
        status: 'failapi',
        message: `처리 중 오류 발생: ${error.message}`
      };
    }

    // 그 외의 모든 에러는 저장 실패로 처리
    await updateToSaveFailure(userid, productId);
    return {
      success: false,
      status: 'failsave',
      message: `처리 중 오류 발생: ${error.message}`
    };
  }
}


/**
 * 워커 실행 함수
 */
async function runWorker() {
  console.log(`타오바오 상세 정보 워커 시작`);
  console.log(`큐 모니터링 중: ${QUEUE_NAME}`);
  console.log(`처리 간격: ${PROCESS_INTERVAL_MS}ms`);

  let processedCount = 0;
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  // 프로세스 종료 시 안전하게 종료
  process.on('SIGTERM', () => {
    console.log('SIGTERM 신호 수신, 워커 종료 중...');
    process.exit(0);
  });
  process.on('SIGINT', () => {
    console.log('SIGINT 신호 수신, 워커 종료 중...');
    process.exit(0);
  });

  // 순차적으로 하나씩 작업 가져와 일정 간격으로 처리
  while (true) {
    try {
      // timeout=0으로 무한 대기 -> 대기 중 중첩 호출 없음
      const job = await getFromQueue(QUEUE_NAME, 0);
      if (job) {
        processedCount++;
        limit(() => processJob(job)).then(result => {
          if (result.success) {
            const method = result.method === 'copy' ? '데이터 복사' : 'API 호출';
            console.log(`처리 성공: ${job.productId} (${method})`);
          } else {
            console.log(`처리 실패: ${job.productId} - ${result.status}`);
          }
        }).catch(error => {
          console.error(`작업 처리 중 오류: 상품 ${job.productId}`, error);
        });

        if (processedCount % 100 === 0) {
          console.log(`===== 처리 통계 =====`);
          console.log(`총 처리된 작업: ${processedCount}`);
          console.log(`=====================`);
        }
      }
    } catch (error) {
      console.error('워커 처리 중 오류:', error);
    }

    // API rate limit 유지
    await sleep(PROCESS_INTERVAL_MS);
  }
}

// 워커 시작
runWorker().catch(error => {
  console.error('워커 시작 중 치명적 오류:', error);
  process.exit(1);
});
