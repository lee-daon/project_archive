import redisClient from '../../backend/common/utils/redisClient.js';

async function testRedis() {
  try {
    console.log('=== Redis 테스트 시작 ===');
    
    // 1. 기본 연결 테스트
    console.log('1. Redis ping 테스트...');
    const pingResult = await redisClient.ping();
    console.log('Ping 결과:', pingResult);
    
    // 2. 단순 SET/GET 테스트
    console.log('2. 기본 SET/GET 테스트...');
    await redisClient.set('test_key', 'test_value');
    const testValue = await redisClient.get('test_key');
    console.log('SET/GET 결과:', testValue);
    
    // 3. 문제의 키 직접 조회
    console.log('3. 문제의 키 직접 조회...');
    const problemKey = 'spacing_setting:2';
    
    // EXISTS 먼저 확인
    const exists = await redisClient.exists(problemKey);
    console.log(`키 존재 여부 (${problemKey}):`, exists);
    
    // TYPE 확인
    const keyType = await redisClient.type(problemKey);
    console.log(`키 타입 (${problemKey}):`, keyType);
    
    // GET 시도 (타임아웃 설정)
    console.log('GET 명령 시도...');
    const startTime = Date.now();
    
    try {
      const value = await Promise.race([
        redisClient.get(problemKey),
        new Promise((_, reject) => setTimeout(() => reject(new Error('3초 타임아웃')), 3000))
      ]);
      
      const endTime = Date.now();
      console.log(`GET 결과: ${value} (소요시간: ${endTime - startTime}ms)`);
    } catch (timeoutError) {
      console.log('❌ GET 명령에서 타임아웃 발생:', timeoutError.message);
      
      // Redis 연결 상태 확인
      console.log('Redis 연결 상태:', redisClient.status);
    }
    
    // 4. Redis 정보 조회
    console.log('4. Redis 서버 정보...');
    const info = await redisClient.info('server');
    console.log('서버 정보 (일부):', info.split('\n').slice(0, 5).join('\n'));
    
    // 5. 메모리 사용량 확인
    const memory = await redisClient.info('memory');
    const memoryLines = memory.split('\n').filter(line => 
      line.includes('used_memory_human') || line.includes('maxmemory')
    );
    console.log('메모리 정보:', memoryLines);
    
  } catch (error) {
    console.error('Redis 테스트 중 오류:', error);
  } finally {
    // 테스트 키 정리
    await redisClient.del('test_key');
    console.log('=== Redis 테스트 완료 ===');
  }
}

testRedis(); 