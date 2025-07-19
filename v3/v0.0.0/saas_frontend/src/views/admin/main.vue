<template>
  <div class="admin-main">
    <!-- 페이지 헤더 -->
    <div class="page-header">
      <h2 class="page-title">어드민 페이지입니다</h2>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AdminMain'
}
</script>

<style scoped>
.admin-main {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color-page);
}

/* 페이지 헤더 */
.page-header {
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
  margin-bottom: var(--spacing-xs);
  text-align: center;
}

.page-title {
  font-size: var(--el-font-size-extra-large);
  font-weight: var(--el-font-weight-bold);
  color: var(--el-text-color-primary);
  margin: 0;
}
</style>
