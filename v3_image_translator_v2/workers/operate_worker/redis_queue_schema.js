// Redis 큐 스키마 - Image Translation Pipeline (URL 방식)

// ===== 워커 간 큐 (Redis BLPOP) =====
// Queue: processor_tasks (BLPOP)
// Processor 워커에서 Unified 워커로 전달되는 OCR 작업
const processor_tasks = {
    "request_id": "647c390b-6279-4633-aa9a-c657379488f8",
    "image_url": "https://img.alicdn.com/example.jpg",
    "image_id": "resized_6.jpg",
    "is_long": true,
    "ocr_result": [
        [
            [[383.0, 79.0], [481.0, 79.0], [481.0, 154.0], [383.0, 154.0]], // box coordinates
            ["05", 0.9856277704238892] // [text, confidence]
        ],
        [
            [[379.0, 162.0], [486.0, 162.0], [486.0, 198.0], [379.0, 198.0]],
            ["卖点介绍", 0.998233437538147]
        ],
        [
            [[213.0, 250.0], [657.0, 250.0], [657.0, 317.0], [213.0, 317.0]],
            ["360°套包工艺", 0.9992042183876038]
        ]
    ]
}

// ===== Unified 워커 내부 프로세스 큐 (asyncio.Queue) =====
// 내부 처리용 프로세스 큐들 - Redis가 아닌 메모리 큐 (SHM 사용)

// inference_process_short/long: GPU 추론 프로세스 큐
// 마스크 생성과 전처리가 통합되어 바로 추론 큐로 전달됨
const inference_process_data = {
    "request_id": "request_id",
    "image_id": "image_id",
    "original_size": [height, width],
    "padding_info": [pad_top, pad_right, pad_bottom, pad_left],
    "preprocessed_img_shm_info": {
        "shm_name": "preprocessed_img_shm_xxx",
        "shape": [target_height, target_width, 3],
        "dtype": "uint8", 
        "size": size
    },
    "preprocessed_mask_shm_info": {
        "shm_name": "preprocessed_mask_shm_xxx",
        "shape": [target_height, target_width],
        "dtype": "uint8",
        "size": size
    },
    "is_long": true
}

// postprocessing_process: 후처리 프로세스 큐
const postprocessing_process_data = {
    "task": { /* inference_process_data와 동일 */ },
    "result": "numpy_array_inference_result", // numpy 배열 (실제로는 메모리 참조)
    "is_long": true
}

// ===== 워커 내부 메모리 저장소 =====
// AsyncInpaintingWorker 내부의 메모리 기반 저장소 (Redis 대신 사용)

// translation_results: 번역 결과 내부 저장소
// worker.translation_results[request_id]
const translation_result_internal = {
    "image_id": "image-filename.jpg",
    "image_url": "https://img.alicdn.com/example.jpg", // 원본 이미지 URL
    "translate_result": [
        {
            "box": [[x1, y1], [x2, y2], [x3, y3], [x4, y4]],
            "translated_text": "번역된 텍스트",
            "original_char_count": 15
        }
    ]
}

// inpainting_results: 인페인팅 결과 내부 저장소  
// worker.inpainting_results[request_id]
const inpainting_result_internal = {
    "image_id": "image_id",
    "is_long": true, // boolean 타입
    "temp_path": "/app/output/temp_inpainted/request_123.png" // 인페인팅된 이미지의 임시 파일 경로
}

// ===== 렌더링 작업 (더 이상 Redis Queue를 사용하지 않음) =====
// ResultChecker가 번역과 인페인팅 결과를 모두 확인하면,
// operate_worker 내부에서 직접 RenderingProcessor를 호출하여 작업을 전달합니다.
// 따라서 'rendering_tasks' 큐는 더 이상 사용되지 않습니다.

// 전달되는 데이터 구조 (Python dict/object)
const rendering_task_data_internal = {
    "request_id": "request_id",
    "image_id": "image_id",
    "translate_data": { /* 번역 결과 객체 */ },
    "inpainted_image": "numpy_array_of_inpainted_image", // 파일에서 로드한 numpy 배열
    "original_image_bytes": "bytes_of_original_image", // URL에서 다운로드한 원본 이미지 바이트
    "is_long": false
}

// ===== 워커 간 큐 =====
// Queue: hosting_tasks (BLPOP)
// Rendering 워커에서 Hosting 워커로 최종 결과 전달
const hosting_tasks_worker_data = {
    "request_id": "request_id",
    "image_id": "image_id",
    "image_url": "https://r2.example.com/rendered/request_123_rendered.jpg" // 최종 렌더링된 이미지 URL
}

// ===== 더 이상 사용하지 않는 Redis Hash =====
// 다음 Hash들은 내부 메모리 저장소로 대체되어 더 이상 사용하지 않음:
// - translate_text_result:{request_id} (translation_results로 대체)
// - inpainting_result:{request_id} (inpainting_results로 대체)

// ===== 처리 흐름 요약 =====
/*
워커 기반 이미지 번역 파이프라인 (개선된 아키텍처):

1. `processor_tasks` (워커 간 큐) → Operate 워커 수신
   - OCR Worker가 `ocr_tasks`를 처리하고 결과를 `processor_tasks` 큐에 넣습니다.

2. Operate 워커 내부에서 병렬 처리:
   a) 번역 경로:
      - 텍스트 번역 API 비동기 호출.
      - 결과와 원본 이미지 URL을 워커의 **내부 메모리 저장소**(`translation_results`)에 저장.
      - 내부 동기화 로직이 인페인팅 결과 확인 후 렌더링 트리거.
   b) 인페인팅 경로:
      - **마스크 생성 + 전처리 통합**: CPU 스레드풀에서 마스크 생성과 전처리를 한 번에 처리 → LaMa 추론 → 후처리(원본 크기 복원).
      - 이 과정은 워커 내부의 메모리 큐와 스레드 풀, 공유 메모리(SHM)를 통해 효율적으로 처리됩니다.
      - 최종 인페인팅 이미지는 *임시 파일*로 서버에 저장되고, 파일 경로가 워커의 **내부 메모리 저장소**(`inpainting_results`)에 저장됩니다.
      - 내부 동기화 로직이 번역 결과 확인 후 렌더링 트리거.

3. 내부 메모리 동기화 및 렌더링 (Operate 워커 내부):
   - 워커의 **내부 메모리 저장소**가 두 결과(번역, 인페인팅)를 모두 확인하면, 임시 인페인팅 파일을 로드하고 번역 데이터를 합쳐 렌더링 프로세서에 전달합니다.
   - 렌더링 → R2 업로드 → `hosting_tasks` 큐에 최종 이미지 URL 전달.

4. `hosting_tasks` (워커 간 큐) → Result 워커 수신:
   - 최종 결과를 메인 서버에 알리는 등의 후속 작업을 처리합니다.

개선 사항:
- **성능 향상**: Redis I/O 제거로 메모리 액세스 속도 100배 이상 향상
- **파이프라인 최적화**: 전처리 큐 제거로 마스크 생성+전처리 통합, 레이턴시 감소
- **코드 단순화**: Redis Hash 스키마 및 에러 처리 간소화, 워커 수 감소
- **리소스 절약**: Redis 메모리 사용량 감소, 네트워크 대역폭 절약
- **동기화 최적화**: 같은 프로세스 내에서 직접 메모리 동기화

워커 분리 구조:
- 워커 간 통신: Redis 큐 (`processor_tasks`, `hosting_tasks`)
- 워커 내부 프로세스: asyncio.Queue (inference, postprocessing) - 전처리 큐 제거
- 워커 내부 동기화: 메모리 기반 저장소 (`translation_results`, `inpainting_results`)
- 데이터 전달:
  - 워커 간: URL 기반.
  - 워커 내부: 공유 메모리(SHM)를 통한 고효율 데이터 파이프라이닝.
  - 비동기 작업 동기화: 내부 메모리 저장소 및 임시 파일 시스템 활용.
*/