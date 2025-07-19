import axios from "axios";
import dotenv from "dotenv";
import { geminiLimiter } from "../../../common/utils/Globalratelimiter.js";

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY ;
// Gemini REST API 엔드포인트 (v1beta 사용 예시)
const GEMINI_FLASH_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

/**
 * Gemini API 텍스트 생성 함수
 * 
 * @param {string} promptContent - 사용자 프롬프트 내용
 * @param {string} systemInstruction - 시스템 지침 (프롬프트)
 * @param {number} thinkingBudget - 사고 프로세스에 할당할 예산 (기본값: 0)
 * @returns {Promise<string>} - 텍스트 응답을 반환하는 프로미스
 */
async function generateGeminiText(promptContent, systemInstruction, thinkingBudget = 0) {
  await geminiLimiter.acquire();
  try {
    const requestData = {
      system_instruction: {
        parts: [{ text: systemInstruction }]
      },
      contents: [
        {
          parts: [{ text: promptContent }]
        }
      ],
      generationConfig: {
        responseMimeType: "text/plain"
      }
    };

    // thinkingBudget이 0보다 크면 thinkingConfig 추가
    if (thinkingBudget > 0) {
      requestData.generationConfig.thinkingConfig = {
        thinkingBudget: thinkingBudget
      };
    }

    const response = await axios.post(GEMINI_FLASH_API_URL, requestData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // 응답 데이터에서 텍스트 추출
    if (response.data?.candidates?.[0]?.content?.parts?.length > 0) {
      return response.data.candidates[0].content.parts[0].text.trim();
    }

    console.error("Gemini API 응답 구조가 예상과 다릅니다:", response.data);
    if (response.data.promptFeedback && response.data.promptFeedback.blockReason) {
      throw new Error(`Gemini API 요청 차단됨: ${response.data.promptFeedback.blockReason}`);
    }
    return "";
  } catch (error) {
    console.error("Gemini API 호출 에러:", error.response ? error.response.data : error.message);
    throw error;
  }
}

/**
 * Gemini API JSON 생성 함수
 * 
 * @param {string} promptContent - 사용자 프롬프트 내용
 * @param {string} systemInstruction - 시스템 지침 (프롬프트)
 * @param {Object} schema - 응답 JSON 스키마
 * @param {number} thinkingBudget - 사고 프로세스에 할당할 예산 (기본값: 0)
 * @returns {Promise<Object>} - 파싱된 JSON 응답 객체
 */
async function generateGeminiJson(promptContent, systemInstruction, schema, thinkingBudget = 0) {
  if (!schema) {
    throw new Error("schema 파라미터가 필요합니다.");
  }
  await geminiLimiter.acquire();
  try {
    const requestData = {
      system_instruction: {
        parts: [{ text: systemInstruction }]
      },
      contents: [
        {
          parts: [{ text: promptContent }]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    };

    // thinkingBudget이 0보다 크면 thinkingConfig 추가
    if (thinkingBudget > 0) {
      requestData.generationConfig.thinkingConfig = {
        thinkingBudget: thinkingBudget
      };
    }

    const response = await axios.post(GEMINI_FLASH_API_URL, requestData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // JSON 응답 처리
    if (response.data?.candidates?.[0]?.content?.parts?.length > 0) {
      const jsonString = response.data.candidates[0].content.parts[0].text;
      try {
        return JSON.parse(jsonString);
      } catch (parseError) {
        console.error("JSON 파싱 에러:", parseError.message);
        return schema.type === "ARRAY" ? [] : {};
      }
    }

    console.error("Gemini API 응답 구조가 예상과 다릅니다:", response.data);
    return schema.type === "ARRAY" ? [] : {};
  } catch (error) {
    console.error("Gemini API 호출 에러:", error.response ? error.response.data : error.message);
    throw error;
  }
}

/**
 * Gemini API 이미지와 텍스트 생성 함수 - 이미지 base64 데이터 처리
 * 
 * @param {string} promptContent - 사용자 프롬프트 내용
 * @param {string} imageBase64 - base64로 인코딩된 이미지 데이터
 * @param {string} imageMimeType - 이미지의 MIME 타입 (기본값: "image/jpeg")
 * @param {string} systemInstruction - 시스템 지침 (프롬프트)
 * @param {Object} schema - 응답 JSON 스키마 (선택적, 제공 시 JSON 응답 반환)
 * @param {number} thinkingBudget - 사고 프로세스에 할당할 예산 (기본값: 0)
 * @returns {Promise<string|Object>} - 텍스트 또는 JSON 응답을 반환하는 프로미스
 */
async function generateGeminiWithImage(promptContent, imageBase64, imageMimeType = "image/jpeg", systemInstruction, schema = null, thinkingBudget = 0) {
  await geminiLimiter.acquire();
  try {
    // 이미지 데이터가 없으면 상황에 따라 일반 텍스트 또는 JSON 생성 함수 호출
    if (!imageBase64) {
      if (schema) {
        return generateGeminiJson(promptContent, systemInstruction, schema, thinkingBudget);
      } else {
        return generateGeminiText(promptContent, systemInstruction, thinkingBudget);
      }
    }

    const requestData = {
      system_instruction: {
        parts: [{ text: systemInstruction }]
      },
      contents: [
        {
          parts: [
            { text: promptContent },
            {
              inline_data: {
                mime_type: imageMimeType,
                data: imageBase64
              }
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: schema ? "application/json" : "text/plain"
      }
    };

    // JSON 스키마가 있으면 추가
    if (schema) {
      requestData.generationConfig.responseSchema = schema;
    }

    // thinkingBudget이 0보다 크면 thinkingConfig 추가
    if (thinkingBudget > 0) {
      requestData.generationConfig.thinkingConfig = {
        thinkingBudget: thinkingBudget
      };
    }

    const response = await axios.post(GEMINI_FLASH_API_URL, requestData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // 응답 데이터 처리
    if (response.data?.candidates?.[0]?.content?.parts?.length > 0) {
      const resultText = response.data.candidates[0].content.parts[0].text.trim();
      
      // JSON 스키마가 제공된 경우 JSON 파싱 시도
      if (schema) {
        try {
          return JSON.parse(resultText);
        } catch (parseError) {
          console.error("JSON 파싱 에러:", parseError.message);
          return schema.type === "ARRAY" ? [] : {};
        }
      }
      
      // 일반 텍스트 반환
      return resultText;
    }

    console.error("Gemini API 응답 구조가 예상과 다릅니다:", response.data);
    if (response.data.promptFeedback && response.data.promptFeedback.blockReason) {
      throw new Error(`Gemini API 요청 차단됨: ${response.data.promptFeedback.blockReason}`);
    }
    
    // 빈 결과 반환 (스키마 유형에 따라)
    return schema ? (schema.type === "ARRAY" ? [] : {}) : "";
  } catch (error) {
    console.error("Gemini API 호출 에러:", error.response ? error.response.data : error.message);
    throw error;
  }
}

export {
  generateGeminiText,
  generateGeminiJson,
  generateGeminiWithImage
};