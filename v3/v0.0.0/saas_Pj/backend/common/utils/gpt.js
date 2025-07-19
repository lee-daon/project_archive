import axios from "axios";
import dotenv from "dotenv";
import logger from './logger.js';
dotenv.config();

const API_KEY = process.env.OPENAI_API_KEY;
const RESPONSES_API_URL = 'https://api.openai.com/v1/responses';

/**
 * OpenAI Responses API를 사용하여 JSON 응답을 반환하는 함수 (AIcategoryMapper용)
 * @param {Object} inputData - JSON 형태의 입력 데이터
 * @param {string} developerPrompt - 개발자 프롬프트
 * @returns {Promise<Object>} - JSON 형식의 응답
 */
async function callChatGPTJson(inputData, developerPrompt) {
  try {
    const response = await axios.post(
      RESPONSES_API_URL,
      {
        model: "o4-mini",
        input: [
          {
            role: "developer",
            content: [
              {
                type: "input_text",
                text: developerPrompt
              }
            ]
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: JSON.stringify(inputData, null, 2)
              }
            ]
          }
        ],
        text: {
          format: {
            type: "json_object"
          }
        },
        reasoning: {
          effort: "low"
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        }
      }
    );

    // Responses API 응답 구조에서 JSON 추출
    const outputContent = response.data.output;
    if (!outputContent || outputContent.length === 0) {
      throw new Error('응답에서 출력 내용을 찾을 수 없습니다.');
    }

    // 첫 번째 출력에서 텍스트 내용 추출
    const messageOutput = outputContent.find(output => output.type === 'message');
    if (!messageOutput || !messageOutput.content || messageOutput.content.length === 0) {
      throw new Error('응답에서 메시지 내용을 찾을 수 없습니다.');
    }

    const textContent = messageOutput.content.find(content => content.type === 'output_text');
    if (!textContent || !textContent.text) {
      throw new Error('응답에서 텍스트 내용을 찾을 수 없습니다.');
    }

    // JSON 파싱 시도
    try {
      const jsonResponse = JSON.parse(textContent.text);
      return jsonResponse;
    } catch (parseError) {
      logger.error(parseError);
      logger.error(textContent.text);
      throw new Error(`JSON 파싱 실패: ${parseError.message}`);
    }
  } catch (error) {
    logger.error(error.response ? error.response.data : error.message);
    throw error;
  }
}

// 함수 export
export { 
  callChatGPTJson
};

