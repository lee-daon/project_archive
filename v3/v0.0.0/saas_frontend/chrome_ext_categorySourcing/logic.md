# 타오바오 스크래퍼 확장 프로그램 기술 문서

## 1. 아키텍처 개요

이 확장 프로그램은 다음과 같은 주요 구성요소로 이루어져 있습니다:

- **백그라운드 서비스 워커** (background.js): 확장 프로그램의 중앙 제어 시스템
- **콘텐츠 스크립트** (content-script.js): B 웹앱과의 통신 담당
- **팝업 인터페이스** (popup.js, popup.html): 사용자 인터페이스 관리
- **설정** (config.js): 전역 상수 및 설정 관리

## 2. 핵심 모듈 및 API

### 2.1 백그라운드 서비스 워커 (background.js)

#### 주요 기능
- 스크래핑 상태 관리
- 타오바오/티몰 페이지와 B 웹앱 간 통신 중개
- 크롤링 스크립트 실행 및 모니터링
- 진행 상황 표시 (뱃지 및 팝업 UI 업데이트)

#### 메시지 API
백그라운드 서비스 워커는 다음 메시지를 수신하고 처리합니다:

#### 주요 함수
- `handleStartScraping(data, sendResponse)`: 스크래핑 시작 처리
- `updateProgress(progressData)`: 진행 상태 업데이트
- `handleScrapingComplete(result)`: 스크래핑 완료 처리
- `handleScrapingError(errorMessage)`: 오류 처리
- `handleStopScraping(sendResponse)`: 스크래핑 중단 처리
- `resetStatus()`: 상태 초기화

### 2.2 콘텐츠 스크립트 (content-script.js)

#### 주요 기능
- B 웹앱과의 직접 통신
- 수집된 데이터를 B 웹앱으로 전송
- 웹앱 연결 상태 확인

#### 메시지 API
콘텐츠 스크립트는 다음 메시지를 수신합니다:

```javascript
// 연결 확인 요청 (백그라운드 → 콘텐츠 스크립트)
{
  action: 'checkConnection'
}

// 데이터 전송 요청 (백그라운드 → 콘텐츠 스크립트)
{
  action: 'sendProductData',
  data: Array            // 수집된 상품 데이터
}
```

또한 웹앱으로 다음 메시지를 전송합니다:

```javascript
// 웹앱으로 데이터 전송 (window.postMessage)
{
  source: 'taobao-scraper-extension',
  action: 'importProducts',
  data: Array            // 수집된 상품 데이터
}
```

#### 주요 함수
- `checkWebAppConnection()`: B 웹앱 연결 확인
- `sendDataToWebApp(products)`: B 웹앱으로 데이터 전송

### 2.3 팝업 인터페이스 (popup.js)

#### 주요 기능
- 사용자 입력 처리
- 진행 상태 표시
- 오류 및 성공 메시지 표시

#### 메시지 API
팝업은 다음 메시지를 수신합니다:

```javascript
// 진행 상태 업데이트 (백그라운드 → 팝업)
{
  action: 'progressUpdate',
  data: {
    current: Number,     // 현재 수집된 수량
    target: Number,      // 목표 수량
    percentage: Number,  // 진행률 (0-100)
    type: String         // 'pages' 또는 'products'
  }
}

// 스크래핑 성공 (백그라운드 → 팝업)
{
  action: 'scrapingSuccess',
  data: {
    productsCount: Number, // 수집된 상품 수
    pagesCount: Number     // 수집된 페이지 수
  }
}

// 스크래핑 오류 (백그라운드 → 팝업)
{
  action: 'scrapingError',
  data: {
    error: String        // 오류 메시지
  }
}
```

#### 주요 함수
- `handleStartClick()`: 시작 버튼 클릭 처리
- `handleStopClick()`: 중지 버튼 클릭 처리
- `updateProgressUI(status)`: 진행 UI 업데이트
- `showError(message)`: 오류 표시
- `showSuccess(message)`: 성공 표시

## 3. 크롤링 로직

### 3.1 페이지 처리 흐름

1. 타오바오/티몰 페이지에서 확장 프로그램 시작
2. 백그라운드 서비스 워커가 타오바오/티몰 페이지에 크롤링 스크립트 주입
3. 크롤링 스크립트는 다음 단계로 진행:
   - 페이지 스크롤하여 모든 상품 로드
   - 현재 페이지 상품 데이터 추출
   - 진행 상황 업데이트 및 백그라운드로 전송
   - 목표 달성하지 않은 경우 다음 페이지로 이동
   - 목표 달성 또는 더 이상 페이지가 없을 때까지 반복
4. 수집된 데이터를 백그라운드로 전송
5. 백그라운드에서 B 웹앱으로 데이터 전송

### 3.2 상품 데이터 추출

각 상품에서 다음 정보를 추출합니다:

```javascript
{
  id: String,            // 상품 ID
  title: String,         // 상품명
  image: String,         // 이미지 URL
  price: Number,         // 가격
  sold: String           // 판매량
}
```

### 3.3 사용자 시뮬레이션

자연스러운 크롤링을 위한 주요 기술:
- `smoothScroll()`: 부드러운 스크롤 움직임 시뮬레이션
- `sleep()`: 랜덤 지연 시간 추가
- `random()`: 무작위 값 생성을 통한 인간적 행동 시뮬레이션
- 페이지의 20%, 40%, 60%, 80% 지점으로 순차적 스크롤

### 3.4 핵심 유틸리티 함수

- `initCrawler()`: 크롤러 초기화 및 실행
- `extractProductId()`: URL이나 HTML 요소에서 상품 ID 추출
- `getFullImageUrl()`: 상대 URL을 절대 URL로 변환
- `parseProducts()`: 페이지 내 상품 요소 파싱
- `processPage()`: 페이지 스크롤 및 데이터 수집
- `goToNextPage()`: 다음 페이지로 이동

## 4. 데이터 흐름

```
[타오바오/티몰 페이지] → [크롤링 스크립트] → [백그라운드 서비스 워커] → [콘텐츠 스크립트] → [B 웹앱]
```

1. 크롤링 스크립트가 타오바오/티몰 페이지에서 데이터 추출
2. 추출된 데이터가 백그라운드 서비스 워커로 전송
3. 백그라운드 서비스 워커가 데이터를 B 웹앱 탭의 콘텐츠 스크립트로 전송
4. 콘텐츠 스크립트가 `window.postMessage()`를 사용하여 데이터를 B 웹앱으로 전송

## 5. 설정 및 상수 (config.js)

설정 파일은 다음 주요 섹션을 포함합니다:

### 5.1 URL 패턴
```javascript
urlPatterns: {
  taobao: 'taobao.com',
  tmall: 'tmall.com',
  localWebApp: 'localhost:8080',
  networkWebApp: '192.168.0.32:8080',
  sourcingCategoryPath: '/product/sourcing/category'
}
```

### 5.2 메시지 액션
```javascript
actions: {
  checkConnection: 'checkConnection',
  startScraping: 'startScraping',
  stopScraping: 'stopScraping',
  // ... 그 외 액션들
}
```

### 5.3 오류 메시지
```javascript
errorMessages: {
  alreadyRunning: '이미 실행중입니다.',
  invalidTargetCount: '유효하지 않은 목표 수입니다.',
  // ... 그 외 오류 메시지들
}
```
## 6. 문제 해결 방법

### 6.1 일반적인 오류
- **B 웹앱 연결 실패**: B 웹앱이 실행 중인지, 올바른 URL에 접속되어 있는지 확인
- **타오바오/티몰 페이지 감지 실패**: 지원되는 페이지 형식인지 확인
- **크롤링 스크립트 실행 오류**: 페이지 구조 변경 여부 확인

### 6.2 DOM 선택자 업데이트
타오바오/티몰 사이트 구조가 변경된 경우, 다음 선택자를 업데이트해야 할 수 있습니다:

```javascript
selectors = {
  productContainer: '.doubleCardWrapperAdapt--mEcC7olq',
  productId: '[id^="item_id_"]',
  productTitle: '.title--qJ7Xg_90',
  productImage: '.mainPic--Ds3X7I8z',
  productPrice: '.priceInt--yqqZMJ5a',
  productSold: '.realSales--XZJiepmt',
  nextPageButton: '.next-pagination-item.next-next'
}
```
