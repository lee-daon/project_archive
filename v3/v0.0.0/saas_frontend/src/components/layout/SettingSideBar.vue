<template>
  <aside class="setting-sidebar">
    <div class="sidebar-header">
      <router-link to="/settings" class="header-link">
      <h3 class="header-title">설정</h3>
      </router-link>
    </div>
    <div class="sidebar-content">
      <nav class="sidebar-menu">
        <!-- 마켓설정 메뉴 -->
        <div class="menu-category">
          <div class="menu-category-header" @click="sidebarStore.toggleCategory('market')">
            <span class="menu-text">마켓설정</span>
            <span class="toggle-icon" :class="{ 'rotated': sidebarStore.categoryOpen.market }">▼</span>
          </div>
          <transition name="slide-down">
            <div class="submenu" v-if="sidebarStore.categoryOpen.market">
              <router-link to="/settings/market" class="submenu-item">마켓등록</router-link>
              <router-link to="/settings/common-policy" class="submenu-item">공통정책설정</router-link>
              <router-link to="/settings/naver-policy" class="submenu-item">네이버정책</router-link>
              <router-link to="/settings/coupang-policy" class="submenu-item">쿠팡정책</router-link>
              <router-link to="/settings/eleven-store-policy" class="submenu-item">11번가정책</router-link>
              <router-link to="/settings/esm-policy" class="submenu-item">ESM정책</router-link>
            </div>
          </transition>
        </div>
        
        <!-- 경고 키워드 설정 메뉴 -->
        <router-link to="/settings/ban-words" class="menu-item">
          <span class="menu-text">경고 키워드 설정</span>
        </router-link>
        <!-- 상세페이지설정 메뉴 -->
        <router-link to="/settings/detail-page-setting" class="menu-item">
          <span class="menu-text">상세페이지설정</span>
        </router-link>
        <!-- 기타 세팅 메뉴 -->
        <router-link to="/settings/process-setting" class="menu-item">
          <span class="menu-text">기타 세팅</span>
        </router-link>
      </nav>
    </div>
  </aside>
</template>

<script>
import { useSidebarStore } from '../../stores/sidebar';

export default {
  name: 'SettingSideBar',
  setup() {
    const sidebarStore = useSidebarStore();
    
    return {
      sidebarStore
    };
  }
}
</script>

<style scoped>
.setting-sidebar {
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

.header-title {
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
  margin-bottom: var(--spacing-xs);
  font-weight: var(--el-font-weight-medium);
}

.menu-item:hover {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  border-left-color: var(--el-color-primary);
  transform: translateX(2px);
}

.menu-item.router-link-active {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: var(--el-font-weight-semibold);
  border-left-color: var(--el-color-primary);
  box-shadow: inset 0 0 0 1px var(--el-border-color-light);
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
  margin-bottom: var(--spacing-xs);
  font-weight: var(--el-font-weight-medium);
}

.menu-category-header:hover {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  border-left-color: var(--el-color-primary);
  transform: translateX(2px);
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
.setting-sidebar::-webkit-scrollbar {
  width: 4px;
}

.setting-sidebar::-webkit-scrollbar-track {
  background: var(--el-border-color-extra-light);
}

.setting-sidebar::-webkit-scrollbar-thumb {
  background: var(--el-border-color);
  border-radius: var(--el-border-radius-base);
}

.setting-sidebar::-webkit-scrollbar-thumb:hover {
  background: var(--el-text-color-secondary);
}

/* 반응형 */
@media (max-width: 768px) {
  .setting-sidebar {
    width: 200px;
    top: 55px;
    height: calc(100vh - 55px);
  }
  
  .menu-item,
  .menu-category-header {
    padding: var(--spacing-xs) var(--spacing-md);
  }
  
  .submenu-item {
    padding: var(--spacing-xs) var(--spacing-md);
  }
  
  .header-title {
    font-size: var(--el-font-size-medium);
  }
}
</style>
