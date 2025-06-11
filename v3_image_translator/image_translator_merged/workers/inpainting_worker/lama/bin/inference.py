import os
import yaml
import torch
import numpy as np
from omegaconf import OmegaConf
from typing import List, Dict, Tuple
import torchvision.transforms.functional as TF # Normalize 사용 위해 추가
from tqdm import tqdm # tqdm import 추가
from torch.cuda.amp import autocast as cuda_autocast # 명시적 import
from contextlib import nullcontext # FP16 비활성화 시 사용할 컨텍스트

# 기존 LaMa 코드에서 필요한 함수들을 가져옵니다.
# 실제 필요한 import는 구현하면서 추가/수정될 수 있습니다.
from saicinpainting.training.trainers import load_checkpoint # Docker 환경(PYTHONPATH=/app) 기준 import
from saicinpainting.evaluation.utils import move_to_device # Docker 환경(PYTHONPATH=/app) 기준 import
# 필요한 전처리/후처리 함수 import
from saicinpainting.evaluation.data import pad_tensor_to_modulo, ceil_modulo # Docker 환경(PYTHONPATH=/app) 기준 import
# from saicinpainting.evaluation.utils import unpad_to_size # 주석 처리된 부분도 수정
import torch.nn.functional as F # pad_tensor_to_modulo 내부에서 사용하므로 import

DEFAULT_MODEL_PATH = "/model" # Docker 환경 기준 기본 경로

def load_lama_model(config_path, checkpoint_path, device):
    """LaMa 모델과 설정을 로드하는 헬퍼 함수"""
    with open(config_path, 'r') as f:
        train_config = OmegaConf.create(yaml.safe_load(f))

    train_config.training_model.predict_only = True
    train_config.visualizer.kind = 'noop'

    model = load_checkpoint(train_config, checkpoint_path, strict=False, map_location=device)
    model.to(device)
    model.eval() # 추론 모드로 설정
    return model, train_config

def batch_inference(
    images_np: List[np.ndarray],  # 이미 전처리된 RGB 이미지들
    masks_np: List[np.ndarray],   # 이미 전처리된 그레이스케일 마스크들
    model: torch.nn.Module,       # Pre-loaded model object
    train_config: OmegaConf,    # Loaded train config from model
    device: str = 'cuda',
    use_fp16: bool = False        # FP16 inference flag
) -> List[np.ndarray]:
    """
    이미 전처리된 배치를 한번에 처리하는 최적화된 추론 함수.
    LaMa 모델 요구사항에 맞는 배수 패딩을 배치 단위로 효율적으로 처리.

    Args:
        images_np: 이미 전처리된 RGB 이미지 배열들 (uint8, HWC).
        masks_np: 이미 전처리된 그레이스케일 마스크 배열들 (uint8).
        model: 사전 로드된 LaMa 모델.
        train_config: 모델 설정 객체.
        device: 사용할 장치 ('cuda' 또는 'cpu').
        use_fp16: FP16 추론 사용 여부.

    Returns:
        인페인팅 결과 이미지 배열들 (RGB, uint8, HWC).
    """
    print(f"최적화된 배치 추론 시작: {len(images_np)}개 이미지, 장치: {device}, FP16: {use_fp16}")
    torch_device = torch.device(device)

    # 모델 설정에서 필요한 값들 가져오기
    dataset_config = train_config.get('data', {}).get('visual_test', train_config.get('data', {}).get('val', {}))
    pad_out_to_modulo = dataset_config.get('pad_out_to_modulo', 8)
    out_key = train_config.get('evaluator', {}).get('inpainted_key', 'inpainted')
    print(f"패딩 배수: {pad_out_to_modulo}, 출력 키: {out_key}")

    if not images_np:
        print("경고: 입력 이미지가 없습니다")
        return []

    # 1. 배치 내 최대 크기 계산 및 배수 패딩 준비
    max_h = max(img.shape[0] for img in images_np)
    max_w = max(img.shape[1] for img in images_np)
    
    # LaMa 모델 요구사항: 배수로 맞춤
    padded_h = ceil_modulo(max_h, pad_out_to_modulo)
    padded_w = ceil_modulo(max_w, pad_out_to_modulo)
    
    print(f"배치 최대 크기: ({max_h}, {max_w}) → 패딩 후: ({padded_h}, {padded_w})")

    # 2. 배치 단위로 패딩 및 텐서 변환
    processed_samples = []
    original_sizes = []  # 언패딩을 위한 원본 크기 저장
    
    for i, (img_np, mask_np) in enumerate(zip(images_np, masks_np)):
        try:
            # 마스크 차원 확인 및 조정
            if mask_np.ndim == 2:
                mask_np = np.expand_dims(mask_np, axis=-1)
            elif mask_np.ndim == 3 and mask_np.shape[2] == 1:
                pass  # 이미 올바른 형태
            else:
                print(f"경고: 샘플 {i}의 마스크 형태가 예상과 다름: {mask_np.shape}")
                continue

            # 이미지와 마스크 크기 일치 확인
            if img_np.shape[:2] != mask_np.shape[:2]:
                print(f"경고: 샘플 {i}의 이미지와 마스크 크기 불일치. 이미지: {img_np.shape[:2]}, 마스크: {mask_np.shape[:2]}")
                continue

            # 원본 크기 저장 (언패딩용)
            orig_h, orig_w = img_np.shape[:2]
            original_sizes.append((orig_h, orig_w))

            # 배치 통일 크기로 패딩
            pad_h = padded_h - orig_h
            pad_w = padded_w - orig_w
            
            # 이미지 패딩 (symmetric mode)
            img_padded = np.pad(img_np, ((0, pad_h), (0, pad_w), (0, 0)), mode='symmetric')
            
            # 마스크 패딩 (symmetric mode)  
            mask_padded = np.pad(mask_np, ((0, pad_h), (0, pad_w), (0, 0)), mode='symmetric')

            # 텐서 변환 [0, 1] 범위로 정규화
            img_tensor = TF.to_tensor(img_padded)  # HWC -> CHW, [0,255] -> [0,1]
            mask_tensor = TF.to_tensor(mask_padded)  # HWC -> CHW, [0,255] -> [0,1]

            # 마스크 이진화 (0.5 임계값)
            mask_tensor = (mask_tensor > 0.5) * 1.0

            processed_samples.append({
                'image': img_tensor,
                'mask': mask_tensor
            })

        except Exception as e:
            print(f"샘플 {i} 전처리 중 오류: {e}")
            original_sizes.append(None)  # 실패한 샘플 표시
            continue

    if not processed_samples:
        print("오류: 유효한 샘플이 없습니다")
        return []

    # 3. 전체 배치를 한번에 스택 (모두 동일한 크기로 통일됨)
    try:
        batch = {
            'image': torch.stack([s['image'] for s in processed_samples]).to(torch_device),
            'mask': torch.stack([s['mask'] for s in processed_samples]).to(torch_device)
        }
        print(f"배치 텐서 형태: Image={batch['image'].shape}, Mask={batch['mask'].shape}")
    except RuntimeError as e:
        print(f"배치 스택 오류: {e}")
        raise e

    # 4. 전체 배치를 한번에 추론 (미니배치 분할 없음!)
    with torch.no_grad():
        autocast_context = cuda_autocast(enabled=use_fp16) if device == 'cuda' else nullcontext()
        
        with autocast_context:
            prediction = model(batch)
            if out_key not in prediction:
                raise KeyError(f"모델 출력에 '{out_key}' 키가 없음. 사용 가능한 키: {prediction.keys()}")
            output_batch_tensor = prediction[out_key]
    
    print(f"추론 출력 텐서 형태: {output_batch_tensor.shape}")

    # 5. 후처리 - 언패딩 및 NumPy 변환
    output_batch_tensor = output_batch_tensor.detach().cpu()
    results = []

    for i in range(output_batch_tensor.shape[0]):
        result_tensor = output_batch_tensor[i]  # CHW
        
        # 원본 크기로 언패딩
        if i < len(original_sizes) and original_sizes[i] is not None:
            orig_h, orig_w = original_sizes[i]
            result_tensor = result_tensor[:, :orig_h, :orig_w]  # 패딩 제거
        
        result_np = result_tensor.permute(1, 2, 0).numpy()  # CHW -> HWC
        result_np = np.clip(result_np * 255, 0, 255).astype(np.uint8)  # [0,1] -> [0,255]
        results.append(result_np)

    print(f"배치 추론 완료: {len(results)}개 결과 반환")
    return results
