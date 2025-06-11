# 배경 제거 API

이미지에서 배경을 제거하는 API 서버입니다.

## 사용법

**API URL**: `http://localhost:8080/api/remove-background` (로컬 서버)

### Node.js 예시
```javascript
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const url = "http://localhost:8080/api/remove-background";
const token = process.env.API_TOKEN || "your-api-token-here";

async function removeBackground() {
    try {
        const form = new FormData();
        form.append('file', fs.createReadStream('input_image.jpg'));
        
        const response = await axios.post(url, form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': `Bearer ${token}`
            },
            responseType: 'arraybuffer'
        });
        
        fs.writeFileSync('output_image.png', response.data);
        console.log('배경 제거 완료!');
    } catch (error) {
        console.error('오류:', error.response?.data || error.message);
    }
}

removeBackground();
```

### curl 예시
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -F "file=@image.jpg" \
  http://localhost:8080/api/remove-background \
  --output result.png
```

**주의**: 실제 운영 시에는 환경변수를 통해 토큰을 설정하세요.