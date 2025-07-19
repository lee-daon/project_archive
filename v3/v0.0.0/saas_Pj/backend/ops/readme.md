# Ops 모듈

## 개요
시스템 운영을 위한 자동화된 cron 작업들을 관리합니다.

## 기능

### Processing Status 정리 작업
- **실행 주기**: 매시간 정각 (cron: `0 * * * *`)
- **목적**: 24시간 이상 `pending` 상태인 `processing_status` 레코드를 `success`로 변경
- **처리**: `updatePreprocessingCompletedStatus()` 호출 및 상세 로그 기록

### Plan Reset 작업
- **실행 주기**: 12시간마다 (cron: `10 0,12 * * *`) - 매일 0시 10분, 12시 10분
- **목적**: Basic/Free 플랜 유저의 제한사항 초기화
- **처리 내용**:
  - `hashed_api_key`가 있는 경우 삭제 (NULL로 설정)
  - `extra_setting`의 `use_deep_ban`이 `true`인 경우 `false`로 변경
- **로깅**: 각 변경사항을 `error_log` 테이블에 기록

## 성능 최적화
- **인덱스 미사용**: 쓰기 성능 우선으로 읽기 최적화 인덱스 제외
- **배치 처리**: 한 번에 최대 1000개 레코드 처리
- **풀 스캔 허용**: 1시간마다 한 번의 쿼리이므로 충분

## 사용법
서버 시작 시 자동으로 초기화됩니다.

```javascript
// server.js에서 자동 호출
import { initializeOps } from './ops/index.js';
initializeOps();
```
