import os
import logging
import json
import aiohttp

# 로깅 설정
logger = logging.getLogger(__name__)

# API 키 (환경 변수 사용 권장)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") # 환경 변수에서 읽어오기
if not GEMINI_API_KEY:
    logger.critical("GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.")
    raise ValueError("API 키가 필요합니다.") # 필요 시 주석 해제

# Gemini API 엔드포인트 (모델 이름 확인 필요, 예: gemini-1.5-flash)
API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"

# --- JSON 응답 스키마 정의 (문자열 배열) ---
TRANSLATION_LIST_SCHEMA = {
    "type": "ARRAY",
    "description": "입력된 텍스트 배열에 대한 번역된 텍스트 문자열 배열. 순서는 원본 배열과 동일해야 합니다.",
    "items": {
        "type": "STRING"
    }
}

async def call_gemini_translate_list(texts_to_translate: list[str], request_id: str = "N/A") -> list[str]:
    """
    Gemini API를 JSON 모드로 호출하여 텍스트 리스트 전체를 번역합니다.

    Args:
        texts_to_translate: 번역할 텍스트 문자열 리스트.
        request_id: 로깅을 위한 요청 ID.

    Returns:
        번역된 텍스트 문자열 리스트.

    Raises:
        aiohttp.ClientError: 네트워크 또는 API 호출 중 에러 발생 시.
        ValueError: API 응답 구문 분석 실패, 스키마 불일치, 길이 불일치 또는 API 에러 메시지 포함 시.
        json.JSONDecodeError: 입력 리스트를 JSON으로 변환 실패 시.
    """
    if not texts_to_translate:
        logger.info(f"[{request_id}] 번역할 텍스트 리스트가 비어있습니다. 빈 리스트 반환.")
        return []

    # 시스템 지침 정의
    system_instruction = (
        "You are a helpful translation assistant. "
        "Translate each of the following texts from the input JSON array into Korean. "
        "I am translating texts that appear in product detail images, and the Korean translations should be natural. "
        "Ensure the output array has the same number of elements as the input array and maintains the original order. "
    )

    # 입력 텍스트 리스트를 JSON 문자열로 변환
    try:
        prompt_content = json.dumps(texts_to_translate, ensure_ascii=False)
    except json.JSONDecodeError as e:
        logger.error(f"[{request_id}] 입력 텍스트 리스트를 JSON으로 변환 실패: {e}")
        raise e

    headers = {
        'Content-Type': 'application/json'
    }
    request_data = {
        "system_instruction": {
            "parts": [{"text": system_instruction}]
        },
        "contents": [
            {
                "role": "user",
                "parts": [{"text": prompt_content}] # JSON 문자열을 프롬프트로 전달
            }
        ],
        "generationConfig": {
            "responseMimeType": "application/json", # JSON 모드 활성화
            "responseSchema": TRANSLATION_LIST_SCHEMA # 정의된 스키마 사용
        }
    }

    logger.debug(f"[{request_id}] Calling Gemini API (JSON List). URL: {API_URL.split('?')[0]}, Num Texts: {len(texts_to_translate)}, Prompt (partial): {prompt_content[:100]}...")

    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(API_URL, headers=headers, json=request_data) as response:
                response_text = await response.text()
                response.raise_for_status() # HTTP 에러 체크

                try:
                    response_data = json.loads(response_text)
                except json.JSONDecodeError:
                    logger.error(f"[{request_id}] Gemini API JSON 응답 파싱 실패 (List). 응답: {response_text}")
                    raise ValueError("Failed to parse Gemini API JSON response (List)")

                # JSON 모드 응답 구조는 약간 다름 (text 필드가 직접 포함됨)
                if response_data.get("candidates") and \
                   len(response_data["candidates"]) > 0 and \
                   response_data["candidates"][0].get("content") and \
                   response_data["candidates"][0]["content"].get("parts") and \
                   len(response_data["candidates"][0]["content"]["parts"]) > 0 and \
                   isinstance(response_data["candidates"][0]["content"]["parts"][0].get("text"), str): # text 필드가 문자열인지 확인

                    # JSON 모드에서는 parts[0].text 자체가 JSON 문자열임
                    translated_list_json = response_data["candidates"][0]["content"]["parts"][0]["text"]
                    try:
                        translated_list = json.loads(translated_list_json)
                    except json.JSONDecodeError:
                        logger.error(f"[{request_id}] Gemini API 반환 JSON 내부 파싱 실패 (List). 내부 JSON: {translated_list_json}")
                        raise ValueError("Failed to parse inner JSON from Gemini API response (List)")

                    # 반환된 것이 리스트인지 확인
                    if not isinstance(translated_list, list):
                        logger.error(f"[{request_id}] Gemini API가 JSON 배열을 반환하지 않음 (List). 반환값 타입: {type(translated_list)}")
                        raise ValueError("Gemini API did not return a JSON array as expected (List)")

                    # 입력과 출력 리스트 길이 비교
                    if len(translated_list) != len(texts_to_translate):
                         logger.error(f"[{request_id}] Gemini API 번역 결과 길이 불일치 (List). 입력: {len(texts_to_translate)}, 출력: {len(translated_list)}")
                         raise ValueError(f"Length mismatch between input ({len(texts_to_translate)}) and translated output ({len(translated_list)}) (List)")

                    logger.debug(f"[{request_id}] Gemini API 응답 수신 (List). 번역된 항목 수: {len(translated_list)}")
                    return translated_list # 성공 시 번역된 리스트 반환
                else:
                    # 예상치 못한 응답 구조 또는 빈 응답 처리 (JSON 모드)
                    logger.error(f"[{request_id}] Gemini API 응답 구조가 예상과 다릅니다 (List): {response_data}")
                    if response_data.get("promptFeedback") and response_data["promptFeedback"].get("blockReason"):
                        reason = response_data['promptFeedback']['blockReason']
                        ratings = response_data['promptFeedback'].get('safetyRatings', 'N/A')
                        logger.error(f"[{request_id}] Gemini API 요청 차단됨 (List): {reason}, 이유: {ratings}")
                        raise ValueError(f"Gemini API request blocked (List): {reason}")
                    raise ValueError("Unexpected Gemini API response structure (List)")

        except aiohttp.ClientResponseError as e:
            logger.error(f"[{request_id}] Gemini API HTTP 에러 (List): {e.status} {e.message}. 응답: {response_text}")
            try:
                error_details = json.loads(response_text)
                if error_details.get("error") and error_details["error"].get("message"):
                    logger.error(f"[{request_id}] 상세 Gemini API 에러 (List): {error_details['error']['message']}")
                    raise ValueError(f"Gemini API Error (List): {error_details['error']['message']}") from e
            except json.JSONDecodeError:
                pass
            raise e
        except aiohttp.ClientError as e:
            logger.error(f"[{request_id}] Gemini API 호출 중 네트워크/클라이언트 에러 (List): {e}")
            raise e
        except Exception as e:
             logger.error(f"[{request_id}] Gemini API 호출 중 예상치 못한 에러 (List): {e}", exc_info=True)
             raise e
