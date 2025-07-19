<template>
  <div class="forbidden-brand">
    <div class="page-header">
      <h2 class="page-title">금지브랜드 검수</h2>
      <p class="page-description">브랜드 필터링된 상품을 검토하고 승인 여부를 결정할 수 있습니다.</p>
    </div>
    
    <!-- 로딩 상태 -->
    <AppLoading v-if="loading" text="데이터를 불러오는 중..." />
    
    <!-- 빈 상태 -->
    <div v-else-if="products.length === 0" class="empty-container">
      <el-icon class="empty-icon"><Box /></el-icon>
      <p class="empty-message">브랜드 필터링된 상품이 없습니다.</p>
    </div>
    
    <!-- 메인 콘텐츠 -->
    <div v-else class="content-container">
      <!-- 상품 목록 헤더 -->
      <div class="list-header">
        <div class="selection-controls">
          <button 
            class="btn-select-all" 
            @click="toggleSelectAll" 
            :class="{ 'active': isAllSelected }"
          >
            {{ isAllSelected ? '전체 해제' : '전체 선택' }}
          </button>
          <span v-if="selectedProducts.length > 0" class="selected-count">
            {{ selectedProducts.length }}개 상품 선택됨
          </span>
          <span class="info-text">
            선택된 상품은 브랜드 승인(금지 해제)되며, 선택하지 않은 상품은 브랜드 금지 상태로 유지됩니다.
          </span>
        </div>
      </div>
      
      <!-- 상품 목록 (스크롤 영역) -->
      <div class="product-list-container">
        <div class="product-grid">
          <div 
            v-for="product in products" 
            :key="product.productid" 
            class="product-card"
            :class="{ 'selected': isSelected(product.productid) }"
            @click="toggleProductSelection(product)"
          >
            <div class="card-checkbox">
              <input 
                type="checkbox" 
                :checked="isSelected(product.productid)" 
                @click.stop
                @change="toggleProductSelection(product)"
                class="checkbox-input"
              >
            </div>
            <div class="card-content">
              <h3 class="product-title">{{ product.title_translated }}</h3>
              <div class="product-meta">
                <div class="brand-info">
                  <span class="brand-label">브랜드:</span>
                  <span class="brand-name">{{ product.brand_name }}</span>
                </div>
                <div class="product-id">
                  <span class="id-label">상품 ID:</span>
                  <span class="id-value">{{ product.productid }}</span>
                </div>
              </div>
              <a 
                :href="product.detail_url" 
                target="_blank" 
                class="detail-link" 
                @click.stop
              >
                원본 상품 보기 →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 액션 패널 -->
    <div v-if="products.length > 0" class="action-panel">
      <div class="summary-section">
        <div class="summary-content">
          <span class="summary-title" v-if="selectedProducts.length > 0">
            {{ selectedProducts.length }}개 상품 브랜드 승인 예정
          </span>
          <span class="summary-title" v-else>브랜드 승인할 상품을 선택해 주세요</span>
          <span class="summary-description">
            (선택되지 않은 {{ products.length - selectedProducts.length }}개 상품은 브랜드 금지 유지)
          </span>
        </div>
        <div class="action-buttons">
          <button 
            class="btn btn-primary" 
            :disabled="processing"
            @click="startProcessing"
          >
            {{ processing ? '처리 중...' : '가공 시작' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Box } from '@element-plus/icons-vue';
import { getForbiddenBrandProducts, updateBrandApproval } from '../../../../services/processing';
import AppLoading from '@/components/app/loading.vue';

export default {
  name: 'ForbiddenBrand',
  components: {
    AppLoading
  },
  setup() {
    const products = ref([]);
    const loading = ref(true);
    const selectedProducts = ref([]);
    const processing = ref(false);

    // 전체 선택 여부 계산
    const isAllSelected = computed(() => {
      return products.value.length > 0 && 
             selectedProducts.value.length === products.value.length;
    });

    // 특정 상품이 선택되었는지 확인
    const isSelected = (productId) => {
      return selectedProducts.value.some(p => p.productid === productId);
    };

    const fetchForbiddenProducts = async () => {
      loading.value = true;
      
      try {
        const response = await getForbiddenBrandProducts();
        
        if (response.success) {
          products.value = response.data;
        } else {
          ElMessage.error('데이터를 불러오는데 실패했습니다.');
        }
      } catch (err) {
        // 서버로부터 받은 에러 메시지 사용
        const errorMessage = err.response?.data?.message || '서버 오류가 발생했습니다: ' + (err.message || '알 수 없는 오류');
        ElMessage.error(errorMessage);
      } finally {
        loading.value = false;
      }
    };

    // 상품 선택 토글
    const toggleProductSelection = (product) => {
      const index = selectedProducts.value.findIndex(p => p.productid === product.productid);
      
      if (index === -1) {
        // 선택되지 않은 상품 추가
        selectedProducts.value.push(product);
      } else {
        // 이미 선택된 상품 제거
        selectedProducts.value.splice(index, 1);
      }
    };

    // 전체 선택/해제 토글
    const toggleSelectAll = () => {
      if (isAllSelected.value) {
        // 전체 해제
        selectedProducts.value = [];
      } else {
        // 전체 선택
        selectedProducts.value = [...products.value];
      }
    };

    // 가공 시작 - 선택된 상품은 브랜드 금지 해제, 나머지는 금지 유지
    const startProcessing = async () => {
      if (processing.value) return;
      
      const confirmMessage = 
        `가공을 시작하시겠습니까?\n` +
        `- 선택된 ${selectedProducts.value.length}개 상품: 브랜드 승인\n` +
        `- 선택되지 않은 ${products.value.length - selectedProducts.value.length}개 상품: 브랜드 금지 유지`;
        
      if (!confirm(confirmMessage)) return;
      
      processing.value = true;
      
      try {
        // 선택된 상품 ID 배열 (브랜드 승인)
        const approvedProductIds = selectedProducts.value.map(p => p.productid);
        
        // 제출할 데이터 배열 구성
        const productsData = products.value.map(product => {
          return {
            productid: product.productid,
            ban: !approvedProductIds.includes(product.productid)
          };
        });
        
        // 모든 상품 상태를 한번에 업데이트
        const response = await updateBrandApproval(productsData);
        
        if (response.success) {
          ElMessage.success(`가공이 완료되었습니다.\n- ${selectedProducts.value.length}개 상품 브랜드 승인\n- ${products.value.length - selectedProducts.value.length}개 상품 브랜드 금지 유지`);
          
          // 처리 완료 후 목록 갱신
          products.value = [];
          selectedProducts.value = [];
        } else {
          ElMessage.error('상품 상태 업데이트에 실패했습니다.');
        }
      } catch (err) {
        // 서버로부터 받은 에러 메시지 사용
        const errorMessage = err.response?.data?.message || '상품 상태 업데이트 중 오류가 발생했습니다: ' + (err.message || '알 수 없는 오류');
        ElMessage.error(errorMessage);
      } finally {
        processing.value = false;
      }
    };

    onMounted(() => {
      fetchForbiddenProducts();
    });

    return {
      products,
      loading,
      selectedProducts,
      processing,
      isAllSelected,
      isSelected,
      toggleProductSelection,
      toggleSelectAll,
      startProcessing,
      Box
    };
  }
}
</script>

<style scoped>
.forbidden-brand {
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
  margin-bottom: 0;
}

.page-description {
  color: var(--el-text-color-secondary);
  font-size: var(--el-font-size-base);
  margin: 0;
}

/* 상태 컨테이너들 */
.empty-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  flex: 1;
  padding: var(--spacing-xxl);
}

.empty-container {
  color: var(--el-text-color-secondary);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: var(--spacing-md);
  color: var(--el-text-color-secondary);
}

.empty-message {
  font-size: var(--el-font-size-base);
  margin: 0;
}

/* 메인 콘텐츠 */
.content-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0; /* 플렉스 아이템이 축소될 수 있도록 */
  padding: var(--spacing-sm) var(--spacing-md) 0;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

/* 목록 헤더 - 더 컴팩트하게 */
.list-header {
  background-color: var(--el-bg-color);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--el-border-radius-base);
  border: 1px solid var(--el-border-color-lighter);
  box-shadow: var(--el-box-shadow-base);
  margin-bottom: var(--spacing-sm);
  flex-shrink: 0;
}

.selection-controls {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.btn-select-all {
  padding: var(--spacing-xs) var(--spacing-sm);
  background-color: var(--el-bg-color-page);
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  cursor: pointer;
  font-size: var(--el-font-size-small);
  font-weight: var(--el-font-weight-medium);
  color: var(--el-text-color-regular);
  transition: all 0.2s ease;
}

.btn-select-all:hover {
  background-color: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-7);
  color: var(--el-color-primary);
}

.btn-select-all.active {
  background-color: var(--el-color-primary);
  border-color: var(--el-color-primary);
  color: white;
}

.selected-count {
  font-size: var(--el-font-size-small);
  color: var(--el-color-primary);
  font-weight: var(--el-font-weight-semibold);
}

.info-text {
  font-size: var(--el-font-size-extra-small);
  color: var(--el-text-color-secondary);
  margin: 0;
  line-height: 1.4;
}

/* 상품 목록 컨테이너 (스크롤 영역) */
.product-list-container {
  flex: 1;
  min-height: 0; /* 플렉스 아이템이 축소될 수 있도록 */
  overflow-y: auto;
  padding-right: var(--spacing-xs); /* 스크롤바 공간 확보 */
}

/* 상품 그리드 */
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: var(--spacing-md);
  padding-bottom: var(--spacing-sm); /* 하단 여백 */
}

.product-card {
  background-color: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base);
  padding: var(--spacing-md);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  box-shadow: var(--el-box-shadow-base);
}

.product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(91, 108, 242, 0.15);
  border-color: var(--el-color-primary-light-7);
}

.product-card.selected {
  border-color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
  box-shadow: 0 2px 8px rgba(91, 108, 242, 0.2);
}

.card-checkbox {
  flex-shrink: 0;
  padding-top: 2px;
}

.checkbox-input {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--el-color-primary);
}

.card-content {
  flex: 1;
  min-width: 0;
}

.product-title {
  font-size: var(--el-font-size-medium);
  font-weight: var(--el-font-weight-semibold);
  color: var(--el-text-color-primary);
  margin: 0 0 var(--spacing-sm) 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-meta {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-sm);
}

.brand-info,
.product-id {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.brand-label,
.id-label {
  font-size: var(--el-font-size-small);
  color: var(--el-text-color-secondary);
  font-weight: var(--el-font-weight-medium);
}

.brand-name {
  font-size: var(--el-font-size-small);
  font-weight: var(--el-font-weight-semibold);
  color: var(--el-color-danger);
  background-color: rgba(220, 53, 69, 0.1);
  padding: 2px var(--spacing-xs);
  border-radius: 4px;
}

.id-value {
  font-size: var(--el-font-size-small);
  color: var(--el-text-color-regular);
  font-family: monospace;
}

.detail-link {
  display: inline-block;
  color: var(--el-color-primary);
  text-decoration: none;
  font-size: var(--el-font-size-small);
  font-weight: var(--el-font-weight-medium);
  transition: color 0.2s ease;
}

.detail-link:hover {
  color: var(--el-color-primary-light-3);
  text-decoration: underline;
}

/* 액션 패널 - 더 컴팩트하게 */
.action-panel {
  background-color: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color-lighter);
  padding: var(--spacing-sm) var(--spacing-md);
  flex-shrink: 0;
  box-shadow: 0 -1px 3px rgba(0,0,0,0.1);
}

.summary-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.summary-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.summary-title {
  font-size: var(--el-font-size-base);
  font-weight: var(--el-font-weight-semibold);
  color: var(--el-text-color-primary);
}

.summary-description {
  font-size: var(--el-font-size-small);
  color: var(--el-text-color-secondary);
}

.action-buttons {
  display: flex;
  gap: var(--spacing-sm);
}

.btn {
  padding: var(--spacing-xs) var(--spacing-md);
  border: none;
  border-radius: var(--el-border-radius-base);
  cursor: pointer;
  font-size: var(--el-font-size-small);
  font-weight: var(--el-font-weight-semibold);
  transition: all 0.2s ease;
  min-width: 100px;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background-color: var(--el-color-primary);
  color: white;
  box-shadow: 0 2px 4px rgba(91, 108, 242, 0.2);
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--el-color-primary-light-3);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(91, 108, 242, 0.3);
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .content-container {
    padding: var(--spacing-sm);
  }
  
  .page-header {
    padding: var(--spacing-sm);
  }
  
  .product-grid {
    grid-template-columns: 1fr;
  }
  
  .summary-section {
    flex-direction: column;
    gap: var(--spacing-sm);
    align-items: stretch;
  }
  
  .summary-content {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-xs);
  }
  
  .action-buttons {
    justify-content: stretch;
  }
  
  .btn {
    flex: 1;
  }
}

@media (max-width: 992px) {
  .product-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
}
</style> 