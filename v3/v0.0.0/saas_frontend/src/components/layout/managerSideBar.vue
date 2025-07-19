<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <router-link to="/manager" class="header-link">
        <h3>등록상품관리</h3>
      </router-link>
    </div>
    <div class="sidebar-content">
      <nav class="sidebar-menu">
        <!-- 등록현황 메뉴 -->
        <router-link to="/manager/register-check" class="menu-item">
          <span class="menu-text">등록현황</span>
        </router-link>
        
        <!-- 애널리틱스 메뉴 -->
        <router-link to="/manager/analytics" class="menu-item">
          <span class="menu-text">애널리틱스</span>
        </router-link>
        
        <!-- 주문 상품 검색 메뉴 -->
        <router-link to="/manager/product-search" class="menu-item">
          <span class="menu-text">주문 상품 검색</span>
        </router-link>
      </nav>
    </div>
  </aside>
</template>

<script>
import { useSidebarStore } from '../../stores/sidebar';

export default {
  name: 'ManagerSideBar',
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

.menu-text {
  font-size: var(--el-font-size-base);
  flex-grow: 1;
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
  
  .menu-item {
    padding: var(--spacing-xs) var(--spacing-md);
  }
}
</style>
