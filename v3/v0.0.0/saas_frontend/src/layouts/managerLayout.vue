<template>
  <div class="layout-container">
    <TopBar />
    <div class="content-container">
      <transition name="sidebar-slide">
        <ManagerSideBar v-if="showSidebar && sidebarStore.isOpen" />
      </transition>
      <main class="main-content" :class="{ 'full-width': !showSidebar || !sidebarStore.isOpen }">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useSidebarStore } from '../stores/sidebar';
import TopBar from '../components/layout/TopBar.vue';
import ManagerSideBar from '../components/layout/managerSideBar.vue';

export default {
  name: 'ManagerLayout',
  components: {
    TopBar,
    ManagerSideBar
  },
  setup() {
    const route = useRoute();
    const sidebarStore = useSidebarStore();
    
    const showSidebar = computed(() => {
      return route.meta.module === 'manager';
    });

    return {
      showSidebar,
      sidebarStore
    };
  }
}
</script>

<style scoped>
.layout-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.content-container {
  display: flex;
  flex: 1;
  margin-top: 64px; /* TopBar 높이만큼 상단 여백 추가 */
}

.main-content {
  flex: 1;
  padding: 10px;
  margin-left: 220px; /* Fixed SideBar 너비만큼 마진 추가 */
  height: calc(100vh - 64px); /* TopBar 높이를 제외한 정확한 높이 */
  overflow: hidden; /* 메인 콘텐츠도 고정 */
  box-sizing: border-box;
  transition: margin-left 0.3s ease;
}

.main-content.full-width {
  margin-left: 0;
}

/* 사이드바 슬라이드 애니메이션 */
.sidebar-slide-enter-active,
.sidebar-slide-leave-active {
  transition: all 0.3s ease;
}

.sidebar-slide-enter-from {
  transform: translateX(-100%);
}

.sidebar-slide-leave-to {
  transform: translateX(-100%);
}
</style>
