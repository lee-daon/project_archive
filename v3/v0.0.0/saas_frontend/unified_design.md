# 통일된 디자인 시스템 (Element Plus 기반)

## 1. 색상 시스템

### Primary Colors
- **Primary**: `#409eff` (주 색상)
- **Success**: `#28a745` (성공, 확인)
- **Warning**: `#ffc107` (경고)
- **Danger**: `#dc3545` (에러, 삭제)
- **Info**: `#6c757d` (정보)

### Text Colors
- **Primary**: `#1F2937` (주요 텍스트)
- **Regular**: `#4B5563` (일반 텍스트)
- **Secondary**: `#6B7280` (보조 텍스트)
- **Placeholder**: `#9CA3AF` (플레이스홀더)

### Background Colors
- **White**: `#FFFFFF` (메인 배경)
- **Light**: `#F9FAFB` (보조 배경)
- **Border**: `#D1D5DB` (테두리)

## 2. 간격 시스템

### Spacing Scale
- **sm**: `8px` (작은 간격)
- **md**: `16px` (기본 간격)
- **lg**: `24px` (큰 간격)
- **xl**: `32px` (매우 큰 간격)

## 3. 타이포그래피

### Font Sizes
- **extra-large**: `20px` (페이지 제목)
- **large**: `18px` (섹션 제목)
- **medium**: `16px` (강조 텍스트)
- **base**: `14px` (기본 텍스트)
- **small**: `13px` (보조 텍스트)

### Font Weights
- **bold**: `700` (제목)
- **semibold**: `600` (서브 제목)
- **medium**: `500` (강조)
- **normal**: `400` (기본)

## 4. 컴포넌트 규칙

### Element Plus 컴포넌트 필수 사용
- **버튼**: `<el-button>` 만 사용, HTML `<button>` 금지
- **입력**: `<el-input>` 사용
- **폼**: `<el-form>` 사용
- **아이콘**: Element Plus Icons 사용, 이모지 금지

### 버튼 타입 가이드
```html
<el-button type="primary">주요 액션</el-button>
<el-button type="success">성공 액션</el-button>
<el-button type="warning">경고 액션</el-button>
<el-button type="danger">위험 액션</el-button>
<el-button type="info">정보 액션</el-button>
```

### 크기 가이드
- **Large**: `size="large"` - 중요한 버튼
- **Default**: 기본값 - 일반 버튼
- **Small**: `size="small"` - 보조 버튼

## 5. 호버 효과 시스템

### 기본 호버 패턴
```css
.hover-effect:hover {
  transform: translateY(-1px);
  box-shadow: var(--el-box-shadow-base);
  border-color: var(--el-color-primary-light-7);
  transition: all 0.2s ease;
}
```

### 사이드 메뉴 호버
```css
.menu-item:hover {
  transform: translateX(4px);
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}
```

## 6. 레이아웃 패턴

### 카드 레이아웃
```css
.card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base);
  padding: var(--spacing-lg);
  box-shadow: var(--el-box-shadow-light);
}
```

### 페이지 헤더
```css
.page-header {
  margin-bottom: var(--spacing-xl);
}

.page-title {
  font-size: var(--el-font-size-extra-large);
  font-weight: var(--el-font-weight-bold);
  color: var(--el-text-color-primary);
}
```

## 7. 반응형 디자인

### 브레이크포인트
- **Mobile**: `< 768px`
- **Tablet**: `768px - 992px`
- **Desktop**: `> 992px`

### 반응형 패턴
```css
@media (max-width: 768px) {
  .container {
    padding: var(--spacing-md);
  }
  
  .page-title {
    font-size: var(--el-font-size-large);
  }
}
```

## 8. 애니메이션

### 기본 트랜지션
```css
.transition {
  transition: all 0.2s ease;
}
```

### 슬라이드 애니메이션
```css
.slide-enter-active {
  transition: all 0.3s ease;
}

.slide-enter-from {
  transform: translateY(-10px);
  opacity: 0;
}
```

## 9. 필수 CSS 변수 목록

### 색상 변수
- `--el-color-primary`
- `--el-color-success`
- `--el-color-warning`
- `--el-color-danger`
- `--el-text-color-primary`
- `--el-text-color-secondary`
- `--el-bg-color`

### 간격 변수
- `--spacing-sm`
- `--spacing-md`
- `--spacing-lg`
- `--spacing-xl`

### 폰트 변수
- `--el-font-size-base`
- `--el-font-size-large`
- `--el-font-weight-medium`
- `--el-font-weight-bold`

### 기타 변수
- `--el-border-radius-base`
- `--el-box-shadow-light`
- `--el-box-shadow-base`

---

## 🎯 핵심 원칙

1. **일관성**: 모든 페이지에서 동일한 Element Plus 컴포넌트 사용
2. **CSS 변수**: 하드코딩 금지, 모든 값은 CSS 변수 사용
3. **반응형**: 모든 페이지에 모바일 우선 반응형 적용
4. **호버 효과**: 표준 호버 패턴 사용
5. **접근성**: 키보드 네비게이션과 색상 대비 고려

---

## 📋 체크리스트

### 새 페이지 생성 시 확인사항
- [ ] `<el-button>` 사용 (`<button>` 금지)
- [ ] CSS 변수 사용 (하드코딩 금지)
- [ ] Element Plus 아이콘 사용 (이모지 금지)
- [ ] 반응형 디자인 구현
- [ ] 표준 호버 효과 적용
- [ ] 적절한 spacing 변수 사용

### 기존 페이지 수정 시 확인사항
- [ ] HTML 태그를 Element Plus 컴포넌트로 교체
- [ ] 하드코딩된 색상/크기를 CSS 변수로 변경
- [ ] 호버 효과 표준화
- [ ] 모바일 반응형 개선
