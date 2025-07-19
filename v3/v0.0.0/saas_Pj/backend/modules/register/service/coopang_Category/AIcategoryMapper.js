import { getCoupangCategoryEssentials } from './categoryMeta.js';
import { callChatGPTJson } from '../../../../common/utils/gpt.js'; // gpt.js 사용으로 변경

const COUPANG_OPTION_MAPPING_PROMPT = `
# 시스템 역할 안내
당신은 상품 정보 변환 전문가입니다. 주어진 중국 쇼핑몰 상품 정보와 쿠팡의 카테고리별 필수 입력 정보를 바탕으로, 쿠팡에 등록하기 가장 적합한 형태로 상품 옵션명과 값을 재구성해야 합니다.

## 사용자 요청
다음 정보를 바탕으로 쿠팡에 등록할 상품 옵션을 생성해주세요:

### 1. 현재 상품 옵션 정보 (optionSchema, variants)
- \`optionSchema\`: 현재 상품의 옵션 구성 방식 (예: 색상, 사이즈)
- \`variants\`: 각 옵션 조합별 재고 및 가격 정보

### 2. 쿠팡 카테고리 필수/선택 속성 정보 (coupangAttributes)
- 각 속성은 \`name\`(속성명), \`dataType\`, \`inputType\`, \`required\`(\`MANDATORY\` 또는 \`OPTIONAL\`), \`basicUnit\`(해당 시 단위), \`inputValues\`(선택 가능한 값 목록) 등을 포함합니다.
- \`MANDATORY\` 속성은 반드시 상품 정보에 포함되어야 합니다.

### 3. 기존 상품 기본 정보 (productName)
- 상품명을 통해 상품의 특성을 파악하여 적절한 옵션 매핑에 활용

## 🚨 중요한 제한사항
1. **쿠팡 옵션 조합은 최대 3개까지만 가능합니다.** 즉, 각 variant의 optionCombination 배열은 최대 3개의 \`{ optionId, valueId }\` 쌍만 포함할 수 있습니다.
2. **옵션명(optionName)은 반드시 쿠팡의 속성명(coupangAttributes의 name)을 사용해야 합니다.** 절대로 쿠팡 coupangAttributes의 name이외의 옵션명을 사용하지 마세요.
3. **기존 이미지 정보(imageUrl)는 반드시 보존해야 합니다.** 원본 optionSchema의 optionValues에 있는 imageUrl이 있다면 반드시 그대로 유지하고, 없다면 빈 문자열이나 null로 처리하세요. 이미지 개수가 변경되면 매핑이 실패할 수 있습니다.
4. **응답은 반드시 유효한 JSON 형식만 반환해야 합니다.** 추가적인 설명이나 텍스트 없이 순수한 JSON 데이터만 출력하세요.
5. 만약 \`MANDATORY\` 속성이 3개를 초과한다면, 가장 중요한 3개를 선택하거나 여러 속성을 하나의 옵션으로 결합해야 합니다.

## 📋 출력 규칙

### 📐 양식적 요구사항이 내용의 정확성보다 우선시됩니다
다음 구조적 규칙들을 반드시 준수해야 하며, 이는 개별 값의 의미적 정확성보다 중요합니다:
- ✅ 올바른 JSON 형식과 필수 필드들(optionSchema, variants) 완전 포함
- ✅ 모든 \`MANDATORY\` 속성을 상품 정보에 반드시 포함
- ✅ \`inputType\`이 \`SELECT\`인 경우 반드시 \`inputValues\` 중에서만 선택
- ✅ \`inputType\`이 \`INPUT\`이고 \`basicUnit\`이 있는 경우 반드시 해당 단위 포함
- ✅ 최대 3개 옵션 조합 제한 준수

### 🔄 옵션 매핑 규칙
1. 모든 \`MANDATORY\` 속성을 충족하는 새로운 옵션 조합을 만들어야 합니다.
2. 기존 상품 옵션(\`optionSchema\`, \`variants\`)을 최대한 활용하되, \`MANDATORY\` 속성을 만족시키기 위해 기존 옵션명/값에 쿠팡 요구 속성명/값을 추가하거나 변형해야 할 수 있습니다.
   - 💡 **예시**: 기존 옵션이 "사이즈: M"이고, 쿠팡 \`MANDATORY\` 속성이 "색상"이라면, "사이즈+색상" 형태로 조합하거나 각각을 별도 옵션으로 처리할 수 있습니다.
3. **최대 3개의 옵션까지만 사용할 수 있으므로**, 만약 필요한 속성이 3개를 초과한다면:
   - 여러 속성을 하나의 옵션으로 결합 (예: "색상+소재": "빨간색+면")
   - 가장 중요한 속성 3개만 선택
   - OPTIONAL 속성은 우선순위를 낮춰서 제외

## 📝 입력 데이터 예시

\`\`\`json
{
  "productName": "남성용 순면 반팔 티셔츠 M 사이즈",
  "optionSchema": [
    {
      "optionId": "1627207",
      "optionName": "색상분류",
      "optionValues": [
        { "valueId": "1177220561", "valueName": "블랙", "imageUrl": "https://image.url/black.jpg" },
        { "valueId": "1177220562", "valueName": "화이트", "imageUrl": "https://image.url/white.jpg" }
      ]
    }
  ],
  "variants": [
    {
      "stockQuantity": 50,
      "price": "15000.00",
      "optionCombination": [{ "optionId": "1627207", "valueId": "1177220561" }]
    },
    {
      "stockQuantity": 50,
      "price": "15000.00", 
      "optionCombination": [{ "optionId": "1627207", "valueId": "1177220562" }]
    }
  ],
  "coupangAttributes": [
    { "name": "색상", "dataType": "STRING", "inputType": "SELECT", "required": "MANDATORY", "inputValues": ["검정색", "흰색", "빨간색"] },
    { "name": "사이즈", "dataType": "STRING", "inputType": "INPUT", "required": "MANDATORY" },
    { "name": "소재", "dataType": "STRING", "inputType": "INPUT", "required": "MANDATORY" },
    { "name": "총 중량", "dataType": "NUMBER", "inputType": "INPUT", "required": "OPTIONAL", "basicUnit": "g" }
  ]
}
\`\`\`

## 📤 출력 JSON 형식 (3개 옵션 조합 예시)

### 🖼️ **이미지 보존 중요!**
원본에서 "색상분류" 옵션에 이미지가 있었다면, 옵션명이 "색상"으로 변경되더라도 **반드시 기존 이미지 URL을 그대로 보존**해야 합니다.

\`\`\`json
{
  "optionSchema": [
    {
      "optionId": "1627207",
      "optionName": "색상",
      "optionValues": [
        { "valueId": "1177220561", "valueName": "검정색", "imageUrl": "https://image.url/black.jpg" },
        { "valueId": "1177220562", "valueName": "흰색", "imageUrl": "https://image.url/white.jpg" }
      ]
    },
    {
      "optionId": "1627208", 
      "optionName": "사이즈",
      "optionValues": [
        { "valueId": "1177220563", "valueName": "M" }
      ]
    },
    {
      "optionId": "1627209",
      "optionName": "소재", 
      "optionValues": [
        { "valueId": "1177220564", "valueName": "순면" }
      ]
    }
  ],
  "variants": [
    {
      "stockQuantity": 50,
      "price": "15000.00",
      "optionCombination": [
        { "optionId": "1627207", "valueId": "1177220561" },
        { "optionId": "1627208", "valueId": "1177220563" },
        { "optionId": "1627209", "valueId": "1177220564" }
      ]
    },
    {
      "stockQuantity": 50, 
      "price": "15000.00",
      "optionCombination": [
        { "optionId": "1627207", "valueId": "1177220562" },
        { "optionId": "1627208", "valueId": "1177220563" },
        { "optionId": "1627209", "valueId": "1177220564" }
      ]
    }
  ]
}
\`\`\`

### ⚠️ **이미지 처리 규칙:**
- ✅ 원본에 이미지가 있으면: "imageUrl": "//img.alicdn.com/bao/uploaded/..." (그대로 보존)
- ✅ 원본에 이미지가 없으면: "imageUrl": "" (빈 문자열 유지)
- ❌ 이미지 개수 변경 (시스템에서 자동 롤백됨)
`;

/**
 * 제한된 variants에서 실제로 사용되는 optionValues만 남기고 불필요한 것들을 제거합니다.
 * 
 * @param {Array} optionSchema - 원본 옵션 스키마
 * @param {Array} limitedVariants - 제한된 variants 배열
 * @returns {Array} 정리된 optionSchema
 */
function filterUnusedOptionValues(optionSchema, limitedVariants) {
  // 1. 제한된 variants에서 실제로 사용되는 optionId와 valueId 조합을 추출합니다.
  const usedOptionValuePairs = new Set();
  
  limitedVariants.forEach(variant => {
    if (variant.optionCombination && Array.isArray(variant.optionCombination)) {
      variant.optionCombination.forEach(option => {
        if (option.optionId && option.valueId) {
          usedOptionValuePairs.add(`${option.optionId}-${option.valueId}`);
        }
      });
    }
  });

  // 2. optionSchema를 순회하면서 실제로 사용되는 optionValues만 남깁니다.
  const filteredOptionSchema = [];
  
  optionSchema.forEach(option => {
    if (!option.optionId || !option.optionValues || !Array.isArray(option.optionValues)) {
      return; // 유효하지 않은 옵션은 건너뜁니다.
    }

    // 이 옵션에서 실제로 사용되는 optionValues만 필터링합니다.
    const usedOptionValues = option.optionValues.filter(optionValue => {
      if (!optionValue.valueId) return false;
      return usedOptionValuePairs.has(`${option.optionId}-${optionValue.valueId}`);
    });

    // 사용되는 optionValues가 있다면 옵션을 포함합니다.
    if (usedOptionValues.length > 0) {
      filteredOptionSchema.push({
        ...option,
        optionValues: usedOptionValues
      });
    }
  });

  return filteredOptionSchema;
}

/**
 * 주어진 상품 정보와 쿠팡 카테고리 메타데이터를 바탕으로 AI를 호출하여
 * 쿠팡에 적합한 형태로 옵션을 매핑하고 상품 정보를 업데이트합니다.
 *
 * @param {object} productData - 기존 상품 정보 (structure.md의 jsonData 형식)
 * @param {string} coupangAccessKey - 쿠팡 API 액세스 키
 * @param {string} coupangSecretKey - 쿠팡 API 시크릿 키
 * @param {number} coupangCategoryId - 쿠팡 카테고리 ID
 * @param {number} maxOptionCount - 최대 옵션 개수 (config에서 가져온 값)
 * @returns {Promise<object>} 성공 시 { success: true, data: { updatedProductData } }, 실패 시 { success: false, message: '에러 메시지' }
 */
export async function mapOptionsForCoupang(productData, coupangAccessKey, coupangSecretKey, coupangCategoryId, maxOptionCount) {
  try {
    // 1. 쿠팡 카테고리 필수/선택 속성 정보 가져오기
    const categoryEssentialsResult = await getCoupangCategoryEssentials(coupangAccessKey, coupangSecretKey, coupangCategoryId);
    if (!categoryEssentialsResult.success) {
      return { success: false, message: `쿠팡 카테고리 정보 조회 실패: ${categoryEssentialsResult.message}` };
    }
    const coupangAttributes = categoryEssentialsResult.data.attributes;

    // 2. variants를 maxOptionCount만큼 제한 (너무 많은 데이터로 인한 AI 오류 방지)
    const limitedVariants = productData.variants.slice(0, maxOptionCount);
    console.log(`[AIcategoryMapper] 원본 variants 개수: ${productData.variants.length}, 제한된 variants 개수: ${limitedVariants.length}`);

    // 3. 제한된 variants에서 실제로 사용되지 않는 optionValues 제거
    const filteredOptionSchema = filterUnusedOptionValues(productData.optionSchema, limitedVariants);
    console.log(`[AIcategoryMapper] 원본 optionSchema 개수: ${productData.optionSchema.length}, 정리된 optionSchema 개수: ${filteredOptionSchema.length}`);
    
    // 정리된 optionValues 개수 로깅
    const originalOptionValueCount = productData.optionSchema.reduce((total, option) => total + (option.optionValues?.length || 0), 0);
    const filteredOptionValueCount = filteredOptionSchema.reduce((total, option) => total + (option.optionValues?.length || 0), 0);
    console.log(`[AIcategoryMapper] 원본 optionValues 개수: ${originalOptionValueCount}, 정리된 optionValues 개수: ${filteredOptionValueCount}`);

    // 4. AI 요청 전 이미지 개수 체크
    const originalImageCount = filteredOptionSchema.reduce((count, option) => {
      return count + (option.optionValues?.filter(value => value.imageUrl && value.imageUrl.trim() !== "").length || 0);
    }, 0);
    
    console.log(`[AIcategoryMapper] AI 요청 전 이미지 개수: ${originalImageCount}`);

    // 5. AI에 전달할 입력 데이터 구성 (제한된 variants와 정리된 optionSchema 사용)
    const aiInputData = {
      productName: productData.productInfo.productName,
      optionSchema: filteredOptionSchema,
      variants: limitedVariants,
      coupangAttributes: coupangAttributes
    };

    // 6. AI 호출 (OpenAI Responses API - o4-mini) - JSON 객체를 직접 전달
    const aiMappedData = await callChatGPTJson(aiInputData, COUPANG_OPTION_MAPPING_PROMPT);
    if (!aiMappedData) {
      return { success: false, message: 'AI 옵션 매핑 응답이 없습니다.' };
    }

    // 7. AI 응답 후 이미지 개수 체크
    const aiImageCount = aiMappedData.optionSchema?.reduce((count, option) => {
      return count + (option.optionValues?.filter(value => value.imageUrl && value.imageUrl.trim() !== "").length || 0);
    }, 0) || 0;
    
    console.log(`[AIcategoryMapper] AI 응답 후 이미지 개수: ${aiImageCount}`);
    
    // 8. 이미지 개수가 다르면 롤백
    if (originalImageCount !== aiImageCount) {
      console.warn(`[AIcategoryMapper] 이미지 개수 불일치로 롤백: 원본 ${originalImageCount}개 -> AI 결과 ${aiImageCount}개`);
      return { 
        success: false, 
        message: `이미지 개수 불일치로 자동 매핑 실패 (원본: ${originalImageCount}개, 결과: ${aiImageCount}개)` 
      };
    }

    // 9. AI 응답 검증 (Responses API가 JSON 객체를 직접 반환함)
    if (!aiMappedData.optionSchema || !aiMappedData.variants) {
      console.error("AI 응답에 필요한 필드가 없습니다:", aiMappedData);
      return { success: false, message: 'AI 응답에 필요한 optionSchema 또는 variants가 없습니다.' };
    }

    // 10. 구조적 동일성 보장: 전체 productData 구조를 유지하면서 AI 결과 적용
    const updatedProductData = JSON.parse(JSON.stringify(productData)); // 깊은 복사
    
    // productInfo는 그대로 유지하고, optionSchema와 variants만 AI 결과로 교체
    updatedProductData.optionSchema = aiMappedData.optionSchema;
    updatedProductData.variants = aiMappedData.variants;
    
    console.log(`[AIcategoryMapper] AI 매핑 완료 - optionSchema: ${aiMappedData.optionSchema.length}개, variants: ${aiMappedData.variants.length}개`);
    console.log(`[AIcategoryMapper] 구조 확인:`);
    console.log(`  - productInfo 유지됨: ${!!updatedProductData.productInfo}`);
    console.log(`  - productInfo.productId: ${updatedProductData.productInfo?.productId}`);
    console.log(`  - productInfo.productName: ${updatedProductData.productInfo?.productName}`);
    console.log(`  - optionSchema 개수: ${updatedProductData.optionSchema?.length}`);
    console.log(`  - variants 개수: ${updatedProductData.variants?.length}`);

    return { success: true, data: { updatedProductData } };

  } catch (error) {
    console.error('쿠팡 옵션 매핑 중 오류 발생:', error);
    return { success: false, message: `쿠팡 옵션 매핑 처리 중 오류: ${error.message}` };
  }
}

/**
 * (예시 사용법)
 * async function exampleUsage() {
 *   const sampleProductData = {
 *     productInfo: {
 *       productId: "TEST12345",
 *       productName: "여성용 여름 쿨링 반팔 티셔츠",
 *       attributes: [{ name: "소재", value: "폴리에스터" }],
 *       // ... 기타 productInfo 필드
 *     },
 *     optionSchema: [
 *       {
 *         optionId: "1",
 *         optionName: "색상",
 *         optionValues: [
 *           { valueId: "101", valueName: "스카이블루" },
 *           { valueId: "102", valueName: "핑크" }
 *         ]
 *       }
 *     ],
 *     variants: [
 *       {
 *         stockQuantity: 10,
 *         price: "12000.00",
 *         optionCombination: [{ optionId: "1", valueId: "101" }]
 *       },
 *       {
 *         stockQuantity: 15,
 *         price: "12000.00", 
 *         optionCombination: [{ optionId: "1", valueId: "102" }]
 *       }
 *     ]
 *   };
 *
 *   const coupangAccessKey = "YOUR_COUPANG_ACCESS_KEY";
 *   const coupangSecretKey = "YOUR_COUPANG_SECRET_KEY";
 *   const coupangCategoryId = 77426; // 예시 카테고리 ID
 *
 *   const result = await mapOptionsForCoupang(sampleProductData, coupangAccessKey, coupangSecretKey, coupangCategoryId);
 *
 *   if (result.success) {
 *     console.log("쿠팡 옵션 매핑 성공:", JSON.stringify(result.data.updatedProductData, null, 2));
 *   } else {
 *     console.error("쿠팡 옵션 매핑 실패:", result.message);
 *   }
 * }
 *
 * // exampleUsage(); // 테스트 시 주석 해제
 */ 