import os
import sys
import json
import asyncio
import numpy as np
import cv2
import pytest
from unittest.mock import patch, MagicMock

# LaMa 모듈 목(mock) 처리
sys.modules['lama'] = MagicMock()
sys.modules['lama.bin'] = MagicMock()
sys.modules['lama.bin.inference'] = MagicMock()

# 프로젝트 루트 경로 설정
TEST_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(os.path.dirname(TEST_DIR))
sys.path.insert(0, ROOT_DIR)

# 테스트할 모듈 임포트
from workers.inpainting_worker.worker import (
    resize_with_padding,
    restore_from_padding,
    process_batch
)
from core.shm_manager import create_shm_from_array, get_array_from_shm, cleanup_shm

# 픽스처: 테스트 이미지와 마스크 생성
@pytest.fixture
def test_image():
    # 간단한 테스트 이미지 생성 (100x100 RGB)
    img = np.zeros((100, 100, 3), dtype=np.uint8)
    # 간단한 패턴 추가
    img[30:70, 30:70] = [255, 0, 0]  # 빨간색 사각형
    return img

@pytest.fixture
def test_mask():
    # 간단한 테스트 마스크 생성 (100x100 그레이스케일)
    mask = np.zeros((100, 100), dtype=np.uint8)
    # 마스크에 인페인팅할 영역 표시 (255: 채울 영역)
    mask[40:60, 40:60] = 255  # 사각형 중앙 인페인팅
    return mask

# 리사이징 및 패딩 테스트
def test_resize_with_padding(test_image):
    # 원본 이미지보다 큰 크기로 패딩
    target_size = (150, 150)
    result, padding_info = resize_with_padding(test_image, target_size)
    
    # 결과 검증
    assert result.shape[:2] == target_size
    assert padding_info == (25, 25, 25, 25)  # top, right, bottom, left
    
    # 원본 이미지보다 작은 크기로 리사이징
    target_size = (50, 50)
    result, padding_info = resize_with_padding(test_image, target_size)
    
    # 결과 검증
    assert result.shape[:2] == target_size
    
    # 비대칭 크기로 리사이징
    target_size = (200, 100)
    result, padding_info = resize_with_padding(test_image, target_size)
    
    # 결과 검증
    assert result.shape[:2] == target_size

# 리사이징 후 원본 크기 복원 테스트
def test_restore_from_padding(test_image):
    # 먼저 이미지 리사이징 및 패딩
    target_size = (150, 150)
    padded, padding_info = resize_with_padding(test_image, target_size)
    
    # 원본 크기로 복원
    restored = restore_from_padding(padded, padding_info, test_image.shape[:2])
    
    # 결과 검증: 원본 크기와 동일해야 함
    assert restored.shape[:2] == test_image.shape[:2]
    
    # 픽셀 값 비교는 리사이징 과정에서 약간의 차이가 있을 수 있으므로 생략

# 공유 메모리 테스트
@patch('core.shm_manager.get_array_from_shm')
@patch('core.shm_manager.create_shm_from_array')
@patch('core.shm_manager.cleanup_shm')
def test_shm_operations_mocked(mock_cleanup, mock_create, mock_get, test_image, test_mask):
    # 모의 설정
    mock_create.return_value = {'shm_name': 'test_shm', 'shape': [100, 100, 3], 'dtype': 'uint8'}
    mock_shm = MagicMock()
    mock_get.return_value = (test_image, mock_shm)
    
    # 테스트 로직...
    # 여기에 있는 실제 SHM 작업 대신 모의 객체를 사용하는 테스트 코드 작성

# 배치 처리 모의 테스트 (LaMa 모델 없이)
@patch('workers.inpainting_worker.worker.batch_inference')
@patch('workers.inpainting_worker.worker.get_redis_client')
@patch('workers.inpainting_worker.worker.create_shm_from_array')
@patch('workers.inpainting_worker.worker.get_array_from_shm')
@pytest.mark.asyncio
async def test_process_batch(mock_get_array, mock_create_shm, mock_redis, mock_batch_inference, test_image, test_mask):
    # 모의 설정
    mock_model = MagicMock()
    mock_train_config = MagicMock()
    
    # get_array_from_shm 모의 설정
    mock_img_shm = MagicMock()
    mock_mask_shm = MagicMock()
    mock_get_array.side_effect = [
        (test_image, mock_img_shm),
        (test_mask, mock_mask_shm)
    ]
    
    # batch_inference 모의 설정
    mock_result = np.zeros_like(test_image)
    mock_batch_inference.return_value = [mock_result]
    
    # create_shm_from_array 모의 설정
    mock_shm_info = {
        'shm_name': 'test_shm',
        'shape': test_image.shape,
        'dtype': str(test_image.dtype),
        'size': test_image.nbytes
    }
    mock_create_shm.return_value = mock_shm_info
    
    # Redis 클라이언트 모의 설정
    mock_redis_instance = MagicMock()
    mock_redis.return_value = mock_redis_instance
    mock_redis_instance.rpush = MagicMock()
    
    # 테스트 데이터
    batch_tasks = [{
        'request_id': 'test_request',
        'image_id': 'test_image.jpg',
        'shm_name': 'test_img_shm',
        'mask_shm_info': {
            'shm_name': 'test_mask_shm',
            'shape': test_mask.shape,
            'dtype': str(test_mask.dtype),
            'size': test_mask.nbytes
        }
    }]
    
    # worker.py의 모듈 변수 패치
    with patch('workers.inpainting_worker.worker.model', mock_model), \
         patch('workers.inpainting_worker.worker.train_config', mock_train_config):
        # 배치 처리 함수 호출
        result = await process_batch(batch_tasks, is_long=False)
        
        # 검증
        assert result is True
        mock_batch_inference.assert_called_once()
        mock_redis_instance.rpush.assert_called_once()

# 메인 테스트 실행
if __name__ == "__main__":
    pytest.main(["-xvs", __file__])
