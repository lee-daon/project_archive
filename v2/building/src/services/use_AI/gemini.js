/**
 * @fileoverview Gemini API를 호출하여 번역 및 기타 서비스를 제공하는 함수 모음
 * 
 * 이 파일은 Gemini API를 사용하여 중국어 텍스트(상품 속성, 옵션, 상품명, 브랜드명 등)를
 * 한국어(및 영어)로 변역하는 여러 함수를 포함하고 있습니다.
 */

import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY ;
// Gemini REST API 엔드포인트 (v1beta 사용 예시)
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;
// const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-pro:generateContent?key=${API_KEY}`; // Pro 모델 사용 시

// gpt.js의 프롬프트들을 여기에 가져오거나 Gemini에 맞게 수정합니다.
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
7) 누락되는 결과값이 존재해서는 안됩니다
8) 반드시 요청된 JSON 스키마 형식 (아래 '원하는 출력 형식' 참고)으로만 출력해주세요.

[중국어 원문 속성]
- (예시) 品牌：小米
- (예시) 重量：1.5公斤
- (예시) 材质：不锈钢

[원하는 출력 형식]
[{"key": "브랜드", "value": "샤오미"}, {"key": "무게", "value": "1.5kg"}, {"key": "소재", "value": "스테인리스강"}...]

입력은 {{상품명: 상품명},[ {속성명:속성값}, {속성명2:속성값2} .....]} 으로 제시될 것입니다.
출력은 반드시 위 '원하는 출력 형식'을 따라야 합니다.
`; // 원하는 출력 형식 예시 및 요구사항 수정

// 기존 pidprompt와 vidprompt를 통합한 새로운 옵션 번역 프롬프트
const optionPrompt = `
[시스템 역할 안내]
당신은 한국 온라인 쇼핑몰에 맞춰 중국어로 된 상품 옵션을
자연스럽게 한국어로 변환해주는 전문가입니다.

[사용자 요청]
아래 옵션 정보를 한국어로 번역해 주세요.
번역 시 다음 사항을 지켜주세요:
1) 명사 중심 표현
2) 한국식 단위 적용 (cm, g, mL 등)
3) 자연스럽고 간결한 한국식 표현
4) 직역보다는 해당 상품 카테고리에 맞는 용어 활용
5) 번역하기 어려운 경우 원문 그대로 반환합니다
6) 옵션명과 옵션값은 모두 25글자 이하로 간결하게 번역해 주세요
7) 반드시 요청된 JSON 스키마 형식으로 출력해주세요.

[입력 형식]
{
  "optionname": "中国语选项名称",
  "optionvalue": "中国语选项值"
}

[출력 형식]
{
  "translated_optionname": "한국어 옵션명",
  "translated_optionvalue": "한국어 옵션값"
}
`;

/**
 * @deprecated 이 프롬프트는 이전 버전과의 호환성을 위해 유지됩니다. 새로운 구현에서는 optionPrompt를 사용하세요.
 */
const pidprompt = `
[시스템 역할 안내]
당신은 한국 온라인 쇼핑몰에 맞춰 중국어로 된 상품 옵션의 종류를
자연스럽게 한국어로 변환해주는 전문가입니다.

[사용자 요청]
번역 시 다음 사항을 지켜주세요:

1) 명사 중심 표현
2) 직역보다는 해당 상품 카테고리에 맞는 용어 활용
3) 번역하기 어려운 속성의 경우 원문 그대로를 사용합니다
4) 최종 번역 결과 텍스트만 출력해주세요.

[입력예시]
尺寸

[원하는 출력 예시]
사이즈
`;

/**
 * @deprecated 이 프롬프트는 이전 버전과의 호환성을 위해 유지됩니다. 새로운 구현에서는 optionPrompt를 사용하세요.
 */
const vidprompt = `
[시스템 역할 안내]
당신은 한국 온라인 쇼핑몰에 맞춰 중국어로 된 상품 옵션의 값을
자연스럽게 한국어로 변환해주는 전문가입니다.

[사용자 요청]
번역 시 다음 사항을 지켜주세요:
1) 명사 중심 표현
2) 한국식 단위 적용 (cm, g, mL 등)
3) 맥락을 알 수 없으면 원문 그대로 출력합니다.
4) 자연스럽고 간결한 한국식 표현
5) 최종 번역 결과 텍스트만 출력해주세요.
6) 옵션명은 가능한 짧고 명료해야 합니다

[예시]
잘못된 예: "42사이즈 한사이즈 크게 나왔습니다"
올바른 예: "42사이즈, 한사이즈 크게"
[출력요구사항]
반드시 25글자 이하로 출력해 주세요.
`;

const productNameprompt = `
[시스템 역할 안내]
당신은 중국어 상품명을 SEO에 최적화된 자연스러운 한국어 상품명으로 변환하는 전문가입니다.

[사용자 요청]
제시된 상품명을 한국어로 seo최적화 번역해 주세요.
번역 시 다음 사항을 지켜주세요:
1) 명사 중심의 간결한 한국식 표현으로 작성
2) 40자 이내의 자연스러운 한국어 상품명
3) 직역보다는 해당 상품 카테고리에 맞는 용어 활용
4) 지식재산권 문제가 발생가능한 단어 사용 금지
5) 중복되는 단어, 시즌성·홍보 문구 사용 금지
6) 제품명 키워드 부가정보 순서로 작성
7) 감탄사,문장부호,특수문자,불필요한 수식어 사용 금지
8) 반드시 상품명에 브랜드,중국어가 포함되어 있으면 안됩니다
9) 너무 일반적인 키워드보다는 구체적인 강점이나 특성을 나타내는 키워드 1~2개를 포함해 검색노출 효과를 높입니다
10) 최종 번역 결과 텍스트만 출력해주세요.

[출력구조]
조건을 모두 만족한 최종 한국어 상품명만 출력해 주세요.
`;

/**
 * 키워드를 반드시 포함하는 상품명 번역 프롬프트
 */
const productNameWithKeywordPrompt = `
[시스템 역할 안내]
당신은 중국어로 된 상품명을 한국 쇼핑몰 seo에 맞게
자연스럽게 한국어로 변환해주는 전문가입니다.

[사용자 요청]
아래 제공된 중국어 상품명과 키워드 배열을 참고하여, 키워드를 **반드시 포함**하여 한국어로 SEO 최적화된 상품명을 생성해주세요.
번역 시 다음 사항을 지켜주세요:
1) 명사 중심의 간결한 한국식 표현으로 작성
2) 40자 이내의 자연스러운 한국어 상품명
3) 직역보다는 해당 상품 카테고리에 맞는 용어 활용
4) 지식재산권 문제가 발생가능한 단어 사용 금지
5) 중복되는 단어, 시즌성·홍보 문구 사용 금지
6) 제품명 키워드 부가정보 순서로 작성(제공된 키워드를 자연스럽게, 반드시 포함)
7) 감탄사,문장부호,특수문자,불필요한 수식어 사용 금지
8) 반드시 상품명에 브랜드,중국어가 포함되어 있으면 안됩니다
9) 너무 일반적인 키워드보다는 구체적인 강점이나 특성을 나타내는 키워드 1~2개를 포함해 검색노출 효과를 높입니다
10) 최종 번역 결과 텍스트만 출력해주세요.

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
8) 반드시 요청된 JSON 스키마 형식(문자열 배열)으로만 출력해주세요.
`;

const brandtranslationprompt = `
[시스템 역할 안내]
당신은 한국 온라인 쇼핑몰에 맞춰 중국어로 된 브랜드명을
자연스럽게 한국어와 영어로 변환해주는 전문가입니다.

[사용자 요청]
중국어 브랜드명을 한국어와 영어로 번역해줘
최종 번역 결과 텍스트만 출력해주세요.

[출력구조]
다음 출력구조를 엄격히 지켜주세요

한국어 브랜드명/영어 브랜드명
`;

// 새로운 프롬프트: 간단 상품명 번역 (브랜드 식별/필터링 목적)
const simpleProductNamePrompt = `
[시스템 역할 안내]
당신은 중국어 상품명을 자연스러운 한국어로 번역하는 번역가입니다.
번역 결과는 상품명에서 브랜드를 식별하고 필터링하는 데 사용될 것입니다.

[사용자 요청]
제시된 중국어 상품명을 한국어로 간단하게 번역해주세요.
특별한 규칙 없이 자연스러운 번역 결과만 출력해주세요.
번역에 중국어가 포함되면 안됩니다.
**만약 상품명에 중국 브랜드명이 포함되어 있다면, 한국에서 통용되는 공식 상표명으로 바꿔서 번역 결과에 포함시켜 주세요.** (예: 小米 -> 샤오미)
`;

// --- JSON 스키마 정의 ---
const attributeSchema = {
  type: "ARRAY",
  description: "번역된 속성 키-값 쌍의 배열",
  items: {
    type: "OBJECT",
    description: "번역된 속성명(key)과 값(value)을 포함하는 객체",
    properties: {
      "key": { type: "STRING", description: "번역된 속성 이름" },
      "value": { type: "STRING", description: "번역된 속성 값" }
    },
    required: ["key", "value"] // key와 value 모두 필수
  }
};

const keywordSchema = {
  type: "ARRAY",
  description: "생성된 키워드 문자열의 배열",
  items: {
    type: "STRING"
  }
};

// 옵션 번역용 JSON 스키마 정의
const optionSchema = {
  type: "OBJECT",
  description: "번역된 옵션 이름과 옵션 값",
  properties: {
    "translated_optionname": { type: "STRING", description: "번역된 옵션 이름" },
    "translated_optionvalue": { type: "STRING", description: "번역된 옵션 값" }
  },
  required: ["translated_optionname", "translated_optionvalue"]
};

/**
 * Gemini 텍스트 API 호출 함수
 *
 * @param {string} promptContent - 사용자 프롬프트 내용
 * @param {string} systemInstruction - 시스템 지침 (프롬프트)
 * @returns {Promise<string>} - 텍스트 응답을 반환하는 프로미스
 */
async function callGeminiText(promptContent, systemInstruction) {
  try {
    const requestData = {
      system_instruction: {
        parts: [{ text: systemInstruction }]
      },
      contents: [
        {
          role: "user",
          parts: [{ text: promptContent }]
        }
      ],
      generationConfig: {
        response_mime_type: "text/plain" // 텍스트 응답 명시
      }
    };

    const response = await axios.post(API_URL, requestData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // 응답 데이터에서 텍스트 추출
    if (response.data?.candidates?.[0]?.content?.parts?.length > 0) {
      return response.data.candidates[0].content.parts[0].text.trim();
    }

    console.error("Gemini API 응답 구조가 예상과 다릅니다 (Text):", response.data);
    if (
      response.data.promptFeedback &&
      response.data.promptFeedback.blockReason
    ) {
      throw new Error(`Gemini API 요청 차단됨: ${response.data.promptFeedback.blockReason}, 이유: ${response.data.promptFeedback.safetyRatings}`);
    }
    return "";
  } catch (error) {
    console.error("Gemini API 호출 에러 (Text - axios):", error.response ? error.response.data : error.message);
    if (error.response && error.response.data && error.response.data.error) {
      console.error("상세 에러:", error.response.data.error.message);
      throw new Error(`Gemini API Error: ${error.response.data.error.message}`);
    }
    throw error;
  }
}

/**
 * Gemini JSON API 호출 함수
 *
 * @param {string} promptContent - 사용자 프롬프트 내용
 * @param {string} systemInstruction - 시스템 지침 (프롬프트)
 * @param {Object} schema - 응답 JSON 스키마
 * @returns {Promise<Object>} - 파싱된 JSON 응답 객체
 */
async function callGeminiJson(promptContent, systemInstruction, schema) {
  if (!schema) {
    throw new Error("callGeminiJson 함수 호출 시 schema 파라미터가 필요합니다.");
  }

  try {
    const requestData = {
      system_instruction: {
        parts: [{ text: systemInstruction }]
      },
      contents: [
        {
          role: "user",
          parts: [{ text: promptContent }]
        }
      ],
      generationConfig: {
        response_mime_type: "application/json", // JSON 모드 활성화
        response_schema: schema
      }
    };

    const response = await axios.post(API_URL, requestData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // JSON 모드에서는 응답 텍스트에 JSON 문자열 포함
    if (response.data?.candidates?.[0]?.content?.parts?.length > 0) {
      const jsonString = response.data.candidates[0].content.parts[0].text;
      try {
        return JSON.parse(jsonString);
      } catch (parseError) {
        console.error("JSON 파싱 에러 (JSON 모드):", parseError.message);
        console.error("모델 원본 응답 (JSON 문자열 예상):", jsonString);
        return schema.type === "ARRAY" ? [] : {};
      }
    }

    console.error("Gemini API 응답 구조가 예상과 다릅니다 (JSON):", response.data);
     if (response.data.promptFeedback && response.data.promptFeedback.blockReason) {
       // JSON 모드에서 차단 이유 확인
       const reason = response.data.promptFeedback.blockReason;
       const details = response.data.promptFeedback.safetyRatings || "세부 정보 없음";
       // 스키마 관련 문제일 수도 있음 (예: 'SCHEMA_VALIDATION_FAILED')
       console.error(`Gemini API 요청 차단됨 (JSON 모드): ${reason}`, details);
       throw new Error(`Gemini API 요청 차단됨 (JSON 모드): ${reason}`);
    }
    return schema.type === "ARRAY" ? [] : {};
  } catch (error) {
    console.error("Gemini API 호출 에러 (JSON - axios):", error.response ? error.response.data : error.message);
    if (error.response && error.response.data && error.response.data.error) {
      console.error("상세 에러:", error.response.data.error.message);
      throw new Error(`Gemini API Error (JSON 모드): ${error.response.data.error.message}`);
    }
    throw error;
  }
}

// --- Exported 함수들 ---

/**
 * 속성 번역 프롬프트 호출 함수
 *
 * @param {string} prompt - 사용자 입력 프롬프트 (중국어 속성)
 * @returns {Promise<Array<Object>>} - 변환된 속성 배열 (형식: [{"속성명": "속성값"}, ...])
 */
export async function translatAttributePrompt(prompt) {
  const resultKeyVal = await callGeminiJson(prompt, promptText, attributeSchema);

  if (!Array.isArray(resultKeyVal)) {
    console.error("Gemini 속성 번역 결과가 배열이 아닙니다:", resultKeyVal);
    return []; // 빈 배열 반환
  }

  // [{"key": "...", "value": "..."}, ...] 형식을 [{"속성명": "속성값"}, ...] 형식으로 변환
  //기존 코드랑 사용연결성 올릴수 있도록 변형
  try {
    const transformedResult = resultKeyVal.map(item => {
      if (item && typeof item.key === 'string' && item.value !== undefined) {
        return { [item.key]: item.value };
      } else {
        console.warn("속성 번역 결과의 항목 형식이 올바르지 않습니다:", item);
        return null;
      }
    }).filter(item => item !== null);

    return transformedResult; // 변환된 결과 반환
  } catch (transformError) {
    console.error("속성 번역 결과 변환 중 에러 발생:", transformError);
    console.error("원본 key-value 결과:", resultKeyVal);
    return [];
  }
}

/**
 * 옵션 종류와 값을 한 번에 번역하는 함수
 * 
 * @param {Object} optionData - 옵션 데이터 객체 (optionname, optionvalue를 속성으로 포함)
 * @returns {Promise<Object>} - 번역된 옵션 객체 (translated_optionname, translated_optionvalue 속성 포함)
 */
export async function translateOptionPrompt(optionData) {
  try {
    const promptData = JSON.stringify(optionData);
    const result = await callGeminiJson(promptData, optionPrompt, optionSchema);
    
    if (!result || typeof result !== 'object') {
      console.error("옵션 번역 결과가 올바른 형식이 아닙니다:", result);
      return {
        translated_optionname: optionData.optionname,
        translated_optionvalue: optionData.optionvalue
      };
    }
    
    return {
      translated_optionname: result.translated_optionname || optionData.optionname,
      translated_optionvalue: result.translated_optionvalue || optionData.optionvalue
    };
  } catch (error) {
    console.error("옵션 번역 중 오류 발생:", error);
    return {
      translated_optionname: optionData.optionname,
      translated_optionvalue: optionData.optionvalue
    };
  }
}

/**
 * 옵션 종류 (Pid) 번역 프롬프트 호출 함수
 * 
 * @deprecated 이 함수는 이전 버전과의 호환성을 위해 유지됩니다. 새로운 구현에서는 translateOptionPrompt를 사용하세요.
 * @param {string} prompt - 사용자 입력 프롬프트 (중국어 옵션 종류)
 * @returns {Promise<string>} - 번역된 옵션 종류 텍스트
 */
export async function translatePidOptionPrompt(prompt) {
  return await callGeminiText(prompt, pidprompt);
}

/**
 * 옵션 값 (Vid) 번역 프롬프트 호출 함수
 * 
 * @deprecated 이 함수는 이전 버전과의 호환성을 위해 유지됩니다. 새로운 구현에서는 translateOptionPrompt를 사용하세요.
 * @param {string} prompt - 사용자 입력 프롬프트 (중국어 옵션 값)
 * @returns {Promise<string>} - 번역된 옵션 값 텍스트
 */
export async function translatevidOptionPrompt(prompt) {
  return await callGeminiText(prompt, vidprompt);
}

/**
 * 상품명 번역 프롬프트 호출 함수 (SEO 최적화)
 *
 * @param {string} prompt - 중국어 상품명 원문
 * @returns {Promise<string>} - 번역된 상품명 텍스트
 */
export async function translateProductNamePrompt(prompt) {
  return await callGeminiText(prompt, productNameprompt);
}

/**
 * 키워드 포함 상품명 번역 프롬프트 호출 함수
 *
 * @param {string} productName - 중국어 상품명 원문
 * @param {Array<string>} keywords - 포함할 키워드 배열
 * @returns {Promise<string>} - 번역된 상품명 텍스트
 */
export async function translateProductNameWithKeywordPrompt(productName, keywords) {
  const promptData = JSON.stringify({ productName, keywords });
  return await callGeminiText(promptData, productNameWithKeywordPrompt);
}

/**
 * 키워드 생성 프롬프트 호출 함수
 *
 * @param {string} prompt - 중국어 상품명 원문
 * @returns {Promise<Array<string>>} - 생성된 키워드 문자열 배열
 */
export async function translateKeywordGenerationPrompt(prompt) {
  const result = await callGeminiJson(prompt, keywordGenerationprompt, keywordSchema);
  return Array.isArray(result) ? result : [];
}

/**
 * 브랜드명 번역 프롬프트 호출 함수
 *
 * @param {string} prompt - 중국어 브랜드명 원문
 * @returns {Promise<string>} - 번역된 브랜드명 (한국어/영어) 텍스트
 */
export async function translateBrandNamePrompt(prompt) {
  return await callGeminiText(prompt, brandtranslationprompt);
} 

/**
 * 간단 상품명 번역 프롬프트 호출 함수 (규칙 없음)
 * (브랜드 식별/필터링 목적)
 * @param {string} productName - 번역할 중국어 상품명
 * @returns {Promise<string>} - 번역된 한국어 상품명 텍스트
 */
export async function translateSimpleProductNamePrompt(productName) {
    // callGeminiText를 사용하여 간단 번역 프롬프트 호출
    return await callGeminiText(productName, simpleProductNamePrompt);
  }
  