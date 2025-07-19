# 워커별 Rate Limit 처리 패턴 가이드 (v3)

## ✍️ **최신 변경사항: p-limit을 통한 동시 실행 제한 추가**

**v2 → v3 업데이트**:
- 모든 주요 워커에 **p-limit 동시 실행 제한** 적용
- 기존 fire-and-forget 구조를 유지하면서 과부하 방지
- 설정 파일에 `CONCURRENCY_LIMITS` 추가로 중앙 관리

**v1 → v2 업데이트**:
기존 `setInterval` 방식은 큐가 비어있을 때 다수의 `getFromQueue` 호출이 동시에 블로킹(대기) 상태에 빠지는 문제를 야기할 수 있었습니다. 이로 인해 큐에 작업이 한 번에 추가되면, 대기하던 호출들이 동시에 깨어나면서 의도치 않은 동시 처리가 발생했습니다.

모든 워커를 **`while(true)` 루프와 단일 `getFromQueue` 호출** 조합으로 변경하여 이 문제를 해결했습니다. 이제 워커는 항상 하나의 작업만을 기다리므로, 안정적이고 예측 가능한 방식으로 작업을 처리합니다.

---

## 🎯 **Rate Limit 패턴 분류**

### 🚀 **Pattern A: `while` + 비동기 디스패치 + p-limit (처리량 최적화)**
> 외부 API 호출처럼 응답이 오래 걸리는 작업을 처리할 때, 응답 대기 시간과 관계없이 일정한 간격으로 새 작업을 시작하여 처리량을 극대화하는 패턴. **p-limit으로 동시 실행 수를 제한하여 과부하 방지**

- **로직 흐름**:
  1. `const limit = pLimit(동시실행제한수)`: p-limit 인스턴스 생성
  2. `while(true)` 루프 시작
  3. `await getFromQueue()`: 큐에서 작업이 올 때까지 대기
  4. `limit(() => processJob())`: **p-limit으로 래핑한** 작업을 비동기로 실행 (Fire-and-Forget)
  5. `await sleep()`: 작업 완료를 기다리지 않고 즉시 일정 시간 대기 후 다음 루프 실행

- **주요 워커 및 동시 실행 제한**:
  - 모든 워커 공통: **30개 제한** (과부하 방지용 보험)

- **특징**:
  - API 응답 시간(e.g., 50초)이 워커의 처리 간격(e.g., 1초)에 영향을 주지 않음
  - **동시 실행 수 제한으로 메모리 사용량과 API 부하 안정화**
  - 외부 API의 Rate Limit을 준수하면서도 최대 처리량을 보장

- **p-limit 적용 예시**:
  ```javascript
  import pLimit from 'p-limit';
  const limit = pLimit(API_SETTINGS.CONCURRENCY_LIMITS.TRANSLATOR_WORKER);
  
  // 기존: processJob(job).then(...)
  // 현재: limit(() => processJob(job)).then(...)
  ```

---

### 🛡️ **Pattern B: `while` + 동기 처리 (순차/자원 제어)**
> 내부 서버 처리나 I/O 집중 작업처럼, 한 번에 하나씩 순차적으로 처리하고 시스템 부하를 안정적으로 조절해야 할 때 사용하는 패턴

- **로직 흐름**:
  1. `while(true)` 루프 시작
  2. `await getFromQueue()`: 큐에서 작업이 올 때까지 대기
  3. **`await processJob()`**: 작업이 **완료될 때까지** 동기적으로 대기
  4. `await sleep()`: 작업 완료 후 일정 시간 대기

- **주요 워커**:
  - `nukki/nukkiWorker.js`
  - `imgTranslator/mainworker.js`

- **특징**:
  - 작업이 반드시 하나씩 순서대로 처리됨
  - 이미지 처리, 파일 시스템 접근 등 동시 실행 시 부하가 커질 수 있는 작업에 적합
  - 외부 서비스로 인한 대기가 크기 않을 경우 간단한 구현을 위해 사용

---

## 🆚 **쿠팡 vs 네이버 API 처리 방식**

두 워커 모두 **Pattern A (비동기 디스패치)**를 사용하지만, API 제약 조건 때문에 추가적인 로직이 포함됩니다.

- **쿠팡 (`coopangRegister`)**:
  - 유저별 Rate Limit (`checkUserRateLimit`)만 체크합니다.
  - 다른 유저의 작업은 동시에 처리될 수 있습니다.

- **네이버 (`naverRegister`)**:
  - 유저별 Rate Limit (`checkUserRateLimit`)을 체크합니다.
  - 추가로, **유저별 순차 처리** (`processingUsers` Set)를 보장합니다. 같은 유저의 작업은 절대 동시에 실행되지 않습니다. 이는 네이버 API의 더 엄격한 제약 때문입니다.
  
> Rate Limit에 걸리거나, 다른 작업이 처리 중인 유저의 작업은 다시 큐의 뒤쪽으로 보내져 다음 기회에 처리됩니다.

---

## 🛡️ **Rate Limit vs p-limit 구분**

### **Rate Limit (sleep 구현)**
> **목적**: 외부 API의 Rate Limit 정책 준수

- **구현 방식**: `await sleep(WORKER_DELAY_MS)` 
- **제어 대상**: 작업을 **시작하는 간격**
- **예시**: 
  - 타오바오 API: 초당 5회 제한 → 200ms 간격
  - 네이버 API: 사용자별 초당 1회 → 1000ms 간격

### **p-limit (동시 실행 제한)**
> **목적**: 외부 API 응답 지연으로 인한 **의도치 않은 과부하 방지**

- **문제 상황**: 외부 API가 1500ms 응답 시간을 가질 때
  - Rate Limit만 있으면: 200ms마다 새 작업 시작
  - 1500ms 동안 최대 **7-8개 작업이 동시 실행**될 수 있음
  - API 서버 장애 시 **수백 개 작업이 동시 대기** 가능

- **p-limit 해결책**: 최대 동시 실행 수를 제한
  - 10개 제한 시: 11번째 작업은 기존 작업 완료까지 대기
  - **메모리 사용량 예측 가능**
  - **시스템 안정성 확보**

```javascript
const limit = pLimit(10); // 최대 10개만 동시 실행

while (true) {
  const job = await getFromQueue();
  if (job) {
    limit(() => processJob(job)); // 10개 초과 시 대기
  }
  await sleep(200); // Rate Limit은 여전히 유지
}
```

### **두 방식의 협력**
- **Rate Limit**: API 정책 준수 (속도 제어)
- **p-limit**: 시스템 과부하 방지 (동시성 제어)
- **결과**: 안정적이고 예측 가능한 워커 동작

---

## ⚙️ **설정값 위치**

모든 간격, Rate Limit 및 **동시 실행 제한** 설정은 `backend/common/config/settings.js`의 `API_SETTINGS`에서 중앙 관리됩니다.

```javascript
export const API_SETTINGS = {
  // 기존 Rate Limit 설정
  TEXT_API_DELAY_MS: 30,
  TAOBAO_API_DELAY_MS: 200,
  NUKKI_PROCESS_INTERVAL: 200,
  IMAGE_REQUEST_RATE_LIMIT: 200,
  COOPANG_USER_RATE_LIMIT_MS: 1000,
  COOPANG_WORKER_DELAY_MS: 200,
  NAVER_USER_RATE_LIMIT_MS: 1000,
  NAVER_WORKER_DELAY_MS: 200,
  
  // 동시 실행 제한 설정 (p-limit) - 과부하 방지용 보험
  CONCURRENCY_LIMITS: {
    TAOBAO_WORKER: 30,       // 타오바오 상세 정보 워커 (과부하 방지용 안전망)
    TRANSLATOR_WORKER: 30,   // 번역 워커 (과부하 방지용 안전망)
    COOPANG_WORKER: 30,      // 쿠팡 등록 워커 (과부하 방지용 안전망)
    NAVER_WORKER: 30,        // 네이버 등록 워커 (과부하 방지용 안전망)
  },
  // ...
};
```

### 📊 **예상 시나리오**

**정상 운영 시**:
- Rate Limit이 주 제어 → 동시 실행 수 낮음 (5-10개)
- p-limit 제한에 도달하지 않음

**API 지연 시** (응답시간 5초+):
- 동시 실행 수 증가 → 15-25개
- 여전히 30개 제한 내에서 안전

**극한 상황** (API 장애):
- 30개 제한에 도달 → 31번째부터 대기
- 시스템 과부하 방지

> 💡 **모니터링**: 실제 동시 실행 수가 자주 30개에 도달한다면 Rate Limit 간격 조정 고려
