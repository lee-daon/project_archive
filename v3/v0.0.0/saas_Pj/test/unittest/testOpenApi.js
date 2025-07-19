/**
 * Public API 테스트 파일
 * API 키: sk_9_016f082c7e2aac75a633cef908b83ef4
 * 테스트 데이터: userid=9, productid=23, groupcode=1
 */

const BASE_URL = 'http://localhost:3000/apiEnterprise';
const API_KEY = 'sk_9_016f082c7e2aac75a633cef908b83ef4';

// 공통 헤더
const headers = {
  'Content-Type': 'application/json',
  'x-api-key': API_KEY
};

/**
 * API 호출 함수
 */
async function apiCall(endpoint, data) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(data)
    });

    const result = await response.json();
    
    console.log(`\n=== ${endpoint} 요청 ===`);
    console.log('요청 데이터:', JSON.stringify(data, null, 2));
    console.log('응답 상태:', response.status);
    console.log('응답 데이터:', JSON.stringify(result, null, 2));
    
    return result;
  } catch (error) {
    console.error(`API 호출 오류 (${endpoint}):`, error.message);
    return null;
  }
}

/**
 * 테스트 실행
 */
async function runTests() {
  console.log('🚀 Public API 테스트 시작');
  console.log(`API 키: ${API_KEY}`);
  console.log(`Base URL: ${BASE_URL}`);

  // 1. 상품 상세 데이터 조회 테스트 (productid=23)
  await apiCall('/product-detail', {
    productId: 23
  });

  // 잠시 대기 (Rate Limit 방지)
  await new Promise(resolve => setTimeout(resolve, 1100));

  // 2. 상품 리스트 조회 - 그룹 코드로 조회 (groupCode=1)
  await apiCall('/product-list', {
    groupCode: "1"
  });

  // 잠시 대기 (Rate Limit 방지)
  await new Promise(resolve => setTimeout(resolve, 1100));

  // 3. 상품 리스트 조회 - 중복 제거=false (api_requested=false인 것만)
  await apiCall('/product-list', {
    allowDuplicates: false
  });

  console.log('\n✅ 모든 테스트 완료');
}

/**
 * 추가 테스트 - 소싱 API
 */
async function testSourcingApi() {
  console.log('\n🔍 소싱 API 테스트');
  
  // 테스트용 URL 배열
  const testUrls = [
    'https://detail.tmall.com/item.htm?id=123456789',
    'https://item.taobao.com/item.htm?id=987654321'
  ];

  await apiCall('/sourcing', {
    urls: testUrls
  });
}

/**
 * Rate Limit 테스트
 */
async function testRateLimit() {
  console.log('\n⚡ Rate Limit 테스트');
  
  // 빠른 연속 요청으로 Rate Limit 테스트
  const promises = [];
  for (let i = 0; i < 3; i++) {
    promises.push(apiCall('/product-list', { allowDuplicates: true }));
  }
  
  await Promise.all(promises);
}

// 메인 실행부 (ES 모듈)
(async () => {
  try {
    // 기본 테스트 실행
    await runTests();
    
    // 추가 테스트 (선택사항)
    console.log('\n📋 추가 테스트를 실행하시겠습니까? (5초 후 자동 진행)');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    await testSourcingApi();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await testRateLimit();
    
  } catch (error) {
    console.error('테스트 실행 중 오류:', error);
  }
})();

    