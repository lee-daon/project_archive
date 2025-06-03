import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.OPENAI_API_KEY || 'YOUR_OPENAI_API_KEY';
const API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * ChatGPT에 프롬프트를 전송하고 JSON 응답을 반환하는 함수
 * @param {string} prompt - 사용자 요청 프롬프트
 * @param {string} promptText - 시스템 프롬프트
 * @returns {Promise<Object>} - JSON 형식의 응답
 */
async function callChatGPTJson(prompt, promptText) {
  try {
    const response = await axios.post(
      API_URL,
      {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: promptText },
          { role: "user", content: prompt }
        ],
        temperature: 0.7
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        }
      }
    );

    // API 응답에서 메시지 내용 추출
    const content = response.data.choices[0].message.content;

    // 응답이 JSON 형식 문자열이라 가정하고 파싱
    try {
      // 가능한 JSON 형식 추출 시도
      let jsonContent = content;
      
      // 일반 텍스트에서 JSON 배열 부분만 추출 시도
      const jsonArrayMatch = content.match(/\[\s*{.+}\s*\]/s);
      if (jsonArrayMatch) {
        jsonContent = jsonArrayMatch[0];
      }
      
      const jsonResponse = JSON.parse(jsonContent);
      //console.log("JSON 응답:", jsonResponse);
      return jsonResponse; // JSON 객체 반환
    } catch (parseError) {
      console.error("JSON 파싱 에러:", parseError.message);
      console.error("원본 응답:", content);
      
      // 빈 배열 반환
      console.warn("빈 배열 반환됨. 파싱 실패.");
      return [];
    }
  } catch (error) {
    console.error("에러 발생:", error.response ? error.response.data : error.message);
    throw error;
  }
}

/**
 * ChatGPT에 프롬프트를 전송하고 텍스트 응답을 반환하는 함수
 * @param {string} prompt - 사용자 요청 프롬프트
 * @param {string} promptText - 시스템 프롬프트
 * @returns {Promise<string>} - 텍스트 형식의 응답
 */
async function callChatGPT(prompt, promptText) {
  try {
    const response = await axios.post(
      API_URL,
      {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: promptText },
          { role: "user", content: prompt }
        ],
        temperature: 0.7
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        }
      }
    );

    // API 응답에서 메시지 내용 추출
    const content = response.data.choices[0].message.content;
    return content;
  } catch (error) {
    console.error("에러 발생:", error.response ? error.response.data : error.message);
    throw error;
  }
}

/**
 * ChatGPT(gpt-4o 모델)에 프롬프트를 전송하고 텍스트 응답을 반환하는 함수
 * @param {string} prompt - 사용자 요청 프롬프트
 * @param {string} promptText - 시스템 프롬프트
 * @returns {Promise<string>} - 텍스트 형식의 응답
 */
async function callChatGPT_4o(prompt, promptText) {
  try {
    const response = await axios.post(
      API_URL,
      {
        model: "gpt-4o",
        messages: [
          { role: "system", content: promptText },
          { role: "user", content: prompt }
        ],
        temperature: 0.7
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        }
      }
    );

    // API 응답에서 메시지 내용 추출
    const content = response.data.choices[0].message.content;
    return content;
  } catch (error) {
    console.error("에러 발생:", error.response ? error.response.data : error.message);
    throw error;
  }
}


const promptText = `
[시스템 역할 안내]
당신은 한국 온라인 쇼핑몰에 맞춰 중국어로 된 상품 속성을 
자연스럽게 한국어로 변환해주는 전문가입니다. 

[사용자 요청]
아래 중국어 상품 속성을 한국어로 번역해 주세요. 
번역 시 다음 사항을 지켜주세요:
1) 명사 중심 표현
2) 한국식 단위 적용 (cm, g, mL 등)
3) 자연스럽고 간결한 한국식 표현
4) 직역보다는 해당 상품 카테고리에 맞는 용어 활용
5) 상품명을 참고해 문맥에 맞게 번역해주세요
6) 번역하기 어려운 속성의 경우 원문 그대로 반환합니다
7)누락되는 결과값이 존재해서는 안됩니다

[중국어 원문 속성]
- (예시) 品牌：小米
- (예시) 重量：1.5公斤
- (예시) 材质：不锈钢

[원하는 출력 예시]
[{"브랜드": "샤오미"}, {"무게": "1.5kg"}, {"소재": "스테인리스강"}...]

입력은{{상품명: 상품명},[ {속성명:속성값}, {속성명2:속성값2} .....]} 으로 제시될 것이며 출력 역시 [{속성명:속성값},
{속성명2:속성값2}.....]를 엄격히 지켜야 합니다

`;

const pidprompt = `
[시스템 역할 안내]
당신은 한국 온라인 쇼핑몰에 맞춰 중국어로 된 상품 옵션의 종류를 
자연스럽게 한국어로 변환해주는 전문가입니다. 

[사용자 요청]
번역 시 다음 사항을 지켜주세요:

1) 명사 중심 표현
2) 직역보다는 해당 상품 카테고리에 맞는 용어 활용
3) 번역하기 어려운 속성의 경우 원문 그대로를 사용합니다

[입력예시]
尺寸

[원하는 출력 예시]
사이즈
`;

const vidprompt = `
[시스템 역할 안내]
당신은 한국 온라인 쇼핑몰에 맞춰 중국어로 된 상품 옵션의 값을 
자연스럽게 한국어로 변환해주는 전문가입니다. 

[사용자 요청]
번역 시 다음 사항을 지켜주세요:
1) 명사 중심 표현
2) 한국식 단위 적용 (cm, g, mL 등)
3) 맥락을 알 수 없으면 원문 그대로를 출력합니다.
4) 자연스럽고 간결한 한국식 표현

[출력요구사항]
반드시 25글자 이하로 출력해 주세요.
`;

const productNameprompt = `
[시스템 역할 안내]
당신은 한국 온라인 쇼핑몰에 맞춰 중국어로 된 상품명을 
자연스럽게 한국어로 변환해주는 전문가입니다. 

[사용자 요청]
제시된 상품명을 한국어로 seo최적화 번역해 주세요. 
번역 시 다음 사항을 지켜주세요:
1) 명사 중심 표현
2) 상품명 50자 이하로 출력
3) 자연스럽고 간결한 한국식 표현
4) 직역보다는 해당 상품 카테고리에 맞는 용어 활용
5) 지식재산권 문제가 발생가능한 단어 사용 금지
6) 중복되는 단어 사용 금지
7) 제품명 키워드 부가정보 순서로 작성
8) 수식어,감탄사,문장부호 사용 금지
9) 반드시 상품명에 브랜드가 포함되어 있으면 안됩니다

[출력구조]
조건을 모두 만족한 최종 한국어 상품명만 출력해 주세요.
`;

// 새로운 프롬프트 추가: 키워드를 포함하여 상품명 번역
const productNameWithKeywordPrompt = `
[시스템 역할 안내]
당신은 한국 온라인 쇼핑몰에 맞춰 중국어로 된 상품명을 
자연스럽게 한국어로 변환해주는 전문가입니다.

[사용자 요청]
아래 제공된 중국어 상품명과 키워드 배열을 참고하여, 키워드를 **반드시 포함**하여 한국어로 SEO 최적화된 상품명을 생성해주세요.
번역 시 다음 사항을 지켜주세요:
1) 명사 중심 표현
2) 상품명 50자 이하로 출력
3) 자연스럽고 간결한 한국식 표현
4) 직역보다는 해당 상품 카테고리에 맞는 용어 활용
5) 지식재산권 문제가 발생가능한 단어 사용 금지
6) 중복되는 단어 사용 금지
7) 제품명 키워드 부가정보 순서로 작성 (제공된 키워드를 자연스럽게 포함)
8) 수식어, 감탄사, 문장부호 사용 금지
9) 상품명에 브랜드가 포함되어 있으면 제거.

[입력 형식]
{
  "productName": "중국어 상품명 원문",
  "keywords": ["키워드1", "키워드2", ...]
}

[출력 구조]
조건을 모두 만족한 최종 한국어 상품명만 출력해 주세요.
`;

const keywordGenerationprompt = `
[시스템 역할 안내]
당신은 한국 온라인 쇼핑몰에 맞춰 중국어로 된 상품 이름을 
자연스럽게 한국어로 변환해주는 전문가입니다. 


[사용자 요청]
제시된 상품명을 참고해 키워드를 생성해 주세요
1) 상품명을 참고해 키워드를 생성해 주세요
2) 20개 이하의 키워드를 출력해 주세요
3) 키워드는 한국어로 작성해 주세요
4) 키워드는 상품명과 관련된 키워드를 출력해 주세요
5) 중복 어휘를 지양하고, 간결하고 명확한 키워드로 작성해 주세요.
6) 키워드는 한 단어 또는 짧은 구 형태로 작성해 주세요.
7) 키워드에 브랜드가 포함되어 있으면 안됩니다.

[출력구조]
다음 출력구조를 엄격히 지켜주세요 
[키워드1, 키워드2, 키워드3, ...]
`;

const brandtranslationprompt = `
[시스템 역할 안내]
당신은 한국 온라인 쇼핑몰에 맞춰 중국어로 된 브랜드명을 
자연스럽게 한국어와 영어로 변환해주는 전문가입니다. 

[사용자 요청]
중국어 브랜드명을 한국어와 영어로 번역해줘

[출력구조]
다음 출력구조를 엄격히 지켜주세요 

한국어 브랜드명/영어 브랜드명
`;



/**
 * gpt를 이용해 중국어 상품 속성을 한국어로 규칙에 따라 번역하는 함수
 * @param {string} prompt - 번역할 중국어 상품 속성 텍스트
 * @returns {Promise<Object>} - 번역된 속성 JSON 객체
 */
export async function translatAttributePrompt(prompt) {
  return await callChatGPTJson(prompt, promptText);
}

/**
 * gpt를 이용해 중국어 상품 옵션 종류(pid)를 한국어로 규칙에 따라 번역하는 함수
 * @param {string} prompt - 번역할 중국어 상품 옵션 종류 텍스트
 * @returns {Promise<string>} - 번역된 상품 옵션 종류 텍스트
 */
export async function translatePidOptionPrompt(prompt) {
  return await callChatGPT(prompt, pidprompt);
}

/**
 * gpt를 이용해 중국어 상품 옵션 값(vid)을 한국어로 규칙에 따라 번역하는 함수
 * @param {string} prompt - 번역할 중국어 상품 옵션 값 텍스트
 * @returns {Promise<string>} - 번역된 상품 옵션 값 텍스트
 */
export async function translatevidOptionPrompt(prompt) {
  return await callChatGPT(prompt, vidprompt);
}

/**
 * gpt를 이용해 상품 이름을 한국어로 규칙에 따라 seo최적화 번역하는 함수
 * @param {string} prompt - 번역할 상품 이름 텍스트
 * @returns {Promise<string>} - 번역된 상품 이름 텍스트
 */
export async function translateProductNamePrompt(prompt) {
  return await callChatGPT(prompt, productNameprompt);
}

/**
 * gpt를 이용해 키워드를 포함하여 상품 이름을 한국어로 규칙에 따라 seo최적화 번역하는 함수
 * @param {string} productName - 번역할 중국어 상품 이름 텍스트
 * @param {string[]} keywords - 상품명에 포함할 키워드 배열
 * @returns {Promise<string>} - 번역된 상품 이름 텍스트
 */
export async function translateProductNameWithKeywordPrompt(productName, keywords) {
  const promptData = JSON.stringify({ productName, keywords });
  return await callChatGPT(promptData, productNameWithKeywordPrompt);
}

/**
 * gpt를 이용해 seo최적화된 키워드를 생성하는 함수
 * @type {string}
 */
export async function translateKeywordGenerationPrompt(prompt) {
  return await callChatGPT(prompt, keywordGenerationprompt);
}

/**
 * gpt를 이용해 중국어 브랜드명을 한국어와 영어로 번역하는 함수
 * @param {string} prompt - 번역할 중국어 브랜드명 텍스트
 * @returns {Promise<string>} - 번역된 브랜드명 텍스트
 */
export async function translateBrandNamePrompt(prompt) {
  return await callChatGPT(prompt, brandtranslationprompt);
}
