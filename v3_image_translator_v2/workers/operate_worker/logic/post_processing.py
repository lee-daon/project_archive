import numpy as np
import cv2
from typing import Tuple

def restore_from_padding(img: np.ndarray, padding_info: Tuple[int, int, int, int], original_size: Tuple[int, int]) -> np.ndarray:
    """
    패딩 정보를 사용하여 이미지를 원본 크기로 복원합니다.
    
    Args:
        img: 패딩된 이미지
        padding_info: 패딩 정보 (top, right, bottom, left)
        original_size: 원본 크기 (height, width)
        
    Returns:
        원본 크기로 복원된 이미지
    """
    pad_top, pad_right, pad_bottom, pad_left = padding_info
    h, w = original_size
    
    # 패딩 제거
    unpadded = img[pad_top:img.shape[0]-pad_bottom, pad_left:img.shape[1]-pad_right]
    
    # 원본 크기로 복원 (필요한 경우)
    if unpadded.shape[:2] != (h, w):
        restored = cv2.resize(unpadded, (w, h), interpolation=cv2.INTER_LINEAR)#복원을 해야 한다는 건 이미지를 축소해서 처리했기 때문에 원본 크기로 복원해야 한다는 것
        return restored# 참고로 단순히 패딩만 있었다면 복원의 필요성이 없음
    
    return unpadded
