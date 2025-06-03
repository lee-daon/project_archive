import { promisePool } from '../../db/connectDB.js'; // 경로 수정
import { translatAttributePrompt } from './gemini.js';
import pLimit from 'p-limit';

/**
 * productid를 받아 챗 gpt한테 보낼 prompt 문자열을 생성하는 함수.
 * @param {string} productid - 조회할 상품의 id
 * @returns {Promise<string>} - 생성된 prompt 문자열
 */
async function createPrompt(productid) {
  try {
    // productlist 테이블에서 product_name 조회
    const [productRows] = await promisePool.query(
      "SELECT product_name FROM productlist WHERE productid = ?",
      [productid]
    );

    if (productRows.length === 0) {
      throw new Error("해당 productid의 상품이 존재하지 않습니다.");
    }

    // 상품명 이스케이프 처리
    const productName = productRows[0].product_name.replace(/[\[\]\{\}\"\'\:\\,]/g, ' ');

    // properties 테이블에서 name_raw와 value_raw 조회
    const [propertyRows] = await promisePool.query(
      "SELECT name_raw, value_raw FROM properties WHERE productid = ?",
      [productid]
    );

    // properties 테이블의 각 행을 {key:value} 형식의 문자열로 변환
    const formattedProperties = propertyRows.map(prop => {
      // 더 넓은 범위의 특수문자를 처리 (JSON 관련 모든 특수문자)
      const nameEscaped = prop.name_raw.replace(/[\[\]\{\}\"\'\:\\,]/g, ' ');
      const valueEscaped = prop.value_raw.replace(/[\[\]\{\}\"\'\:\\,]/g, ' ');
      return `{${nameEscaped}:${valueEscaped}}`;
    }).join(',\n\t');

    // prompt 문자열 생성 (예시 형식에 맞게)
    const prompt = `{{상품명: ${productName}}, \n[\t${formattedProperties}] }`;

    return prompt;
  } catch (error) {
    console.error("createPrompt 함수 에러: ", error);
    throw error;
  }
}

/**
 * 주어진 productid와 properties 배열 데이터를 properties 테이블에 저장하는 함수
 * @param {string} productid - 연결된 제품의 ID
 * @param {Array<Object>} properties - 예: [{"브랜드": "샤오미"}, {"무게": "1.5kg"}, {"소재": "스테인리스강"}]
 */
async function insertProperties(productid, properties) {
  try {
    // properties가 배열인지 확인
    if (!Array.isArray(properties)) {
      console.error("Properties가 배열이 아닙니다:", properties);
      return; // 배열이 아니면 함수 종료
    }

    // 배열이 비어있는지 확인
    if (properties.length === 0) {
      console.error("Properties 배열이 비어있습니다.");
      return;
    }

    // 각 객체에서 key: name_translated, value: value_translated 추출하여 배열로 변환
    // prop_order도 추가하여 0부터 순차적으로 증가
    const values = properties.map((prop, index) => {
      const key = Object.keys(prop)[0];
      const value = prop[key];
      return [productid, key, value, index]; // prop_order는 0부터 시작
    });

    // ON DUPLICATE KEY UPDATE 구문을 사용하여 이미 존재하는 경우 업데이트
    const sql = `
      INSERT INTO properties 
        (productid, name_translated, value_translated, prop_order) 
      VALUES ? 
      ON DUPLICATE KEY UPDATE 
        name_translated = VALUES(name_translated), 
        value_translated = VALUES(value_translated)
    `;
    
    const [result] = await promisePool.query(sql, [values]);

    //console.log("Properties inserted successfully:", result);
  } catch (err) {
    console.error("Error inserting properties:", err);
  }
}

/**
 * 상품속성 배열을 받은 후, 비동기적으로 번역하여 저장하는 함수
 * 동시에 3개의 작업만 실행되도록 제한(유동적 변경 가능)
 * @param {Array<string>} productids - 처리할 상품 ID 배열
 * @returns {Promise<void>}
 */
export default async function translateattribute(productids) {
  try {
    if (!productids || productids.length === 0) {
      throw new Error("상품 ID 배열이 비어있습니다.");
    }
    
    // 동시에 3개의 작업만 실행되도록 제한
    const limit = pLimit(3);
    
    // 모든 productids에 대해 처리할 작업 배열 생성
    const tasks = productids.map((productid, index) => {
      return limit(async () => {
        // 각 작업 사이에 0.3초 간격 추가 (첫 번째 작업은 제외)
        if (index > 0) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        console.log(`처리할 상품 ID(${index + 1}/${productids.length}): ${productid}`);
        
        // createPrompt 함수를 실행하여 프롬프트 생성
        const prompt = await createPrompt(productid);
        //console.log("생성된 프롬프트:",prompt);
        
        // gpt.js의 translatAttributePrompt 함수에 전달하여 번역 결과 얻기
        const translatedProperties = await translatAttributePrompt(prompt);
        //console.log("번역 결과:", translatedProperties);
        
        // 번역 결과가 배열인지 확인
        if (!Array.isArray(translatedProperties)) {
          console.error(`상품 ID ${productid}에 대한 번역 결과가 배열이 아닙니다:`, translatedProperties);
          return; // 배열이 아니면 해당 상품 처리 건너뛰기
        }
        
        // 번역 결과를 insertProperties 함수에 전달하여 DB에 저장
        await insertProperties(productid, translatedProperties);
        
        console.log(`상품 ID ${productid}에 대한 속성 번역 완료`);
      });
    });
    
    // 모든 작업이 완료될 때까지 대기
    await Promise.all(tasks);
    console.log("모든 상품 속성 번역 작업이 완료되었습니다.");
    
  } catch (error) {
    console.error("translateattribute 함수 에러:", error);
    throw error;
  }
}


