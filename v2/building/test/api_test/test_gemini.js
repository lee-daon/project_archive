// 이 파일은 src/services/use_AI/gemini.js 에 구현된 함수들을 테스트합니다.
// gemini.js 파일이 존재하고, 필요한 함수들이 export 되어 있어야 합니다.

// 필요한 함수들을 gemini.js에서 import 합니다.
// 경로가 다를 경우 수정해주세요.
import {
  translatAttributePrompt,
  translateOptionPrompt, // 새로운 옵션 번역 함수
  translateProductNamePrompt,
  translateProductNameWithKeywordPrompt,
  translateKeywordGenerationPrompt,
  translateBrandNamePrompt
} from '../../src/services/use_AI/gemini.js'; // 경로 확인!

// 테스트 실행 함수
async function runTests() {
  console.log("Gemini API 테스트 시작...");

  try {
    // 1. 속성 번역 테스트 (translatAttributePrompt)
    console.log("\n--- 속성 번역 테스트 ---");
    const attributeInput = JSON.stringify({
      "상품명": "小米智能手表", // 예시 상품명
      "속성": [
        { "品牌": "小米" },
        { "颜色": "黑色" },
        { "重量": "50克" }
      ]
    });
    const translatedAttributes = await translatAttributePrompt(attributeInput);
    console.log("입력:", attributeInput);
    console.log("번역 결과 (JSON 예상):", translatedAttributes);
    // 간단한 검증: 반환값이 객체인지 확인
    if (typeof translatedAttributes !== 'object' || translatedAttributes === null) {
        console.error("오류: 속성 번역 결과가 유효한 객체가 아닙니다.");
    }

    // 1.5 새로운 통합 옵션 번역 테스트 (translateOptionPrompt)
    console.log("\n--- 새로운 통합 옵션 번역 테스트 ---");
    const optionInput = {
      optionname: "尺寸",
      optionvalue: "大号"
    };
    const translatedOption = await translateOptionPrompt(optionInput);
    console.log("입력:", optionInput);
    console.log("번역 결과 (객체 예상):", translatedOption);
    if (typeof translatedOption !== 'object' || !translatedOption.translated_optionname || !translatedOption.translated_optionvalue) {
        console.error("오류: 통합 옵션 번역 결과가 유효한 객체가 아닙니다.");
    }


    // 4. 상품명 번역 테스트 (translateProductNamePrompt)
    console.log("\n--- 상품명 번역 테스트 ---");
    const productNameInput = "新款夏季透气运动鞋男士跑步鞋";
    const translatedProductName = await translateProductNamePrompt(productNameInput);
    console.log("입력:", productNameInput);
    console.log("번역 결과 (텍스트 예상, 50자 이하):", translatedProductName);
    if (typeof translatedProductName !== 'string' || translatedProductName.length === 0) {
        console.error("오류: 상품명 번역 결과가 유효한 문자열이 아닙니다.");
    } else if (translatedProductName.length > 50) {
        console.warn("경고: 상품명 번역 결과가 50자를 초과했습니다.");
    }

    // 5. 키워드 포함 상품명 번역 테스트 (translateProductNameWithKeywordPrompt)
    console.log("\n--- 키워드 포함 상품명 번역 테스트 ---");
    const productNameWithKeywordInput = "华为智能手环8 NFC版";
    const keywordsInput = ["스마트밴드", "NFC"];
    const translatedProductNameWithKeyword = await translateProductNameWithKeywordPrompt(productNameWithKeywordInput, keywordsInput);
    console.log("입력 상품명:", productNameWithKeywordInput);
    console.log("입력 키워드:", keywordsInput);
    console.log("번역 결과 (텍스트 예상, 키워드 포함):", translatedProductNameWithKeyword);
     if (typeof translatedProductNameWithKeyword !== 'string' || translatedProductNameWithKeyword.length === 0) {
        console.error("오류: 키워드 포함 상품명 번역 결과가 유효한 문자열이 아닙니다.");
    } else {
        // 키워드가 모두 포함되었는지 간단히 확인
        const includesAllKeywords = keywordsInput.every(kw => translatedProductNameWithKeyword.includes(kw));
        if (!includesAllKeywords) {
            console.warn("경고: 번역된 상품명에 일부 또는 모든 키워드가 포함되지 않았을 수 있습니다.");
        }
    }


    // 6. 키워드 생성 테스트 (translateKeywordGenerationPrompt)
    console.log("\n--- 키워드 생성 테스트 ---");
    const keywordGenInput = "夏季新款女士连衣裙";
    const generatedKeywords = await translateKeywordGenerationPrompt(keywordGenInput);
    console.log("입력:", keywordGenInput);
    console.log("생성된 키워드 (배열 예상):", generatedKeywords);
    if (!Array.isArray(generatedKeywords)) {
         console.error("오류: 키워드 생성 결과가 배열이 아닙니다.");
    } else if (generatedKeywords.length > 20) {
        console.warn("경고: 생성된 키워드 개수가 20개를 초과했습니다.");
    }

    // 7. 브랜드 번역 테스트 (translateBrandNamePrompt)
    console.log("\n--- 브랜드 번역 테스트 ---");
    const brandInput = "华为";
    const translatedBrand = await translateBrandNamePrompt(brandInput);
    console.log("입력:", brandInput);
    console.log("번역 결과 (한국어/영어 형식 예상):", translatedBrand);
    if (typeof translatedBrand !== 'string' || !translatedBrand.includes('/')) {
         console.error("오류: 브랜드 번역 결과 형식이 올바르지 않습니다 (한국어/영어).");
    }


    console.log("\nGemini API 테스트 완료.");

  } catch (error) {
    console.error("\n테스트 중 에러 발생:", error);
  }
}

// 테스트 실행
runTests();
