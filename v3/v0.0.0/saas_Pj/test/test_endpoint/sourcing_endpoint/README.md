# API 테스트 도구

이 폴더에는 백엔드 API를 테스트하기 위한 도구가 포함되어 있습니다.

## 파일 설명

- `apitest.html`: API 테스트를 위한 웹 인터페이스
- `testdata.js`: 테스트에 사용되는 샘플 데이터

## 테스트 방법

1. 백엔드 서버가 실행 중인지 확인하세요.
   ```
   node backend/server.js
   ```

2. Redis 서버가 실행 중인지 확인하세요.

3. 타오바오 상세 정보 워커가 실행 중인지 확인하세요.
   ```
   node backend/worker/taobaodetail/taobaoworker.js
   ```

4. 브라우저에서 `apitest.html` 파일을 열어주세요. 로컬 서버를 사용한다면:
   ```
   # 예시 - http-server를 사용하는 경우
   npx http-server backend/test
   ```

5. 웹 인터페이스에서 테스트하려는 사용자 ID를 입력하세요.

6. 각 API 테스트 버튼을 클릭하여 테스트를 실행하세요:
   - "상품 업로드 테스트" 버튼: `/src/upload` API 호출
   - "상세 정보 파싱 테스트" 버튼: `/src/detailparselist` API 호출

7. 테스트 결과는 각 섹션의 결과 영역에 표시됩니다.

## API 설명

### 1. 상품 업로드 API (`/src/upload`)

상품 목록을 서버에 업로드하여 처리하는 API입니다.

#### 요청 형식:
```
POST /src/upload?userid={userid}
Content-Type: application/json

[
  {
    "productId": "718614821378",
    "productName": "상품명",
    "pic": "이미지 URL",
    "price": 28.8,
    "sales": "2000+",
    "detail_url": "상품 URL"
  },
  ...
]
```

### 2. 상품 상세 정보 파싱 API (`/src/detailparselist`)

상품 상세 정보 파싱을 큐에 등록하는 API입니다.

#### 요청 형식:
```
POST /src/detailparselist?userid={userid}
Content-Type: application/json

[
  {
    "productId": "718614821378",
    "productName": "상품명"
  },
  ...
]
```

## 주의사항

1. 테스트 전 백엔드 서버와 Redis 서버가 모두 실행 중이어야 합니다.
2. 타오바오 API 호출에는 제한이 있을 수 있으므로, 대량의 테스트는 자제해주세요.
3. `userid` 파라미터는 필수이며, 데이터베이스에 존재하는 유효한 사용자 ID를 사용해야 합니다.
4. 테스트 데이터의 상품 ID는 실제 타오바오에 존재하는 ID여야 API 호출이 성공합니다. 