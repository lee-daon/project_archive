<template>
  <div class="loading-container" :class="{ 'overlay': overlay }">
    <div class="loading-spinner" :class="sizeClass"></div>
    <p v-if="text" class="loading-text">{{ text }}</p>
  </div>
</template>

<script>
import { computed } from 'vue';

export default {
  name: 'AppLoading',
  props: {
    text: {
      type: String,
      default: '로딩 중...'
    },
    size: {
      type: String,
      default: 'medium', // small, medium, large
      validator: (value) => ['small', 'medium', 'large'].includes(value)
    },
    overlay: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const sizeClass = computed(() => `size-${props.size}`);
    
    return {
      sizeClass
    };
  }
}
</script>

<style scoped>
.loading-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: var(--spacing-xxl);
}

.loading-container.overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  z-index: 100;
}

.loading-spinner {
  border: 3px solid var(--el-border-color-lighter);
  border-radius: 50%;
  border-top-color: var(--el-color-primary);
  animation: spin 1s linear infinite;
  margin-bottom: var(--spacing-md);
}

.loading-spinner.size-small {
  width: 24px;
  height: 24px;
  border-width: 2px;
}

.loading-spinner.size-medium {
  width: 40px;
  height: 40px;
  border-width: 3px;
}

.loading-spinner.size-large {
  width: 60px;
  height: 60px;
  border-width: 4px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  color: var(--el-text-color-secondary);
  font-size: var(--el-font-size-base);
  margin: 0;
  text-align: center;
}
</style>
