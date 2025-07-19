# 번역 워커 모듈 (Translator)

## 개요

번역 워커 모듈은 Redis 큐를 통해 비동기적으로 텍스트 번역 및 최적화 작업을 처리하는 시스템입니다. 글로벌 Rate Limiter를 통해 Gemini API 호출 속도를 제어하여 외부 API의 제한 정책을 준수합니다. 이 모듈은 여러 유형의 번역 작업을 처리하며, 각 작업 유형에 맞는 서비스를 호출합니다.

## 주요 구성 요소

### 1. 워커 시스템 (worker.js)

Redis 큐에서 작업을 가져와 처리하는 메인 워커 시스템입니다.

- **기능**: 
  - Redis 큐(`text:translation:queue`)에서 작업 가져오기
  - 작업 유형에 따른 적절한 서비스 함수 호출
  - p-limit를 통한 동시 실행 제한 (과부하 방지)
  - 오류 처리 및 로깅
  - 작업 통계 수집 및 출력

- **처리 가능한 작업 유형**:
  - `attribute`: 속성 번역
  - `option`: 옵션 번역
  - `keyword`: 키워드 생성
  - `seo`: SEO 최적화 (상품명 번역)

### 2. 속도 제한 시스템 (Global Rate Limiter)

`backend/common/utils/Globalratelimiter.js`의 `geminiLimiter`를 사용하여 Gemini API 호출 속도를 제한합니다.

- **구성**:
  - `geminiLimiter`: 전역 Gemini API 호출 제한
  - `p-limit(1)`을 통한 순차 처리로 Race Condition 방지
  - 설정된 간격(`GEMINI_API_DELAY_MS`)에 따른 호출 간격 제어

- **주요 기능**:
  - 마지막 API 호출 시간 추적
  - 설정된 간격 미만 시 자동 대기
  - 전역적인 API 호출 순서 보장
  - 외부 API Rate Limit 정책 준수

### 3. 번역 서비스 (service/)

각 작업 유형별 번역 및 처리 로직을 담당하는 서비스입니다.

- **translateNsaveAttribute.js**: 상품 속성 번역
- **translateNsaveOption.js**: 상품 옵션 번역
- **translateNsaveKeyword.js**: 키워드 생성
- **translateNsaveProductname.js**: 상품명 최적화 및 번역

### 4. 데이터베이스 액세스 (db/)

번역 데이터의 저장 및 조회를 담당하는 모듈입니다.

- **주요 기능**:
  - 번역 데이터 저장 및 업데이트
  - 번역 상태 확인 및 업데이트
  - 작업 카운터 관리

### 5. AI 구성 (ai_config/)

AI 모델 연동 및 프롬프트 관리를 담당합니다.

- **주요 구성요소**:
  - Gemini API 연동 설정
  - 번역을 위한 시스템 프롬프트
  - 응답 스키마 정의
  - 글로벌 Rate Limiter 연동

## 처리 흐름

### 기본 처리 흐름

1. Redis 큐에서 번역 작업 가져오기
2. p-limit를 통한 동시 실행 제한 확인
3. 작업 유형에 따라 적절한 서비스 함수 호출
4. Global Rate Limiter를 통한 API 호출 속도 제한
5. AI 모델을 통한 번역/생성 수행
6. 결과 검증 및 DB 저장
7. 작업 상태 업데이트 및 카운터 감소
8. 모든 작업이 완료되면 최종 상태 업데이트

### 작업 유형별 처리 흐름

#### 1. 속성 번역 (attribute)

```
시작 → 이미 번역된 속성 확인 → 번역 데이터 준비 → Rate Limiter 통과 → 
Gemini API 호출 → 번역 결과 검증 → 번역 결과 저장 → 상태 업데이트 → 작업 개수 감소
```

#### 2. 옵션 번역 (option)

```
시작 → 이미 번역된 옵션 확인 → 옵션 데이터 준비 → Rate Limiter 통과 → 
Gemini API 호출 → 번역 결과 검증 → 번역 결과 저장 → 상태 업데이트 → 옵션 작업 개수 감소
```

#### 3. 키워드 생성 (keyword)

```
시작 → 이미 생성된 키워드 확인 → 키워드 생성 데이터 준비 → Rate Limiter 통과 → 
Gemini API 호출 → 생성 결과 검증 → 생성 결과 저장 → 상태 업데이트 → 작업 개수 감소
```

#### 4. 상품명 최적화 (seo)

```
시작 → 이미 최적화된 상품명 확인 → 상품명 원본 데이터 가져오기 → 프롬프트 데이터 준비 → 
Rate Limiter 통과 → Gemini API 호출 → 생성 결과 검증 → 생성 결과 저장 → 상태 업데이트 → 작업 개수 감소
```

## 오류 처리

- 각 서비스 함수에서는 try-catch-finally 구조로 오류를 처리합니다.
- 오류 발생 시 `saveErrorLog` 함수를 통해 오류 정보를 DB에 저장합니다.
- 작업 실패 시에도 상태를 업데이트하고 작업 개수를 감소시킵니다.
- 워커 자체의 오류 발생 시에도 중단되지 않고 계속 실행됩니다.

## 속도 제한 구현

### Global Rate Limiter 방식

1. **전역 API 호출 제한**: 모든 번역 작업이 동일한 `geminiLimiter`를 사용
2. **순차 처리**: `p-limit(1)`을 통해 API 호출 간격 제어
3. **설정 기반**: `API_SETTINGS.GEMINI_API_DELAY_MS`에 따른 호출 간격 (현재: 1000ms)
4. **Race Condition 방지**: 동시 호출 시에도 안전한 간격 보장

### 동시 실행 제한

1. **p-limit 적용**: 워커 레벨에서 최대 동시 실행 수 제한
2. **과부하 방지**: `API_SETTINGS.CONCURRENCY_LIMITS.TRANSLATOR_WORKER`에 따른 제한
3. **메모리 안정성**: 과도한 동시 작업으로 인한 시스템 과부하 방지

## 사용 방법

워커는 서버 시작 시 자동으로 실행됩니다. Redis 큐에 작업을 추가하면 워커가 해당 작업을 처리합니다.

```javascript
// 작업 추가 예시
import { addToTextTranslationQueue } from '../../../common/utils/redisClient.js';

// 속성 번역 작업 추가
const data = {
  type: 'attribute',
  userId: 123,
  productId: 456
};
await addToTextTranslationQueue(data);
```

## 디렉토리 구조

```
backend/worker/translator/
├── worker.js              # 메인 워커 시스템
├── logicflow.md           # 처리 로직 흐름 문서
├── README.md              # 문서화 파일
├── service/               # 번역 서비스 모듈
│   ├── translateNsaveAttribute.js    # 속성 번역 서비스
│   ├── translateNsaveOption.js       # 옵션 번역 서비스
│   ├── translateNsaveKeyword.js      # 키워드 생성 서비스
│   ├── translateNsaveProductname.js  # 상품명 최적화 서비스
│   └── advancedProcess.js            # 고급 처리 기능
├── db/                    # 데이터베이스 액세스 모듈
│   ├── detail.js          # 상품 상세 정보 DB 작업
│   ├── options.js         # 옵션 관련 DB 작업
│   └── processingStatus.js # 처리 상태 관리
└── ai_config/             # AI 모델 설정
    ├── gemini.js          # Gemini API 연동 (Global Rate Limiter 사용)
    └── systemPrompt.js    # 시스템 프롬프트 정의
```

## 주요 차이점 (서비스 간)

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

## Rate Limiter 설정

현재 번역 워커의 속도 제한은 다음과 같이 설정됩니다:

- **API 호출 간격**: `API_SETTINGS.GEMINI_API_DELAY_MS` (1000ms)
- **동시 실행 제한**: `API_SETTINGS.CONCURRENCY_LIMITS.TRANSLATOR_WORKER` (50개)
- **워커 처리 간격**: `API_SETTINGS.TRANSLATOR_WORKER_DELAY_MS` (30ms)

모든 설정은 `backend/common/config/settings.js`에서 중앙 관리됩니다.
