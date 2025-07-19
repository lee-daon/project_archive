# Status Control Documentation

등록된 상품 관리 모듈에서 어떤 상태들을 변경하는지 문서화합니다.

## 📊 상태 관리 개요

이 모듈은 등록된 상품들의 상태를 관리하며, 주로 다음 두 가지 테이블의 상태를 제어합니다:
- **register_management 테이블**: 플랫폼별 등록 상태
- **status 테이블**: 전체 등록 플래그

---

## 🔄 API별 상태 변경

### 1. 등록된 상품 조회 (`GET /get-registering-info`)

#### 조회 대상 상태
- **조회 범위**: `pending`, `success`, `fail` 상태만 조회
- **제외 상태**: `retry`, `optionMapRequired`, `rate_limit` 등은 조회에서 제외

#### 변경되는 상태
- **없음** (조회만 수행)

---

### 2. 마켓에서 상품 내리기 (`POST /remove-from-market`)

#### 처리 과정
1. **마켓 API 호출**: 플랫폼에서 상품 내리기 (상품번호가 있는 경우만)
2. **상태 업데이트**: `makeRegisterable()` 함수 호출

#### 변경되는 상태

##### register_management 테이블
| 플랫폼 | 테이블 | 변경 필드 | 변경값 |
|--------|--------|-----------|--------|
| 쿠팡 | `coopang_register_management` | `status` | `retry` |
| 네이버 | `naver_register_management` | `status` | `retry` |

##### status 테이블
| 플랫폼 | 변경 필드 | 변경값 |
|--------|-----------|--------|
| 쿠팡 | `coopang_registered` | `FALSE` |
| 쿠팡 | `coopang_register_failed` | `FALSE` |
| 네이버 | `naver_registered` | `FALSE` |
| 네이버 | `naver_register_failed` | `FALSE` |
| 11번가 | `elevenstore_registered` | `FALSE` |
| 11번가 | `elevenstore_register_failed` | `FALSE` |

#### 의도
상품을 마켓에서 내린 후 다시 등록 가능한 상태로 되돌림

---

### 3. 상품 영구 삭제 (`DELETE /delete-products`)

#### 처리 과정
1. **모든 마켓에서 삭제**: 쿠팡, 네이버 API 호출 (상품번호가 있는 경우만)
2. **데이터베이스 정리**: `deleteSpecificTables()` 함수 호출

#### 삭제되는 테이블 및 데이터

##### 개인소유권 테이블
- `products_detail`: 상품 상세 정보
- `private_main_image`: 개인 메인 이미지
- `private_description_image`: 개인 설명 이미지
- `private_nukki_image`: 개인 누끼 이미지
- `private_properties`: 개인 속성 정보
- `private_options`: 개인 옵션 정보

##### 상태 관련 테이블
- `processing_status`: 가공 상태 정보
- `status`: 전체 상태 관리 정보
- `pre_register`: 등록 전 준비 데이터
- `coopang_register_management`: 쿠팡 등록 관리 정보
- `naver_register_management`: 네이버 등록 관리 정보

#### 의도
상품을 완전히 시스템에서 제거 (공용 데이터는 보존)

---

## 🎯 상태 변경 로직

### makeRegisterable() 함수
**위치**: `repository/makeRegisterable.js`

**기능**: 상품을 다시 등록 가능한 상태로 변경

**처리 과정**:
1. 플랫폼별 register_management 테이블에서 상태를 `retry`로 변경
2. status 테이블에서 해당 플랫폼의 등록 관련 플래그를 `FALSE`로 초기화

### deleteSpecificTables() 함수
**위치**: `repository/deleteAllRows.js`

**기능**: 지정된 테이블에서만 상품 데이터 삭제

**특징**:
- FOREIGN KEY 순서에 따라 안전하게 삭제
- 공용 데이터 테이블은 건드리지 않음
- 트랜잭션으로 보호되어 원자성 보장

---

## ⚠️ 주의사항

### 1. 상품번호 검증
- **상품번호가 없는 경우**: 마켓 API 호출을 건너뛰고 상태 업데이트만 진행
- **유효하지 않은 상품번호**: `isNaN(parseInt(productNumber))` 체크

### 2. 트랜잭션 처리
- 모든 상태 변경은 트랜잭션으로 보호
- 실패 시 롤백하여 데이터 일관성 유지

### 3. 에러 처리
- 마켓 API 실패해도 상태 업데이트는 진행
- 부분 실패 허용 (일부 상품만 실패해도 계속 진행)

### 4. 계정 정보 조회
- `findAccountInfo()` 함수로 상품별 마켓 계정 정보 조회
- register_management → account_info 순서로 조회

---

## 📈 상태 흐름도

### 마켓에서 내리기
```
등록된 상품 (success/fail)
    ↓
마켓 API 호출 (상품 내리기)
    ↓
register_management.status = 'retry'
    ↓
status 테이블 플래그 초기화
    ↓
다시 등록 가능한 상태
```

### 영구 삭제
```
등록된 상품
    ↓
모든 마켓에서 삭제 시도
    ↓
지정된 테이블에서 데이터 삭제
    ↓
시스템에서 완전 제거
```

---

## 🔍 디버깅 정보

### 로그 메시지
- `계정 정보 조회 성공`: findAccountInfo 성공
- `상품번호 없음 - 마켓 내리기/삭제 건너뛰기`: 상품번호 검증 실패
- `특정 테이블 삭제 시작/완료`: deleteSpecificTables 실행
- `{플랫폼} 마켓에서 상품 {productid} 삭제 성공/실패`: 마켓 API 결과

### 응답 데이터
- `marketResults`: 각 플랫폼별 마켓 API 호출 결과
- `deleteResults`: 테이블별 삭제된 레코드 수
- `marketNumber`: 사용된 마켓 번호


