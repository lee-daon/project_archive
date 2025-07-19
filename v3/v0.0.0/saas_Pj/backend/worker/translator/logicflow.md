# 번역 서비스 로직 흐름

## 1. 속성 번역 처리 흐름 (translateNsaveAttribute.js)

```mermaid
flowchart TD
    A[시작: translateAndSaveAttribute] --> B{이미 번역된 속성이 있는지 확인}
    B -->|Yes| C[로그 기록 후 true 반환]
    B -->|No| D[속성 데이터 준비: createAttributePromptData]
    D --> E[Gemini API 호출: generateGeminiJson]
    E --> F{번역 결과 유효성 검증}
    F -->|실패| G[오류 발생: 예외 처리]
    F -->|성공| H[번역 결과 저장: saveTranslatedAttributes]
    H -->|성공| I[로그 기록 후 true 반환]
    H -->|실패| J[저장 실패: 예외 처리]
    G --> K[오류 로그 저장: saveErrorLog]
    J --> K
    K --> L[상태 업데이트: updateAttributeTranslated(false)]
    L --> M[false 반환]
    I --> N[finally 블록 실행]
    M --> N
    C --> N
    N --> O[작업 개수 감소: decreaseTaskCount]
    O --> P[종료]
```

### 처리 단계
1. **이미 번역된 속성 확인**
   - 번역된 속성이 있으면 작업을 건너뜀

2. **번역 데이터 준비**
   - 제품 속성 정보 수집

3. **Gemini API 호출**
   - AI 모델을 통한 번역 수행

4. **번역 결과 검증**
   - 번역 결과의 유효성 검사
   - 결과가 배열이고 요소가 있는지 확인

5. **번역 결과 저장**
   - 번역된 속성을 DB에 저장

6. **상태 처리**
   - 성공/실패 여부에 따라 상태 업데이트
   - 오류 발생 시 로그 저장

7. **작업 개수 감소**
   - 작업 완료 시 작업 개수 감소
   - 모든 작업 완료 시 상태를 'success'로 변경

## 2. 옵션 번역 처리 흐름 (translateNsaveOption.js)

```mermaid
flowchart TD
    A[시작: translateAndSaveOption] --> B{이미 번역된 옵션이 있는지 확인}
    B -->|Yes| C[로그 기록 후 true 반환]
    B -->|No| D[옵션 데이터 준비: createOptionPromptData]
    D --> E[Gemini API 호출: generateGeminiJson]
    E --> F{번역 결과 유효성 검증}
    F -->|실패| G[원본 값 사용]
    F -->|성공| H[번역 결과 저장: saveTranslatedOption]
    G --> H
    H -->|성공| I[로그 기록 후 true 반환]
    H -->|실패| J[저장 실패: 예외 처리]
    J --> K[오류 로그 저장: saveErrorLog]
    K --> L[상태 업데이트: updateOptionTranslated(false)]
    L --> M[false 반환]
    I --> N[finally 블록 실행]
    M --> N
    C --> N
    N --> O[옵션 작업 개수 감소: decreaseOptionTaskCount]
    O --> P[종료]
```

### 처리 단계
1. **이미 번역된 옵션 확인**
   - 번역된 옵션이 있으면 작업을 건너뜀

2. **번역 데이터 준비**
   - 옵션명과 옵션값 데이터 수집

3. **Gemini API 호출**
   - AI 모델을 통한 번역 수행

4. **번역 결과 검증**
   - 번역 결과의 유효성 검사
   - 결과가 없으면 원본 값을 사용

5. **번역 결과 저장**
   - 번역된 옵션명과 옵션값을 DB에 저장

6. **상태 처리**
   - 성공/실패 여부에 따라 상태 업데이트
   - 오류 발생 시 로그 저장

7. **옵션 작업 개수 감소**
   - 작업 완료 시 옵션 작업 개수 감소
   - 모든 작업(img, option, overall) 완료 시 상태를 'success'로 변경

## 3. 키워드 생성 처리 흐름 (translateNsaveKeyword.js)

```mermaid
flowchart TD
    A[시작: generateAndSaveKeywords] --> B{이미 생성된 키워드가 있는지 확인}
    B -->|Yes| C[로그 기록 후 true 반환]
    B -->|No| D[키워드 생성 데이터 준비: createKeywordPromptData]
    D --> E[Gemini API 호출: generateGeminiJson]
    E --> F{생성 결과 유효성 검증}
    F -->|실패| G[오류 발생: 예외 처리]
    F -->|성공| H[생성 결과 저장: saveGeneratedKeywords]
    H -->|성공| I[키워드 생성 상태 업데이트: updateKeywordGenerated(true)]
    I --> J[로그 기록 후 true 반환]
    H -->|실패| K[저장 실패: 예외 처리]
    G --> L[오류 로그 저장: saveErrorLog]
    K --> L
    L --> M[키워드 생성 상태 업데이트: updateKeywordGenerated(false)]
    M --> N[false 반환]
    J --> O[finally 블록 실행]
    N --> O
    C --> O
    O --> P[작업 개수 감소: decreaseTaskCount]
    P --> Q[종료]
```

### 처리 단계
1. **이미 생성된 키워드 확인**
   - 생성된 키워드가 있으면 작업을 건너뜀

2. **키워드 생성 데이터 준비**
   - 상품명, 카테고리 정보 수집

3. **Gemini API 호출**
   - AI 모델을 통한 키워드 생성 수행

4. **생성 결과 검증**
   - 생성 결과의 유효성 검사
   - 결과가 배열이고 요소가 있는지 확인

5. **생성 결과 저장**
   - 생성된 키워드를 DB에 저장

6. **상태 처리**
   - 성공/실패 여부에 따라 상태 업데이트
   - 오류 발생 시 로그 저장

7. **작업 개수 감소**
   - 작업 완료 시 전체 작업 개수(overall_tasks_count) 감소
   - 모든 작업이 완료되면 상태를 'success'로 변경

## 4. 주요 차이점

1. **검증 로직**
   - 속성 번역: 유효하지 않은 결과는 오류 처리
   - 옵션 번역: 유효하지 않은 결과는 원본 값으로 대체
   - 키워드 생성: 유효하지 않은 결과는 오류 처리

2. **작업 개수 감소**
   - 속성 번역: `decreaseTaskCount` 호출 (overall_tasks_count 감소)
   - 옵션 번역: `decreaseOptionTaskCount` 호출 (option_tasks_count 감소)
   - 키워드 생성: `decreaseTaskCount` 호출 (overall_tasks_count 감소)

3. **상태 업데이트 조건**
   - 속성 번역: overall_tasks_count가 0이고 img_tasks_count, option_tasks_count도 0이면 success
   - 옵션 번역: option_tasks_count가 0이고 img_tasks_count, overall_tasks_count도 0이면 success
   - 키워드 생성: overall_tasks_count가 0이면 success

4. **저장 방식**
   - 속성 번역: 각 속성에 대해 name_translated, value_translated 업데이트
   - 옵션 번역: prop_path로 대응하는 옵션의 translated_optionname, translated_optionvalue 업데이트
   - 키워드 생성: products_detail 테이블의 keywords 필드에 콤마로 구분된 문자열로 저장
