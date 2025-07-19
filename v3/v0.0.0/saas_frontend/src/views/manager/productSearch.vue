<template>
  <div class="product-search">
    <!-- 페이지 헤더 -->
    <div class="page-header">
      <h2 class="page-title">주문 상품 검색</h2>
      <p class="page-description">판매자 상품코드 또는 상품명을 입력하여 상품을 검색하세요.</p>
    </div>

    <!-- 검색 영역 -->
    <div class="search-container">
      <div class="search-wrapper">
        <div class="search-box">
          <el-input
            v-model="searchTerm"
            size="large"
            placeholder="예: 소형 롤러 3톤 진동식 디젤 쌍륜 1톤 핸드가드 또는 2431242"
            class="search-input"
            :loading="searching"
            @keyup.enter="handleSearch"
          >
            <template #append>
              <el-button 
                type="primary" 
                :icon="Search"
                :loading="searching"
                @click="handleSearch"
              >
                검색
              </el-button>
            </template>
          </el-input>
        </div>
      </div>
    </div>

    <!-- 검색 결과 -->
    <div v-if="searchResult" class="result-container">
      <div class="result-card">
        <div class="product-info">
          <div class="product-image">
            <img :src="searchResult.image?.startsWith('//') ? 'https:' + searchResult.image : searchResult.image" :alt="searchResult.productTitle || searchResult.titleRaw" />
          </div>
          <div class="product-details">
            <h3 class="product-title">{{ searchResult.titleRaw }}</h3>
            <div class="product-meta">
              <div class="meta-item">
                <span class="meta-label">상품 ID:</span>
                <span class="meta-value">{{ searchResult.productId }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">사용자 ID:</span>
                <span class="meta-value">{{ searchResult.userid }}</span>
              </div>
              <div class="meta-item" v-if="searchResult.detailUrl">
                <span class="meta-label">상세 URL:</span>
                <el-link 
                  :href="searchResult.detailUrl?.startsWith('//') ? 'https:' + searchResult.detailUrl : searchResult.detailUrl" 
                  type="primary" 
                  target="_blank"
                  class="detail-link"
                >
                  상품 페이지 보기
                  <el-icon><Link /></el-icon>
                </el-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 빈 결과 메시지 -->
    <div v-if="searched && !searchResult" class="empty-result">
      <div class="empty-icon">
        <el-icon size="48"><Search /></el-icon>
      </div>
      <h3 class="empty-title">검색 결과가 없습니다</h3>
      <p class="empty-description">입력하신 식별코드에 해당하는 상품이 없습니다.</p>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { Search, Link } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { searchOrderProduct } from '@/services/order';

export default {
  name: 'ProductSearch',
  setup() {
    const searchTerm = ref('');
    const searching = ref(false);
    const searched = ref(false);

    const searchResult = ref(null);

    const handleSearch = async () => {
      if (!searchTerm.value.trim()) {
        ElMessage.warning('검색어를 입력해주세요.');
        return;
      }

      searching.value = true;
      searchResult.value = null;
      searched.value = false;

      try {
        const response = await searchOrderProduct(searchTerm.value.trim());
        
        if (response.success && response.data) {
          searchResult.value = response.data;
          ElMessage.success('검색이 완료되었습니다.');
        } else {
          throw new Error('검색 결과가 없습니다.');
        }
      } catch (err) {
        ElMessage.error(err.response?.data?.message || '검색 중 오류가 발생했습니다.');
        console.error('상품 검색 실패:', err);
      } finally {
        searching.value = false;
        searched.value = true;
      }
    };

    return {
      searchTerm,
      searching,
      searched,
      searchResult,
      handleSearch,
      Search,
      Link
    };
  }
}
</script>

<style scoped>
.product-search {
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
}

.page-title {
  font-size: var(--el-font-size-extra-large);
  font-weight: var(--el-font-weight-bold);
  color: var(--el-text-color-primary);
  margin: 0 0 var(--spacing-xs) 0;
}

.page-description {
  color: var(--el-text-color-secondary);
  font-size: var(--el-font-size-base);
  margin: 0;
}

/* 검색 영역 */
.search-container {
  padding: var(--spacing-xxl) var(--spacing-md);
  display: flex;
  justify-content: center;
  background-color: var(--el-bg-color);
}

.search-wrapper {
  width: 100%;
  max-width: 750px;
}

.search-box {
  margin-bottom: var(--spacing-md);
}

.search-input {
  width: 100%;
}

.search-input :deep(.el-input__wrapper) {
  height: 50px;
}

.search-input :deep(.el-input__inner) {
  height: 48px;
  line-height: 48px;
}

/* 검색 결과 */
.result-container {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-md);
}

.result-card {
  max-width: 1000px;
  margin: 0 auto;
  background: var(--el-bg-color);
  border-radius: var(--el-border-radius-base);
  padding: var(--spacing-xl);
  box-shadow: var(--el-box-shadow-light);
  border: 1px solid var(--el-border-color-lighter);
}

.product-info {
  display: flex;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.product-image {
  flex-shrink: 0;
}

.product-image img {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: var(--el-border-radius-base);
  border: 1px solid var(--el-border-color-lighter);
}

.product-details {
  flex: 1;
}

.product-title {
  font-size: var(--el-font-size-large);
  font-weight: var(--el-font-weight-bold);
  color: var(--el-text-color-primary);
  margin: 0 0 var(--spacing-md) 0;
  line-height: 1.4;
}

.product-meta {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.meta-label {
  font-weight: var(--el-font-weight-medium);
  color: var(--el-text-color-secondary);
  min-width: 80px;
}

.meta-value {
  color: var(--el-text-color-primary);
  font-family: monospace;
}

.detail-link {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
}

/* 옵션 섹션 */
.options-section {
  border-top: 1px solid var(--el-border-color-lighter);
  padding-top: var(--spacing-lg);
}

.options-title {
  font-size: var(--el-font-size-large);
  font-weight: var(--el-font-weight-bold);
  color: var(--el-text-color-primary);
  margin: 0 0 var(--spacing-md) 0;
  display: flex;
  align-items: center;
}

.options-title:before {
  content: '';
  width: 4px;
  height: 20px;
  background-color: var(--el-color-primary);
  margin-right: var(--spacing-sm);
  border-radius: 2px;
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-md);
}

.option-card {
  background: var(--el-bg-color-page);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base);
  padding: var(--spacing-md);
  display: flex;
  gap: var(--spacing-md);
  transition: all 0.2s ease;
}

.option-card:hover {
  border-color: var(--el-color-primary-light-7);
  box-shadow: var(--el-box-shadow-light);
}

.option-image img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: var(--el-border-radius-small);
  border: 1px solid var(--el-border-color-lighter);
}

.option-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.option-prop,
.option-name,
.option-value {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.prop-label,
.name-label,
.value-label {
  font-size: var(--el-font-size-small);
  font-weight: var(--el-font-weight-medium);
  color: var(--el-text-color-secondary);
  min-width: 60px;
}

.prop-value,
.name-value,
.value-value {
  font-size: var(--el-font-size-small);
  color: var(--el-text-color-primary);
  font-weight: var(--el-font-weight-medium);
}

.translated {
  font-size: var(--el-font-size-extra-small);
  color: var(--el-text-color-secondary);
  font-style: italic;
}

/* 빈 결과 */
.empty-result {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: var(--spacing-xxl);
  text-align: center;
}

.empty-icon {
  color: var(--el-text-color-secondary);
  margin-bottom: var(--spacing-lg);
}

.empty-title {
  font-size: var(--el-font-size-large);
  font-weight: var(--el-font-weight-bold);
  color: var(--el-text-color-primary);
  margin: 0 0 var(--spacing-sm) 0;
}

.empty-description {
  color: var(--el-text-color-secondary);
  font-size: var(--el-font-size-base);
  margin: 0;
}

/* Element Plus 커스터마이징 */
:deep(.el-input-group__append) {
  padding: 0;
}

:deep(.el-input-group__append .el-button) {
  border-radius: 0 var(--el-border-radius-base) var(--el-border-radius-base) 0;
  margin: 0;
  height: 50px;
  padding: 0 var(--spacing-lg);
}

:deep(.el-input__wrapper) {
  border-radius: var(--el-border-radius-base) 0 0 var(--el-border-radius-base);
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .search-container {
    padding: var(--spacing-lg) var(--spacing-sm);
  }
  
  .result-container {
    padding: var(--spacing-sm);
  }
  
  .result-card {
    padding: var(--spacing-lg);
  }
  
  .product-info {
    flex-direction: column;
    gap: var(--spacing-md);
  }
  
  .product-image {
    align-self: center;
  }
  
  .options-grid {
    grid-template-columns: 1fr;
  }
  
  .option-card {
    flex-direction: column;
    text-align: center;
  }

  .meta-item {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-xs);
  }
  
  .meta-label {
    min-width: unset;
  }
}

@media (max-width: 480px) {
  .page-header {
    padding: var(--spacing-sm);
  }
  
  .page-title {
    font-size: var(--el-font-size-large);
  }
  
  .search-container {
    padding: var(--spacing-md) var(--spacing-sm);
  }
}
</style>

