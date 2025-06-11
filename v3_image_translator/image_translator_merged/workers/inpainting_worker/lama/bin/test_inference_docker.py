# lama/bin/test_inference_docker.py
import sys
import os
import cv2
import numpy as np
import torch
import time
# Import functions from the inference module in the same directory
from inference import load_lama_model, batch_inference

print("--- Docker Inference Test Script ---")

# --- Configuration ---
input_dir = '/input_images'
output_dir = '/output'
image_fname = '000068.png'
mask_fname = '000068_mask.png'
model_docker_path = '/model' # Docker internal path
config_fname='config.yaml'
checkpoint_fname='best.ckpt'
device_to_use = 'cuda' if torch.cuda.is_available() else 'cpu'
test_batch_size = 4 # 배치 사이즈 8로 변경
use_fp16_test = True # Set to True to test FP16 inference

print(f"Device: {device_to_use}, Model Path: {model_docker_path}, Batch Size: {test_batch_size}, FP16: {use_fp16_test}")

# --- 1. Load Model (outside timing loop) ---
print("\nLoading LaMa model...")
model_load_start = time.time()
model_config_path = os.path.join(model_docker_path, config_fname)
model_ckpt_path = os.path.join(model_docker_path, 'models', checkpoint_fname)
try:
    model, train_config = load_lama_model(model_config_path, model_ckpt_path, torch.device(device_to_use))
except FileNotFoundError as e:
    print(f"Error loading model: {e}")
    sys.exit(1)
model_load_end = time.time()
print(f"Model loaded successfully in {model_load_end - model_load_start:.2f} seconds.")


# --- 2. Prepare Data ---
image_path = os.path.join(input_dir, image_fname)
mask_path = os.path.join(input_dir, mask_fname)

print(f"\nLoading image: {image_path}")
print(f"Loading mask: {mask_path}")
image_np = cv2.imread(image_path, cv2.IMREAD_COLOR) # BGR
if image_np is None:
    print(f"Error: Cannot load image: {image_path}")
    sys.exit(1)

mask_np = cv2.imread(mask_path, cv2.IMREAD_GRAYSCALE)
if mask_np is None:
    print(f"Error: Cannot load mask: {mask_path}")
    sys.exit(1)

# Ensure mask is (H, W, 1)
if mask_np.ndim == 2:
    mask_np = np.expand_dims(mask_np, axis=-1)

print(f"Original image shape: {image_np.shape}, dtype: {image_np.dtype}")
print(f"Original mask shape: {mask_np.shape}, dtype: {mask_np.dtype}")

# Simulate batch size 8 (Data preparation)
num_replications = test_batch_size # test_batch_size 값 사용
images_list_bgr = [image_np] * num_replications
masks_list_np = [mask_np] * num_replications
print(f"Total samples prepared: {len(images_list_bgr)}")

# Convert images to RGB for inference function
images_list_rgb = [cv2.cvtColor(img, cv2.COLOR_BGR2RGB) for img in images_list_bgr]
print("Converted images to RGB")

# --- 3. Call batch_inference and Measure Inference Time Only ---
print("\nCalling batch_inference...")
inference_start_time = time.time() # Start timing *after* model loading
try:
    results_list_np = batch_inference(
        images_np=images_list_rgb,
        masks_np=masks_list_np,
        model=model,             # Pass loaded model
        train_config=train_config, # Pass loaded config
        device=device_to_use,
        batch_size=test_batch_size,
        use_fp16=use_fp16_test    # Pass FP16 flag
    )
except Exception as e:
    print(f"Error during batch_inference: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
inference_end_time = time.time()
total_inference_time = inference_end_time - inference_start_time
num_images = len(results_list_np) if results_list_np else 0

# --- 4. Check and Save Results ---
if results_list_np:
    print(f"\nbatch_inference completed successfully ({num_images} results in {total_inference_time:.2f} seconds [inference only]).")
    
    if num_images > 0:
        time_per_image = total_inference_time / num_images
        fps = num_images / total_inference_time
        print(f"  Average time per image: {time_per_image:.3f} seconds")
        print(f"  Frames Per Second (FPS): {fps:.2f}")

    # Save all results in the batch
    os.makedirs(output_dir, exist_ok=True)
    base_fname_no_ext = os.path.splitext(image_fname)[0]
    
    for i, result_img_rgb in enumerate(results_list_np):
        print(f"  Processing result {i+1}/{len(results_list_np)}: shape={result_img_rgb.shape}, dtype={result_img_rgb.dtype}")
        
        # Generate unique filename for each result in the batch
        save_fname = f"result_docker_test_{base_fname_no_ext}_{i}.png"
        save_path = os.path.join(output_dir, save_fname)
        
        # Convert RGB back to BGR for cv2.imwrite
        result_img_bgr = cv2.cvtColor(result_img_rgb, cv2.COLOR_RGB2BGR)
        cv2.imwrite(save_path, result_img_bgr)
        print(f"    Saved result {i+1} to: {save_path}")


else:
    print("\nNo results returned from batch_inference.")

print("\n--- Docker Inference Test Script Finished ---") 