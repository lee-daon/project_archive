import cv2
import numpy as np
import logging

logger = logging.getLogger(__name__)

def bytes_to_numpy_bgr(image_bytes: bytes) -> np.ndarray:
    """이미지 바이트 데이터를 OpenCV를 사용하여 uint8 BGR NumPy 배열로 변환합니다."""
    try:
        # 바이트 데이터를 NumPy 배열로 디코딩 (컬러 이미지로 로드)
        nparr = np.frombuffer(image_bytes, np.uint8)
        img_np = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img_np is None:
            raise ValueError("이미지 데이터를 디코딩할 수 없습니다. 지원되지 않는 형식이거나 파일이 손상되었을 수 있습니다.")

        # OpenCV는 기본적으로 BGR, HWC 순서로 로드하며, dtype은 uint8
        if img_np.dtype != np.uint8:
            # 일반적으로 imdecode는 uint8로 반환하지만, 명시적 확인
            logger.warning(f"Decoded image dtype is {img_np.dtype}, expected uint8. Attempting conversion.")
            img_np = img_np.astype(np.uint8)

        logger.info(f"Image decoded successfully. Shape: {img_np.shape}, Dtype: {img_np.dtype}")
        return img_np

    except Exception as e:
        logger.error(f"Error converting image bytes to NumPy array: {e}", exc_info=True)
        # 에러를 다시 발생시켜 호출자에게 알림
        raise ValueError(f"이미지 처리 중 오류 발생: {e}") 