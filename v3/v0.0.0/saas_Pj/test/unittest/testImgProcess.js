import { addToQueue } from '../../backend/common/utils/redisClient.js';
import { promisePool } from '../../backend/common/utils/connectDB.js';
import { QUEUE_NAMES } from '../../backend/common/config/settings.js';

// 기존 실제 상품 ID들 (실제 DB에 있는 데이터)
const EXISTING_PRODUCT_IDS = [606782037692, 617739847699];

/**
 * 기존 이미지 데이터 조회
 */
async function getExistingImageData() {
  const connection = await promisePool.getConnection();
  
  try {
    console.log('🔍 기존 이미지 데이터 조회 중...');
    
    // 메인 이미지 조회 (//img.alicdn.com으로 시작하는 것들만)
    const [mainImages] = await connection.query(
      `SELECT productid, imageurl, imageorder 
       FROM item_images_raw 
       WHERE productid IN (?, ?) 
       AND imageurl LIKE '//img.alicdn.com%'
       ORDER BY productid, imageorder`,
      EXISTING_PRODUCT_IDS
    );
    
    // 상세 이미지 조회
    const [descImages] = await connection.query(
      `SELECT productid, imageurl, imageorder 
       FROM item_images_des_raw 
       WHERE productid IN (?, ?) 
       AND imageurl LIKE '//img.alicdn.com%'
       ORDER BY productid, imageorder`,
      EXISTING_PRODUCT_IDS
    );
    
    // 옵션 이미지 조회 (product_options에서 같은 패턴)
    const [optionImages] = await connection.query(
      `SELECT prop_path, imageurl 
       FROM product_options 
       WHERE imageurl LIKE '//img.alicdn.com%'
       ORDER BY prop_path
       LIMIT 5`
    );
    
    console.log(`📊 발견된 이미지:
    - 메인 이미지: ${mainImages.length}개
    - 상세 이미지: ${descImages.length}개  
    - 옵션 이미지: ${optionImages.length}개`);
    
    return { mainImages, descImages, optionImages };
    
  } catch (error) {
    console.error('❌ 기존 데이터 조회 실패:', error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Redis 큐에 이미지 다운로드 작업 추가 (기존 데이터 기반)
 */
async function addImageDownloadJobs() {
  console.log('📤 Redis 큐에 이미지 다운로드 작업 추가 중...');
  
  const { mainImages, descImages, optionImages } = await getExistingImageData();
  let jobCount = 0;
  
  // 메인 이미지 작업들
  for (const img of mainImages) {
    // //로 시작하는 URL을 https:로 변환
    const fullUrl = img.imageurl.startsWith('//') ? 'https:' + img.imageurl : img.imageurl;
    
    await addToQueue(QUEUE_NAMES.IMAGE_DOWNLOAD_QUEUE, {
      productid: img.productid,
      imageurl: fullUrl,
      imageType: 'main',
      imageorder: img.imageorder
    });
    jobCount++;
  }
  
  // 상세 이미지 작업들
  for (const img of descImages) {
    const fullUrl = img.imageurl.startsWith('//') ? 'https:' + img.imageurl : img.imageurl;
    
    await addToQueue(QUEUE_NAMES.IMAGE_DOWNLOAD_QUEUE, {
      productid: img.productid,
      imageurl: fullUrl,
      imageType: 'description',
      imageorder: img.imageorder
    });
    jobCount++;
  }
  
  // 옵션 이미지 작업들
  console.log('\n🔍 옵션 이미지 큐 추가 중...');
  for (const img of optionImages) {
    if (img.imageurl) {
      const fullUrl = img.imageurl.startsWith('//') ? 'https:' + img.imageurl : img.imageurl;
      
      console.log(`  옵션 추가: ${img.prop_path} -> ${fullUrl.substring(0, 50)}...`);
      
      await addToQueue(QUEUE_NAMES.IMAGE_DOWNLOAD_QUEUE, {
        imageurl: fullUrl,
        imageType: 'option',
        prop_path: img.prop_path
      });
      jobCount++;
    }
  }
  
  console.log(`✅ 총 ${jobCount}개 작업을 큐에 추가했습니다.`);
  console.log('📋 큐 이름:', QUEUE_NAMES.IMAGE_DOWNLOAD_QUEUE);
  
  return jobCount;
}

/**
 * 처리 결과 확인
 */
async function checkResults() {
  const connection = await promisePool.getConnection();
  
  try {
    console.log('🔍 처리 결과 확인 중...');
    
    // 메인 이미지 결과 확인
    const [mainImages] = await connection.query(
      `SELECT productid, imageurl, imageorder 
       FROM item_images_raw 
       WHERE productid IN (?, ?)
       ORDER BY productid, imageorder`,
      EXISTING_PRODUCT_IDS
    );
    
    // 상세 이미지 결과 확인
    const [descImages] = await connection.query(
      `SELECT productid, imageurl, imageorder 
       FROM item_images_des_raw 
       WHERE productid IN (?, ?)
       ORDER BY productid, imageorder`,
      EXISTING_PRODUCT_IDS
    );
    
    // 옵션 이미지 결과 확인 (최근 처리된 것들만)
    const [optionImages] = await connection.query(
      `SELECT prop_path, imageurl 
       FROM product_options 
       WHERE imageurl IS NOT NULL
       AND (imageurl LIKE '//img.alicdn.com%' OR imageurl LIKE 'https://image.loopton.com%')
       ORDER BY prop_path
       LIMIT 10`
    );
    
    console.log('\n📊 처리 결과:');
    console.log('메인 이미지 (' + mainImages.length + '개):');
    mainImages.forEach(img => {
      const isProcessed = img.imageurl.includes('image.loopton.com');
      const isOriginal = img.imageurl.includes('img.alicdn.com');
      const status = isProcessed ? '✅ 처리완료' : (isOriginal ? '⏳ 대기중' : '❓ 기타');
      console.log(`  ${img.productid}[${img.imageorder}]: ${status} - ${img.imageurl.substring(0, 60)}...`);
    });
    
    console.log('\n상세 이미지 (' + descImages.length + '개):');
    descImages.forEach(img => {
      const isProcessed = img.imageurl.includes('image.loopton.com');
      const isOriginal = img.imageurl.includes('img.alicdn.com');
      const status = isProcessed ? '✅ 처리완료' : (isOriginal ? '⏳ 대기중' : '❓ 기타');
      console.log(`  ${img.productid}[${img.imageorder}]: ${status} - ${img.imageurl.substring(0, 60)}...`);
    });
    
    console.log('\n옵션 이미지 (' + optionImages.length + '개):');
    optionImages.forEach(img => {
      const isProcessed = img.imageurl && img.imageurl.includes('image.loopton.com');
      const isOriginal = img.imageurl && img.imageurl.includes('img.alicdn.com');
      const status = isProcessed ? '✅ 처리완료' : (isOriginal ? '⏳ 대기중' : '❓ 기타');
      console.log(`  ${img.prop_path}: ${status} - ${img.imageurl ? img.imageurl.substring(0, 60) + '...' : 'NULL'}`);
    });
    
    // 통계 계산
    const processedMain = mainImages.filter(img => img.imageurl.includes('image.loopton.com')).length;
    const processedDesc = descImages.filter(img => img.imageurl.includes('image.loopton.com')).length;
    const processedOption = optionImages.filter(img => img.imageurl && img.imageurl.includes('image.loopton.com')).length;
    
    const originalMain = mainImages.filter(img => img.imageurl.includes('img.alicdn.com')).length;
    const originalDesc = descImages.filter(img => img.imageurl.includes('img.alicdn.com')).length;
    const originalOption = optionImages.filter(img => img.imageurl && img.imageurl.includes('img.alicdn.com')).length;
    
    const totalProcessed = processedMain + processedDesc + processedOption;
    const totalOriginal = originalMain + originalDesc + originalOption;
    const totalImages = mainImages.length + descImages.length + optionImages.length;
    
    console.log(`\n📈 처리 통계:`);
    console.log(`  ✅ 처리완료: ${totalProcessed}개`);
    console.log(`  ⏳ 대기중: ${totalOriginal}개`);
    console.log(`  📊 전체: ${totalImages}개`);
    
    if (totalOriginal > 0) {
      const processRate = Math.round((totalProcessed / (totalProcessed + totalOriginal)) * 100);
      console.log(`  🎯 처리율: ${processRate}% (${totalProcessed}/${totalProcessed + totalOriginal})`);
    }
    
  } catch (error) {
    console.error('❌ 결과 확인 실패:', error);
  } finally {
    connection.release();
  }
}

/**
 * 큐 상태 확인
 */
async function checkQueueStatus() {
  try {
    // 직접 redisClient import해서 확인
    const redisClient = (await import('../../backend/common/utils/redisClient.js')).default;
    const queueLength = await redisClient.llen(QUEUE_NAMES.IMAGE_DOWNLOAD_QUEUE);
    console.log(`📋 현재 큐 대기: ${queueLength}개 작업`);
    return queueLength;
  } catch (error) {
    console.error('❌ 큐 상태 확인 실패:', error);
    return -1;
  }
}

/**
 * 메인 테스트 실행
 */
async function runTest() {
  console.log('🚀 이미지 다운로더 워커 테스트 시작 (기존 데이터 활용)\n');
  
  try {
    // 1. 기존 데이터 확인
    await getExistingImageData();
    
    // 2. Redis 큐에 작업 추가
    const jobCount = await addImageDownloadJobs();
    
    // 3. 큐 상태 확인
    await checkQueueStatus();
    
    console.log('\n🔧 이제 워커를 실행해주세요:');
    console.log('cd backend/worker/imgDownloader && node worker.js');
    console.log('\n⏱️  워커가 처리할 시간을 기다린 후, 아래 명령어로 결과를 확인하세요:');
    console.log('node test/unittest/testImgProcess.js check');
    console.log('\n📊 큐 상태만 확인하려면:');
    console.log('node test/unittest/testImgProcess.js queue');
    
  } catch (error) {
    console.error('❌ 테스트 실행 실패:', error);
    process.exit(1);
  }
}

// 명령어 처리
const command = process.argv[2];

switch (command) {
  case 'check':
    console.log('🔍 결과 확인 중...\n');
    await checkResults();
    break;
    
  case 'queue':
    console.log('📋 큐 상태 확인 중...\n');
    await checkQueueStatus();
    break;
    
  default:
    await runTest();
}

console.log('\n✨ 완료');
process.exit(0);
