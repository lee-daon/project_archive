# 중요한 레이아웃 정보

## ProductsLayout.vue 메인 컨테이너

이 디렉토리의 모든 페이지들은 `ProductsLayout.vue`의 메인 컨테이너 안에서 렌더링됩니다.

### 레이아웃 구조
- **TopBar**: 고정 높이 55px
- **SideBar**: 고정 너비 220px (왼쪽)
- **Main Content**: `calc(100vh - 55px)` 높이, `margin-left: 220px`

### 중요 사항
1. **높이 설정**: 페이지에서 `height: 100vh` 사용 금지 → `height: 100%` 사용
2. **오버플로우**: 메인 컨테이너가 `overflow: hidden`으로 설정됨
3. **패딩**: 메인 컨테이너에 `padding: 10px` 적용됨

### 올바른 페이지 구조
```css
.page-container {
  height: 100%; /* 100vh 아님! */
  display: flex;
  flex-direction: column;
}
```

이 정보를 무시하고 `height: 100vh`를 사용하면 레이아웃이 깨집니다.

## 아이콘 사용 규칙

### 금지사항
- **이모지 사용 금지**: UI에서 이모지(📦, ⚠️, 💾 등) 사용 금지
- **텍스트 아이콘 금지**: 유니코드 문자나 특수문자를 아이콘으로 사용 금지

### 권장사항
- **Element Plus Icons 사용**: 모든 아이콘은 Element Plus Icons 라이브러리 사용
- **일관성 유지**: 동일한 의미의 아이콘은 프로젝트 전체에서 통일
- **접근성 고려**: 아이콘만으로 의미 전달 시 대체 텍스트 제공

### 자주 사용하는 Element Plus 아이콘
- `<el-icon><Document /></el-icon>` - 문서, 목록
- `<el-icon><Warning /></el-icon>` - 경고, 에러
- `<el-icon><Check /></el-icon>` - 성공, 완료
- `<el-icon><Loading /></el-icon>` - 로딩
- `<el-icon><Refresh /></el-icon>` - 새로고침
- `<el-icon><Download /></el-icon>` - 저장, 다운로드
