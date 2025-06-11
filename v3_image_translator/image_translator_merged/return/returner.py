import os
import sys
import json
import time
import logging
import asyncio
import numpy as np
from typing import Dict, Any, Optional, Tuple
import traceback
from pathlib import Path
from dotenv import load_dotenv
import cv2
from datetime import datetime

# 현재 디렉토리를 추가하여 모듈 임포트 문제 해결
current_dir = Path(__file__).parent.absolute()
sys.path.append(str(current_dir.parent))

# 코어 모듈 임포트
from core.config import REDIS_URL, HOSTING_TASKS_QUEUE
from core.redis_client import get_redis_client, initialize_redis, close_redis
from core.shm_manager import get_array_from_shm, cleanup_shm

# 환경 변수 로드
load_dotenv()

# 환경 변수 설정
OUTPUT_DIR = os.getenv('OUTPUT_DIR', './output/translated')
JPEG_QUALITY = int(os.getenv('JPEG_QUALITY', '80'))

# 로깅 설정
logging.basicConfig(level=logging.INFO,
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ImageReturner:
    """
    호스팅 큐에서 이미지를 가져와서 로컬에 파일로 저장하는 워커
    """
    
    def __init__(self):
        """초기화"""
        self.redis = get_redis_client()
        
        # 공유 메모리 객체 추적 (정리용)
        self.active_shm_objects = []
        
        # 출력 디렉토리 설정
        self.output_dir = Path(OUTPUT_DIR)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # 결과 저장을 위한 JSON 파일 경로
        self.results_file = self.output_dir / 'results.json'
        
        logger.info(f"ImageReturner 초기화 완료 - 출력 디렉토리: {self.output_dir}")
    
    async def _get_image_from_shm(self, shm_info: Dict[str, Any]) -> Tuple[Optional[np.ndarray], str]:
        """
        공유 메모리에서 이미지 로드
        
        Args:
            shm_info: 공유 메모리 정보 (shm_name, shape, dtype, size 포함)
            
        Returns:
            (이미지 배열, 오류 메시지) 튜플
        """
        try:
            if isinstance(shm_info, str):
                # 과거 버전 호환성을 위해 문자열(shm_name)만 받는 경우 처리
                logger.warning(f"Received string instead of shm_info dictionary: {shm_info}. Using default values.")
                shm_info = {
                    'shm_name': shm_info,
                    'shape': [1024, 1024, 3],  # 기본 해상도
                    'dtype': 'uint8',
                    'size': 1024 * 1024 * 3
                }
            
            # 필수 필드 확인
            if not shm_info.get('shm_name'):
                raise ValueError("Missing 'shm_name' in shm_info")
                
            # 공유 메모리에서 배열 가져오기 (get_array_from_shm는 shape/dtype/size 정보 필요)
            img_array, existing_shm = get_array_from_shm(shm_info)
            
            # 정리를 위해 목록에 추가
            self.active_shm_objects.append(existing_shm)
            
            # 배열 복사본 반환
            return img_array.copy(), ""
            
        except Exception as e:
            shm_name = shm_info.get('shm_name', 'unknown') if isinstance(shm_info, dict) else str(shm_info)
            error_msg = f"공유 메모리 {shm_name}에서 이미지 로드 중 오류: {str(e)}"
            logger.error(error_msg, exc_info=True)
            return None, error_msg
    
    async def _cleanup_shm_resources(self):
        """공유 메모리 자원 정리"""
        for shm in self.active_shm_objects:
            try:
                shm.close()
            except Exception as e:
                logger.warning(f"공유 메모리 객체 닫기 중 오류: {str(e)}")
        
        # 목록 비우기
        self.active_shm_objects.clear()
    
    async def _save_image_to_file(self, image_array: np.ndarray, image_id: str) -> Tuple[bool, str]:
        """
        이미지를 로컬 파일로 저장
        
        Args:
            image_array: 저장할 이미지 배열
            image_id: 이미지 ID
            
        Returns:
            (성공 여부, 파일 경로 또는 오류 메시지) 튜플
        """
        try:
            # 파일명 생성 (timestamp 포함)
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{image_id}_{timestamp}.jpg"
            file_path = self.output_dir / filename
            
            # 파이프라인에서 전달되는 이미지는 이미 BGR 형식이므로 변환하지 않음
            # (OpenCV로 처리된 이미지는 BGR 순서를 유지)
            image_bgr = image_array
            
            # 파일로 저장
            success = cv2.imwrite(
                str(file_path),
                image_bgr,
                [cv2.IMWRITE_JPEG_QUALITY, JPEG_QUALITY]
            )
            
            if success:
                logger.info(f"이미지 저장 완료: {file_path}")
                return True, str(file_path)
            else:
                error_msg = f"이미지 저장 실패: {file_path}"
                logger.error(error_msg)
                return False, error_msg
                
        except Exception as e:
            error_msg = f"이미지 저장 중 오류: {str(e)}"
            logger.error(error_msg, exc_info=True)
            return False, error_msg
    
    async def _save_result_to_json(self, image_id: str, file_path: str, request_id: str):
        """
        결과를 JSON 파일에 저장
        
        Args:
            image_id: 이미지 ID
            file_path: 저장된 파일 경로
            request_id: 요청 ID
        """
        try:
            # 기존 결과 로드
            results = []
            if self.results_file.exists():
                with open(self.results_file, 'r', encoding='utf-8') as f:
                    results = json.load(f)
            
            # 새 결과 추가
            new_result = {
                "timestamp": datetime.now().isoformat(),
                "request_id": request_id,
                "image_id": image_id,
                "file_path": file_path,
                "status": "completed"
            }
            results.append(new_result)
            
            # 결과 저장
            with open(self.results_file, 'w', encoding='utf-8') as f:
                json.dump(results, f, ensure_ascii=False, indent=2)
                
            logger.info(f"결과 JSON에 저장됨: {image_id}")
            
        except Exception as e:
            logger.error(f"결과 JSON 저장 중 오류: {str(e)}", exc_info=True)
    
    async def process_hosting_task(self, task_data: Dict[str, Any]):
        """
        호스팅 작업 처리 (로컬 파일 저장)
        
        Args:
            task_data: 호스팅 작업 데이터
        """
        request_id = task_data.get("request_id", "unknown")
        image_id = task_data.get("image_id", "unknown")
        shm_info = task_data.get("shm_info")  # 전체 shm_info 객체
        
        # 로그 메시지 수정
        shm_name = shm_info.get('shm_name') if isinstance(shm_info, dict) else None
        logger.info(f"[{request_id}] 파일 저장 작업 시작 (이미지: {image_id}, SHM: {shm_name})")
        
        try:
            # 필수 데이터 확인
            if not all([request_id != "unknown", image_id != "unknown", shm_info]):
                logger.error(f"[{request_id}] 필수 작업 데이터 누락: {task_data}")
                return
            
            # 공유 메모리에서 이미지 로드 (전체 shm_info 전달)
            image_array, error = await self._get_image_from_shm(shm_info)
            if image_array is None:
                logger.error(f"[{request_id}] 이미지 로드 실패: {error}")
                return
                
            # 이미지를 로컬 파일로 저장
            success, result = await self._save_image_to_file(image_array, image_id)
            
            # 저장 성공 확인
            if not success:
                logger.error(f"[{request_id}] 이미지 저장 실패: {result}")
                return
                
            # 결과를 JSON 파일에 저장
            file_path = result
            await self._save_result_to_json(image_id, file_path, request_id)
            
            logger.info(f"[{request_id}] 파일 저장 완료: {image_id} -> {file_path}")
                
        except Exception as e:
            logger.error(f"[{request_id}] 파일 저장 작업 처리 중 오류: {str(e)}", exc_info=True)
            
        finally:
            # 공유 메모리 리소스 정리
            await self._cleanup_shm_resources()
            
            # SHM 이름으로 unlink 호출 (필요시)
            try:
                if shm_name:
                    cleanup_shm(shm_name)
            except Exception as unlink_e:
                logger.error(f"[{request_id}] SHM unlink 오류 {shm_name}: {unlink_e}")
    
    async def start_worker(self, poll_interval: float = 1.0):
        """
        파일 저장 워커 시작
        
        Args:
            poll_interval: 큐 폴링 간격 (초)
        """
        logger.info(f"이미지 파일 저장 워커 시작 (큐: {HOSTING_TASKS_QUEUE})")
        
        while True:
            try:
                # 큐에서 작업 가져오기
                task = await self.redis.blpop(HOSTING_TASKS_QUEUE, timeout=int(poll_interval))
                
                if task:
                    queue_name_bytes, task_data_bytes = task
                    try:
                        task_data = json.loads(task_data_bytes.decode('utf-8'))
                        # 작업 처리 (작업마다 새 태스크 생성)
                        asyncio.create_task(self.process_hosting_task(task_data))
                    except json.JSONDecodeError as e:
                        logger.error(f"작업 데이터 디코딩 오류: {task_data_bytes}. 오류: {e}")
                    except Exception as proc_e:
                        logger.error(f"작업 처리 중 오류: {proc_e}", exc_info=True)
                
            except asyncio.CancelledError:
                logger.info("워커 태스크 취소됨")
                break
            except Exception as e:
                logger.error(f"작업 처리 루프 중 오류: {str(e)}", exc_info=True)
                await asyncio.sleep(poll_interval)
        
        logger.info("이미지 파일 저장 워커 종료")

async def main():
    """메인 함수"""
    # Redis 초기화
    await initialize_redis()
    
    worker_task = None
    
    try:
        # 워커 초기화 및 시작
        returner = ImageReturner()
        worker_task = asyncio.create_task(returner.start_worker())
        
        # 워커 태스크 완료 대기
        await worker_task
        
    except asyncio.CancelledError:
        logger.info("메인 태스크 취소됨")
    except KeyboardInterrupt:
        logger.info("KeyboardInterrupt 수신, 워커 종료 중...")
    except Exception as e:
        logger.error(f"프로그램 실행 중 오류: {str(e)}", exc_info=True)
    finally:
        # 워커 태스크 취소
        if worker_task and not worker_task.done():
            logger.info("워커 태스크 취소 중...")
            worker_task.cancel()
            
            try:
                await worker_task
            except asyncio.CancelledError:
                pass
        
        # Redis 연결 종료
        await close_redis()
        logger.info("Redis 연결 종료. 프로그램 종료.")

if __name__ == "__main__":
    asyncio.run(main())
