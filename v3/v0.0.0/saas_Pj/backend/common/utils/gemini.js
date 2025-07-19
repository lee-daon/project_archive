/**
 * @fileoverview Gemini API를 호출하여 번역 및 기타 서비스를 제공하는 함수 모음
 * 
 * 이 파일은 Gemini API를 사용하여 중국어 텍스트(상품 속성, 옵션, 상품명, 브랜드명 등)를
 * 한국어(및 영어)로 변역하는 여러 함수를 포함하고 있습니다.
 */

import axios from "axios";
import dotenv from "dotenv";
import { geminiLimiter } from "./Globalratelimiter.js";
import logger from './logger.js';
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY ;
// Gemini REST API 엔드포인트 (v1beta 사용 예시)
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;
// const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-pro:generateContent?key=${API_KEY}`; // Pro 모델 사용 시

// 간단한 상품명 번역 프롬프트
const simpleProductNamePrompt = `번역된 한국어 상품명만 반환해주세요.`;

// 브랜드 식별 프롬프트
const identifyBrandPrompt = `
상품명과 브랜드명 정보를 바탕으로 정확한 브랜드를 식별하고 "한글브랜드명/영어브랜드명" 형태로 출력해주세요.

[처리 규칙]
1. 기존 브랜드명이 있다면 우선 참고하되, 상품명과 일치하는지 확인
2. 상품명 앞부분에 나오는 브랜드명을 우선 식별
3. 중국어 브랜드는 한국에서 통용되는 공식 명칭으로 변환 (예: 小米→샤오미, 华为→화웨이)
4. 영어 브랜드는 정확한 공식 명칭 사용하고 한글 표기 추가 (예: Apple→애플/Apple)
5. 브랜드가 불분명하거나 일반 명사인 경우 "없음" 출력
6. 출력 형태: "한글브랜드명/영어브랜드명" 또는 "없음"

[예시]
상품명="小米 智能手机 128GB", 브랜드명="" → "샤오미/Xiaomi"
상품명="Apple iPhone 15 Pro", 브랜드명="Apple" → "애플/Apple"
상품명="华为 P50 Pro", 브랜드명="华为" → "화웨이/Huawei"
상품명="Samsung Galaxy S24", 브랜드명="" → "삼성/Samsung"
상품명="普通手机壳", 브랜드명="" → "없음"
상품명="无线充电器", 브랜드명="无品牌" → "없음"
`;

/**
 * Gemini 텍스트 API 호출 함수
 *
 * @param {string} promptContent - 사용자 프롬프트 내용
 * @param {string} systemInstruction - 시스템 지침 (프롬프트)
 * @returns {Promise<string>} - 텍스트 응답을 반환하는 프로미스
 */
async function callGeminiText(promptContent, systemInstruction) {
  await geminiLimiter.acquire();
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

    logger.error(response.data);
    if (response.data.promptFeedback?.blockReason) {
      throw new Error(`Gemini API 요청 차단됨: ${response.data.promptFeedback.blockReason}`);
    }
    return "";
  } catch (error) {
    logger.error(error.response ? error.response.data : error.message);
    if (error.response?.data?.error) {
      throw new Error(`Gemini API Error: ${error.response.data.error.message}`);
    }
    throw error;
  }
}


/**
 * 간단 상품명 번역 프롬프트 호출 함수 (단순 번역만)
 * @param {string} productName - 번역할 중국어 상품명
 * @returns {Promise<string>} - 번역된 한국어 상품명 텍스트
 */
export async function translateSimpleProductNamePrompt(productName) {
    return await callGeminiText(productName, simpleProductNamePrompt);
}

/**
 * 상품명과 브랜드명 정보를 바탕으로 브랜드 식별 및 정리
 * @param {string} productTitle - 상품명
 * @param {string} brandName - 기존 브랜드명 (없으면 빈 문자열)
 * @returns {Promise<string>} - "한글브랜드명/영어브랜드명" 또는 "없음"
 */
export async function identifyBrandFromInfo(productTitle, brandName = '') {
    const inputText = `상품명="${productTitle}", 브랜드명="${brandName}"`;
    return await callGeminiText(inputText, identifyBrandPrompt);
}
  