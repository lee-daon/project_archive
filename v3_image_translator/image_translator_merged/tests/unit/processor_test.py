import unittest
import json
import redis
import os
import cv2 # OpenCV 추가
import numpy as np # NumPy 추가 (shm_manager에서 사용될 수 있음)
import logging

# 로깅 기본 설정 추가
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

# 프로젝트 루트 경로 추정 (tests/unit 디렉토리 기준)
TESTS_DIR = os.path.dirname(os.path.abspath(__file__))
UNIT_TEST_DIR = os.path.dirname(TESTS_DIR)
PROJECT_ROOT = os.path.dirname(UNIT_TEST_DIR)
IMAGES_DIR = os.path.join(PROJECT_ROOT, "images") # 이미지 디렉토리 경로 추가

# core 모듈을 찾기 위해 경로 추가
import sys
sys.path.append(PROJECT_ROOT)

from core.config import REDIS_URL, OCR_RESULT_QUEUE
from core.shm_manager import create_shm_from_array, cleanup_shm

logger = logging.getLogger(__name__)

class TestProcessorDataSetup(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        """테스트 클래스 시작 전 Redis 연결 설정"""
        try:
            cls.redis_client = redis.from_url(REDIS_URL, decode_responses=False)
            cls.redis_client.ping()
            print(f"Connected to Redis at {REDIS_URL}")
        except redis.exceptions.ConnectionError as e:
            print(f"Failed to connect to Redis: {e}")
            raise Exception("Redis connection failed for tests.") # 테스트 중단

        # result.json 파일 경로 설정
        cls.result_json_path = os.path.join(PROJECT_ROOT, "result.json")
        if not os.path.exists(cls.result_json_path):
            raise FileNotFoundError(f"{cls.result_json_path} not found.")

        # 이미지 파일 목록 가져오기
        cls.image_files = {f: os.path.join(IMAGES_DIR, f) for f in os.listdir(IMAGES_DIR) if f.lower().endswith(('.png', '.jpg', '.jpeg'))}
        if not cls.image_files:
            print(f"Warning: No image files found in {IMAGES_DIR}")


    @classmethod
    def tearDownClass(cls):
        """테스트 클래스 종료 후 Redis 연결 해제"""
        if hasattr(cls, 'redis_client') and cls.redis_client:
            cls.redis_client.close()
            print("Redis connection closed.")

    def setUp(self):
        """각 테스트 시작 전에 공유 메모리 생성 및 Redis 큐 설정"""
        self.created_shm_names = [] # 생성된 SHM 이름 저장 리스트
        self.redis_client.delete(OCR_RESULT_QUEUE) # 시작 전 큐 비우기

        try:
            with open(self.result_json_path, 'r', encoding='utf-8') as f:
                results_data = json.load(f)
        except json.JSONDecodeError:
            self.fail(f"Failed to decode JSON from {self.result_json_path}.")

        print(f"Processing {len(results_data)} items from {self.result_json_path} for Redis queue '{OCR_RESULT_QUEUE}'...")

        pushed_count = 0
        processed_items = [] # 실제 Redis에 푸시할 아이템 리스트

        for item in results_data:
            image_id = item.get("image_id")
            if not image_id:
                print(f"Warning: Item missing 'image_id'. Skipping SHM creation. Item: {item}")
                processed_items.append(item) # SHM 없이 그대로 추가
                continue

            image_path = self.image_files.get(image_id)
            if not image_path:
                print(f"Warning: Image file '{image_id}' not found in {IMAGES_DIR}. Skipping SHM creation for this item.")
                processed_items.append(item) # SHM 없이 그대로 추가
                continue

            try:
                # 이미지 로드 (컬러로)
                image_data = cv2.imread(image_path, cv2.IMREAD_COLOR)
                if image_data is None:
                    print(f"Warning: Failed to read image '{image_path}' with OpenCV. Skipping SHM creation.")
                    processed_items.append(item) # SHM 없이 그대로 추가
                    continue

                # 공유 메모리 생성
                shm_info = create_shm_from_array(image_data)
                self.created_shm_names.append(shm_info['shm_name']) # 정리 위해 이름 저장
                logger.info(f"[{item.get('request_id', 'N/A')}] Created SHM for {image_id}: {shm_info}") # 생성된 SHM 정보 로깅 추가

                # 아이템의 shm_info 업데이트
                item['shm_info'] = shm_info
                processed_items.append(item) # 업데이트된 아이템 추가

            except Exception as e:
                print(f"Error creating or processing shared memory for '{image_id}': {e}. Skipping SHM creation.")
                processed_items.append(item) # 원본 아이템 추가 (SHM 정보 없이)

        # 처리된 아이템들을 Redis 큐에 푸시
        for item in processed_items:
             try:
                item_json_bytes = json.dumps(item).encode('utf-8')
                self.redis_client.lpush(OCR_RESULT_QUEUE, item_json_bytes)
                pushed_count += 1
             except Exception as e:
                 print(f"Failed to push processed item to Redis: {item}. Error: {e}")

        print(f"Successfully pushed {pushed_count} items (out of {len(results_data)} original) to Redis queue '{OCR_RESULT_QUEUE}'")

    def tearDown(self):
        """각 테스트 종료 후 생성된 공유 메모리 해제"""
        print(f"Cleaning up {len(self.created_shm_names)} shared memory segments...")
        released_count = 0
        # 임시로 공유 메모리 정리를 주석 처리합니다.
        # 워커가 공유 메모리에 접근할 수 있도록 하기 위함입니다.
        # 테스트 후 수동으로 정리하거나, 통합 테스트 환경을 구축해야 합니다.
        # for shm_name in self.created_shm_names:
        #     try:
        #         cleanup_shm(shm_name)
        #         released_count += 1
        #     except Exception as e:
        #         print(f"Unexpected error during cleanup_shm call for \'{shm_name}\': {e}")
        # print(f"Successfully released {released_count} shared memory segments.")
        print(f"Skipping shared memory cleanup in tearDown for worker testing.") # 임시 메시지
        # Redis 큐는 setUp에서 매번 비우므로 여기서 비울 필요 없음

    def test_queue_populated(self):
        """setUp 후 Redis 큐에 데이터가 있는지 간단히 확인합니다."""
        queue_length = self.redis_client.llen(OCR_RESULT_QUEUE)
        print(f"Checking Redis queue '{OCR_RESULT_QUEUE}'. Found {queue_length} items.")
        self.assertGreater(queue_length, 0, f"Redis queue '{OCR_RESULT_QUEUE}' should be populated after setUp.")

if __name__ == '__main__':
    # unittest 실행
    # 로깅 설정이 main 블록 전에 적용되도록 위치 조정 필요 시 검토
    # logging.basicConfig(...) # 이미 파일 상단에 있음

    suite = unittest.TestSuite()
    suite.addTest(unittest.makeSuite(TestProcessorDataSetup))
    runner = unittest.TextTestRunner()
    test_result = runner.run(suite) # 결과 저장 (선택적)

    # 테스트 실행 후 프로세스가 바로 종료되지 않도록 대기
    print("\nTest execution finished. Shared memory segments should still exist.")
    # 테스트 실패 시에도 대기할지 결정 (현재는 실패해도 대기)
    input("Press Enter to close Redis connection and exit test script...")

    # 사용자가 Enter를 누르면 Redis 연결 종료 시도
    print("Attempting to close Redis connection...")
    try:
        # setUpClass에서 생성된 클래스 변수에 접근
        if hasattr(TestProcessorDataSetup, 'redis_client') and TestProcessorDataSetup.redis_client:
            # 동기/비동기 클라이언트 여부 확인 불필요, close()는 둘 다 가능
            TestProcessorDataSetup.redis_client.close()
            print("Redis connection closed.")
        else:
            print("Redis client not found or already closed.")
    except Exception as e:
        print(f"Error closing Redis connection manually: {e}")

    print("Exiting test script.")
