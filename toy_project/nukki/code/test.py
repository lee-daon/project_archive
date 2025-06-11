import asyncio
import aiohttp
import aiofiles
import os
from datetime import datetime

# API 서버 설정 - 환경변수나 설정파일에서 가져오세요
API_URL = os.getenv("API_URL", "http://localhost:8080/api/remove-background")
TOKEN = os.getenv("API_TOKEN", "your-api-token-here")
TIMEOUT = 150  # 2.5분 - Cold Start + 모델로딩 + 이미지처리 고려

async def process_image_async(session, image_path, test_name, method="header"):
    """
    비동기로 이미지 배경 제거 처리
    """
    print(f"📤 {test_name} - 요청 시작: {image_path}")
    
    if not os.path.exists(image_path):
        print(f"❌ {test_name} - 이미지 파일을 찾을 수 없습니다: {image_path}")
        return False
    
    try:
        async with aiofiles.open(image_path, "rb") as f:
            file_content = await f.read()
        
        # 요청 데이터 준비
        data = aiohttp.FormData()
        data.add_field('file', file_content, filename=os.path.basename(image_path))
        
        # 인증 방법에 따른 설정
        headers = {}
        params = {}
        
        if method == "header":
            headers["Authorization"] = f"Bearer {TOKEN}"
        elif method == "query":
            params["token"] = TOKEN
        elif method == "form":
            data.add_field('token', TOKEN)
        
        # 비동기 요청 전송
        timeout = aiohttp.ClientTimeout(total=TIMEOUT)
        async with session.post(
            API_URL, 
            data=data, 
            headers=headers, 
            params=params,
            timeout=timeout
        ) as response:
            
            if response.status == 200:
                # 성공적으로 처리된 경우
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")[:-3]
                output_filename = f"output_{method}_{timestamp}.png"
                
                content = await response.read()
                async with aiofiles.open(output_filename, "wb") as output:
                    await output.write(content)
                
                print(f"✅ {test_name} - 성공! 결과 저장: {output_filename}")
                return True
            else:
                print(f"❌ {test_name} - 실패 (상태코드: {response.status})")
                try:
                    error_text = await response.text()
                    print(f"📝 {test_name} - 응답 내용: {error_text}")
                except:
                    pass
                return False
                
    except asyncio.TimeoutError:
        print(f"❌ {test_name} - 타임아웃 ({TIMEOUT}초 초과)")
        return False
    except Exception as e:
        print(f"❌ {test_name} - 오류 발생: {str(e)}")
        return False

async def test_multiple_images_async():
    """
    비동기로 여러 이미지를 동시에 처리
    """
    print("🚀 배경 제거 API 비동기 테스트 시작")
    print(f"📍 API URL: {API_URL}")
    print(f"⏱️  타임아웃: {TIMEOUT}초")
    
    # 테스트할 이미지 파일들 입력받기
    image_paths = []
    for i in range(3):
        image_path = input(f"\n📁 테스트할 이미지 파일 {i+1} 경로를 입력해주세요: ").strip()
        if not image_path:
            print(f"❌ 이미지 파일 {i+1} 경로가 입력되지 않았습니다.")
            return
        image_paths.append(image_path)
    
    print(f"\n🔄 {len(image_paths)}장의 이미지를 동시에 처리합니다...")
    
    # 비동기 세션 생성 및 동시 요청 실행
    async with aiohttp.ClientSession() as session:
        # 각각 다른 인증 방법으로 테스트
        tasks = [
            process_image_async(session, image_paths[0], "이미지1 (Header토큰)", "header"),
            process_image_async(session, image_paths[1], "이미지2 (Query토큰)", "query"),
            process_image_async(session, image_paths[2], "이미지3 (Form토큰)", "form")
        ]
        
        # 모든 작업이 완료될 때까지 대기
        start_time = datetime.now()
        results = await asyncio.gather(*tasks, return_exceptions=True)
        end_time = datetime.now()
        
        # 결과 분석
        success_count = sum(1 for result in results if result is True)
        total_time = (end_time - start_time).total_seconds()
        
        print(f"\n📊 테스트 완료!")
        print(f"✅ 성공: {success_count}/{len(image_paths)}장")
        print(f"⏱️  총 소요시간: {total_time:.2f}초")
        
        if success_count == len(image_paths):
            print("🎉 모든 이미지 처리가 성공적으로 완료되었습니다!")
        else:
            print("⚠️  일부 이미지 처리가 실패했습니다.")

async def test_rapid_single_image():
    """
    단일 이미지로 연속 3회 빠른 테스트
    """
    print("\n🔥 단일 이미지 연속 처리 테스트")
    
    image_path = input("📁 테스트할 이미지 파일 경로를 입력해주세요: ").strip()
    if not image_path:
        print("❌ 이미지 파일 경로가 입력되지 않았습니다.")
        return
    
    print(f"🔄 같은 이미지를 3번 동시에 처리합니다...")
    
    async with aiohttp.ClientSession() as session:
        tasks = [
            process_image_async(session, image_path, f"처리{i+1}", "header")
            for i in range(3)
        ]
        
        start_time = datetime.now()
        results = await asyncio.gather(*tasks, return_exceptions=True)
        end_time = datetime.now()
        
        success_count = sum(1 for result in results if result is True)
        total_time = (end_time - start_time).total_seconds()
        
        print(f"\n📊 연속 처리 완료!")
        print(f"✅ 성공: {success_count}/3회")
        print(f"⏱️  총 소요시간: {total_time:.2f}초")

def main():
    print("🚀 비동기 배경 제거 API 테스트")
    print("1. 서로 다른 이미지 3장 동시 처리")
    print("2. 같은 이미지 3번 연속 처리")
    
    choice = input("\n선택하세요 (1 또는 2): ").strip()
    
    if choice == "1":
        asyncio.run(test_multiple_images_async())
    elif choice == "2":
        asyncio.run(test_rapid_single_image())
    else:
        print("❌ 잘못된 선택입니다.")

if __name__ == "__main__":
    main()
