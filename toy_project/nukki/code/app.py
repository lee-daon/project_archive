from flask import Flask, request, send_file, jsonify
from rembg import remove
from PIL import Image
from io import BytesIO
import os

app = Flask(__name__)

# 토큰 설정 - 환경변수에서 가져오세요
VALID_TOKEN = os.getenv("API_TOKEN", "your-secure-token-here")

def validate_token():
    """
    요청에서 토큰을 검증합니다.
    헤더의 Authorization 또는 쿼리 파라미터의 token을 확인합니다.
    """
    # Authorization 헤더에서 토큰 확인
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        if token == VALID_TOKEN:
            return True
    
    # 쿼리 파라미터에서 토큰 확인
    token = request.args.get('token')
    if token == VALID_TOKEN:
        return True
    
    # POST 요청의 form data에서 토큰 확인
    token = request.form.get('token')
    if token == VALID_TOKEN:
        return True
    
    return False

def remove_background(input_image):
    """
    입력 이미지에서 배경을 제거하고 흰색 배경으로 교체합니다.
    
    Args:
        input_image: PIL Image 객체
        
    Returns:
        BytesIO: 배경이 제거된 PNG 이미지의 바이트 스트림
    """
    try:
        # 배경 제거 처리 (흰색 배경 고정)
        output_image = remove(
            input_image,
            bgcolor=(255, 255, 255, 255),  # 흰색 배경 고정
            post_process_mask=True
        )
        
        # BytesIO 스트림으로 변환
        img_io = BytesIO()
        output_image.save(img_io, 'PNG')
        img_io.seek(0)
        
        return img_io
    except Exception as e:
        raise Exception(f"이미지 처리 중 오류가 발생했습니다: {str(e)}")

def validate_image_file(file):
    """
    업로드된 파일이 유효한 이미지인지 확인합니다.
    
    Args:
        file: Flask request.files 객체
        
    Returns:
        PIL.Image: 유효한 경우 PIL Image 객체
        
    Raises:
        ValueError: 유효하지 않은 파일인 경우
    """
    if not file or file.filename == '':
        raise ValueError("파일이 선택되지 않았습니다.")
    
    try:
        image = Image.open(file.stream)
        return image
    except Exception as e:
        raise ValueError(f"유효하지 않은 이미지 파일입니다: {str(e)}")

@app.route('/api/remove-background', methods=['POST'])
def remove_background_api():
    """
    이미지 배경 제거 API
    토큰 검증 후 이미지 배경을 제거하고 흰색 배경으로 교체하여 반환합니다.
    """
    # 토큰 검증
    if not validate_token():
        return jsonify({
            'error': '유효하지 않은 토큰입니다.',
            'code': 'INVALID_TOKEN'
        }), 401
    
    # 파일 확인
    if 'file' not in request.files:
        return jsonify({
            'error': '파일이 업로드되지 않았습니다.',
            'code': 'NO_FILE'
        }), 400
    
    file = request.files['file']
    
    try:
        # 이미지 유효성 검사
        input_image = validate_image_file(file)
        
        # 배경 제거 처리
        output_stream = remove_background(input_image)
        
        # 처리된 이미지 반환
        return send_file(
            output_stream, 
            mimetype='image/png',
            as_attachment=True,
            download_name='removed_background.png'
        )
        
    except ValueError as e:
        return jsonify({
            'error': str(e),
            'code': 'VALIDATION_ERROR'
        }), 400
    except Exception as e:
        return jsonify({
            'error': str(e),
            'code': 'PROCESSING_ERROR'
        }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'error': '요청하신 엔드포인트를 찾을 수 없습니다.',
        'code': 'NOT_FOUND'
    }), 404

@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({
        'error': '허용되지 않은 HTTP 메서드입니다.',
        'code': 'METHOD_NOT_ALLOWED'
    }), 405

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', debug=False, port=port)