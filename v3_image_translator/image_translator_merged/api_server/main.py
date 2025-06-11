from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
import uvicorn
import uuid
import logging
from typing import Optional
from contextlib import asynccontextmanager

# 모듈 임포트 (경로 수정 및 추가)
from modules.request_handler import process_translate_request # 절대 경로로 수정
from core.redis_client import initialize_redis, close_redis # core에서는 초기화/종료만 사용
from core.shm_manager import cleanup_all_managed_shms
from core.config import API_HOST, API_PORT, LOG_LEVEL

# 로깅 설정
logging.basicConfig(level=LOG_LEVEL)
logger = logging.getLogger(__name__)

# 지원되는 이미지 포맷과 최대 파일 크기 설정
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

# Lifespan 이벤트 핸들러 정의
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 애플리케이션 시작 시 실행
    logger.info("Application startup...")
    await initialize_redis()
    # 여기에 다른 시작 작업 추가 가능 (예: 모델 로딩)
    yield
    # 애플리케이션 종료 시 실행
    logger.info("Application shutdown...")
    await close_redis()
    cleanup_all_managed_shms()
    logger.info("Cleanup finished.")

# FastAPI 앱 인스턴스 생성 시 lifespan 전달
app = FastAPI(title="Image Translation API Server", lifespan=lifespan)

@app.post("/translate")
async def translate_image(
    file: UploadFile = File(..., description="업로드할 이미지 파일"),
    is_long: bool = Form(False, description="긴 텍스트 이미지 여부"),
    imgid: Optional[str] = Form(None, description="이미지 원본 식별자")
):
    """이미지 번역 요청 처리 엔드포인트"""
    
    # 1. Content-Type 검증
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400, 
            detail=f"지원되지 않는 파일 형식입니다. 지원 형식: {', '.join(ALLOWED_IMAGE_TYPES)}"
        )
    
    # 2. 파일 확장자 검증 (추가 보안)
    if file.filename:
        file_ext = "." + file.filename.split(".")[-1].lower() if "." in file.filename else ""
        if file_ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"지원되지 않는 파일 확장자입니다. 지원 확장자: {', '.join(ALLOWED_EXTENSIONS)}"
            )
    
    # 3. 파일 크기 사전 검증 (가능한 경우)
    if hasattr(file, 'size') and file.size and file.size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"파일 크기가 너무 큽니다. 최대 크기: {MAX_FILE_SIZE // (1024*1024)}MB"
        )

    # imgid가 제공되지 않으면 파일 이름 사용
    image_id = imgid if imgid else file.filename
    request_id = str(uuid.uuid4())

    try:
        # 파일 내용을 읽으면서 크기 추가 검증
        image_bytes = await file.read()
        if len(image_bytes) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"파일 크기가 너무 큽니다. 최대 크기: {MAX_FILE_SIZE // (1024*1024)}MB"
            )
        
        if len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="빈 파일입니다.")

        # 실제 처리 로직은 request_handler 모듈로 분리
        await process_translate_request(
            request_id=request_id,
            image_bytes=image_bytes,
            image_id=image_id,
            is_long=is_long,
            original_filename=file.filename
        )

        # 작업 요청 성공 시 request_id 반환 (202 Accepted)
        return JSONResponse(
            status_code=202,
            content={
                "message": "번역 요청이 접수되었습니다. 처리 완료 시 webhook으로 결과가 전송됩니다.",
                "request_id": request_id,
                "accepted_file": {
                    "filename": file.filename,
                    "content_type": file.content_type,
                    "size": len(image_bytes)
                }
            }
        )

    except HTTPException:
        # HTTPException은 다시 발생시켜 FastAPI가 처리하도록 함
        raise
    except Exception as e:
        logger.error(f"Error processing request {request_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"요청 처리 중 오류 발생: {e}")

if __name__ == "__main__":
    # 개발 환경에서는 uvicorn 직접 실행, 프로덕션에서는 gunicorn 등 사용
    uvicorn.run("main:app", host=API_HOST, port=API_PORT, reload=True) # reload=True 개발 시 유용
