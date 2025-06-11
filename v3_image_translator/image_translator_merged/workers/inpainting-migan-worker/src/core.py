import torch
import numpy as np
import os
import time
from typing import List, Optional, Tuple

# from .model import MIGAN_Pipeline_PT, MIGAN_Generator # 같은 src 폴더 내의 model.py
# 위 상대경로 import는 이 파일이 패키지의 일부로 실행될 때 유효합니다.
# 만약 app.py에서 src.core 를 import하고 core.py가 model.py를 참조해야 한다면,
# 실행 경로와 PYTHONPATH 설정에 따라 절대경로 import가 필요할 수 있습니다.
# 예를 들어, 프로젝트 루트가 PYTHONPATH에 있다면 from src.model import ...
from src.model import MIGAN_Pipeline_PT, MIGAN_Generator # app.py가 프로젝트 루트에서 실행된다고 가정

PYTORCH_MODEL_PATH_DEFAULT = "./models/migan_512_places2.pt"
MODEL_RESOLUTION_DEFAULT = 1024

migan_pipeline_pt_instance: Optional[MIGAN_Pipeline_PT] = None
current_device: Optional[torch.device] = None

def initialize_pipeline(model_path: str = PYTORCH_MODEL_PATH_DEFAULT, 
                        resolution: int = MODEL_RESOLUTION_DEFAULT, 
                        device_str: Optional[str] = None) -> Tuple[Optional[MIGAN_Pipeline_PT], Optional[torch.device]]:
    global migan_pipeline_pt_instance, current_device

    if device_str:
        device = torch.device(device_str)
    else:
        device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    
    current_device = device

    if MIGAN_Generator is None:
        print("MIGAN_Generator not available, PyTorch pipeline cannot be initialized.")
        migan_pipeline_pt_instance = None
        return None, device

    if not os.path.exists(model_path):
        print(f"Warning: PyTorch Model file not found at {model_path}.")
        migan_pipeline_pt_instance = None
        return None, device
    
    try:
        print(f"Initializing PyTorch MIGAN_Pipeline for {model_path}...")
        init_start_time = time.time()
        migan_pipeline_pt_instance = MIGAN_Pipeline_PT(
            model_path=model_path,
            resolution=resolution,
            device=device
        )
        init_end_time = time.time()
        print(f"PyTorch MIGAN_Pipeline loaded successfully to {device} in {init_end_time - init_start_time:.4f} seconds.")
        return migan_pipeline_pt_instance, device
    except Exception as e:
        print(f"Error initializing PyTorch MIGAN_Pipeline: {e}")
        migan_pipeline_pt_instance = None
        return None, device

def get_pipeline_instance() -> Optional[MIGAN_Pipeline_PT]:
    return migan_pipeline_pt_instance

def get_current_device() -> Optional[torch.device]:
    return current_device

def inpaint_batch_images(image_np_list: List[np.ndarray], 
                           mask_np_list: List[np.ndarray]
                           ) -> List[np.ndarray]:
    pipeline = get_pipeline_instance()
    device = get_current_device()

    if pipeline is None:
        raise RuntimeError("PyTorch MIGAN_Pipeline is not initialized. Call initialize_pipeline() first.")
    if device is None:
        raise RuntimeError("Device not set. Call initialize_pipeline() first.")
    if not image_np_list or not mask_np_list:
        return []
    if len(image_np_list) != len(mask_np_list):
        raise ValueError("Image and mask lists must have the same number of elements.")

    image_tensors = []
    mask_tensors = []

    for img_np, mask_np in zip(image_np_list, mask_np_list):
        if img_np.ndim != 3 or img_np.shape[2] != 3:
            raise ValueError(f"Each image in image_np_list must be HWC with 3 channels, got shape {img_np.shape}")
        if mask_np.ndim != 3 or mask_np.shape[2] != 1:
            raise ValueError(f"Each mask in mask_np_list must be HWC with 1 channel, got shape {mask_np.shape}")
        if img_np.dtype != np.uint8:
            raise ValueError(f"Images must be np.uint8, got {img_np.dtype}")
        if mask_np.dtype != np.uint8:
             raise ValueError(f"Masks must be np.uint8, got {mask_np.dtype}")

        # Ensure consistent H, W for images and their corresponding masks before tensor conversion
        # The pipeline itself can handle varied H,W per batch item due to cropping,
        # but a single image and its mask must match.
        if img_np.shape[0] != mask_np.shape[0] or img_np.shape[1] != mask_np.shape[1]:
            raise ValueError(
                f"Image (shape {img_np.shape[:2]}) and mask (shape {mask_np.shape[:2]}) dimensions must match for each pair."
            )

        img_tensor = torch.from_numpy(img_np).permute(2, 0, 1).unsqueeze(0) # 1, C, H, W
        mask_tensor = torch.from_numpy(mask_np).permute(2, 0, 1).unsqueeze(0) # 1, 1, H, W
        image_tensors.append(img_tensor.to(device, dtype=torch.uint8))
        mask_tensors.append(mask_tensor.to(device, dtype=torch.uint8))

    if not image_tensors: return []

    # Stack individual tensors into a batch
    # Note: If images have different H, W, torch.cat will fail.
    # The MIGAN_Pipeline_PT.forward method is designed to handle a batch where items can have different H, W initially,
    # as it processes each item individually for cropping before creating the model input batch.
    # Thus, direct torch.cat might not be what we want if H,W differ across the batch.
    # However, the MIGAN_Pipeline_PT.forward takes a single image_batch_uint8 and mask_batch_uint8.
    # This implies images/masks should be batched first.
    # If they have different sizes, this will be an issue.
    # For now, assume all images_np_list have been resized to a common size if necessary before this function,
    # or the pipeline's internal handling is robust to it (which it seems to be for cropping).
    # Let's check for consistent H, W across the batch before cat, or adapt pipeline for list of tensors.

    # The current MIGAN_Pipeline_PT.forward expects batched tensors B,C,H,W.
    # This means H and W *must* be consistent across the batch for torch.cat().
    # If H,W vary, then MIGAN_Pipeline_PT.forward needs to be refactored to accept List[Tensor]
    # or we must resize/pad images to a consistent size for the batch here.
    # For now, we enforce H,W to be same across batch for simplicity, matching original app.py batching.
    first_img_shape = None
    if image_tensors:
        first_img_shape = image_tensors[0].shape # (1, C, H, W)
        for i_tensor in image_tensors[1:]:
            if i_tensor.shape[2] != first_img_shape[2] or i_tensor.shape[3] != first_img_shape[3]:
                raise ValueError("All images in a batch must have the same Height and Width for torch.cat(). "
                                 "Please resize/pad images to a consistent size before batching.")
    
    image_batch_tensor = torch.cat(image_tensors, dim=0) # (B, C, H, W)
    mask_batch_tensor = torch.cat(mask_tensors, dim=0)   # (B, 1, H, W)

    with torch.no_grad():
        inpainted_batch_tensor = pipeline(image_batch_tensor, mask_batch_tensor) # Returns (B, C, H, W) uint8

    inpainted_results_list = []
    for i in range(inpainted_batch_tensor.size(0)):
        single_result_tensor = inpainted_batch_tensor[i].cpu().permute(1, 2, 0) # H, W, C
        inpainted_results_list.append(single_result_tensor.numpy().astype(np.uint8))
        
    return inpainted_results_list 