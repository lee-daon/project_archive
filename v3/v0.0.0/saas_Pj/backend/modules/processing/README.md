# Processing 모듈

## 소개

Processing 모듈은 상품 데이터 가공을 담당하는 백엔드 시스템입니다. 주요 기능으로는 브랜드 필터링, 상품 정보 번역, 이미지 번역, 상태 관리 등이 있습니다.

## 주요 기능

- **브랜드 필터링**: 상품의 브랜드명을 분석하여 금지어가 포함된 상품을 필터링
- **브랜드명 번역**: 중국어 브랜드명을 한국어로 번역
- **상품 정보 번역**: 상품 제목, 속성, 옵션 등을 번역
- **이미지 번역**: 상품 이미지 내 텍스트를 번역
- **가공 상태 관리**: 상품의 가공 진행 상태를 관리하고 모니터링
- **번역 작업 연계**: 브랜드 필터링 후 허용된 상품에 대한 번역 작업 연계

## 설치 및 설정

1. 의존성 설치:
```bash
npm install
```

2. 환경 변수 설정:
```
API_BASE_URL=http://localhost:3000
INTERNAL_API_KEY=your_internal_api_key
```

## API 엔드포인트

### 가공 작업 시작
- **URL**: `/prc/manager`
- **메소드**: `POST`
- **기능**: 상품 가공 작업을 시작하며, 옵션에 따라 브랜드 필터링 또는 번역 작업 수행

### 브랜드밴 체크 상품 조회
- **URL**: `/prc/brandbancheck`
- **메소드**: `GET`
- **기능**: 브랜드 금지어 확인이 필요한 상품 목록 조회

### 브랜드 필터링 결과 처리
- **URL**: `/prc/brandfilter`
- **메소드**: `POST`
- **기능**: 관리자가 확인한 브랜드 필터링 결과를 처리하고 후속 작업 진행

### 가공 상태 조회
- **URL**: `/prc/getstatus`
- **메소드**: `GET`
- **기능**: 상품의 가공 상태 정보 조회

### 번역 작업 요청
- **URL**: `/prc/translatedetail`
- **메소드**: `POST`
- **기능**: 상품에 대한 번역 및 가공 작업을 요청하고 작업 큐에 등록

### 번역된 이미지 수신
- **URL**: `/prc/imgtranslation`
- **메소드**: `POST`
- **기능**: 번역 서버로부터 번역된 이미지 정보를 수신하고 저장

## 사용 예시

### 1. 가공 작업 시작 요청

```javascript
// 가공 작업 시작 요청 예시
const requestBody = {
  options: {
    brandFiltering: true,
    optionTranslation: true,
    attributeTranslation: true,
    imageTranslation: {
      main: true,
      detail: true,
      option: true
    }
  },
  targets: {
    type: "commit",
    commitCode: 1
  }
};

const response = await fetch('/processing/manager', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify(requestBody)
});
```

### 2. 브랜드밴 체크 상품 조회

```javascript
// 브랜드밴 체크 상품 조회 예시
const response = await fetch('/prc/brandbancheck', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});
```

## 아키텍처

자세한 아키텍처 정보는 [ARCHTECTURE.md](./ARCHTECTURE.md) 문서를 참조하세요.

## API 문서

전체 API 명세는 [API.md](./API.md) 문서를 참조하세요.
