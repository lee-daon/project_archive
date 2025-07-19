import { createProductSchema } from '../../backend/modules/postprocessing/service/createBaseSchema.js';
import {
  fetchProductBasicInfo,
  fetchRepresentativeImage,
  fetchMainImages,
  fetchDescriptionImages,
  fetchAttributes,
  fetchSkuData,
  fetchPrivateOptions
} from '../../backend/modules/postprocessing/repository/buildJsonInfo.js';
import { saveProductJsonAndUpdateStatus } from '../../backend/modules/postprocessing/repository/registerReadyStatus.js';
import { updateBaseJsonCompletedStatus } from '../../backend/common/utils/assistDb/GlobalStatus.js';

/**
 * JSON 생성 테스트를 위한 함수들
 */

// 테스트 데이터
const TEST_USER_ID = 2;
const TEST_PRODUCT_IDS = [622706981192, 721963707226];

/**
 * 개별 DB 함수들을 테스트하는 함수
 */
async function testIndividualDbFunctions() {
  console.log('=== 개별 DB 함수 테스트 시작 ===');
  
  for (const productId of TEST_PRODUCT_IDS) {
    console.log(`\n--- 상품 ID: ${productId} ---`);
    
    try {
      // 1. 기본 정보 테스트
      console.log('1. 기본 정보 조회 테스트...');
      const basicInfo = await fetchProductBasicInfo(TEST_USER_ID, productId);
      console.log('기본 정보:', basicInfo);
      
      // 2. 대표 이미지 테스트
      console.log('2. 대표 이미지 조회 테스트...');
      const representativeImage = await fetchRepresentativeImage(TEST_USER_ID, productId);
      console.log('대표 이미지:', representativeImage);
      
      // 3. 메인 이미지들 테스트
      console.log('3. 메인 이미지 배열 조회 테스트...');
      const mainImages = await fetchMainImages(TEST_USER_ID, productId, representativeImage);
      console.log('메인 이미지들:', mainImages);
      
      // 4. 상세 이미지들 테스트
      console.log('4. 상세 이미지 배열 조회 테스트...');
      const descImages = await fetchDescriptionImages(TEST_USER_ID, productId);
      console.log('상세 이미지들:', descImages);
      
      // 5. 속성 정보 테스트
      console.log('5. 속성 정보 조회 테스트...');
      const attributes = await fetchAttributes(TEST_USER_ID, productId);
      console.log('속성들:', attributes);
      
      // 6. SKU 데이터 테스트
      console.log('6. SKU 데이터 조회 테스트...');
      const skuData = await fetchSkuData(TEST_USER_ID, productId);
      console.log('SKU 데이터:', skuData);
      
      // 7. 개인 옵션 테스트
      console.log('7. 개인 옵션 조회 테스트...');
      const privateOptions = await fetchPrivateOptions(TEST_USER_ID, productId);
      console.log('개인 옵션들:', privateOptions);
      
    } catch (error) {
      console.error(`상품 ${productId} 개별 함수 테스트 중 오류:`, error);
    }
  }
  
  console.log('\n=== 개별 DB 함수 테스트 완료 ===');
}

/**
 * 전체 JSON 스키마 생성을 테스트하는 함수
 */
async function testCompleteJsonSchema() {
  console.log('\n=== 전체 JSON 스키마 생성 테스트 시작 ===');
  
  for (const productId of TEST_PRODUCT_IDS) {
    console.log(`\n--- 상품 ID: ${productId} 스키마 생성 ---`);
    
    try {
      const schemaResult = await createProductSchema(TEST_USER_ID, productId);
      
      if (schemaResult.success) {
        console.log('✅ JSON 스키마 생성 성공!');
        console.log('상품 정보:', JSON.stringify(schemaResult.productInfo, null, 2));
        console.log('옵션 스키마:', schemaResult.optionSchema);
        console.log('옵션 이미지:', schemaResult.optionImages);
        console.log('변형 수:', schemaResult.variants.length);
        console.log('옵션 값 이름:', schemaResult.optionValueNames);
      } else {
        console.log('❌ JSON 스키마 생성 실패:', schemaResult.message);
      }
    } catch (error) {
      console.error(`상품 ${productId} 스키마 생성 중 오류:`, error);
    }
  }
  
  console.log('\n=== 전체 JSON 스키마 생성 테스트 완료 ===');
}

/**
 * JSON 저장 및 상태 업데이트 테스트
 */
async function testSaveAndStatusUpdate() {
  console.log('\n=== JSON 저장 및 상태 업데이트 테스트 시작 ===');
  
  for (const productId of TEST_PRODUCT_IDS) {
    console.log(`\n--- 상품 ID: ${productId} 저장 테스트 ---`);
    
    try {
      // 1. JSON 스키마 생성
      const schemaResult = await createProductSchema(TEST_USER_ID, productId);
      
      if (schemaResult.success) {
        // 2. pre_register 테이블에 저장
        console.log('JSON 데이터 저장 중...');
        const saveResult = await saveProductJsonAndUpdateStatus(TEST_USER_ID, productId, schemaResult);
        
        if (saveResult.success) {
          console.log('✅ JSON 저장 성공!');
          
          // 3. status 테이블 업데이트
          console.log('baseJson_completed 상태 업데이트 중...');
          const statusResult = await updateBaseJsonCompletedStatus(TEST_USER_ID, productId);
          
          if (statusResult.success) {
            console.log('✅ 상태 업데이트 성공!');
          } else {
            console.log('❌ 상태 업데이트 실패:', statusResult.message);
          }
        } else {
          console.log('❌ JSON 저장 실패:', saveResult.message);
        }
      } else {
        console.log('❌ JSON 스키마 생성 실패, 저장 건너뜀');
      }
    } catch (error) {
      console.error(`상품 ${productId} 저장 테스트 중 오류:`, error);
    }
  }
  
  console.log('\n=== JSON 저장 및 상태 업데이트 테스트 완료 ===');
}

/**
 * 메인 테스트 실행 함수
 */
async function runAllTests() {
  console.log('🚀 JSON 생성 DB 테스트 시작');
  console.log(`테스트 사용자 ID: ${TEST_USER_ID}`);
  console.log(`테스트 상품 IDs: ${TEST_PRODUCT_IDS.join(', ')}`);
  
  try {
    // 1. 개별 DB 함수들 테스트
    await testIndividualDbFunctions();
    
    // 2. 전체 JSON 스키마 생성 테스트
    await testCompleteJsonSchema();
    
    // 3. 저장 및 상태 업데이트 테스트
    await testSaveAndStatusUpdate();
    
    console.log('\n🎉 모든 테스트 완료!');
  } catch (error) {
    console.error('❌ 테스트 실행 중 전체 오류:', error);
  }
}

// 테스트 실행
runAllTests()

// 개별 테스트 함수들을 export (다른 테스트에서 사용 가능)
export {
  testIndividualDbFunctions,
  testCompleteJsonSchema,
  testSaveAndStatusUpdate,
  runAllTests
};
