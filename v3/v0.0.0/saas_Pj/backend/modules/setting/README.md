# Setting Module

SaaS 플랫폼의 사용자 설정 관리를 담당하는 모듈입니다.

## 개요

Setting 모듈은 사용자의 다양한 설정을 관리하는 기능을 제공합니다:
- 공통 정책 설정 (마진, 환율, 수수료 등)
- 네이버 등록 설정 (배송, A/S, 포인트 등)
- 쿠팡 정책 설정 (배송, A/S, 옵션 등)
- 11번가 정책 설정 (해외사이즈, 관부과세, 포인트 등)
- 마켓 계정 관리 (네이버, 쿠팡)
- 사용자 금지어 설정 (개별 금지어 관리)
- 판매자 차단 관리 (상품별 판매자/쇼핑몰 차단)
- 쿠팡 배송지 조회 (출고지/반품지 정보)
- 네이버 주소록 조회 (계정 주소록 정보)
- 11번가 주소 조회 (출고지/반품지 정보)
- 상세페이지 설정 (상품 상세페이지 이미지 및 표시 옵션)
- 기타 설정 (심층 벤 사용여부, 키워드 뛰어쓰기 허용여부, 마켓별 상품개수 관리)

## 주요 기능

### 1. 공통 정책 설정 (Common Policy)
- 최소 마진 및 마진 퍼센트 설정
- 구매 수수료, 수입 관세/부가세 설정
- 환율 설정 (중국, 미국)
- 할인 퍼센트 범위 설정

### 2. 네이버 정책 설정 (Naver Policy)
- 배송업체 및 A/S 정보 설정
- 포인트 및 캐시백 설정
- 리뷰 포인트 설정
- 가격 설정 로직 선택

### 3. 마켓 설정 (Market Setting)
- 네이버/쿠팡 마켓 계정 관리
- 마켓별 SKU 제한 설정
- 네이버 클라이언트 정보 관리 (민감정보 마스킹)

### 4. 사용자 금지어 설정 (Ban Words)
- 개별 사용자 금지어 관리
- 쉼표로 구분된 금지어 목록 저장
- 캐시를 통한 성능 최적화

### 5. 판매자 차단 관리 (Ban Seller)
- 상품 ID를 통한 판매자/쇼핑몰 차단
- 차단된 판매자의 모든 상품 자동 차단
- 트랜잭션 처리를 통한 데이터 일관성 보장
- 사용자별 차단 목록 관리
- ban_seller, ban_shop, status 테이블 연동 처리

### 6. 쿠팡 정책 설정 (Coupang Policy)
- 배송업체 코드 및 A/S 정보 설정
- 무료배송, 옵션 개수, 반품 배송비 설정
- 수입 관세 포함 여부 설정

### 7. 11번가 정책 설정 (ElevenStore Policy)
- 해외사이즈 조견표 노출여부 설정
- 관부과세 및 배송비 포함 여부 설정
- 11번가 포인트 적립 금액 설정
- 옵션 배열 로직 선택 (가장 많은 상품/최저가)
- 반품/교환비용 및 A/S 안내 설정

### 8. 쿠팡 배송지 조회 (Coupang Shipping)
- 출고지 및 반품지 정보 조회
- 사용 가능한 배송지만 필터링
- 쿠팡 API 연동을 통한 실시간 조회

### 9. 네이버 주소록 조회 (Naver Address Book)
- 네이버 계정 주소록 정보 조회
- 전자서명 기반 인증
- 페이징 지원으로 대량 주소록 처리

### 10. 11번가 주소 조회 (ElevenStore Address)
- 11번가 출고지 및 반품/교환지 정보 조회
- euc-kr 인코딩 처리를 통한 한글 지원
- XML 응답을 JSON으로 파싱
- addrSeq 값을 11번가 마켓 설정에서 활용

### 11. 상세페이지 설정 (Detail Page)
- 상품 상세페이지 상단/하단 이미지 관리 (각각 3개까지)
- 속성(Properties) 및 옵션(Options) 표시 여부 설정
- 이미지 업로드/수정/삭제 지원
- Cloudflare R2를 통한 이미지 호스팅
- 이미지 유효성 검증 (JPG, JPEG, PNG, GIF, WEBP, 5MB 이하)

### 12. 기타 설정 (Extra Setting)
- 심층 벤 사용여부 설정 (0: 미사용, 1: 사용)
- 키워드 뛰어쓰기 허용여부 설정 (0: 비허용, 1: 허용)
- 마켓별 계정 목록 조회 (네이버, 쿠팡, 11번가)
- 마켓별 등록된 상품개수 조회 및 수정
- JWT 토큰 기반 인증으로 사용자별 데이터 격리
- 자동 기본값 설정 (설정이 없는 경우)

## API 엔드포인트

### 기본 경로
```
/setting
```

### 하위 경로
- `/commonpolicy` - 공통 정책 설정
- `/naverpolicy` - 네이버 정책 설정
- `/coopangpolicy` - 쿠팡 정책 설정
- `/elevenstorepolicy` - 11번가 정책 설정
- `/marketsetting` - 마켓 계정 설정
- `/banwords` - 사용자 금지어 설정
- `/ban-seller` - 판매자 차단 관리
- `/coupang-shipping` - 쿠팡 배송지 조회
- `/naver-address-book` - 네이버 주소록 조회
- `/elevenstore-address` - 11번가 주소 조회
- `/detail-page` - 상세페이지 설정
- `/extra` - 기타 설정 (심층 벤, 키워드 뛰어쓰기, 마켓별 상품개수)

## 설치 및 설정

### 필요한 의존성
```javascript
import express from 'express';
import multer from 'multer';
import { parseStringPromise } from 'xml2js';
import iconv from 'iconv-lite';
import { promisePool } from '../../../common/utils/connectDB.js';
import { uploadImageFromBuffer } from '../../../common/utils/img_hosting.js';
```

### 새로 추가된 의존성 (v1.1.0)
```javascript
import { getMarketNumbers, getProductCount, updateProductCount } from '../repository/countCorrect.js';
import { getExtraSettings, saveExtraSettings } from '../repository/extraSetting.js';
```

### 데이터베이스 테이블
- `common_setting` - 공통 설정
- `naver_register_config` - 네이버 등록 설정
- `naver_account_info` - 네이버 계정 정보
- `coopang_account_info` - 쿠팡 계정 정보
- `elevenstore_account_info` - 11번가 계정 정보
- `extra_setting` - 기타 설정 (사용자 금지어, 심층 벤, 키워드 뛰어쓰기)
- `coopang_setting` - 쿠팡 정책 설정
- `elevenstore_setting` - 11번가 정책 설정
- `ban_seller` - 판매자 차단 정보
- `ban_shop` - 쇼핑몰 차단 정보
- `status` - 상품별 차단 상태 관리

## 사용 예시

### 공통 설정 조회
```javascript
GET /setting/commonpolicy/
Authorization: Bearer {token}
```

### 네이버 마켓 생성
```javascript
POST /setting/marketsetting/?market=naver
Content-Type: application/json
Authorization: Bearer {token}

{
  "naver_market_number": 12345,
  "naver_market_memo": "메인 스토어",
  "naver_maximun_sku_count": 1000
}
```

### 사용자 금지어 설정
```javascript
PUT /setting/banwords
Content-Type: application/json

{
  "userid": 123,
  "bannedWords": "금지어1, 금지어2, 금지어3"
}
```

### 판매자 차단
```javascript
POST /setting/ban-seller/
Content-Type: application/json
Authorization: Bearer {token}

{
  "product_id": "1234567890"
}
```

### 11번가 정책 설정
```javascript
PUT /setting/elevenstorepolicy/
Content-Type: application/json
Authorization: Bearer {token}

{
  "overseas_size_chart_display": false,
  "include_import_duty": true,
  "include_delivery_fee": true,
  "elevenstore_point_amount": 1000,
  "option_array_logic": "most_products",
  "return_cost": 5000,
  "exchange_cost": 5000,
  "as_guide": "문의사항이 있으시면 고객센터로 연락주세요.",
  "return_exchange_guide": "상품 수령 후 7일 이내 반품/교환이 가능합니다."
}
```

### 쿠팡 배송지 조회
```javascript
POST /setting/coupang-shipping/places
Content-Type: application/json

{
  "accessKey": "your_access_key",
  "secretKey": "your_secret_key",
  "vendorId": "your_vendor_id"
}
```

### 네이버 주소록 조회
```javascript
POST /setting/naver-address-book
Content-Type: application/json

{
  "client_id": "naver_client_id",
  "client_secret": "naver_client_secret"
}
```

### 11번가 주소 조회
```javascript
POST /setting/elevenstore-address/
Content-Type: application/json
Authorization: Bearer {token}

{
  "apiKey": "your-11st-api-key"
}
```

### 상세페이지 이미지 설정
```javascript
POST /setting/detail-page
Content-Type: multipart/form-data
Authorization: Bearer {token}

FormData:
- include_properties: 1
- include_options: 0
- top_images[0]: (이미지 파일)
- bottom_images[1]: (이미지 파일)
- changed_images: {"top_changed":[0],"bottom_changed":[1],"top_deleted":[],"bottom_deleted":[2]}
```

### 기타 설정 조회
```javascript
GET /setting/extra/
Authorization: Bearer {token}
```

### 기타 설정 업데이트
```javascript
PUT /setting/extra/
Content-Type: application/json
Authorization: Bearer {token}

{
  "use_deep_ban": 1,
  "allow_keyword_spacing": 0
}
```

### 마켓번호 목록 조회
```javascript
GET /setting/extra/market-numbers/?market=naver
Authorization: Bearer {token}
```

### 상품개수 조회
```javascript
GET /setting/extra/product-count/?market=naver&market_number=1
Authorization: Bearer {token}
```

### 상품개수 수정
```javascript
PUT /setting/extra/product-count/
Content-Type: application/json
Authorization: Bearer {token}

{
  "market": "naver",
  "market_number": 1,
  "count": 1500
}
```

## 보안 고려사항

### 인증
- 모든 API는 JWT 토큰 기반 인증 필요
- `req.user.userid`를 통한 사용자 식별

### 민감정보 보호
- 네이버 클라이언트 정보는 조회 시 마스킹 처리
- 데이터베이스에는 원본 저장, API 응답에서만 마스킹

### 데이터 유효성 검증
- 모든 입력값에 대한 타입 및 범위 검증
- 중복 마켓번호 방지
- SQL 인젝션 방지를 위한 Prepared Statement 사용

## 에러 처리

### 공통 에러 응답 형식
```json
{
  "success": false,
  "message": "에러 메시지",
  "error": "상세 에러 정보"
}
```

### 주요 에러 코드
- `400` - 잘못된 요청 (유효성 검증 실패)
- `401` - 인증 실패
- `409` - 중복 데이터 (마켓번호 중복 등)
- `500` - 서버 내부 오류

## 개발 가이드

### 새로운 설정 추가 시
1. 데이터베이스 스키마 업데이트
2. Repository 함수 추가
3. Service 로직 구현
4. Controller 라우트 추가
5. 유효성 검증 로직 추가
6. API 문서 업데이트

### 테스트
```bash
# 단위 테스트
npm test setting

# 통합 테스트
npm run test:integration setting
```

## 버전 히스토리

### v1.3.0
- 11번가 주소 조회 API 추가
- euc-kr 인코딩 처리를 통한 한글 지원
- XML 응답 파싱 및 JSON 변환
- addrSeq 값을 11번가 마켓 설정에서 활용
- iconv-lite 라이브러리 의존성 추가

### v1.2.0
- 판매자 차단 API 추가
- 상품 ID를 통한 판매자/쇼핑몰 차단 기능
- 차단된 판매자의 모든 상품 자동 차단
- 트랜잭션 처리를 통한 데이터 일관성 보장

### v1.1.0
- 기타 설정 API 추가 (심층 벤, 키워드 뛰어쓰기)
- 마켓별 상품개수 관리 API 추가
- 11번가 마켓 지원 추가
- JWT 토큰 기반 인증 강화

### v1.0.0
- 공통 정책 설정 API
- 네이버 정책 설정 API
- 마켓 계정 관리 API
- 민감정보 마스킹 기능
- 사용자 금지어 설정 API
- 쿠팡 정책 설정 API
- 쿠팡 배송지 조회 API
- 네이버 주소록 조회 API

## 기여하기

1. 새로운 기능 추가 시 테스트 코드 작성 필수
2. API 변경 시 문서 업데이트 필수
3. 보안 관련 변경 시 보안 팀 리뷰 필수

## 라이선스

MIT License
