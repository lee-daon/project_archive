<template>
  <div class="product-main">
    <!-- 기본 홈 화면 (자식 라우트가 없을 때) -->
    <div v-if="$route.name === 'ProductMain'" class="home">
      <div class="welcome-card">
        <h1>환영합니다</h1>
        <p>상품 관리 시스템에 로그인하셨습니다.</p>
        <div class="quick-links">
          <router-link to="/product/sourcing/url" class="quick-link">
            <el-icon class="quick-link-icon"><Search /></el-icon>
            <div class="quick-link-text">
              <h3>상품수집</h3>
              <p>URL, 카테고리, 쇼핑몰 상품 수집</p>
            </div>
          </router-link>
          
          <router-link to="/product/results" class="quick-link">
            <el-icon class="quick-link-icon"><DataBoard /></el-icon>
            <div class="quick-link-text">
              <h3>수집결과확인</h3>
              <p>수집된 상품 결과 확인</p>
            </div>
          </router-link>
          
          <router-link to="/product/processing/settings" class="quick-link">
            <el-icon class="quick-link-icon"><Setting /></el-icon>
            <div class="quick-link-text">
              <h3>상품가공</h3>
              <p>수집된 상품 정보 가공 및 설정</p>
            </div>
          </router-link>
          
          <router-link to="/product/inspection" class="quick-link">
            <el-icon class="quick-link-icon"><Select /></el-icon>
            <div class="quick-link-text">
              <h3>상품검수</h3>
              <p>등록 전 상품 검수 및 확인</p>
            </div>
          </router-link>
          
          <router-link to="/product/registration" class="quick-link">
            <el-icon class="quick-link-icon"><Edit /></el-icon>
            <div class="quick-link-text">
              <h3>상품등록</h3>
              <p>최종 상품 등록 관리</p>
            </div>
          </router-link>
        </div>
      </div>
    </div>
    
    <!-- 자식 라우트 표시 -->
    <router-view v-else />
  </div>
</template>

<script>
import { Search, DataBoard, Setting, Select, Edit } from '@element-plus/icons-vue';

export default {
  name: 'ProductMain',
  setup() {
    return {
      Search,
      DataBoard,
      Setting,
      Select,
      Edit
    };
  }
}
</script>

<style scoped>
.product-main {
  width: 100%;
  height: 100%;
  overflow: auto;
  box-sizing: border-box;
}

.home {
  padding: var(--spacing-lg);
}

.welcome-card {
  background-color: var(--el-bg-color);
  border-radius: var(--el-border-radius-base);
  padding: var(--spacing-xl);
  box-shadow: var(--el-box-shadow-light);
}

.welcome-card h1 {
  margin-top: 0;
  color: var(--el-text-color-primary);
}

.quick-links {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-lg);
  margin-top: var(--spacing-xl);
}

.quick-link {
  display: flex;
  align-items: center;
  padding: var(--spacing-lg);
  background-color: var(--el-fill-color-light);
  border-radius: var(--el-border-radius-base);
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s, box-shadow 0.2s;
}

.quick-link:hover {
  transform: translateY(-3px);
  box-shadow: var(--el-box-shadow-base);
}

.quick-link-icon {
  font-size: 2rem;
  margin-right: var(--spacing-lg);
  color: var(--el-color-primary);
}

.quick-link-text h3 {
  margin: 0 0 var(--spacing-xs) 0;
  color: var(--el-text-color-primary);
}

.quick-link-text p {
  margin: 0;
  color: var(--el-text-color-secondary);
}
</style> 