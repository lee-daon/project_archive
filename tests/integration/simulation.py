import asyncio
import aiohttp
import os
import glob
import argparse
import random

# 기본 설정값
DEFAULT_API_URL = "http://localhost:8000/translate"
DEFAULT_IMAGE_EXTENSIONS = ['*.jpg', '*.png'] # 지원할 이미지 확장자 리스트

async def send_image(session, url, image_path):
    """지정된 URL로 이미지 파일을 비동기적으로 전송합니다."""
    try:
        # 파일 확장자를 기반으로 content_type 결정 (예: image/jpeg, image/png)
        ext = os.path.splitext(image_path)[1][1:].lower()
        content_type = f"image/{ext}"
        if ext == 'jpg':
            content_type = 'image/jpeg' # MIME 타입 표준 준수

        with open(image_path, 'rb') as f:
            data = aiohttp.FormData()
            # 'file' 필드 이름은 API 서버의 구현과 일치해야 합니다.
            data.add_field('file', f, filename=os.path.basename(image_path), content_type=content_type)
            # 추가 필드: is_long (무작위 boolean), imgid (파일명)
            data.add_field('is_long', str(random.choice([True, False]))) # 문자열로 전송
            data.add_field('imgid', os.path.basename(image_path))

            async with session.post(url, data=data) as response:
                response_text = await response.text()
                print(f"보냄: {os.path.basename(image_path)}, 응답 상태: {response.status}, 응답 내용: {response_text[:100]}...") # 응답 내용 일부만 출력
                response.raise_for_status() # 오류 발생 시 예외 발생
                return await response.json() # JSON 응답 처리
    except aiohttp.ClientError as e:
        print(f"오류 발생 ({os.path.basename(image_path)}): {e}")
        return None
    except FileNotFoundError:
        print(f"오류: 파일을 찾을 수 없습니다 - {image_path}")
        return None
    except Exception as e:
        print(f"예상치 못한 오류 발생 ({os.path.basename(image_path)}): {e}")
        return None


async def main(api_url, image_dir, image_extensions):
    """지정된 디렉토리의 지정된 확장자 이미지들을 API로 비동기 전송합니다."""
    image_paths = []
    for ext_pattern in image_extensions:
        image_paths.extend(glob.glob(os.path.join(image_dir, ext_pattern)))

    if not image_paths:
        print(f"오류: '{image_dir}' 디렉토리에서 지원하는 이미지 ({image_extensions})를 찾을 수 없습니다.")
        return

    # rate limit 등을 고려하여 동시 요청 수 제한 (예: 10개)
    connector = aiohttp.TCPConnector(limit_per_host=10)
    async with aiohttp.ClientSession(connector=connector) as session:
        tasks = [send_image(session, api_url, img_path) for img_path in image_paths]
        results = await asyncio.gather(*tasks)
        print("\n--- 모든 요청 완료 ---")
        successful_requests = sum(1 for r in results if r is not None)
        print(f"총 {len(image_paths)}개 이미지 중 {successful_requests}개 요청 성공")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="API 서버로 이미지 전송 시뮬레이션")
    parser.add_argument("--url", default=DEFAULT_API_URL, help="API 엔드포인트 URL") # 상단 변수 사용
    # 이미지 디렉토리를 스크립트 위치 기준으로 상대 경로 설정
    script_dir = os.path.dirname(os.path.abspath(__file__))
    default_image_dir = os.path.abspath(os.path.join(script_dir, '..', '..', 'images')) # workspace/images
    parser.add_argument("--image_dir", default=default_image_dir, help="이미지 파일이 있는 디렉토리 경로")
    parser.add_argument("--ext", nargs='+', default=DEFAULT_IMAGE_EXTENSIONS, help="처리할 이미지 확장자 패턴 리스트 (예: *.jpg *.png)") # 확장자 인자 추가

    args = parser.parse_args()

    # 이벤트 루프 정책 설정 (Windows 환경에서 ProactorEventLoop 사용 권장)
    if os.name == 'nt':
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

    asyncio.run(main(args.url, args.image_dir, args.ext)) # 확장자 리스트 전달
