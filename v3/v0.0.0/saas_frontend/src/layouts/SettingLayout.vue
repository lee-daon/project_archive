<template>
  <div class="layout-container">
    <TopBar />
    <div class="content-container">
      <transition name="sidebar-slide">
        <SettingSideBar v-if="showSidebar && sidebarStore.isOpen" />
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
import SettingSideBar from '../components/layout/SettingSideBar.vue';

export default {
  name: 'SettingLayout',
  components: {
    TopBar,
    SettingSideBar
  },
  setup() {
    const route = useRoute();
    const sidebarStore = useSidebarStore();
    
    const showSidebar = computed(() => {
      return route.meta.module === 'settings';
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
  margin-left: 220px; /* Fixed SettingSideBar 너비만큼 마진 추가 */
  height: calc(100vh - 64px); /* TopBar 높이를 제외한 정확한 높이 */
  overflow: hidden; /* 개별 페이지의 content-container가 스크롤 담당 */
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
