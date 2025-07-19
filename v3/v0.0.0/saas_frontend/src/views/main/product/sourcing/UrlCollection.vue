<template>
  <div class="url-collection-page">
    <div class="page-header">
      <h2 class="page-title">URL로 수집하기</h2>
      <p class="page-description">URL을 한줄씩 입력해 주세요.</p>
    </div>
    
    <div class="content-container">
      <div class="url-input-card card">
        <div class="card-header">
          <h3 class="card-title">URL 입력</h3>
        </div>
        <div class="card-body">
          <div class="url-input-area">
            <textarea
              v-model="urlList"
              class="url-input"
              placeholder="https://example.com
https://example.org
https://example.net
https://example.edu"
              rows="10"
            ></textarea>
            <p class="input-help">상품 URL을 한 줄씩 입력하세요</p>
          </div>
          
          <div class="button-area">
            <button 
              class="fetch-button primary-button"
              @click="startSourcing"
              :disabled="isLoading"
            >
              <span v-if="isLoading" class="loading-spinner"></span>
              {{ isLoading ? '수집 중...' : '수집 시작' }}
            </button>
          </div>
        </div>
      </div>
      

    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { parseProductIds } from '../../../../services/sourcing_service/parseIdList';
import { urlSourcing } from '../../../../services/sourcing';

export default {
  name: 'UrlCollection',
  setup() {
    const router = useRouter();
    const urlList = ref('');
    const isLoading = ref(false);

    // 성공 시 상품 목록 확인 페이지로 이동
    const navigateToProductListCheck = () => {
      setTimeout(() => {
        router.push('/product/sourcing/list');
      }, 300);
    };

    const startSourcing = async () => {
      if (!urlList.value.trim()) {
        ElMessage.warning('URL을 입력해주세요.');
        return;
      }

      try {
        isLoading.value = true;
        
        // URL에서 상품 ID 추출
        const productIds = parseProductIds(urlList.value);
        
        if (productIds.length === 0) {
          ElMessage.warning('유효한 상품 ID를 찾을 수 없습니다.');
          return;
        }
        
        // API 호출
        const response = await urlSourcing(productIds);
        
        // 성공 시 메시지 표시 및 페이지 이동
        if (response.success) {
          ElMessage.success(response.message || '수집이 시작되었습니다.');
          // 상품 목록 확인 페이지로 이동
          navigateToProductListCheck();
        } else {
          ElMessage.error(response.message || '수집 처리 중 문제가 발생했습니다.');
        }
      } catch (error) {
        ElMessage.error(error.response?.data?.message || '수집 중 오류가 발생했습니다.');
      } finally {
        isLoading.value = false;
      }
    };

    return {
      urlList,
      isLoading,
      startSourcing
    };
  }
};
</script>

<style scoped>
.url-collection-page {
  height: 100%;
  overflow-y: auto;
  background-color: var(--el-bg-color-page);
  display: flex;
  flex-direction: column;
}

.page-header {
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
  margin-bottom: var(--spacing-xs);
}

.page-title {
  font-size: var(--el-font-size-extra-large);
  font-weight: var(--el-font-weight-bold);
  color: var(--el-text-color-primary);
  margin-bottom: var(--spacing-xs);
}

.page-description {
  color: var(--el-text-color-secondary);
  font-size: var(--el-font-size-base);
  margin: 0;
}

.content-container {
  flex: 1;
  padding: var(--spacing-md);
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.card {
  background: var(--el-bg-color);
  border-radius: var(--el-border-radius-base);
  box-shadow: var(--el-box-shadow-base);
  border: 1px solid var(--el-border-color-lighter);
  transition: box-shadow 0.2s ease;
}

.card:hover {
  box-shadow: var(--el-box-shadow-light);
}

.url-input-card {
  flex-shrink: 0;
}

.card-header {
  padding: var(--spacing-md) var(--spacing-md) 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
  margin-bottom: var(--spacing-md);
}

.card-title {
  font-size: var(--el-font-size-large);
  font-weight: var(--el-font-weight-semibold);
  color: var(--el-text-color-primary);
  margin: 0;
  padding-bottom: var(--spacing-sm);
}

.card-body {
  padding: 0 var(--spacing-md) var(--spacing-md);
}

.url-input-area {
  margin-bottom: var(--spacing-md);
}

.url-input {
  width: 100%;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  padding: var(--spacing-md);
  font-family: 'Consolas', 'Liberation Mono', 'Menlo', 'Courier', monospace;
  font-size: var(--el-font-size-base);
  color: var(--el-text-color-primary);
  background-color: var(--el-bg-color);
  resize: vertical;
  min-height: 180px;
  line-height: 1.5;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.url-input:focus {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-9);
  outline: none;
}

.url-input::placeholder {
  color: var(--el-text-color-placeholder);
}

.input-help {
  margin-top: var(--spacing-xs);
  color: var(--el-text-color-secondary);
  font-size: var(--el-font-size-small);
  margin: var(--spacing-xs) 0 0 0;
}

.button-area {
  display: flex;
  justify-content: flex-end;
}

.primary-button {
  background-color: var(--el-color-primary);
  color: var(--el-color-white);
  border: none;
  border-radius: var(--el-border-radius-base);
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--el-font-size-base);
  font-weight: var(--el-font-weight-medium);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  min-width: 120px;
  justify-content: center;
}

.primary-button:hover:not(:disabled) {
  background-color: var(--el-color-primary-light-3);
  box-shadow: var(--el-box-shadow-dark);
}

.primary-button:active:not(:disabled) {
  transform: translateY(0);
}

.primary-button:disabled {
  background-color: var(--el-text-color-placeholder);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: var(--el-color-white);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}



/* 반응형 디자인 */
@media (max-width: 768px) {
  .content-container {
    padding: var(--spacing-md);
  }
  
  .page-header {
    padding: var(--spacing-md);
  }
  
  .card-header,
  .card-body {
    padding-left: var(--spacing-md);
    padding-right: var(--spacing-md);
  }
  
  .url-input {
    min-height: 150px;
  }
}
</style> 