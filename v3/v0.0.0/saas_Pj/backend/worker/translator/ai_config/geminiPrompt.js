const attributePrompt = `
[시스템 역할 안내]
당신은 중국어로 된 상품 속성을 자연스럽게 한국어로 변환해주는 전문가입니다.

[사용자 요청]
번역 시 다음 사항을 지켜주세요:
1. 명사 중심의 간결한 한국식 표현 사용
2. 한국식 단위 적용 (cm, g, mL 등)
3. 상품명에 맞는 적절한 용어 활용
4. 번역 어려운 속성은 원문 그대로 반환
5. 모든 속성값 누락 없이 처리

입력은 {{상품명: 상품명},[ {속성명:속성값}, {속성명2:속성값2} .....]} 으로 제시될 것입니다.
`; // 원하는 출력 형식은 스키마로 정의

const optionPrompt = `
당신은 중국어 상품 옵션을 한국어로 번역하는 전문가입니다.

번역 규칙:
1. 옵션명과 옵션값 모두 25자 이하로 간결하게 번역
2. 명사 중심의 한국식 표현 사용
3. 번역 어려운 경우 원문 그대로 반환

입력 형식: { optionname: "옵션명", optionvalue: "옵션값" }
`;

/**
 * 기본 상품명 최적화 프롬프트
 */
const productNameprompt = `
includeBrand가 false라면 브랜드를 포함시키지 말아줘.
최종결과는 번역된 한국어 상품명만 반환해줘.
`;


/**
 * 키워드 생성 프롬프트
 */
const keywordGenerationprompt = `
제시된 상품명을 참고해 20개의 한국어 키워드들을 생성해 주세요.
include항목은 키워드에 포함시켜 주세요.
키워드는 한단어로 작성해 주세요.
상품의 잠재적 용도나 타겟 사용자를 고려한 키워드도 포함하세요.
키워드에 중국어가 포함되서는 안됩니다.
`;

/**
 * 이미지와 텍스트를 분석하여 상품 키워드를 생성하는 프롬프트
 */
const imageKeywordGenerationPrompt = `
제시된 상품명과 이미지를 참고해 20개의 한국어 키워드들을 생성해 주세요.
include항목은 키워드에 포함시켜 주세요.
키워드는 한단어로 작성해 주세요.
상품의 잠재적 용도나 타겟 사용자를 고려한 키워드도 포함하세요.
키워드에 중국어가 포함되서는 안됩니다.

[이미지 분석 추가 지침]
- 이미지에 보이는 상품의 주요 특징(색상, 디자인, 형태, 재질 등)을 확인하세요
- 상품명에 나타난 정보와 이미지에서 확인한 특징을 결합하여 키워드를 생성하세요
- 이미지에서 인식된 제품 카테고리, 색상, 스타일 등이 중요한 키워드가 됩니다
- 상품의 사용 용도가 이미지에서 명확하게 보이는지 확인하세요
- 상품의 스타일(캐주얼, 포멀, 모던, 클래식 등)을 파악하세요
- 이미지에서 추가적인 제품 특징(방수, 내구성, 휴대성 등)을 유추할 수 있는지 확인하세요
`;

// --- JSON 스키마 정의 ---
const GeminiAttributeSchema = {
    type: "ARRAY",
    description: "번역된 속성 키-값 쌍의 배열",
    items: {
      type: "OBJECT",
      description: "번역된 속성명(key)과 값(value)을 포함하는 객체",
      properties: {
        "key": { type: "STRING", description: "번역된 속성 이름" },
        "value": { type: "STRING", description: "번역된 속성 값" }
      },
      propertyOrdering: ["key", "value"], // 속성 순서 명시
      required: ["key", "value"]
    }
  };
  
  const GeminiKeywordSchema = {
    type: "ARRAY",
    description: "생성된 키워드 문자열의 배열",
    items: {
      type: "STRING",
      description: "한국어로 된 상품 관련 키워드"
    }
  };
  
  // 옵션 번역용 JSON 스키마 정의
  const GeminiOptionSchema = {
    type: "OBJECT",
    description: "번역된 옵션 이름과 옵션 값",
    properties: {
      "translated_optionname": { type: "STRING", description: "번역된 옵션 이름" },
      "translated_optionvalue": { type: "STRING", description: "번역된 옵션 값" }
    },
    propertyOrdering: ["translated_optionname", "translated_optionvalue"],
    required: ["translated_optionname", "translated_optionvalue"]
  };

export {
  attributePrompt,
  optionPrompt,
  productNameprompt,
  keywordGenerationprompt,
  imageKeywordGenerationPrompt,
  GeminiAttributeSchema,
  GeminiKeywordSchema,
  GeminiOptionSchema
};