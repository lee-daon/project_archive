import unittest
import asyncio
import json
import numpy as np
import cv2 # 마스크 생성을 위해 여전히 필요할 수 있음
from unittest.mock import patch, AsyncMock, MagicMock, call

# 프로젝트 루트 경로 추정 및 sys.path 추가
import os
import sys
TESTS_DIR = os.path.dirname(os.path.abspath(__file__))
UNIT_TEST_DIR = os.path.dirname(TESTS_DIR)
PROJECT_ROOT = os.path.dirname(UNIT_TEST_DIR)
sys.path.insert(0, PROJECT_ROOT)

# 테스트 대상 모듈 임포트 (패치 대상이므로 경로 주의)
from workers.processor import worker as processor_worker
from core import config

# 실제 SHM 함수는 mock으로 대체되므로 shm_manager 임포트 필요 없을 수 있음
# from core import shm_manager

class TestProcessorWorker(unittest.IsolatedAsyncioTestCase):

    def setUp(self):
        """각 테스트 전에 Mock 객체 설정"""
        # --- Mock Redis Client ---
        # processor_worker 내의 redis_client 객체를 mock으로 대체
        # patch 데코레이터나 patch.start()를 사용하는 것이 더 일반적이지만,
        # 여기서는 setUp 내에서 직접 할당하는 방식으로 예시를 보여드립니다.
        # 테스트 실행 환경에 따라 patch 방식이 더 안정적일 수 있습니다.
        self.mock_redis_client = AsyncMock()
        processor_worker.redis_client = self.mock_redis_client

        # --- Mock SHM Manager Functions ---
        # worker 모듈 *내에서* 참조하는 shm_manager 함수들을 패치
        self.patcher_get_array = patch('workers.processor.worker.get_array_from_shm', new_callable=MagicMock)
        self.mock_get_array_from_shm = self.patcher_get_array.start()

        self.patcher_create_array = patch('workers.processor.worker.create_shm_from_array', new_callable=MagicMock)
        self.mock_create_shm_from_array = self.patcher_create_array.start()

        # --- Mock Translation API ---
        self.patcher_translate = patch('workers.processor.worker.call_translation_api', new_callable=AsyncMock)
        self.mock_call_translation_api = self.patcher_translate.start()

        # --- Mock OpenCV (선택적) ---
        # 실제 이미지 처리를 피하고 싶다면 fillPoly 등도 mock 처리 가능
        self.patcher_fillpoly = patch('cv2.fillPoly', new_callable=MagicMock) # worker 파일에서 cv2 직접 참조 가정
        self.mock_fillPoly = self.patcher_fillpoly.start()

        # --- 기본 Mock 설정 ---
        # get_array_from_shm은 (배열, shm객체) 튜플 반환 가정, shm객체는 close 메서드 필요
        mock_shm_obj = MagicMock()
        mock_shm_obj.close = MagicMock()
        self.sample_image_array = np.zeros((100, 100, 3), dtype=np.uint8) # 테스트용 샘플 이미지
        self.mock_get_array_from_shm.return_value = (self.sample_image_array, mock_shm_obj)

        # create_shm_from_array는 shm_info 딕셔너리 반환 가정
        self.mock_mask_shm_info = {"shm_name": "mock_mask_shm", "shape": [100, 100], "dtype": "uint8", "size": 10000}
        self.mock_create_shm_from_array.return_value = self.mock_mask_shm_info

        # call_translation_api는 입력 텍스트 리스트를 그대로 반환 가정
        # 수정: side_effect를 async 함수로 정의하여 코루틴이 아닌 실제 값을 반환하도록 함
        async def mock_translation_side_effect(texts, req_id):
            # await asyncio.sleep(0) # 필요 시 비동기 동작 시뮬레이션
            return texts
        self.mock_call_translation_api.side_effect = mock_translation_side_effect
        # self.mock_call_translation_api.return_value = ['mock_你好', 'mock_Hello'] # 또는 고정 값 반환

        # --- 테스트 데이터 준비 ---
        self.sample_request_id = "test-req-123"
        self.sample_image_id = "test_image.jpg"
        self.sample_shm_info = {"shm_name": "mock_img_shm", "shape": [100, 100, 3], "dtype": "uint8", "size": 30000}
        self.sample_ocr_result = [
            [[[10, 10], [50, 10], [50, 30], [10, 30]], ['你好', 0.95]], # 중국어
            [[[60, 40], [90, 40], [90, 60], [60, 60]], ['Hello', 0.98]] # 영어
        ]

    def tearDown(self):
        """각 테스트 후 Mock 객체 정리"""
        self.patcher_get_array.stop()
        self.patcher_create_array.stop()
        self.patcher_translate.stop()
        self.patcher_fillpoly.stop()
        # 워커 내부 redis_client를 원래대로 돌려놓거나 None으로 설정
        processor_worker.redis_client = None # 또는 실제 초기화 로직 필요 시 조정

    async def test_process_ocr_result_task_happy_path(self):
        """정상적인 OCR 결과 처리 테스트 (is_long=False, 중국어 필터링 ON)"""
        processor_worker.ONLY_CHINESE_FILTER = True # 필터링 활성화
        task_data = {
            "request_id": self.sample_request_id,
            "image_id": self.sample_image_id,
            "is_long": False,
            "shm_info": self.sample_shm_info,
            "ocr_result": self.sample_ocr_result
        }

        await processor_worker.process_ocr_result_task(task_data)

        # 1. 원본 이미지 SHM 접근 확인
        self.mock_get_array_from_shm.assert_called_once_with(self.sample_shm_info)

        # 2. 중국어 필터링으로 '你好'만 남음 -> 마스크 생성 시 fillPoly 호출 확인
        #    fillPoly는 numpy 배열을 받으므로 정확한 배열 비교는 복잡할 수 있음
        #    호출 여부와 호출 시 사용된 배열의 dtype 정도만 확인 가능
        self.mock_fillPoly.assert_called_once()
        args, kwargs = self.mock_fillPoly.call_args
        self.assertEqual(args[1][0].dtype, np.int32) # box 좌표는 int32 배열이어야 함

        # 3. 마스크 SHM 생성 확인
        self.mock_create_shm_from_array.assert_called_once()
        # 첫 번째 인자가 mask 배열인지 확인 (shape, dtype 등)
        mask_arg = self.mock_create_shm_from_array.call_args[0][0]
        self.assertEqual(mask_arg.shape, (100, 100))
        self.assertEqual(mask_arg.dtype, np.uint8)
        # create_shm_from_array에 prefix 인자 전달 확인
        self.assertIn('prefix', self.mock_create_shm_from_array.call_args.kwargs)
        self.assertEqual(self.mock_create_shm_from_array.call_args.kwargs['prefix'], config.SHM_NAME_PREFIX)


        # 4. Inpainting 작업 큐잉 확인 (short 큐)
        expected_inpainting_task = {
            "request_id": self.sample_request_id,
            "image_id": self.sample_image_id,
            "shm_name": self.sample_shm_info["shm_name"], # 원본 이미지 SHM
            "mask_shm_info": self.mock_mask_shm_info    # 마스크 이미지 SHM
        }
        expected_inpainting_task_json = json.dumps(expected_inpainting_task).encode('utf-8')
        self.mock_redis_client.lpush.assert_any_call(config.INPAINTING_SHORT_TASKS_QUEUE, expected_inpainting_task_json)

        # 5. 번역 API 호출 확인 (원본 OCR 결과 기준 - '你好', 'Hello')
        self.mock_call_translation_api.assert_awaited_once_with(['你好', 'Hello'], self.sample_request_id)

        # 6. Rendering 결과 저장 확인
        expected_translate_result = [
            {"box": [[10, 10], [50, 10], [50, 30], [10, 30]], "translated_text": '你好', "original_char_count": 2},
            {"box": [[60, 40], [90, 40], [90, 60], [60, 60]], "translated_text": 'Hello', "original_char_count": 5}
        ]
        expected_rendering_data = {
            "shm_name": self.sample_shm_info["shm_name"],
            "translate_result": expected_translate_result
        }
        expected_hash_key = f"{config.RENDERING_RESULT_HASH_PREFIX}{self.sample_request_id}"
        expected_rendering_data_json = json.dumps(expected_rendering_data).encode('utf-8')
        self.mock_redis_client.hset.assert_awaited_once_with(expected_hash_key, mapping={"data": expected_rendering_data_json})

        # 7. 원본 이미지 SHM 핸들 close 확인 (get_array_from_shm의 두 번째 반환값)
        mock_shm_obj = self.mock_get_array_from_shm.return_value[1]
        mock_shm_obj.close.assert_called_once()

    async def test_process_ocr_result_empty(self):
        """빈 OCR 결과 처리 테스트"""
        task_data = {
            "request_id": self.sample_request_id,
            "image_id": self.sample_image_id,
            "is_long": False,
            "shm_info": self.sample_shm_info,
            "ocr_result": [] # 빈 리스트
        }

        await processor_worker.process_ocr_result_task(task_data)

        # 1. Hosting 큐로 전달되었는지 확인
        expected_hosting_task = {
            "request_id": self.sample_request_id,
            "image_id": self.sample_image_id,
            "shm_name": self.sample_shm_info["shm_name"]
        }
        expected_hosting_task_json = json.dumps(expected_hosting_task).encode('utf-8')
        self.mock_redis_client.lpush.assert_awaited_once_with(config.HOSTING_TASKS_QUEUE, expected_hosting_task_json)

        # 2. 다른 작업들(SHM 접근, 마스크 생성, 번역 등)은 호출되지 않았는지 확인
        self.mock_get_array_from_shm.assert_not_called()
        self.mock_create_shm_from_array.assert_not_called()
        self.mock_call_translation_api.assert_not_awaited()
        self.mock_redis_client.hset.assert_not_awaited()

    # --- 추가 테스트 케이스들 ---
    # async def test_process_ocr_result_no_chinese_filter(self): ...
    # async def test_process_ocr_result_is_long(self): ...
    # async def test_process_ocr_result_shm_get_fail(self): ...
    # async def test_process_ocr_result_mask_shm_create_fail(self): ...
    # ... 등등

if __name__ == '__main__':
    unittest.main()
