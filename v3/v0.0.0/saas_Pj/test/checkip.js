import axios from 'axios';

/**
 * 여러 IP 확인 서비스를 사용하여 현재 공인 IP 주소를 확인합니다.
 */
async function checkPublicIP() {
  console.log('현재 공인 IP 주소 확인 중...');
  
  const ipServices = [
    { name: 'ipify.org', url: 'https://api.ipify.org?format=json', parser: (data) => data.ip },
    { name: 'ipapi.co', url: 'https://ipapi.co/json/', parser: (data) => data.ip },
    { name: 'ip-api.com', url: 'http://ip-api.com/json', parser: (data) => data.query }
  ];
  
  // 모든 요청을 병렬로 실행
  const ipPromises = ipServices.map(async (service) => {
    try {
      const response = await axios.get(service.url, { timeout: 5000 });
      const ip = service.parser(response.data);
      return { service: service.name, ip, success: true };
    } catch (error) {
      console.error(`${service.name} 서비스 오류:`, error.message);
      return { service: service.name, success: false, error: error.message };
    }
  });
  
  // 모든 요청 결과 기다리기
  const results = await Promise.all(ipPromises);
  
  // 결과 출력
  console.log('\n===== IP 확인 결과 =====');
  
  // 성공한 요청만 필터링
  const successfulResults = results.filter(result => result.success);
  
  if (successfulResults.length === 0) {
    console.error('IP 주소를 확인할 수 없습니다. 인터넷 연결을 확인하세요.');
    return;
  }
  
  // 각 서비스별 결과 출력
  successfulResults.forEach(result => {
    console.log(`[${result.service}] ${result.ip}`);
  });
  
  // 가장 많이 반환된 IP 확인 (신뢰도 높은 IP)
  const ipCounts = {};
  successfulResults.forEach(result => {
    ipCounts[result.ip] = (ipCounts[result.ip] || 0) + 1;
  });
  
  let mostCommonIP = null;
  let highestCount = 0;
  
  for (const [ip, count] of Object.entries(ipCounts)) {
    if (count > highestCount) {
      mostCommonIP = ip;
      highestCount = count;
    }
  }
  
  console.log('\n가장 신뢰할 수 있는 현재 IP 주소:');
  console.log(mostCommonIP);
  console.log('=======================\n');
  
  // 로컬 네트워크 인터페이스 정보 출력 (내부 IP)
  try {
    const { networkInterfaces } = require('os');
    const interfaces = networkInterfaces();
    
    console.log('로컬 네트워크 인터페이스 정보:');
    
    for (const [name, iface] of Object.entries(interfaces)) {
      for (const info of iface) {
        // IPv4 주소만 출력
        if (info.family === 'IPv4') {
          console.log(`[${name}] ${info.address} ${info.internal ? '(내부)' : '(외부)'}`);
        }
      }
    }
  } catch (error) {
    console.error('로컬 네트워크 정보를 가져올 수 없습니다:', error.message);
  }
}

// 함수 실행
checkPublicIP().catch(error => {
  console.error('오류 발생:', error.message);
});
