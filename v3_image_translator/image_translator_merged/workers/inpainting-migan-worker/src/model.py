import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.cuda.amp import autocast
import math
import numbers
from typing import Tuple # MIGAN_Pipeline_PT 내 get_masked_bbox 에서 사용될 수 있음

# lib.model_zoo.migan_inference에서 Generator를 임포트 시도
# 이 경로는 프로젝트 루트에서 실행될 때를 기준으로 합니다.
# src 폴더 내이므로, 상대경로 또는 PYTHONPATH 설정이 필요할 수 있습니다.
try:
    # 만약 MI-GAN-main/lib/... 구조라면 아래와 같이 시도 가능
    # from ..lib.model_zoo.migan_inference import Generator as MIGAN_Generator
    # 현재는 app.py와 동일한 import 경로 유지
    from lib.model_zoo.migan_inference import Generator as MIGAN_Generator
except ImportError as e:
    print(f"Could not import MIGAN_Generator in model.py: {e}. Make sure 'lib' directory is in PYTHONPATH or accessible.")
    MIGAN_Generator = None

class GaussianSmoothing(nn.Module):
    def __init__(self, channels, kernel_size, sigma, dim=2):
        super(GaussianSmoothing, self).__init__()
        self.padding = (kernel_size - 1) // 2

        if isinstance(kernel_size, numbers.Number):
            kernel_size = [kernel_size] * dim
        if isinstance(sigma, numbers.Number):
            sigma = [sigma] * dim

        kernel = 1
        # For older PyTorch versions that do not support 'indexing'
        if hasattr(torch, 'meshgrid') and 'indexing' in torch.meshgrid.__code__.co_varnames:
            meshgrids = torch.meshgrid(
                [torch.arange(size, dtype=torch.float32) for size in kernel_size],
                indexing='ij'
            )
        else: # Fallback for PyTorch < 1.10
            meshgrids = torch.meshgrid(
                [torch.arange(size, dtype=torch.float32) for size in kernel_size]
            )
        for size, std, mgrid in zip(kernel_size, sigma, meshgrids):
            mean = (size - 1) / 2
            kernel *= 1 / (std * math.sqrt(2 * math.pi)) * \
                      torch.exp(-((mgrid - mean) / (2 * std)) ** 2)
        kernel = kernel / torch.sum(kernel)
        kernel = kernel.view(1, 1, *kernel.size())
        kernel = kernel.repeat(channels, *[1] * (kernel.dim() - 1))
        self.register_buffer('weight', kernel)
        self.groups = channels
        if dim == 1: self.conv = F.conv1d
        elif dim == 2: self.conv = F.conv2d
        elif dim == 3: self.conv = F.conv3d
        else: raise RuntimeError('Only 1, 2 and 3 dimensions are supported.')

    def forward(self, input_tensor):
        input_tensor = F.pad(input_tensor, (self.padding, self.padding, self.padding, self.padding), mode='reflect')
        return self.conv(input_tensor, weight=self.weight.to(input_tensor.dtype), groups=self.groups, padding=0)

class MIGAN_Pipeline_PT(nn.Module):
    def __init__(self, model_path, resolution, padding=128, device='cpu'):
        super().__init__()
        self.device = device
        if MIGAN_Generator is None:
            raise RuntimeError("MIGAN_Generator class could not be imported. Cannot initialize MIGAN_Pipeline_PT.")

        self.model = MIGAN_Generator(resolution=resolution)
        # Load model state dict
        try:
            self.model.load_state_dict(torch.load(model_path, map_location='cpu'))
        except FileNotFoundError:
            raise FileNotFoundError(f"Model file not found at {model_path}. Please ensure the model path is correct.")
        except Exception as e:
            raise RuntimeError(f"Error loading model state_dict: {e}")

        self.model = self.model.to(self.device)
        self.model.eval()

        self.gaussian_blur = GaussianSmoothing(channels=1, kernel_size=5, sigma=1.0, dim=2).to(self.device)
        self.res = torch.tensor(resolution, device=self.device)
        self.padding = torch.tensor(padding, device=self.device)

    def get_masked_bbox(self, mask_tensor: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor, torch.Tensor]:
        mask_tensor = mask_tensor.to(self.device)
        batch_size = mask_tensor.size(0)
        orig_h, orig_w = mask_tensor.size(2), mask_tensor.size(3)

        all_x_mins, all_x_maxs, all_y_mins, all_y_maxs = [], [], [], []

        for i in range(batch_size):
            single_mask = mask_tensor[i, 0, :, :]
            h_tensor = torch.tensor(single_mask.size(0), device=self.device, dtype=torch.int32)
            w_tensor = torch.tensor(single_mask.size(1), device=self.device, dtype=torch.int32)

            h_indices = torch.arange(0, h_tensor.item(), device=self.device, dtype=torch.int32)
            w_indices = torch.arange(0, w_tensor.item(), device=self.device, dtype=torch.int32)

            xx = single_mask.float().mean(dim=0)
            yy = single_mask.float().mean(dim=1)
            
            threshold = 254.9 / 255.0 if single_mask.max() > 1.0 else 0.99 # Handle 0-255 or 0-1 mask
            
            # If mask is 0 for hole, 1 for known (normalized)
            # We are looking for regions that are not fully known (i.e. < threshold)
            # If mask is 0 for hole, 255 for known (uint8)
            # We are looking for regions that are not fully known (i.e. < 254.9 for a 0-255 mask)
            # The original logic assumes mask_tensor passed to get_masked_bbox is uint8 [0, 255]
            # Let's assume mask_tensor (after potential resize in forward) is [0, 255] uint8
            # For mean calculation, it's converted to float.
            # So threshold should be based on 0-255 scale if mean is over that scale.
            # If mask_tensor is already float 0-1, threshold should be ~0.99.
            # Let's assume `single_mask` here is float and in [0, 1] range if it came from a normalized mask,
            # or [0, 255] if it's directly from uint8.
            # The comment `mask_batch_uint8_resized` is passed to `get_masked_bbox`
            # suggests it's uint8. So `xx` and `yy` would be in [0, 255] range.
            
            # Original code: threshold = 254.9 # For mask values 0 for masked, 255 for known
            # If mask is 0/255, mean is also in this range.
            # If mask is 0/1, mean is in this range.
            # Let's make it adaptive. If max value of single_mask > 1, assume 0-255.
            current_mask_threshold = 254.9 if single_mask.max().item() > 1.0 else (0.99 if single_mask.max().item() > 0 else 0.01)


            xx_masked_ids = w_indices[xx < current_mask_threshold]
            yy_masked_ids = h_indices[yy < current_mask_threshold]

            if xx_masked_ids.numel() == 0:
                x_min, x_max = torch.tensor(0, device=self.device), w_tensor - 1
            else:
                x_min, x_max = torch.min(xx_masked_ids), torch.max(xx_masked_ids)

            if yy_masked_ids.numel() == 0:
                y_min, y_max = torch.tensor(0, device=self.device), h_tensor - 1
            else:
                y_min, y_max = torch.min(yy_masked_ids), torch.max(yy_masked_ids)

            cnt_x = (x_min + x_max) // 2
            cnt_y = (y_min + y_max) // 2
            masked_w = x_max - x_min
            masked_h = y_max - y_min
            
            crop_size = torch.max(masked_w, masked_h)
            crop_size = crop_size + self.padding * 2
            crop_size = torch.max(crop_size, self.res)

            offset = crop_size // 2
            cur_x_min = torch.max(cnt_x - offset, torch.tensor(0, device=self.device))
            cur_x_max = torch.min(cnt_x + offset, w_tensor)
            cur_y_min = torch.max(cnt_y - offset, torch.tensor(0, device=self.device))
            cur_y_max = torch.min(cnt_y + offset, h_tensor)

            current_crop_w = cur_x_max - cur_x_min
            if current_crop_w < crop_size:
                diff = crop_size - current_crop_w
                cur_x_min = torch.max(cur_x_min - diff // 2, torch.tensor(0, device=self.device))
                cur_x_max = torch.min(cur_x_min + crop_size, w_tensor)
                cur_x_min = torch.max(cur_x_max - crop_size, torch.tensor(0, device=self.device))

            current_crop_h = cur_y_max - cur_y_min
            if current_crop_h < crop_size:
                diff = crop_size - current_crop_h
                cur_y_min = torch.max(cur_y_min - diff // 2, torch.tensor(0, device=self.device))
                cur_y_max = torch.min(cur_y_min + crop_size, h_tensor)
                cur_y_min = torch.max(cur_y_max - crop_size, torch.tensor(0, device=self.device))

            all_x_mins.append(cur_x_min.unsqueeze(0))
            all_x_maxs.append(cur_x_max.unsqueeze(0))
            all_y_mins.append(cur_y_min.unsqueeze(0))
            all_y_maxs.append(cur_y_max.unsqueeze(0))
        
        if batch_size > 0:
            return (torch.cat(all_x_mins), torch.cat(all_x_maxs), 
                    torch.cat(all_y_mins), torch.cat(all_y_maxs))
        else:
            return (torch.tensor(0, device=self.device), torch.tensor(orig_w, device=self.device), 
                    torch.tensor(0, device=self.device), torch.tensor(orig_h, device=self.device))

    def preprocess(self, image_tensor_uint8: torch.Tensor, mask_tensor_uint8: torch.Tensor) -> torch.Tensor:
        # image_tensor_uint8: (B, C, H_crop, W_crop) uint8
        # mask_tensor_uint8: (B, 1, H_crop, W_crop) uint8 (0 for hole, 255 for known)
        
        image_tensor_float = image_tensor_uint8.float() # To 0-255 float
        mask_tensor_float = mask_tensor_uint8.float()   # To 0-255 float

        resized_image = F.interpolate(image_tensor_float, size=(self.res.item(), self.res.item()), mode='bilinear', align_corners=False)
        resized_mask = F.interpolate(mask_tensor_float, size=(self.res.item(), self.res.item()), mode='nearest')

        resized_image_normalized = resized_image / 255.0 * 2.0 - 1.0 # -1 to 1
        # Mask normalized to 0 for hole, 1 for known
        resized_mask_normalized = resized_mask / 255.0 
        
        # MIGAN model input: torch.cat([mask_norm_for_model - 0.5, image_norm * mask_norm_for_blending], dim=1)
        # mask_norm_for_model: 0 means known, 1 means hole (original MIGAN paper and some impls)
        # image_norm * mask_norm_for_blending: image with known regions, holes are zeroed out.
        #                                     mask_norm_for_blending: 0 for hole, 1 for known.
        
        # Current resized_mask_normalized is 0 for hole, 1 for known.
        # For `mask - 0.5` input channel, if MIGAN expects (0 for known, 1 for hole) normalized mask,
        # then we'd need `(1.0 - resized_mask_normalized) - 0.5`.
        # However, the create_onnx_pipeline.py uses `mask - 0.5` where its `mask` is also (0 for hole, 1 for known) after /255.
        # This suggests MIGAN's first channel takes a mask where 0 (hole) becomes -0.5, and 1 (known) becomes 0.5.
        # The second part `image * mask` uses mask (0 for hole, 1 for known) to zero out holes.
        
        model_input_mask_channel = resized_mask_normalized - 0.5 # (-0.5 for hole, 0.5 for known)
        model_input_image_channel = resized_image_normalized * resized_mask_normalized # Holes zeroed out
        
        model_input = torch.cat([model_input_mask_channel, model_input_image_channel], dim=1)
        return model_input.to(self.device)

    def postprocess(self, original_cropped_image_uint8: torch.Tensor, original_cropped_mask_uint8: torch.Tensor, model_output_tensor: torch.Tensor) -> torch.Tensor:
        # original_cropped_image_uint8: (B, C, H_crop, W_crop) uint8, on device
        # original_cropped_mask_uint8: (B, 1, H_crop, W_crop) uint8, on device (0 for hole, 255 for known)
        # model_output_tensor: (B, C, self.res, self.res) float tensor from model, on device
        
        batch_size, _, orig_h, orig_w = original_cropped_image_uint8.shape

        model_output_denorm = ((model_output_tensor * 0.5 + 0.5) * 255.0).clamp(0, 255)
        output_resized_to_crop_dim = F.interpolate(model_output_denorm, size=(orig_h, orig_w), mode='bilinear', align_corners=False)

        original_cropped_image_float = original_cropped_image_uint8.float() # 0-255
        # Mask for blending: 0 for hole, 1 for known, soft.
        # original_cropped_mask_uint8 is 0 for hole, 255 for known.
        blend_mask = original_cropped_mask_uint8.float() / 255.0 # (B, 1, H_crop, W_crop), 0-1
        
        blend_mask = F.max_pool2d(blend_mask, kernel_size=3, stride=1, padding=1)
        blend_mask = self.gaussian_blur(blend_mask) # Expects (B, 1, H, W), outputs same
        
        composed_img = original_cropped_image_float * blend_mask + output_resized_to_crop_dim * (1.0 - blend_mask)
        return composed_img.clamp(0, 255).to(torch.uint8)

    def forward(self, image_batch_uint8: torch.Tensor, mask_batch_uint8: torch.Tensor) -> torch.Tensor:
        # image_batch_uint8: (B, 3, H, W) torch.uint8 Tensor
        # mask_batch_uint8: (B, 1, H, W) torch.uint8 Tensor (0 for hole, 255 for known)
        
        image_batch_uint8 = image_batch_uint8.to(self.device)
        mask_batch_uint8 = mask_batch_uint8.to(self.device)

        batch_size = image_batch_uint8.size(0)
        orig_h, orig_w = image_batch_uint8.size(2), image_batch_uint8.size(3)

        if mask_batch_uint8.size(2) != orig_h or mask_batch_uint8.size(3) != orig_w:
             # Ensure mask is float for interpolate, then back to byte
             mask_batch_uint8_resized = F.interpolate(mask_batch_uint8.float(), size=(orig_h, orig_w), mode='nearest').byte()
        else:
             mask_batch_uint8_resized = mask_batch_uint8
        
        # Pass the resized mask (still uint8, 0 for hole, 255 for known) to get_masked_bbox
        all_x_mins, all_x_maxs, all_y_mins, all_y_maxs = self.get_masked_bbox(mask_batch_uint8_resized)
        
        batch_model_input_list = []
        original_cropped_images_for_post = []
        original_cropped_masks_for_post = []

        for i in range(batch_size):
            x_min_i, x_max_i, y_min_i, y_max_i = all_x_mins[i].item(), all_x_maxs[i].item(), all_y_mins[i].item(), all_y_maxs[i].item()
            
            if x_max_i <= x_min_i or y_max_i <= y_min_i:
                # print(f"Warning: Invalid crop for batch item {i} ({x_min_i}-{x_max_i}, {y_min_i}-{y_max_i}). Using full image.")
                cropped_img_i = image_batch_uint8[i:i+1, :, :, :] 
                cropped_mask_i = mask_batch_uint8_resized[i:i+1, :, :, :] # Use resized mask
            else:
                cropped_img_i = image_batch_uint8[i:i+1, :, y_min_i:y_max_i, x_min_i:x_max_i]
                cropped_mask_i = mask_batch_uint8_resized[i:i+1, :, y_min_i:y_max_i, x_min_i:x_max_i] # Use resized mask

            original_cropped_images_for_post.append(cropped_img_i)
            original_cropped_masks_for_post.append(cropped_mask_i)
            
            # Preprocess expects uint8 inputs
            model_input_i = self.preprocess(cropped_img_i, cropped_mask_i) 
            batch_model_input_list.append(model_input_i)

        if not batch_model_input_list: # Should not happen if batch_size > 0
            return image_batch_uint8 

        final_model_input_batch = torch.cat(batch_model_input_list, dim=0)
        
        if self.device.type == 'cuda':
            with autocast():
                model_output_batch = self.model(final_model_input_batch) 
        else:
            model_output_batch = self.model(final_model_input_batch)

        final_result_batch_list = []
        for i in range(batch_size):
            # Postprocess expects uint8 inputs for original image/mask
            post_result_i = self.postprocess(
                original_cropped_images_for_post[i], 
                original_cropped_masks_for_post[i], 
                model_output_batch[i:i+1, :, :, :]
            )
            
            x_min_i, x_max_i, y_min_i, y_max_i = all_x_mins[i].item(), all_x_maxs[i].item(), all_y_mins[i].item(), all_y_maxs[i].item()
            current_image_canvas = image_batch_uint8[i].clone()
            
            if x_max_i > x_min_i and y_max_i > y_min_i:
                current_image_canvas[:, y_min_i:y_max_i, x_min_i:x_max_i] = post_result_i.squeeze(0)
            else: # Fallback was used, post_result_i is based on full image
                 current_image_canvas = post_result_i.squeeze(0) # post_result_i will be (1,C,H,W)
            final_result_batch_list.append(current_image_canvas.unsqueeze(0))

        return torch.cat(final_result_batch_list, dim=0) 