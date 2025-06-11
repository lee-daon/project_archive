# MI-GAN Image Inpainting (PyTorch)

이 프로젝트는 기존 MI-GAN 구현을 다양한 프로젝트에 쉽게 통합할 수 있도록, **최적화된 처리(FP16 추론, 배치 이미지 처리, 효율적인 전/후처리)를 포함한 핵심 기능을 API 함수 형태로 제공**합니다. Docker를 통해 일관된 실행 환경을 지원하며, `Dockerfile`을 통해 프로젝트 실행에 필요한 모든 의존성을 명확하게 확인할 수 있습니다.

## 목차

- [준비 사항](#준비-사항)
- [기본 실행](#기본-실행)
- [라이브러리로 사용하기 (API 가이드)](#라이브러리로-사용하기-api-가이드)
  - [1. 파이프라인 초기화](#1-파이프라인-초기화)
  - [2. 이미지 인페인팅](#2-이미지-인페인팅)
- [참고: MI-GAN 이란?](#참고-migan-이란)
- [Acknowledgements](#acknowledgements)

## 준비 사항

1.  **필수 라이브러리 설치**:
    프로젝트 루트의 `requirements.txt` 파일을 사용하여 필요한 라이브러리를 설치합니다. (가상환경 권장)
    ```bash
    pip install -r requirements.txt
    ```
    *PyTorch 및 CUDA 버전은 `requirements.txt` 내의 명시된 버전을 따르거나, 사용자의 환경에 맞게 조정될 수 있습니다.*

2.  **사전 학습된 모델 준비**:
    MI-GAN 모델 파일 (`.pt` 확장자)을 다운로드하여 프로젝트 내 `models/` 디렉토리에 위치시킵니다.
    모델은 다음 링크에서 다운로드할 수 있습니다: [MI-GAN Pre-trained Models (Google Drive)](https://drive.google.com/drive/folders/1xNtvN2lto0p5yFKOEEg9RioMjGrYM74w)
    (예: `models/migan_512_places2.pt`)

3.  **(선택) 예제 데이터 확인**:
    `app.py`의 데모 실행을 위해 `examples/` 디렉토리에 이미지와 마스크가 준비되어 있는지 확인합니다.

## 기본 실행 (예제 데모)

프로젝트 루트 디렉토리에서 다음 명령어를 실행하면, `examples/` 폴더의 이미지를 사용하여 인페인팅 데모를 실행합니다:

```bash
python app.py
```

결과는 `examples/places2_512_freeform/results/app_py_refactored_test/`에 저장됩니다.

## 라이브러리로 사용하기 (API 가이드)

다른 Python 코드에서 인페인팅 기능을 직접 호출하려면 다음 함수들을 사용합니다.

### 1. 파이프라인 초기화

인페인팅 실행 전, 모델 파이프라인을 초기화합니다.

- **함수**: `src.core.initialize_pipeline(model_path: str, resolution: int, device_str: Optional[str])`
- **설명**: 모델을 로드하고 지정된 장치(CPU/GPU)에 준비시킵니다.
- **파라미터**:
    - `model_path` (str): `.pt` 모델 파일 경로 (예: `"./models/migan_512_places2.pt"`).
    - `resolution` (int): 모델 해상도 (예: `512`).
    - `device_str` (Optional[str]): 사용할 장치 (`"cpu"`, `"cuda"`). `None`이면 자동 선택.
- **반환**: `(pipeline_instance, device_object)` 튜플. 실패 시 `(None, ...)`. 

### 2. 이미지 인페인팅

초기화된 파이프라인으로 이미지를 인페인팅합니다.

- **함수**: `src.core.inpaint_batch_images(image_np_list: List[np.ndarray], mask_np_list: List[np.ndarray]) -> List[np.ndarray]`
- **설명**: 이미지와 마스크 NumPy 배열 리스트를 입력받아, 인페인팅된 이미지 NumPy 배열 리스트를 반환합니다.
- **입력 형식**:
    - `image_np_list` (`List[np.ndarray]`): 원본 이미지 리스트.
        - 각 이미지: `(H, W, 3)` 형태, `np.uint8` 타입 (RGB).
    - `mask_np_list` (`List[np.ndarray]`): 마스크 리스트.
        - 각 마스크: `(H, W, 1)` 형태, `np.uint8` 타입 (Grayscale).
        - **값 의미**: 0은 인페인팅 영역(구멍), 255는 보존 영역.
        - 각 이미지/마스크 쌍의 H, W는 일치해야 합니다.
        - **배치 내 모든 이미지/마스크는 H, W 크기가 동일해야 합니다.**
- **반환**: 인페인팅된 이미지(`(H,W,3)` `np.uint8` NumPy 배열)들의 리스트.

## 참고: MI-GAN 이란?

MI-GAN (Multi-Illumination Generative Adversarial Network)은 딥러닝 기반 이미지 인페인팅(손상된 이미지 영역 복원) 모델로, 특히 **기존 인페인팅 모델 대비 압도적으로 빠른 처리 속도 향상**을 통해 모바일 장치에서의 효율적인 실행을 목표로 설계되었습니다. 특정 논문 "MI-GAN: A Simple Baseline for Image Inpainting on Mobile Devices" (Sargsyan et al., ICCV 2023)에서 제안된 이 모델은 이미지의 누락된 부분을 주변 컨텍스트를 활용하여 자연스럽게 채웁니다. 이 프로젝트는 해당 MI-GAN 모델의 PyTorch 구현을 기반으로 API화 및 Docker 이미지를 제공하여, 이러한 속도 이점을 쉽게 활용할 수 있도록 합니다.

## Acknowledgements

이 프로젝트는 Picsart AI Research (PAIR)의 MI-GAN 구현을 기반으로 개발되었습니다.
원본 프로젝트 저장소: [https://github.com/Picsart-AI-Research/MI-GAN]

MI-GAN 원본 연구 또는 이 프로젝트의 기반이 된 기술에 대해 인용하시려면 다음 정보를 참고하십시오:
```bibtex
@InProceedings{Sargsyan_2023_ICCV,
    author    = {Sargsyan, Andranik and Navasardyan, Shant and Xu, Xingqian and Shi, Humphrey},
    title     = {MI-GAN: A Simple Baseline for Image Inpainting on Mobile Devices},
    booktitle = {Proceedings of the IEEE/CVF International Conference on Computer Vision (ICCV)},
    month     = {October},
    year      = {2023},
    pages     = {7335-7345}
}
```

제공된 `LICENSE.txt` 파일은 이 파생 프로젝트에 적용되는 MIT 라이선스입니다. 
원본 MI-GAN 프로젝트는 자체 라이선스를 가질 수 있으니, 해당 저장소에서 별도로 확인하시기 바랍니다. 
(예: 원본 MI-GAN 저장소의 라이선스 파일 링크 또는 라이선스 종류 명시)
