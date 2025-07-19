import { mainOperator } from '../../backend/worker/coopangRegister/operator.js';
import fs from 'fs';
import path from 'path';

/**
 * 테스트 실행 함수
 * operator.js의 mainOperator를 테스트하고 결과를 JSON으로 저장
 */
async function runTest() {
    try {
        console.log('쿠팡 등록 테스트 시작...');
        
        // 테스트 파라미터
        const userid = 2;
        const productid = 721963707226;
        
        console.log(`테스트 파라미터 - userid: ${userid}, productid: ${productid}`);
        
        // operator.js 실행
        const result = await mainOperator(userid, productid);
        
        // 파일명에 타임스탬프 추가하여 덮어쓰기 방지
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `test-result-${timestamp}.json`;
        const filePath = path.join('./', fileName);
        
        // 결과를 JSON 파일로 저장
        fs.writeFileSync(filePath, JSON.stringify(result, null, 2), 'utf8');
        
        console.log(`테스트 완료! 결과가 ${fileName}에 저장되었습니다.`);
        console.log('결과 요약:', {
            success: result.success,
            message: result.message,
            userid: result.userid,
            productid: result.productid
        });
        
    } catch (error) {
        console.error('테스트 실행 중 오류 발생:', error);
        
        // 오류 결과도 JSON으로 저장
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const errorFileName = `test-error-${timestamp}.json`;
        const errorResult = {
            success: false,
            error: error.message,
            stack: error.stack,
            userid: 2,
            productid: 721963707226,
            timestamp: new Date().toISOString()
        };
        
        fs.writeFileSync(errorFileName, JSON.stringify(errorResult, null, 2), 'utf8');
        console.log(`오류 정보가 ${errorFileName}에 저장되었습니다.`);
    }
}

// 테스트 실행
runTest();
