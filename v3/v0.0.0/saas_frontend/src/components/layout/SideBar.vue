<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <router-link to="/product" class="header-link">
      <h3>수집상품관리</h3>
      </router-link>
    </div>
    <div class="sidebar-content">
      <nav class="sidebar-menu">
        <!-- 상품수집 메뉴 -->
        <div class="menu-category">
          <div class="menu-category-header" @click="sidebarStore.toggleCategory('collection')">
            <span class="menu-text">상품수집</span>
            <span class="toggle-icon" :class="{ 'rotated': sidebarStore.categoryOpen.collection }">▼</span>
          </div>
          <transition name="slide-down">
            <div class="submenu" v-if="sidebarStore.categoryOpen.collection">
            <router-link to="/product/sourcing/url" class="submenu-item">URL 수집</router-link>
            <router-link to="/product/sourcing/category" class="submenu-item">카테고리 수집</router-link>
            <router-link to="/product/sourcing/shop" class="submenu-item">쇼핑몰 수집</router-link>
                          <router-link to="/product/sourcing/list" class="submenu-item">상품목록 확인</router-link>
            </div>
          </transition>
        </div>
        
        <!-- 수집결과확인 메뉴 -->
        <router-link to="/product/results" class="menu-item">
          <span class="menu-text">수집결과확인</span>
        </router-link>
        
        <!-- 상품가공 메뉴 -->
        <div class="menu-category">
          <div class="menu-category-header" @click="sidebarStore.toggleCategory('processing')">
            <span class="menu-text">상품가공</span>
            <span class="toggle-icon" :class="{ 'rotated': sidebarStore.categoryOpen.processing }">▼</span>
          </div>
          <transition name="slide-down">
            <div class="submenu" v-if="sidebarStore.categoryOpen.processing">
            <router-link to="/product/processing/settings" class="submenu-item">가공설정 및 진행</router-link>
            <router-link to="/product/processing/brand" class="submenu-item">금지브랜드 검수</router-link>
            <router-link to="/product/processing/category-mapping" class="submenu-item">카테고리 매핑</router-link>
                          <router-link to="/product/processing/progress" class="submenu-item">진행상황 확인</router-link>
            </div>
          </transition>
        </div>
        
        <!-- 상품검수 메뉴 -->
        <router-link to="/product/inspection" class="menu-item">
          <span class="menu-text">상품검수</span>
        </router-link>
        
        <!-- 상품등록 메뉴 -->
        <div class="menu-category">
          <div class="menu-category-header" @click="sidebarStore.toggleCategory('registration')">
            <span class="menu-text">상품등록</span>
            <span class="toggle-icon" :class="{ 'rotated': sidebarStore.categoryOpen.registration }">▼</span>
          </div>
          <transition name="slide-down">
            <div class="submenu" v-if="sidebarStore.categoryOpen.registration">
            <router-link to="/product/registration" class="submenu-item">상품등록</router-link>
                          <router-link to="/product/registration/coopang-mapping" class="submenu-item">쿠팡매핑</router-link>
            </div>
          </transition>
        </div>
      </nav>
    </div>
  </aside>
</template>

<script>
import { useSidebarStore } from '../../stores/sidebar';

export default {
  name: 'SideBar',
  setup() {
    const sidebarStore = useSidebarStore();
    
    return {
      sidebarStore
    };
  }
}
</script>

<style scoped>
.sidebar {
  width: 220px;
  background-color: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color-lighter);
  height: calc(100vh - 55px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 55px;
  left: 0;
  z-index: 100;
  box-shadow: var(--el-box-shadow-base);
}

.sidebar-header {
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, var(--el-bg-color) 100%);
}

.header-link {
  text-decoration: none;
  color: inherit;
  display: block;
  transition: all 0.2s ease;
  border-radius: var(--el-border-radius-base);
  padding: var(--spacing-xs);
  margin: calc(var(--spacing-xs) * -1);
}

.header-link:hover {
  background-color: var(--el-color-primary-light-8);
  transform: translateY(-1px);
}

.sidebar-header h3 {
  margin: 0;
  font-size: var(--el-font-size-large);
  font-weight: var(--el-font-weight-semibold);
  color: var(--el-text-color-primary);
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
}

.sidebar-menu {
  padding: var(--spacing-md) 0;
}



.menu-item {
  display: flex;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-lg);
  text-decoration: none;
  color: var(--el-text-color-regular);
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
  font-weight: var(--el-font-weight-medium);
}

.menu-item:hover {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  border-left-color: var(--el-color-primary);
}

.menu-item.router-link-active {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: var(--el-font-weight-semibold);
  border-left-color: var(--el-color-primary);
}

.menu-category {
  margin-bottom: var(--spacing-xs);
}

.menu-category-header {
  display: flex;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-lg);
  cursor: pointer;
  color: var(--el-text-color-regular);
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
  font-weight: var(--el-font-weight-medium);
}

.menu-category-header:hover {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  border-left-color: var(--el-color-primary);
}

.menu-text {
  font-size: var(--el-font-size-base);
  flex-grow: 1;
}

.toggle-icon {
  font-size: 10px;
  color: var(--el-text-color-secondary);
  transition: transform 0.2s ease;
  transform: rotate(0deg);
}

.toggle-icon.rotated {
  transform: rotate(180deg);
}

.submenu {
  overflow: hidden;
}

.submenu-item {
  display: block;
  padding: var(--spacing-sm) var(--spacing-xl);
  text-decoration: none;
  color: var(--el-text-color-regular);
  font-size: var(--el-font-size-small);
  transition: all 0.2s ease;
  font-weight: var(--el-font-weight-medium);
  position: relative;
  border-left: 3px solid transparent;
}

.submenu-item:hover {
  background-color: var(--el-bg-color-page);
  color: var(--el-color-primary);
  border-left-color: var(--el-color-primary-light-7);
}

.submenu-item.router-link-active {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: var(--el-font-weight-semibold);
  border-left-color: var(--el-color-primary);
}

.submenu-item::before {
  content: '•';
  color: var(--el-text-color-secondary);
  font-weight: bold;
  margin-right: var(--spacing-sm);
  transition: color 0.2s ease;
}

.submenu-item:hover::before {
  color: var(--el-color-primary);
}

.submenu-item.router-link-active::before {
  color: var(--el-color-primary);
}

/* 슬라이드 다운 애니메이션 */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.slide-down-enter-from,
.slide-down-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-10px);
}

.slide-down-enter-to,
.slide-down-leave-from {
  max-height: 300px;
  opacity: 1;
  transform: translateY(0);
}

/* 스크롤바 커스터마이징 */
.sidebar::-webkit-scrollbar {
  width: 4px;
}

.sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar::-webkit-scrollbar-thumb {
  background: var(--el-border-color);
  border-radius: var(--el-border-radius-base);
}

.sidebar::-webkit-scrollbar-thumb:hover {
  background: var(--el-text-color-secondary);
}

/* 반응형 */
@media (max-width: 768px) {
  .sidebar {
    width: 200px;
  }
  
  .sidebar-header {
    padding: var(--spacing-md);
  }
  
  .sidebar-header h3 {
    font-size: var(--el-font-size-medium);
  }
  
  .menu-item,
  .menu-category-header {
    padding: var(--spacing-xs) var(--spacing-md);
  }
  
  .submenu-item {
    padding: var(--spacing-xs) var(--spacing-md);
  }
}
</style> 