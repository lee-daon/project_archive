<template>
  <div class="admin-layout">
    <!-- 어드민 헤더 -->
    <div class="admin-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="admin-title">관리자 패널</h1>
          <span class="admin-badge">ADMIN</span>
        </div>
        <div class="header-right">
          <span class="user-info">{{ userInfo.name }} ({{ userInfo.id }})</span>
          <el-button @click="logout" type="danger" size="small" :icon="SwitchButton">
            로그아웃
          </el-button>
        </div>
      </div>
    </div>

    <!-- 어드민 사이드바 -->
    <div class="admin-sidebar">
      <nav class="admin-nav">
        <router-link 
          to="/admin" 
          class="nav-item"
          :class="{ active: $route.path === '/admin' }"
        >
          <el-icon><Monitor /></el-icon>
          <span>대시보드</span>
        </router-link>
        <router-link 
          to="/admin/health" 
          class="nav-item"
          :class="{ active: $route.path === '/admin/health' }"
        >
          <el-icon><CircleCheck /></el-icon>
          <span>시스템 상태</span>
        </router-link>
        <router-link 
          to="/admin/controller" 
          class="nav-item"
          :class="{ active: $route.path === '/admin/controller' }"
        >
          <el-icon><Setting /></el-icon>
          <span>시스템 제어</span>
        </router-link>
        <router-link 
          to="/admin/logs" 
          class="nav-item"
          :class="{ active: $route.path === '/admin/logs' }"
        >
          <el-icon><Document /></el-icon>
          <span>로그 관리</span>
        </router-link>
        <router-link 
          to="/admin/users" 
          class="nav-item"
          :class="{ active: $route.path === '/admin/users' }"
        >
          <el-icon><User /></el-icon>
          <span>사용자 관리</span>
        </router-link>
        <router-link 
          to="/admin/notices" 
          class="nav-item"
          :class="{ active: $route.path === '/admin/notices' }"
        >
          <el-icon><Bell /></el-icon>
          <span>공지사항 관리</span>
        </router-link>
      </nav>
    </div>

    <!-- 메인 콘텐츠 -->
    <div class="admin-content">
      <router-view />
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Monitor, CircleCheck, Setting, SwitchButton, Document, User, Bell } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

export default {
  name: 'AdminLayout',
  setup() {
    const router = useRouter();
    const userInfo = ref({});

    // 사용자 정보 로드
    const loadUserInfo = () => {
      try {
        const userStr = sessionStorage.getItem('user');
        if (userStr) {
          userInfo.value = JSON.parse(userStr);
        }
      } catch (error) {
        console.error('사용자 정보 로드 실패:', error);
      }
    };

    // 로그아웃
    const logout = () => {
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('user');
      ElMessage.success('로그아웃되었습니다.');
      router.push('/login');
    };

    onMounted(() => {
      loadUserInfo();
    });

    return {
      userInfo,
      logout,
      Monitor,
      CircleCheck,
      Setting,
      SwitchButton,
      Document,
      User,
      Bell
    };
  }
}
</script>

<style scoped>
.admin-layout {
  height: 100vh;
  display: grid;
  grid-template-areas: 
    "header header"
    "sidebar content";
  grid-template-rows: 64px 1fr;
  grid-template-columns: 220px 1fr;
  background-color: var(--el-bg-color-page);
}

/* 헤더 */
.admin-header {
  grid-area: header;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
  box-shadow: var(--el-box-shadow-base);
  z-index: 100;
}

.header-content {
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 var(--spacing-lg) 0 var(--spacing-md);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.admin-title {
  font-size: var(--el-font-size-large);
  font-weight: var(--el-font-weight-bold);
  margin: 0;
  color: var(--el-text-color-primary);
}

.admin-badge {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--el-border-radius-round);
  font-size: var(--el-font-size-small);
  font-weight: var(--el-font-weight-bold);
  border: 1px solid var(--el-color-primary-light-7);
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.user-info {
  font-size: var(--el-font-size-small);
  color: var(--el-text-color-regular);
  font-weight: var(--el-font-weight-medium);
}

/* 사이드바 */
.admin-sidebar {
  grid-area: sidebar;
  background-color: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color-lighter);
  box-shadow: var(--el-box-shadow-base);
  overflow-y: auto;
}

.admin-nav {
  padding: var(--spacing-md) 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-lg);
  color: var(--el-text-color-regular);
  text-decoration: none;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
  font-weight: var(--el-font-weight-medium);
}

.nav-item:hover {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  border-left-color: var(--el-color-primary);
}

.nav-item.active {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  border-left-color: var(--el-color-primary);
  font-weight: var(--el-font-weight-semibold);
}

/* 메인 콘텐츠 */
.admin-content {
  grid-area: content;
  overflow-y: auto;
  background-color: var(--el-bg-color-page);
}

/* 스크롤바 커스터마이징 */
.admin-sidebar::-webkit-scrollbar {
  width: 4px;
}

.admin-sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.admin-sidebar::-webkit-scrollbar-thumb {
  background: var(--el-border-color);
  border-radius: var(--el-border-radius-base);
}

.admin-sidebar::-webkit-scrollbar-thumb:hover {
  background: var(--el-text-color-secondary);
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .admin-layout {
    grid-template-areas: 
      "header"
      "content";
    grid-template-rows: 64px 1fr;
    grid-template-columns: 1fr;
  }
  
  .admin-sidebar {
    display: none;
  }
  
  .header-content {
    padding: 0 var(--spacing-md);
  }
  
  .header-right {
    gap: var(--spacing-sm);
  }
  
  .user-info {
    display: none;
  }
}
</style>
