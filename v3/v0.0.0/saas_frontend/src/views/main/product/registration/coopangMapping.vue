<template>
  <div class="coopang-mapping">
    <!-- 로딩 오버레이 -->
    <AppLoading 
      v-if="isProcessing" 
      text="AI 자동 매핑 처리 중... 처리 중이니 잠시만 기다려주세요."
      overlay
    />

    <!-- 페이지 헤더 -->
    <div class="page-header">
      <h2 class="page-title">쿠팡 매핑</h2>
      <p class="page-description">쿠팡 상품 매핑을 설정하고 관리합니다.</p>
    </div>
    
    <!-- 메인 콘텐츠 -->
    <div class="content-container">
      <!-- 상단 액션 바 -->
      <div class="action-bar">
        <div class="selection-info">
          <span class="total-count">전체 {{ products.length }}개</span>
          <span v-if="selectedProducts.length > 0" class="selected-count">
            선택된 상품: {{ selectedProducts.length }}개
          </span>
        </div>
        <div class="action-buttons">
          <el-button 
            @click="selectAll" 
            :type="isAllSelected ? 'primary' : 'default'"
            :icon="isAllSelected ? Close : Check"
          >
            {{ isAllSelected ? '전체 해제' : '전체 선택' }}
          </el-button>
          <el-tooltip
            :content="isEnterprisePlan ? '' : '일괄 자동 매핑은 Enterprise 플랜에서만 사용할 수 있습니다.'"
            placement="top"
            :disabled="isEnterprisePlan"
          >
            <el-button 
              @click="processAutoMapping" 
              :disabled="selectedProducts.length === 0 || isProcessing || !isEnterprisePlan"
              type="primary"
              :icon="MagicStick"
            >
              일괄 자동 매핑 요청 ({{ selectedProducts.length }})
              <el-tag v-if="!isEnterprisePlan" type="warning" size="small" style="margin-left: 8px;">
                Enterprise 전용
              </el-tag>
            </el-button>
          </el-tooltip>
        </div>
      </div>

      <!-- 상품 목록 -->
      <div class="product-list-container">
        <AppLoading v-if="loading" text="상품 목록을 불러오는 중..." />
        
        <div v-else-if="products.length === 0" class="empty-state">
          <el-icon class="empty-icon"><Document /></el-icon>
          <h3>매핑이 필요한 상품이 없습니다</h3>
          <p>모든 상품의 옵션 매핑이 완료되었습니다.</p>
        </div>

        <div v-else class="product-grid">
          <div 
            v-for="product in products" 
            :key="product.productid"
            :class="['product-card', { 'selected': isSelected(product.productid) }]"
            @click="handleProductClick(product)"
          >
            <div class="product-checkbox">
              <input 
                type="checkbox" 
                :checked="isSelected(product.productid)"
                @click.stop="toggleSelection(product.productid)"
                @change="() => {}"
              />
            </div>
            <div class="product-image">
              <img 
                :src="product.imageurl" 
                :alt="product.title"
                @error="handleImageError"
              />
            </div>
            <div class="product-info">
              <h3 class="product-title" :title="product.title">
                {{ product.title }}
              </h3>
              <p class="product-id">ID: {{ product.productid }}</p>
            </div>
            <div class="product-actions">
              <el-button 
                size="small" 
                @click.stop="openMappingModal(product)"
                :icon="Setting"
              >
                매핑 설정
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 매핑 모달 -->
    <CaapangMappingModal
      :isVisible="mappingModal.isVisible"
      :productId="mappingModal.productId"
      @close="closeMappingModal"
      @saved="handleMappingSaved"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Check, Close, MagicStick, Setting, Document } from '@element-plus/icons-vue';
import { getCoopangMappingProducts, processAutoMapping } from '@/services/register.js';
import { getUser } from '@/services/auth';
import CaapangMappingModal from '@/components/product/caapangMappingModal.vue';
import AppLoading from '@/components/app/loading.vue';

export default {
  name: 'CoopangMapping',
  components: {
    CaapangMappingModal,
    AppLoading
  },
  setup() {
    // 사용자 권한 확인
    const user = ref(null);
    const isEnterprisePlan = ref(false);
    
    // 반응형 데이터
    const products = ref([]);
    const selectedProducts = ref([]);
    const loading = ref(false);
    const isProcessing = ref(false);
    
    // 모달 관련 데이터
    const mappingModal = ref({
      isVisible: false,
      productId: ''
    });

    // 계산된 속성
    const isAllSelected = computed(() => {
      return products.value.length > 0 && selectedProducts.value.length === products.value.length;
    });

    // 상품 목록 로딩
    const loadProducts = async () => {
      try {
        loading.value = true;
        const response = await getCoopangMappingProducts();
        if (response.success) {
          products.value = response.products || [];
        } else {
          ElMessage.error(response.error || '상품 목록을 불러오는데 실패했습니다.');
        }
      } catch (err) {
        // 서버로부터 받은 에러 메시지 사용
        const errorMessage = err.response?.data?.message || '서버 연결에 실패했습니다.';
        ElMessage.error(errorMessage);
        console.error('상품 목록 로딩 오류:', err);
      } finally {
        loading.value = false;
      }
    };

    // 선택 관련 함수들
    const isSelected = (productId) => {
      return selectedProducts.value.includes(productId);
    };

    const toggleSelection = (productId) => {
      const index = selectedProducts.value.indexOf(productId);
      if (index > -1) {
        selectedProducts.value.splice(index, 1);
      } else {
        selectedProducts.value.push(productId);
      }
    };

    const selectAll = () => {
      if (isAllSelected.value) {
        selectedProducts.value = [];
      } else {
        selectedProducts.value = products.value.map(p => p.productid);
      }
    };

    // 상품 클릭 처리
    const handleProductClick = (product) => {
      // 상품 카드 클릭 시 선택/해제 토글
      toggleSelection(product.productid);
    };

    // 매핑 모달 열기
    const openMappingModal = (product) => {
      mappingModal.value.productId = product.productid;
      mappingModal.value.isVisible = true;
    };

    // 매핑 모달 닫기
    const closeMappingModal = () => {
      mappingModal.value.isVisible = false;
      mappingModal.value.productId = '';
    };

    // 매핑 저장 완료 처리
    const handleMappingSaved = async (data) => {
      console.log('매핑 저장 완료:', data);
      
      // 성공적으로 매핑된 상품을 목록에서 제거
      const savedProductId = data.productId;
      products.value = products.value.filter(product => product.productid !== savedProductId);
      
      // 선택 목록에서도 제거
      const selectedIndex = selectedProducts.value.indexOf(savedProductId);
      if (selectedIndex > -1) {
        selectedProducts.value.splice(selectedIndex, 1);
      }
      
      // 성공 메시지 표시
      ElMessage.success('옵션 매핑이 성공적으로 저장되었습니다.');
    };

    // AI 자동 매핑 처리
    const processAutoMappingRequest = async () => {
      if (!isEnterprisePlan.value) {
        ElMessage.warning('AI 일괄 매핑은 Enterprise 플랜에서만 사용할 수 있습니다.');
        return;
      }
      
      if (selectedProducts.value.length === 0) {
        ElMessage.warning('선택된 상품이 없습니다.');
        return;
      }

      const confirmMessage = `선택된 ${selectedProducts.value.length}개 상품의 AI 자동 매핑을 처리하시겠습니까?\n처리에는 약 10초 정도 소요됩니다.`;
      if (!confirm(confirmMessage)) {
        return;
      }

      isProcessing.value = true;
      
      try {
        const response = await processAutoMapping(selectedProducts.value);
        
        if (response.success) {
          ElMessage.success(`자동 매핑 완료: ${response.successCount}/${response.totalProcessed}개 성공`);
          
          // 성공한 상품들을 선택 목록에서 제거
          const successfulProducts = response.results
            .filter(result => result.success)
            .map(result => result.productid);
          
          selectedProducts.value = selectedProducts.value.filter(
            id => !successfulProducts.includes(id)
          );
          
          // 상품 목록 새로고침
          await loadProducts();
        } else {
          ElMessage.error(`자동 매핑 실패: ${response.error}`);
        }
      } catch (err) {
        console.error('자동 매핑 처리 오류:', err);
        // 서버로부터 받은 에러 메시지 사용
        const errorMessage = err.response?.data?.message || '자동 매핑 처리 중 오류가 발생했습니다.';
        ElMessage.error(errorMessage);
      } finally {
        isProcessing.value = false;
      }
    };

    // 이미지 에러 처리
    const handleImageError = (event) => {
      event.target.src = '/placeholder-image.png'; // 기본 이미지로 대체
    };

    // 생명주기
    onMounted(() => {
      // 사용자 정보 확인
      user.value = getUser();
      isEnterprisePlan.value = user.value?.plan === 'enterprise';
      
      loadProducts();
    });

    return {
      // 권한
      user,
      isEnterprisePlan,
      
      // 데이터
      products,
      selectedProducts,
      loading,
      isProcessing,
      mappingModal,
      
      // 계산된 속성
      isAllSelected,
      
      // 메서드
      loadProducts,
      isSelected,
      toggleSelection,
      selectAll,
      handleProductClick,
      openMappingModal,
      closeMappingModal,
      handleMappingSaved,
      processAutoMapping: processAutoMappingRequest,
      handleImageError,
      
      // Element Plus Icons
      Check,
      Close,
      MagicStick,
      Setting,
      Document
    };
  }
}
</script>

<style scoped>
.coopang-mapping {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color-page);
  position: relative;
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
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: var(--el-font-size-base);
}

/* 메인 콘텐츠 */
.content-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: var(--spacing-sm) var(--spacing-md) 0;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

/* 액션 바 */
.action-bar {
  background-color: var(--el-bg-color);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--el-border-radius-base);
  border: 1px solid var(--el-border-color-lighter);
  box-shadow: var(--el-box-shadow-base);
  margin-bottom: var(--spacing-sm);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.selection-info {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
}

.total-count {
  color: var(--el-text-color-primary);
  font-weight: var(--el-font-weight-medium);
}

.selected-count {
  color: var(--el-color-primary);
  font-weight: var(--el-font-weight-medium);
}

.action-buttons {
  display: flex;
  gap: var(--spacing-sm);
}

/* 상품 목록 컨테이너 */
.product-list-container {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: var(--spacing-xs);
}

/* 상태 표시 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  text-align: center;
  padding: var(--spacing-xxl);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: var(--spacing-md);
  color: var(--el-text-color-placeholder);
}

.empty-state p {
  color: var(--el-text-color-secondary);
  margin: var(--spacing-sm) 0;
  font-size: var(--el-font-size-base);
}

.empty-state h3 {
  margin: 0 0 var(--spacing-sm) 0;
  color: var(--el-text-color-primary);
  font-size: var(--el-font-size-medium);
}

/* 상품 그리드 */
.product-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-lg);
  padding-bottom: var(--spacing-sm);
}

/* 상품 카드 */
.product-card {
  border: 2px solid var(--el-border-color-light);
  border-radius: var(--el-border-radius-base);
  padding: var(--spacing-md);
  background: var(--el-bg-color);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  box-shadow: var(--el-box-shadow-base);
}

.product-card:hover {
  border-color: var(--el-color-primary);
  box-shadow: 0 4px 12px rgba(91, 108, 242, 0.15);
  transform: translateY(-2px);
}

.product-card.selected {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.product-checkbox {
  position: absolute;
  top: var(--spacing-sm);
  right: var(--spacing-sm);
  z-index: 2;
}

.product-checkbox input {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--el-color-primary);
}

.product-image {
  width: 100%;
  height: 160px;
  margin-bottom: var(--spacing-sm);
  border-radius: var(--el-border-radius-base);
  overflow: hidden;
  background: var(--el-bg-color-page);
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-info {
  margin-bottom: var(--spacing-sm);
}

.product-title {
  margin: 0 0 6px 0;
  font-size: var(--el-font-size-base);
  font-weight: var(--el-font-weight-medium);
  color: var(--el-text-color-primary);
  line-height: 1.4;
  height: 2.8em;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.product-id {
  margin: 0;
  font-size: var(--el-font-size-small);
  color: var(--el-text-color-secondary);
}

.product-actions {
  display: flex;
  justify-content: flex-end;
}

/* 반응형 디자인 */
@media (max-width: 1200px) {
  .product-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .product-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-md);
  }
  
  .content-container {
    padding: var(--spacing-sm);
  }
  
  .page-header {
    padding: var(--spacing-sm);
  }
  
  .action-bar {
    flex-direction: column;
    gap: var(--spacing-sm);
    align-items: stretch;
  }
  
  .selection-info {
    flex-direction: column;
    gap: var(--spacing-xs);
    align-items: flex-start;
  }
  
  .action-buttons {
    justify-content: stretch;
  }
}

@media (max-width: 480px) {
  .product-grid {
    grid-template-columns: 1fr;
  }
}
</style>
