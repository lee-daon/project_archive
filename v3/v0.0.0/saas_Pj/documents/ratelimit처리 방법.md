# Rate Limit 처리 패턴 가이드

이 문서는 프로젝트 내에서 사용되는 두 가지 주요 Rate Limit 처리 패턴을 설명합니다. 각 패턴의 사용 사례와 핵심 원리를 이해하여 일관성 있는 코드를 작성하는 것을 목표로 합니다.

---

## 패턴 1: 전역 API 호출 제어 (`GlobalRateLimiter`)

### 언제 사용하나요?
- 여러 사용자의 동시 HTTP 요청에 대해 **전역 Rate Limit**을 적용해야 할 때 사용합니다.
- 특정 외부 API(예: Taobao, Gemini)의 호출 빈도를 전체 시스템에서 통합 관리할 필요가 있을 때 적합합니다.

### 핵심 원리
1.  **중앙 관리**: `backend/common/utils/Globalratelimiter.js`에서 모든 Rate Limiter를 생성하고 관리합니다.
2.  **순서 보장**: `p-limit(1)`을 사용하여 Rate Limit을 확인하고 마지막 호출 시간을 갱신하는 로직이 한 번에 하나씩만 실행되도록 보장합니다. 이를 통해 **경쟁 상태(Race Condition)를 원천적으로 방지**합니다.
3.  **호출 간격 제어**: API를 호출하기 직전에 `limiter.acquire()`를 실행하여, 마지막 호출 이후 설정된 `delay`만큼의 시간이 지나도록 강제합니다. API의 응답 속도와 관계없이 **호출 시작 간격**을 정확하게 제어하여 처리량을 극대화합니다.

### 주요 파일
- `backend/common/utils/Globalratelimiter.js`
- `backend/common/config/settings.js` (딜레이 설정)

### 사용 예시 (`gemini.js`)
```javascript
// ...
import { geminiLimiter } from "./Globalratelimiter.js";

async function callGeminiText(promptContent, systemInstruction) {
  // Gemini API를 호출하기 직전, Rate Limiter를 통과할 때까지 대기
  await geminiLimiter.acquire(); 
  
  try {
    // ... API 호출 로직 ...
  } catch (error) {
    // ...
  }
}
```

---

## 패턴 2: 워커 기반 비동기 처리 (`RATELIMITSTYLE.md`)

### 언제 사용하나요?
- Redis 큐에서 작업을 꺼내 처리하는 **백그라운드 워커**에 Rate Limit을 적용할 때 사용합니다.
- 외부 API의 응답 시간이 길더라도, 워커가 블로킹되지 않고 일정한 간격으로 계속해서 새 작업을 큐에서 꺼내 비동기로 처리(Fire-and-Forget)해야 할 때 유용합니다.

### 핵심 원리
1.  **비동기 디스패치 (Fire-and-Forget)**: 워커는 `while(true)` 루프를 돌며 큐에서 작업을 가져옵니다. 작업을 비동기 함수(`limit(() => processJob())`)로 실행시킨 뒤, **작업이 끝나기를 기다리지 않고** 바로 `sleep`에 들어갑니다.
2.  **작업 시작 간격 제어**: `await sleep(WORKER_DELAY_MS)`를 통해 다음 작업을 큐에서 꺼내오는 **주기(Polling Interval)**를 제어합니다. 이것이 워커의 Rate Limit 역할을 합니다.
3.  **동시성 제한 (Safety Net)**: `p-limit(N)` (예: N=30)을 사용하여 동시에 "처리 중" 상태에 있을 수 있는 최대 작업 수를 제한합니다. 이는 특정 API가 매우 느려졌을 때 시스템의 메모리가 고갈되거나 과도한 부하가 걸리는 것을 막는 **안전장치**입니다.

### 주요 파일
- `backend/worker/RATELIMITSTYLE.md`

### 사용 예시 (워커 기본 구조)
```javascript
const limit = pLimit(30); // 최대 30개 동시 처리

while (true) {
  const job = await getFromQueue(); // 큐에서 작업 가져오기 (블로킹)
  
  if (job) {
    // 작업을 비동기로 실행하고 결과는 기다리지 않음
    limit(() => processJob(job)); 
  }

  // 다음 작업을 가져오기 전, 일정 시간 대기
  await sleep(200); 
}
```

---

## 두 패턴을 통합하지 않는 이유

`GlobalRateLimiter`와 워커 기반 패턴은 유사해 보이지만, 각기 다른 핵심 문제를 해결하기 위해 설계되었습니다. 이 둘을 통합할 경우 로직이 과도하게 복잡해지고 유지보수가 어려워질 수 있으므로, 의도적으로 두 패턴을 분리하여 사용합니다.

### 각 패턴의 핵심 책임

1.  **`GlobalRateLimiter` (정확성 중심)**
    -   **주요 임무**: API 호출 **시작 간격**을 최대한 정확하게 제어하는 것.
    -   **핵심 문제**: 여러 사용자 요청이 동시에 들어올 때 발생하는 경쟁 상태(Race Condition)를 방지하고, 외부 API의 Rate Limit 정책을 엄격하게 준수하는 것입니다. CPU 부하보다는 API 호출 규약 준수에 초점을 맞춥니다.

2.  **워커 패턴 (처리량 및 부하 관리 중심)**
    -   **주요 임무**: 시스템의 **전체 처리량(Throughput)과 부하**를 안정적으로 관리하는 것.
    -   **핵심 문제**: `p-limit(N)`을 통해 이미지 처리, 데이터 조합 등 CPU/메모리를 많이 사용하는 작업의 **최대 동시 실행 개수**를 제한하여 서버 과부하를 방지하는 것입니다. API 호출은 전체 작업의 일부일 뿐이며, 작업 전체의 흐름을 제어하는 것이 더 중요합니다.
