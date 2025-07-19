import { mainOperator } from '../../backend/worker/elevenStoreRegister/operator.js';
import fs from 'fs';

async function runTest() {
    try {
        console.log('mainOperator 실행 시작...');
        const result = await mainOperator(9, 930985610508);
        
        // 결과를 JSON 파일로 저장
        const jsonResult = JSON.stringify(result, null, 2);
        fs.writeFileSync('test_result.json', jsonResult, 'utf8');
        
        console.log('✅ 테스트 완료! 결과가 test_result.json 파일에 저장되었습니다.');
        console.log('파일 크기:', (jsonResult.length / 1024).toFixed(2), 'KB');
        
    } catch (error) {
        console.error('❌ 테스트 실패:', error.message);
        
        // 오류도 JSON 파일로 저장
        const errorResult = {
            error: true,
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        };
        
        fs.writeFileSync('test_error.json', JSON.stringify(errorResult, null, 2), 'utf8');
        console.log('오류 정보가 test_error.json 파일에 저장되었습니다.');
    }
}

runTest();