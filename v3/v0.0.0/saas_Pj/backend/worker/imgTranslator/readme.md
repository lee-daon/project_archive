# 이미지 번역 워커 아키텍처

이 디렉토리의 워커들은 이미지 번역과 관련된 전체 파이프라인을 담당합니다. 초기에는 단일 `mainworker.js` 파일에서 모든 작업을 처리했지만, Redis 클라이언트의 블로킹 명령(`BLPOP`)으로 인한 교착 상태(Deadlock) 및 성능 문제를 해결하기 위해 3개의 독립된 워커 프로세스로 분리되었습니다.

각 워커는 `server.js`에 의해 개별 프로세스로 실행되어 완벽한 격리를 보장하고 안정성을 극대화합니다.

---

### 1. `taskSender.js` (작업 전송 워커)

- **역할:** 이미지 번역 요청을 처리하고, 개별 이미지 작업을 외부 번역 파이프라인으로 전송합니다.
- **감시 큐:** `image:translation:queue`
- **동작 흐름:**
    1.  `image:translation:queue`에서 `{ "type": "main_image", "userId": ..., "productId": ... }`와 같은 작업 요청을 가져옵니다.
    2.  상품의 이미지가 이미 번역되었는지 확인합니다.
        -   이미 번역된 경우, 작업 카운트를 감소시키고 작업을 종료합니다.
        -   번역되지 않은 경우, 다음 단계로 진행합니다.
    3.  DB에서 해당 상품의 모든 이미지 URL을 조회합니다.
    4.  각 이미지에 대해 고유한 `image_id`를 생성하여 외부 번역 파이프라인이 사용하는 `img:translate:tasks` 큐에 작업을 전송합니다.

### 2. `successHandler.js` (성공 결과 처리 워커)

- **역할:** 외부 번역 파이프라인에서 성공적으로 번역된 이미지의 결과를 처리합니다.
- **감시 큐:** `img:translate:success`
- **동작 흐름:**
    1.  `img:translate:success` 큐에서 `{ "image_id": "...", "image_url": "..." }`와 같은 성공 결과를 가져옵니다.
    2.  `image_id`를 파싱하여 원본 상품 ID와 사용자 ID 등을 식별합니다.
    3.  번역된 이미지 URL(`image_url`)을 데이터베이스의 적절한 위치에 저장합니다.
    4.  해당 상품의 이미지 처리 작업 카운트를 1 감소시킵니다.

### 3. `errorHandler.js` (에러 결과 처리 워커)

- **역할:** 외부 번역 파이프라인에서 실패한 작업의 결과를 처리합니다.
- **감시 큐:** `img:translate:error`
- **동작 흐름:**
    1.  `img:translate:error` 큐에서 `{ "image_id": "...", "error_message": "..." }`와 같은 실패 결과를 가져옵니다.
    2.  `image_id`를 파싱하여 원본 상품 ID와 사용자 ID를 식별합니다.
    3.  수신된 `error_message`를 `error_log` 데이터베이스 테이블에 기록합니다.
    4.  결과적으로 실패했더라도, 해당 작업은 처리된 것이므로 이미지 처리 작업 카운트를 1 감소시킵니다.

---

### 공통 로직

- **`mainworker.js`**: 이제 순수한 라이브러리 역할을 합니다. `taskSender`, `successHandler`, `errorHandler`에서 사용하는 공통 함수들(`runTaskSender`, `runResultHandler` 등)을 `export`합니다. 실제 워커 실행 로직은 포함하지 않습니다.
