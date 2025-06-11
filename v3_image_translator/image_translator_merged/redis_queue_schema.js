// redis 스키마 큐를 기록해 두는 파일

const ocr_tasks = {
    "request_id": request_id,
    "image_id": image_id,
    "is_long": is_long,
    "shm_info": shm_info,
    "original_filename": original_filename // 추적/디버깅 용도
}

const ocr_results = {
    "request_id": "647c390b-6279-4633-aa9a-c657379488f8",
    "image_id": "resized_6.jpg",
    "is_long": true,
    "shm_info": {
        "shm_name": "img_shm_19d2678566e84a8ca7c724eb27ec1d6f",
        "shape": [
            1103,
            860,
            3
        ],
        "dtype": "uint8",
        "size": 2845740
    },
    "ocr_result": [
        [
            [
                [383.0, 79.0],
                [481.0, 79.0],
                [481.0, 154.0],
                [383.0, 154.0]
            ],
            ["05", 0.9856277704238892]
        ],
        [
            [
                [379.0, 162.0],
                [486.0, 162.0],
                [486.0, 198.0],
                [379.0, 198.0]
            ],
            ["\u5356\u70b9\u4ecb\u7ecd", 0.998233437538147]
        ],
        [
            [
                [213.0, 250.0],
                [657.0, 250.0],
                [657.0, 317.0],
                [213.0, 317.0]
            ],
            ["360\u00b0\u5957\u5305\u5de5\u827a", 0.9992042183876038]
        ],
        [
            [
                [217.0, 339.0],
                [681.0, 339.0],
                [681.0, 380.0],
                [217.0, 380.0]
            ],
            ["360\u5ea6\u5957\u5305\u5de5\u827a\uff0c\u7ed3\u5b9e\u8010\u7a7f", 0.9950017929077148]
        ]
    ]
}

const hosting_tasks = { // 호스팅 작업 큐 스키마, 사실상 최종 큐임
    "request_id": request_id,
    "image_id": image_id,
    "shm_info": {  // 이미지의 공유 메모리 정보
        "shm_name": "img_shm_...", // 공유 메모리 이름
        "shape": [height, width, channels], // 이미지 차원 정보
        "dtype": "uint8", // 데이터 타입
        "size": size // 바이트 단위 크기
    }
}

// 프로세서 -> 전처리 워커로 전달하는 큐 스키마 (인페인팅 작업 요청)
const inpainting_long_tasks = {
    "request_id": request_id,
    "image_id": image_id,
    "shm_info": {  // 원본 이미지 공유 메모리 정보
        "shm_name": "img_shm_...",
        "shape": [height, width, channels],
        "dtype": "uint8",
        "size": size
    },
    "mask_shm_info": {  // 마스크 공유 메모리 정보
        "shm_name": "mask_shm_...",
        "shape": [height, width],
        "dtype": "uint8",
        "size": size
    }
}

const inpainting_short_tasks = {
    "request_id": request_id,
    "image_id": image_id,
    "shm_info": {  // 원본 이미지 공유 메모리 정보
        "shm_name": "img_shm_...",
        "shape": [height, width, channels],
        "dtype": "uint8",
        "size": size
    },
    "mask_shm_info": {  // 마스크 공유 메모리 정보
        "shm_name": "mask_shm_...",
        "shape": [height, width],
        "dtype": "uint8",
        "size": size
    }
}

// 전처리 워커 -> 인페인팅 워커로 전달하는 큐 스키마 (LaMa 추론 작업 요청)
const lama_inference_long_tasks = {
    "request_id": request_id,
    "image_id": image_id,
    "original_size": [height, width],  // 원본 이미지 크기
    "padding_info": [pad_top, pad_right, pad_bottom, pad_left],  // 패딩 정보
    "preprocessed_img_shm_info": {  // 전처리된 RGB 이미지 공유 메모리 정보
        "shm_name": "img_shm_...",
        "shape": [height, width, channels],
        "dtype": "uint8",
        "size": size
    },
    "preprocessed_mask_shm_info": {  // 전처리된 그레이스케일 마스크 공유 메모리 정보
        "shm_name": "mask_shm_...",
        "shape": [height, width],
        "dtype": "uint8",
        "size": size
    },
    "is_long": true  // 긴 이미지 여부 (true)
}

const lama_inference_short_tasks = {
    "request_id": request_id,
    "image_id": image_id,
    "original_size": [height, width],  // 원본 이미지 크기
    "padding_info": [pad_top, pad_right, pad_bottom, pad_left],  // 패딩 정보
    "preprocessed_img_shm_info": {  // 전처리된 RGB 이미지 공유 메모리 정보
        "shm_name": "img_shm_...",
        "shape": [height, width, channels],
        "dtype": "uint8",
        "size": size
    },
    "preprocessed_mask_shm_info": {  // 전처리된 그레이스케일 마스크 공유 메모리 정보
        "shm_name": "mask_shm_...",
        "shape": [height, width],
        "dtype": "uint8",
        "size": size
    },
    "is_long": false  // 짧은 이미지 여부 (false)
}

// Hash 키: translate_text_result:{request_id}
// 필드: data (JSON 문자열)
// 설명: Processor 워커가 생성한 번역 결과 및 렌더링에 필요한 데이터를 저장하는 Hash.
//      Inpainting 워커는 이 정보를 사용하지 않으며, 최종 Rendering 단계 또는 API 서버에서 사용될 수 있음.
const translate_text_result_hash_data_field = { // Redis Hash의 필드 구조 (예시)
    "data": JSON.stringify({ // 'data' 필드: 이미지 ID 및 번역 결과 JSON 문자열
        "image_id": "image-filename.jpg",     
        "translate_result": [
            {
                "box": [[x1, y1], [x2, y2], [x3, y3], [x4, y4]],
                "translated_text": "Translated text here",
                "original_char_count": 15
            },
            // ... 
        ]
    }),
    // 수정: shm_name 대신 original_shm_info (JSON 문자열) 저장
    "original_shm_info": JSON.stringify({ 
        "shm_name": "img_shm_...", 
        "shape": [height, width, channels],
        "dtype": "uint8",
        "size": 123456
    }) 
};

// Hash 키: inpainting_result:{request_id}
// 필드: image_id, inpaint_shm_info, is_long
// 설명: Inpainting 워커가 생성한 결과 이미지 데이터를 저장하는 Hash.
//      Rendering 워커에서 사용될 수 있음.
const inpainting_end = {
    "image_id": image_id,
    "inpaint_shm_info": {
        "shm_name": shm_name,
        "shape": shape,
        "dtype": dtype,
        "size": size
    },
    "is_long": "true"  // 긴 이미지 여부 ("true"/"false" 문자열로 저장)
}

// ---> 추가: Rendering Tasks Queue 스키마 정의 <---
// Queue 키: rendering_tasks (List, BLPOP으로 사용)
// 데이터 형식: JSON 문자열
// 설명: ResultChecker가 생성하여 RenderingWorker가 소비하는 렌더링 작업 데이터.
const rendering_tasks_queue_data = {
    "request_id": "unique-request-id",
    "image_id": "image-filename.jpg",
    "translate_data": JSON.stringify({ // 번역 결과 및 색상/크기 정보 포함 (JSON 문자열)
        "image_id": "image-filename.jpg",
        "translate_result": [
            {
                "box": [[x1, y1], [x2, y2], [x3, y3], [x4, y4]],
                "translated_text": "Translated text",
                "original_char_count": 10,
                "text_color": {"r": 0, "g": 0, "b": 0},
                "bg_color": {"r": 255, "g": 255, "b": 255},
                "contrast_ratio": 21.0,
                "font_size": 0.8 // 예시: 폰트 크기 정보 (JS 주석으로 변경)
            },
            // ...
        ]
    }),
    "inpaint_shm_info": JSON.stringify({ // 인페인팅된 이미지 SHM 정보 (JSON 문자열)
        "shm_name": "inpaint_shm_...",
        "shape": [height, width, channels],
        "dtype": "uint8",
        "size": 123456
    }),
    "original_shm_info": JSON.stringify({ // 원본 이미지 SHM 정보 (JSON 문자열)
        "shm_name": "img_shm_...", 
        "shape": [height, width, channels],
        "dtype": "uint8",
        "size": 123456
    }),
    "is_long": false  // 긴 이미지 여부 (boolean 값, ResultChecker에서 변환됨)
};


