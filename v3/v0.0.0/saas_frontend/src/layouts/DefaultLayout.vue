<template>
  <div class="layout-container">
    <TopBar />
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script>
import TopBar from '../components/layout/TopBar.vue';

export default {
  name: 'DefaultLayout',
  components: {
    TopBar
  }
}
</script>

<style scoped>
.layout-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.main-content {
  flex: 1;
  padding: 15px;
  background-color: #f5f7f9;
  margin-top: 64px;
  min-height: calc(100vh - 64px);
  overflow-y: auto;
}
</style> 