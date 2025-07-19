<template>
  <div class="inspection-container">
    <!-- 헤더 섹션 (고정) -->
    <div class="page-header">
      <div class="title-section">
        <h2 class="page-title">상품검수 페이지입니다.</h2>
        <p class="page-description">상세정보를 수정할 상품을 클릭해주세요</p>
      </div>
      
      <div class="controls-section">
        <div class="sort-control">
          <label>정렬:</label>
          <select v-model="sortOrder" @change="loadProducts">
            <option value="latest">최신순</option>
            <option value="oldest">과거순</option>
          </select>
        </div>
        
        <div class="search-control">
          <input 
            type="text" 
            v-model="searchCode" 
            placeholder="괸리코드로 검색" 
            @keyup.enter="handleSearch"
          />
          <el-button 
            type="primary" 
            @click="handleSearch"
            :icon="Search"
          >
            검색
          </el-button>
        </div>
      </div>
    </div>

    <!-- 메인 콘텐츠 영역 (스크롤 가능) -->
    <div class="content-area">
      <!-- 로딩 상태 -->
      <AppLoading v-if="loading" />

      <!-- 상품 그리드 -->
      <div v-else class="products-section">
        <div class="products-grid">
          <div 
            v-for="product in products" 
            :key="product.productid"
            class="product-card"
          >
            <div class="product-checkbox">
              <input 
                type="checkbox" 
                :value="product.productid"
                v-model="selectedProducts"
                @click.stop
              />
            </div>
            <div class="product-image" @click="openProductModal(product.productid)">
              <img 
                :src="product.main_image_url" 
                :alt="product.title_optimized"
                @error="handleImageError"
              />
            </div>
            <div class="product-info" @click="openProductModal(product.productid)">
              <h4 class="product-title">{{ product.title_optimized }}</h4>
              <p class="product-code">관리코드: {{ product.product_group_code }}</p>
            </div>
          </div>
        </div>

        <!-- 페이지네이션 -->
        <div class="pagination" v-if="Math.ceil(pagination.total_count / 60) > 1">
          <el-button 
            @click="changePage(currentPage - 1)"
            :disabled="currentPage <= 1"
            :icon="ArrowLeft"
          >
            이전 페이지
          </el-button>
          
          <span class="page-info">
            {{ currentPage }} / {{ Math.ceil(pagination.total_count / 60) }}
          </span>
          
          <el-button 
            @click="changePage(currentPage + 1)"
            :disabled="currentPage >= Math.ceil(pagination.total_count / 60)"
            :icon="ArrowRight"
          >
            다음 페이지
          </el-button>
        </div>
      </div>
    </div>

    <!-- 하단 액션 섹션 (고정) -->
    <div class="bottom-bar">
      <div class="selection-controls">
        <label class="checkbox-label">
          <input 
            type="checkbox" 
            v-model="selectAll" 
            @change="toggleSelectAll"
          />
          전체 선택
        </label>
        <span class="selected-count">
          선택된 상품: {{ selectedProducts.length }}개
        </span>
      </div>
      
      <div class="action-buttons-group">
        <el-button 
          type="danger"
          size="large"
          @click="discardSelectedProducts"
          :disabled="selectedProducts.length === 0 || loading"
          :icon="Delete"
        >
          폐기하기
        </el-button>
        <el-button 
          type="primary"
          size="large"
          @click="goToMarketRegister"
          :disabled="selectedProducts.length === 0 || loading"
          :icon="Upload"
        >
          마켓에 등록하러 가기
        </el-button>
      </div>
    </div>

    <!-- 상품 수정 모달 -->
    <ProductEditModal
      v-if="showModal"
      :product-id="selectedProductId"
      @close="closeModal"
      @updated="handleProductUpdated"
    />
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import { Search, ArrowLeft, ArrowRight, Upload, Delete } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import ProductEditModal from '../../../components/product/ProductEditModal.vue';
import AppLoading from '../../../components/app/loading.vue';
import { getInspectionProducts, generateRegisterData } from '../../../services/inspection';
import { discardProducts } from '../../../services/postprocessing';

export default {
  name: 'ProductInspection',
  components: {
    ProductEditModal,
    AppLoading
  },
  setup() {
    // 반응형 데이터
    const loading = ref(false);
    const products = ref([]);
    const currentPage = ref(1);
    const sortOrder = ref('latest');
    const searchCode = ref('');
    const showModal = ref(false);
    const selectedProductId = ref(null);
    const selectedProducts = ref([]);
    const selectAll = ref(false);
    
    const pagination = reactive({
      current_page: 1,
      total_count: 0
    });



    // 상품 목록 로드
    const loadProducts = async () => {
      try {
        loading.value = true;
        const params = {
          page: currentPage.value,
          limit: 60,
          order: sortOrder.value,
          search: searchCode.value
        };
        
        const response = await getInspectionProducts(params);
        products.value = response.data.products;
        Object.assign(pagination, response.data.pagination);
        
        // 선택 상태 초기화
        selectedProducts.value = [];
        selectAll.value = false;
      } catch (error) {
        console.error('상품 목록 로딩 실패:', error);
        // 서버로부터 받은 에러 메시지 사용
        const errorMessage = error.response?.data?.message || '상품 목록을 불러오는데 실패했습니다.';
        ElMessage.error(errorMessage);
      } finally {
        loading.value = false;
      }
    };

    // 페이지 변경
    const changePage = (page) => {
      const totalPages = Math.ceil(pagination.total_count / 60);
      
      if (page >= 1 && page <= totalPages) {
        currentPage.value = page;
        loadProducts();
      }
    };

    // 검색 처리
    const handleSearch = () => {
      currentPage.value = 1;
      loadProducts();
    };

    // 상품 모달 열기
    const openProductModal = (productId) => {
      selectedProductId.value = productId;
      showModal.value = true;
    };

    // 모달 닫기
    const closeModal = () => {
      showModal.value = false;
      selectedProductId.value = null;
    };

    // 상품 업데이트 완료 처리
    const handleProductUpdated = () => {
      loadProducts(); // 목록 새로고침
    };

    // 전체 선택 토글
    const toggleSelectAll = () => {
      if (selectAll.value) {
        selectedProducts.value = products.value.map(p => p.productid);
      } else {
        selectedProducts.value = [];
      }
    };

    // 개별 상품 선택 처리
    const toggleProductSelection = (productId) => {
      const index = selectedProducts.value.indexOf(productId);
      if (index > -1) {
        selectedProducts.value.splice(index, 1);
      } else {
        selectedProducts.value.push(productId);
      }
      
      selectAll.value = selectedProducts.value.length === products.value.length;
    };

    // 마켓 등록 처리
    const goToMarketRegister = async () => {
      try {
        loading.value = true;
        const result = await generateRegisterData({
          productids: selectedProducts.value
        });
        
        ElMessage.success(`JSON 데이터 생성 완료! 처리된 상품: ${result.data.processed_count}개`);
        
        // 성공 후 페이지 이동 또는 상태 업데이트
        loadProducts();
      } catch (error) {
        console.error('마켓 등록 데이터 생성 실패:', error);
        // 서버로부터 받은 에러 메시지 사용
        const errorMessage = error.response?.data?.message || '마켓 등록 데이터 생성에 실패했습니다.';
        ElMessage.error(errorMessage);
      } finally {
        loading.value = false;
      }
    };

    // 상품 폐기 처리
    const discardSelectedProducts = async () => {
      if (selectedProducts.value.length === 0) {
        ElMessage.warning('폐기할 상품을 선택해야 합니다.');
        return;
      }

      try {
        loading.value = true;
        const response = await discardProducts(selectedProducts.value);
        
        if (response.success) {
          ElMessage.success(response.message || '상품 폐기가 성공적으로 완료되었습니다.');
          loadProducts();
        } else {
          ElMessage.error(response.message || '폐기 처리 중 오류가 발생했습니다.');
        }
      } catch (error) {
        console.error('상품 폐기 실패:', error);
        const errorMessage = error.response?.data?.message || '서버 요청 중 오류가 발생했습니다.';
        ElMessage.error(errorMessage);
      } finally {
        loading.value = false;
      }
    };

    // 이미지 에러 처리
    const handleImageError = (event) => {
      event.target.src = '/placeholder-image.jpg'; // 기본 이미지
    };

    // 초기 로드
    onMounted(() => {
      loadProducts();
    });

    return {
      loading,
      products,
      currentPage,
      sortOrder,
      searchCode,
      showModal,
      selectedProductId,
      selectedProducts,
      selectAll,
      pagination,
      loadProducts,
      changePage,
      handleSearch,
      openProductModal,
      closeModal,
      handleProductUpdated,
      toggleSelectAll,
      toggleProductSelection,
      goToMarketRegister,
      discardSelectedProducts,
      handleImageError,
      // Element Plus Icons
      Search,
      ArrowLeft,
      ArrowRight,
      Upload,
      Delete
    };
  }
}
</script>

<style scoped>
.inspection-container {
  height: 100%;
  overflow-y: auto;
  background-color: var(--el-bg-color-page);
  display: flex;
  flex-direction: column;
  position: relative;
}

.page-header {
  padding: var(--spacing-sm) var(--spacing-md) var(--spacing-xs);
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
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

.controls-section {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
}

.sort-control {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.sort-control label {
  font-weight: var(--el-font-weight-medium);
  color: var(--el-text-color-regular);
  font-size: var(--el-font-size-base);
}

.sort-control select {
  padding: var(--spacing-xs) var(--spacing-sm);
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  font-size: var(--el-font-size-base);
  color: var(--el-text-color-primary);
  background: var(--el-bg-color);
  transition: all 0.2s ease;
}

.sort-control select:focus {
  outline: none;
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-9);
}

.search-control {
  display: flex;
  gap: var(--spacing-xs);
}

.search-control input {
  padding: var(--spacing-xs) var(--spacing-sm);
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  width: 200px;
  font-size: var(--el-font-size-base);
  color: var(--el-text-color-primary);
  background: var(--el-bg-color);
  transition: all 0.2s ease;
}

.search-control input:focus {
  outline: none;
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-9);
}

.search-control input::placeholder {
  color: var(--el-text-color-placeholder);
}

.content-area {
  flex: 1;
  min-height: 400px;
  overflow-y: auto;
  padding: var(--spacing-xs) var(--spacing-md) 0;
}

.products-section {
  display: flex;
  flex-direction: column;
  min-height: 350px;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: var(--spacing-md);
  padding: var(--spacing-sm) 0;
  min-height: 250px;
}

.product-card {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--el-bg-color);
  position: relative;
  box-shadow: var(--el-box-shadow-light);
}

.product-card:hover {
  border-color: var(--el-color-primary-light-7);
  box-shadow: 0 2px 8px rgba(91, 108, 242, 0.1);
  transform: translateY(-1px);
}

.product-checkbox {
  position: absolute;
  top: var(--spacing-xs);
  left: var(--spacing-xs);
  z-index: 10;
  background: rgba(255, 255, 255, 0.9);
  border-radius: var(--el-border-radius-small);
  padding: var(--spacing-xs);
  backdrop-filter: blur(4px);
}

.product-checkbox input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--el-color-primary);
}

.product-image {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
  cursor: pointer;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s ease;
}

.product-card:hover .product-image img {
  transform: scale(1.02);
}

.product-info {
  padding: var(--spacing-sm);
}

.product-title {
  margin: 0 0 var(--spacing-xs) 0;
  font-size: var(--el-font-size-base);
  font-weight: var(--el-font-weight-medium);
  color: var(--el-text-color-primary);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-code {
  margin: 0;
  font-size: var(--el-font-size-small);
  color: var(--el-text-color-secondary);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) 0;
  border-top: 1px solid var(--el-border-color-lighter);
  margin-top: var(--spacing-sm);
  flex-shrink: 0;
}

.page-info {
  font-weight: var(--el-font-weight-medium);
  color: var(--el-text-color-regular);
  font-size: var(--el-font-size-base);
}

.bottom-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  border-top: 1px solid var(--el-border-color-lighter);
  background-color: var(--el-bg-color);
  flex-shrink: 0;
}

.action-buttons-group {
  display: flex;
  gap: var(--spacing-sm);
}

.selection-controls {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  cursor: pointer;
  font-weight: var(--el-font-weight-medium);
  color: var(--el-text-color-regular);
  font-size: var(--el-font-size-base);
  transition: color 0.2s ease;
}

.checkbox-label:hover {
  color: var(--el-color-primary);
}

.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--el-color-primary);
}

.selected-count {
  color: var(--el-color-primary);
  font-weight: var(--el-font-weight-medium);
  font-size: var(--el-font-size-base);
}

/* 반응형 디자인 */
@media (max-width: 1200px) {
  .products-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 768px) {
  .products-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .page-header {
    flex-direction: column;
    gap: var(--spacing-md);
    align-items: stretch;
  }
  
  .controls-section {
    flex-direction: column;
    width: 100%;
    gap: var(--spacing-sm);
  }
  
  .search-control {
    width: 100%;
  }
  
  .search-control input {
    width: 100%;
  }
  
  .bottom-bar {
    flex-direction: column;
    gap: var(--spacing-sm);
    align-items: stretch;
  }
  
  .content-area {
    min-height: 300px;
  }
  
  .products-section {
    min-height: 250px;
  }
  
  .products-grid {
    min-height: 200px;
  }
}

@media (max-width: 480px) {
  .products-grid {
    grid-template-columns: repeat(1, 1fr);
    min-height: 150px;
  }
  
  .content-area {
    padding: var(--spacing-xs);
    min-height: 250px;
  }
  
  .products-section {
    min-height: 200px;
  }
  
  .page-header {
    padding: var(--spacing-xs);
  }
  
  .bottom-bar {
    padding: var(--spacing-xs);
  }
}
</style> 