# Cloudflare Worker 이미지 처리 API

## 시스템 개요

외부 이미지 URL을 다운로드하고 R2에 저장하는 Cloudflare Worker

### 핵심 기능
- 🌍 **IP 분산**: 차단 우회를 위한 Cloudflare Workers 활용
- 🚀 **스마트 저장**: JPG/PNG는 R2에 직접 저장 후 URL 반환, WebP 등 기타 형식은 바이너리 스트리밍

## API 엔드포인트

### POST / (이미지 다운로드 및 저장)
외부 URL에서 이미지를 가져옵니다.
- **JPG/PNG**: 이미지를 R2에 저장하고 저장된 URL 정보를 JSON으로 반환합니다.
- **WebP 등 기타 형식**: 이미지 바이너리를 직접 반환합니다.

#### 요청
```bash
curl -X POST https://imgdown.loopton.com/ \
  -H "Content-Type: application/json" \
  -H "X-Auth-Key: your-secret-key" \
  -d '{"url": "https://img.alicdn.com/example.jpg"}'
```

#### 응답 (JPG/PNG의 경우)
- **JSON 데이터**
```json
{
  "success": true,
  "hostedUrl": "https://image.loopton.com/raw_image/2025-01/15/image_1703123456_abc123.jpg",
  "fileName": "raw_image/2025-01/15/image_1703123456_abc123.jpg"
}
```

#### 응답 (WebP 등 기타 형식의 경우)
- **바이너리 데이터** (이미지 파일)
- **헤더 정보**:
  ```
  Content-Type: image/webp
  X-Original-URL: https://img.alicdn.com/example.jpg
  X-Final-URL: https://img.alicdn.com/example.jpg_.webp
  ```

### POST /jpg (JPG 저장)
JPG 바이너리 데이터를 R2에 저장

#### 요청
```bash
curl -X POST https://imgdown.loopton.com/jpg \
  -H "Content-Type: image/jpeg" \
  -H "X-Auth-Key: your-secret-key" \
  --data-binary @image.jpg
```

#### 응답
```json
{
  "success": true,
  "hostedUrl": "https://image.loopton.com/raw_image/2025-01/15/image_1703123456_abc123.jpg",
  "fileName": "raw_image/2025-01/15/image_1703123456_abc123.jpg"
}
```




