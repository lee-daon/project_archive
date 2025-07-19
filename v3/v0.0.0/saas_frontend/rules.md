# 프로젝트 개발 지침

## 📋 핵심 코딩 규칙

### 1. 기본 원칙
- **실수 방지**: 확실하지 않은 로직은 진행하지 말고 질문하기
- **간단함**: 코드는 간단하고 담백하게 작성
- **모듈화**: ES6 모듈 문법 사용 (`import { } from './path'`)

### 2. 기술 스택
- **UI Library**: Element Plus 기반
- **Architecture**: 모듈형 구조
- **Import/Export**: ES6 모듈 문법 (`import { } from './path'`)

## 🎨 디자인 시스템 필수 규칙

### 1. Element Plus 컴포넌트 강제 사용
- **버튼**: 모든 `<button>` 태그는 `<el-button>` 컴포넌트로 대체 필수
- **입력**: `<input>` 대신 `<el-input>` 사용
- **폼**: `<form>` 대신 `<el-form>` 사용
- **타입**: primary, success, warning, danger, info 적절히 사용
- **아이콘**: Element Plus Icons 사용 (이모지 금지)

### 2. CSS 변수 사용 강제
- **색상**: `var(--el-color-primary)` 등 CSS 변수 사용
- **간격**: `var(--spacing-md)` 등 spacing 변수 사용
- **폰트**: `var(--el-font-size-base)` 등 typography 변수 사용
- **하드코딩 금지**: 직접 색상값이나 픽셀값 사용 금지

### 3. 컴포넌트 패턴
- **반응형**: 모든 페이지에 반응형 디자인 적용
- **호버 효과**: 표준 호버 패턴 사용 (transform, 색상 변화)
- **일관성**: 모든 페이지에서 동일한 패턴 사용

## 🔧 코드 리뷰 체크리스트

### 필수 확인 사항
- [ ] `<button>` 태그 없이 `<el-button>` 사용
- [ ] CSS 변수 사용 (하드코딩 금지)
- [ ] Element Plus 컴포넌트 우선 사용
- [ ] 반응형 디자인 구현
- [ ] 이모지 대신 Element Plus Icons 사용

### 버튼 타입 가이드
- **Primary**: 주요 액션 (검색, 확인, 저장)
- **Success**: 성공 액션 (등록, 승인, 완료)
- **Warning**: 경고 액션 (수정, 변경)
- **Danger**: 위험 액션 (삭제, 취소)
- **Info**: 정보 액션 (상세보기, 도움말)

## 📁 파일 구조
```
src/
├── components/
├── views/
├── stores/
├── assets/
└── utils/
```

### 1. 코드 문서화
- **JSDoc**: 함수 및 클래스 문서화
- **README**: 프로젝트 설명 및 설치 가이드
- **API 문서**: 엔드포인트 명세

### 2. 컴포넌트 문서화
- **Props**: 타입 및 기본값 명시
- **Events**: 발생 조건 및 페이로드
- **Slots**: 사용법 및 예시

---

## ⚡ 빠른 참조

### 자주 사용하는 컴포넌트
- `<el-button>` - 모든 버튼
- `<el-input>` - 모든 입력 필드
- `<el-form>` - 모든 폼
- `<el-select>` - 셀렉트 박스
- `<el-table>` - 테이블

### 필수 CSS 변수
- `var(--el-color-primary)` - 주 색상 (#409eff)
- `var(--spacing-md)` - 기본 간격 (16px)
- `var(--el-font-size-base)` - 기본 폰트 크기
- `var(--el-text-color-primary)` - 주 텍스트 색상

---

## 📝 변경 로그

### v1.0 (최종 버전) - 2025.01
- **색상 업데이트**: Primary 색상을 #409eff로 변경 (Element Plus 기본 블루)
- **토글 시스템**: 180도 회전 방식으로 통일 (▼ → ▲)
- **서브메뉴 디자인**: 배경색 제거, 개별 아이템만 활성화 표시
- **애니메이션**: 슬라이드 다운 트랜지션 추가 (0.3s ease)
