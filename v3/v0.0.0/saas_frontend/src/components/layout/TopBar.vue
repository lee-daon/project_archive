<template>
  <header class="top-bar">
    <div class="left-section">
      <el-button 
        v-if="shouldShowHamburger" 
        @click="toggleSidebar" 
        text
        size="large"
        class="sidebar-toggle-btn"
      >
        <el-icon :size="28">
          <Expand v-if="!sidebarStore.isOpen" />
          <Fold v-else />
        </el-icon>
      </el-button>
      <div class="logo-container">
        <router-link to="/">
          <img src="../../assets/loopton3.png" alt="loopToN 로고" class="logo" />
        </router-link>
      </div>
    </div>
    <nav class="menu-container">
      <router-link to="/product" class="menu-item">수집 상품 관리</router-link>
      <router-link to="/manager" class="menu-item">등록상품관리</router-link>
      <a 
        href="https://catnip-ruby-a63.notion.site/21561ebafb1d80f49c97f5ee356f46be" 
        target="_blank" 
        rel="noopener noreferrer"
        class="menu-item"
      >
        사용가이드
      </a>
      <router-link to="/settings" class="menu-item">설정</router-link>
      <div class="user-menu">
        <div class="user-info" @click="toggleUserDropdown">
          <span>{{ userName }}</span>
          <span class="dropdown-icon" :class="{ 'rotated': showUserDropdown }">▼</span>
        </div>
        <div class="dropdown-menu" v-if="showUserDropdown">
          <router-link to="/user/profile" class="dropdown-item">프로필</router-link>
          <router-link to="/user/payment" class="dropdown-item">결제</router-link>
          <div class="dropdown-item" @click="handleLogout">로그아웃</div>
        </div>
      </div>
    </nav>
  </header>
</template>

<script>
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useSidebarStore } from '../../stores/sidebar';
import { Expand, Fold } from '@element-plus/icons-vue';
import { logout } from '../../services/auth';

export default {
  name: 'TopBar',
  setup() {
    const userName = ref('사용자');
    const showUserDropdown = ref(false);
    const router = useRouter();
    const route = useRoute();
    const sidebarStore = useSidebarStore();

    const shouldShowHamburger = computed(() => {
      return route.meta.module === 'product' || route.meta.module === 'settings' || route.meta.module === 'manager';
    });

    const toggleUserDropdown = () => {
      showUserDropdown.value = !showUserDropdown.value;
    };

    const toggleSidebar = () => {
      sidebarStore.toggleSidebar();
    };

    const handleLogout = () => {
      // auth.js의 logout 함수 사용 (세션 정리만)
      logout();
      router.push('/login');
    };

    return {
      userName,
      showUserDropdown,
      sidebarStore,
      shouldShowHamburger,
      toggleUserDropdown,
      toggleSidebar,
      handleLogout,
      Expand,
      Fold
    };
  }
}
</script>

<style scoped>
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 64px;
  padding: 0 var(--spacing-lg) 0 var(--spacing-md);
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
  box-shadow: var(--el-box-shadow-base);
  z-index: 150;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
}

.left-section {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.sidebar-toggle-btn {
  color: var(--el-text-color-primary);
  transition: all 0.2s ease;
  padding: var(--spacing-xs) var(--spacing-sm);
}

.sidebar-toggle-btn:hover {
  color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
}

.logo-container {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
}

.logo {
  height: 30px;
  margin-top: 8px;
  transition: transform 0.2s ease;
}

.logo:hover {
  transform: scale(1.02);
}

.menu-container {
  display: flex;
  align-items: center;
}

.menu-item {
  margin-right: var(--spacing-lg);
  text-decoration: none;
  color: var(--el-text-color-regular);
  font-weight: var(--el-font-weight-medium);
  font-size: var(--el-font-size-base);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--el-border-radius-base);
  transition: all 0.2s ease;
}

.menu-item:hover {
  color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
}

.menu-item.router-link-active {
  color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
  font-weight: var(--el-font-weight-semibold);
}

.user-menu {
  position: relative;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--el-border-radius-base);
  color: var(--el-text-color-primary);
  font-weight: var(--el-font-weight-medium);
  transition: background-color 0.2s ease;
  border: 1px solid transparent;
}

.user-info:hover {
  background-color: var(--el-bg-color-page);
  border-color: var(--el-border-color-light);
}

.dropdown-icon {
  margin-left: var(--spacing-sm);
  font-size: 10px;
  color: var(--el-text-color-secondary);
  transition: transform 0.2s ease;
}

.dropdown-icon.rotated {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + var(--spacing-xs));
  right: 0;
  min-width: 150px;
  background-color: var(--el-bg-color);
  border-radius: var(--el-border-radius-base);
  box-shadow: var(--el-box-shadow-light);
  border: 1px solid var(--el-border-color-lighter);
  z-index: 200;
  overflow: hidden;
}

.dropdown-item {
  padding: var(--spacing-sm) var(--spacing-md);
  cursor: pointer;
  text-decoration: none;
  color: var(--el-text-color-regular);
  display: block;
  font-size: var(--el-font-size-base);
  transition: all 0.2s ease;
  border-bottom: 1px solid var(--el-border-color-extra-light);
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item:hover {
  background-color: var(--el-bg-color-page);
  color: var(--el-color-primary);
}

/* 반응형 */
@media (max-width: 768px) {
  .top-bar {
    padding: 0 var(--spacing-md);
  }
  
  .menu-item {
    margin-right: var(--spacing-md);
    padding: var(--spacing-xs) var(--spacing-sm);
  }
  
  .sidebar-toggle-btn {
    padding: var(--spacing-xs);
  }
}
</style> 