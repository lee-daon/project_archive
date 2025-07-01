import logging
import torch
from typing import List
import numpy as np

# lama.bin.inference 모듈에서 필요한 함수들을 직접 가져옵니다.
# 이 경로는 Docker 컨테이너의 PYTHONPATH에 /app/lama가 포함되어 있다고 가정합니다.
from lama.bin.inference import load_lama_model, batch_inference

# 로거 설정
logger = logging.getLogger(__name__)

# LaMa 모델 관련 전역 변수
model = None
train_config = None
device = "cpu"  # 기본값

async def load_model(config_path: str, checkpoint_path: str, use_cuda: bool):
    """LaMa 모델을 메모리에 로드합니다."""
    global model, train_config, device
    
    # CUDA 사용 가능 여부에 따라 장치 설정
    if use_cuda and torch.cuda.is_available():
        device = "cuda"
    else:
        device = "cpu"
        
    try:
        logger.info(f"LaMa 모델 로드 중: {checkpoint_path}, 장치: {device}...")
        # `load_lama_model` 함수를 사용하여 모델 로드
        model, train_config = load_lama_model(config_path, checkpoint_path, device)
        logger.info("LaMa 모델 로드 완료")
    except Exception as e:
        logger.error(f"LaMa 모델 로드 실패: {e}", exc_info=True)
        raise

def run_batch_inference(images_np: List[np.ndarray], masks_np: List[np.ndarray], use_fp16: bool) -> List[np.ndarray]:
    """LaMa 모델을 사용하여 배치 추론을 실행합니다."""
    global model, train_config, device
    
    if model is None or train_config is None:
        raise RuntimeError("LaMa 모델이 로드되지 않았습니다. load_model()을 먼저 호출해야 합니다.")
    
    logger.info(f"LaMa 추론 실행: {len(images_np)}개 이미지, 장치: {device}, FP16: {use_fp16}")
    
    # `batch_inference` 함수를 사용하여 추론 실행
    results_np = batch_inference(
        images_np=images_np,
        masks_np=masks_np,
        model=model,
        train_config=train_config,
        device=device,
        use_fp16=use_fp16
    )
    return results_np
