# `ImageInpainter` 파이프라인 사용 가이드

## 1. 핵심 원리: 처리량(Throughput) 극대화

`ImageInpainter.process_images` 함수는 단일 이미지가 아닌, **이미지 리스트(List)**를 한 번에 받아 처리하도록 설계되었습니다.

이 함수의 목표는 단일 이미지의 처리 속도(Latency)를 줄이는 것보다, **단위 시간당 처리하는 이미지의 총량(Throughput)**을 최대로 만드는 데 있습니다. 이를 위해 내부적으로 다음과 같은 3단계 파이프라인을 구성하여 CPU와 GPU의 유휴 시간을 최소화합니다.

1.  **전처리 (CPU 병렬):** 이미지 리사이즈 및 패딩
2.  **인페인팅 (GPU 일괄 처리):** ONNX 모델 추론
3.  **후처리 (CPU 병렬):** 패딩 제거 및 업스케일링

## 2. 최적의 성능을 위한 호출 시나리오

`process_images` 함수에 몇 개의 이미지를 전달하는지에 따라 파이프라인의 효율이 크게 달라집니다.

*(참고: 아래 예시는 배치 크기(batch_size)가 8일 경우를 가정합니다.)*

### 시나리오 A: 비효율적인 호출 (이미지 8장 전달)

8장의 이미지를 처리하도록 요청하면, 파이프라인은 다음과 같이 동작합니다.

-   **CPU**가 8장의 이미지를 전처리하는 동안 **GPU**는 대기합니다.
-   **GPU**가 8장을 처리하는 동안 **CPU**는 다음 작업이 없으므로 대기합니다.
-   CPU와 GPU가 동시에 일하는 구간이 거의 없어, 파이프라인 병렬 처리의 이점을 살리지 못합니다.

```
[시간 흐름 →]
CPU: [전처리 Batch#1] ------------> [후처리 Batch#1]
GPU: -------------- [인페인팅 Batch#1] ------------>
```

### 시나리오 B: 효율적인 호출 (이미지 24장 전달)

24장의 이미지를 처리하도록 요청하면, 파이프라인이 가득 차면서 진정한 성능을 발휘합니다.

-   **GPU**가 첫 번째 배치(1~8번 이미지)를 처리하는 동안, **CPU**는 쉬지 않고 다음 배치(9~16번 이미지)를 미리 준비합니다.
-   **CPU**가 첫 번째 배치를 후처리하는 동안, **GPU**는 두 번째 배치를 처리하고, **CPU**는 또다시 세 번째 배치를 전처리합니다.
-   이처럼 모든 단계가 겹쳐서 돌아가므로, CPU와 GPU의 유휴 시간이 최소화되고 전체 처리 시간이 극적으로 단축됩니다.

```
[시간 흐름 →]
CPU: [전처리#1] [전처리#2] [후처리#1] [전처리#3] [후처리#2] ...
GPU: ---------- [인페인팅#1] [인페인팅#2] [인페인팅#3] ...
```

## 3. 실용적인 권장사항

> **결론: 처리 효율을 최대로 끌어내려면, 최소 수십 장의 이미지를 한 번에 모아서 `process_images` 함수를 호출하는 것이 좋습니다.**

-   **최소 작업량:** 파이프라인 효과를 보기 시작하는 최소한의 작업량은 **`배치 크기 x 2`** (예: 16장) 이상입니다. 이는 GPU가 일하는 동안 CPU가 다음 작업을 준비할 수 있게 하는 최소 조건입니다.

-   **권장 작업량:** **50장 ~ 200장** 사이의 이미지를 하나의 리스트로 묶어 호출하는 것을 권장합니다. 이 정도의 작업량은 파이프라인을 가득 채워 유휴 시간을 없애기에 충분합니다.

-   **피해야 할 사용법:**
    -   **한 장씩 자주 호출:** `process_images([이미지1], ...)`와 같이 호출하면 파이프라인이 전혀 활용되지 않아 GPU가 대부분의 시간을 대기하므로 매우 비효율적입니다.
    -   **너무 적은 작업량:** 배치 크기보다 적은 수의 이미지를 처리하면, 비효율적인 A 시나리오와 같이 동작하게 됩니다.
